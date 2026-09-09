import { execFileSync } from "node:child_process";
import { args, fail, git, json, parseTag, resolveRoot } from "./_lib.mjs";
import { committedRelease } from "./release-diff.mjs";

function remoteTag(root, tag) {
  try {
    const output = execFileSync("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`, `refs/tags/${tag}^{}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (!output) return null;
    const rows = output.split(/\r?\n/).map((line) => line.split(/\s+/));
    const peeled = rows.find(([, ref]) => ref.endsWith("^{}"));
    if (!peeled) fail("TAG_UNANNOTATED", `${tag} is not annotated`);
    return peeled[0];
  } catch (error) {
    fail("TAG_REMOTE_UNAVAILABLE", error.message);
  }
}

function createAndPush(root, tag, commit) {
  const local = git(root, ["tag", "--list", tag]);
  if (local) {
    if (git(root, ["cat-file", "-t", `refs/tags/${tag}`]) !== "tag") fail("TAG_UNANNOTATED", `${tag} is not annotated`);
    const localCommit = git(root, ["rev-parse", `${tag}^{}`]);
    if (localCommit !== commit) fail("TAG_CONFLICT", `${tag} exists locally at ${localCommit}`);
  } else {
    try {
      execFileSync("git", ["tag", "-a", tag, "-m", tag, commit], { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
    } catch (error) {
      fail("TAG_CREATE_FAILED", error.stderr?.toString().trim() || error.message);
    }
  }
  try {
    execFileSync("git", ["push", "origin", `refs/tags/${tag}:refs/tags/${tag}`], { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
  } catch (error) {
    fail("TAG_PUSH_FAILED", error.stderr?.toString().trim() || error.message);
  }
}

const options = args(process.argv.slice(2));
for (const key of ["root", "plan", "commit"]) if (!options[key]) fail("INVALID_ARGUMENT", `--${key} is required`);
const root = resolveRoot(options.root);
const head = git(root, ["rev-parse", "HEAD"]);
if (head !== options.commit) fail("TAG_COMMIT_MISMATCH", `Checked out ${head}, expected ${options.commit}`);
const trusted = committedRelease(root, options.commit);
git(root, ["merge-base", "--is-ancestor", options.commit, "origin/main"]);

let plan;
try {
  plan = json(options.plan);
} catch (error) {
  fail("INVALID_RELEASE_PLAN", error.message);
}
if (plan.schemaVersion !== 1 || !["version", "recover"].includes(plan.mode) || !Array.isArray(plan.releases) || plan.releases.length === 0) {
  fail("INVALID_RELEASE_PLAN", "A version plan with releases is required");
}

const seen = new Set();
const result = [];
for (const release of plan.releases) {
  if (!release.tag || seen.has(release.tag)) fail("INVALID_RELEASE_PLAN", `Missing or duplicate tag ${release.tag ?? ""}`);
  seen.add(release.tag);
  const parsed = parseTag(release.tag);
  if (!trusted.releases.some((r) => r.name === release.name && r.newVersion === release.newVersion && r.tag === release.tag)) fail("INVALID_RELEASE_PLAN", "Tag is outside the committed release diff");
  if (parsed.version !== release.newVersion || (parsed.kind === "workspace" && parsed.name !== release.name)) {
    fail("INVALID_RELEASE_PLAN", `${release.tag} does not match ${release.name}@${release.newVersion}`);
  }
  const remote = remoteTag(root, release.tag);
  if (remote && remote !== options.commit) fail("TAG_CONFLICT", `${release.tag} exists remotely at ${remote}`);
  if (remote === options.commit) {
    result.push({ tag: release.tag, state: "existing" });
    continue;
  }
  createAndPush(root, release.tag, options.commit);
  const verified = remoteTag(root, release.tag);
  if (verified !== options.commit) fail("TAG_PUSH_FAILED", `${release.tag} did not resolve to ${options.commit}`);
  result.push({ tag: release.tag, state: "created" });
}

process.stdout.write(`${JSON.stringify({ schemaVersion: 1, commit: options.commit, tags: result })}\n`);
