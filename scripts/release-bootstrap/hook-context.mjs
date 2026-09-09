import { execFileSync } from "node:child_process";
import { args, fail, git, packages, parseTag, resolveRoot } from "./_lib.mjs";
import { committedRelease } from "./release-diff.mjs";

const options = args(process.argv.slice(2));
for (const key of ["root", "tag", "commit", "provider", "repository", "hook-id"]) {
  if (!options[key]) fail("INVALID_ARGUMENT", `--${key} is required`);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options["hook-id"])) fail("HOOK_CONFIGURATION_INVALID", "hook id must be kebab-case");

const root = resolveRoot(options.root);
const head = git(root, ["rev-parse", "HEAD"]);
if (head !== options.commit) fail("TAG_COMMIT_MISMATCH", `Checked out ${head}, expected ${options.commit}`);
const release = committedRelease(root, options.commit);
if (git(root, ["cat-file", "-t", `refs/tags/${options.tag}`]) !== "tag") fail("TAG_UNANNOTATED", "Release tag must be annotated");
if (git(root, ["rev-parse", `refs/tags/${options.tag}^{}`]) !== options.commit) fail("TAG_COMMIT_MISMATCH", "Tag targets another commit");
if (!release.releases.some((r) => r.tag === options.tag)) fail("TAG_PACKAGE_MISMATCH", "Tag is not in the committed version diff");
const subject = git(root, ["log", "-1", "--format=%s", options.commit]);
if (subject !== "chore(release): version packages") fail("TAG_COMMIT_UNTRUSTED", `Unexpected release commit subject ${subject}`);
if (options["main-ref"]) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", options.commit, options["main-ref"]], {
      cwd: root,
      stdio: "ignore"
    });
  } catch {
    fail("TAG_COMMIT_UNTRUSTED", `${options.commit} is not an ancestor of ${options["main-ref"]}`);
  }
}
const parsed = parseTag(options.tag);
const available = packages(root);

let target;
if (parsed.kind === "single") {
  const rootPackage = available.find((value) => value.path === ".");
  if (!rootPackage || rootPackage.private === true) fail("TAG_PACKAGE_MISMATCH", "Single-package tag requires a publishable root package");
  target = rootPackage;
} else {
  target = available.find((value) => value.name === parsed.name);
  if (!target || target.private === true) fail("TAG_PACKAGE_MISMATCH", `Unknown publishable package ${parsed.name}`);
}
if (target.version !== parsed.version) fail("TAG_VERSION_MISMATCH", `${target.name} is ${target.version}, tag is ${parsed.version}`);

process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  RELEASE_TAG: options.tag,
  RELEASE_PACKAGE: target.name,
  RELEASE_VERSION: parsed.version,
  RELEASE_COMMIT: options.commit,
  RELEASE_PROVIDER: options.provider,
  RELEASE_REPOSITORY: options.repository,
  RELEASE_HOOK_ID: options["hook-id"]
})}\n`);
