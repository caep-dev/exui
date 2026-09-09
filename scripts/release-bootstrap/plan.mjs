import { existsSync } from "node:fs";
import { adaptiveTag, args, fail, git, isWorkspace, json, packages, pendingChangesets, resolveRoot } from "./_lib.mjs";
import { committedRelease } from "./release-diff.mjs";

const options = args(process.argv.slice(2));
const root = resolveRoot(options.root);
const pending = pendingChangesets(root);

if (git(root, ["log", "-1", "--format=%s"]) === "chore(release): version packages") {
  const { releases } = committedRelease(root);
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, mode: "recover", releases })}\n`);
  process.exit(0);
}

if (pending.length === 0) {
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, mode: "no-op", releases: [] })}\n`);
  process.exit(0);
}

if (!options["status-file"] || !existsSync(options["status-file"])) {
  fail("CHANGESETS_STATUS_REQUIRED", "Run Changesets status with JSON output and pass --status-file");
}

let status;
try {
  status = json(options["status-file"]);
} catch (error) {
  fail("INVALID_RELEASE_PLAN", `Cannot parse status file: ${error.message}`);
}
if (!Array.isArray(status.releases)) fail("INVALID_RELEASE_PLAN", "Missing releases array");
status.releases = status.releases.filter((release) => release.type !== "none");
if (status.releases.length === 0) {
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, mode: "no-op", releases: [] })}\n`);
  process.exit(0);
}

const packageByName = new Map(packages(root).map((value) => [value.name, value]));
const workspace = isWorkspace(root);
const releases = status.releases.map((release) => {
  const manifest = packageByName.get(release.name);
  if (!manifest) fail("INVALID_RELEASE_PLAN", `Unknown package ${release.name}`);
  if (manifest.private === true) fail("INVALID_RELEASE_PLAN", `Private package ${release.name} is not publishable`);
  if (release.oldVersion !== manifest.version) fail("INVALID_RELEASE_PLAN", `${release.name} oldVersion does not match its manifest`);
  const changesets = Array.isArray(release.changesets) ? [...release.changesets].sort() : pending;
  return {
    name: release.name,
    path: manifest.path,
    oldVersion: release.oldVersion,
    newVersion: release.newVersion,
    type: release.type,
    changesets,
    tag: adaptiveTag(release.name, release.newVersion, workspace)
  };
}).sort((left, right) => left.path.localeCompare(right.path));

process.stdout.write(`${JSON.stringify({ schemaVersion: 1, mode: "version", releases })}\n`);
