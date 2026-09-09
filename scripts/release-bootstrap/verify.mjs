import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, normalize, resolve } from "node:path";
import { args, fail } from "./_lib.mjs";

function digest(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

const options = args(process.argv.slice(2));
if (!options.root) fail("INVALID_ARGUMENT", "--root is required");
const root = resolve(options.root);
const declarationPath = join(root, ".release-bootstrap.yaml");
if (!existsSync(declarationPath)) fail("PROJECT_UNSUPPORTED", ".release-bootstrap.yaml is required");
const declaration = readFileSync(declarationPath, "utf8");
if (/__[A-Z0-9_]+__/.test(declaration)) fail("PROJECT_UNSUPPORTED", "repository declaration contains unresolved template tokens");
if (!/^schemaVersion:\s*1\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "repository declaration schemaVersion must be 1");
const provider = declaration.match(/^provider:\s*(github|gitlab)\s*$/m)?.[1];
if (!provider) fail("PROJECT_UNSUPPORTED", "provider must be github or gitlab");
if (!/^defaultBranch:\s*[^\s#]+\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "defaultBranch is required");
if (!/^packageManager:\s*(npm|pnpm|yarn)\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "packageManager must be npm, pnpm, or yarn");
if (!/^tagStrategy:\s*adaptive\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "tagStrategy must be adaptive");
if (!/^changesets:\s*\r?\n\s{2}required:\s*false\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "changesets.required must be false");
if (!/^\s{2}aggregateCheck:\s*ci-gate\s*$/m.test(declaration)) fail("PROJECT_UNSUPPORTED", "ci.aggregateCheck must be ci-gate");

const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (!manifest.devDependencies?.["@changesets/cli"] && !manifest.dependencies?.["@changesets/cli"]) {
  fail("PROJECT_UNSUPPORTED", "@changesets/cli is required");
}
const changesetsConfig = join(root, ".changeset", "config.json");
if (!existsSync(changesetsConfig)) fail("PROJECT_UNSUPPORTED", ".changeset/config.json is required");
try {
  JSON.parse(readFileSync(changesetsConfig, "utf8"));
} catch (error) {
  fail("PROJECT_UNSUPPORTED", `Invalid .changeset/config.json: ${error.message}`);
}

const qualityScripts = [...declaration.matchAll(/^\s{4}-\s*([a-zA-Z0-9:_-]+)\s*$/gm)].map((match) => match[1]);
for (const script of qualityScripts) {
  if (typeof manifest.scripts?.[script] !== "string") fail("PROJECT_UNSUPPORTED", `configured quality script ${script} is missing from package.json`);
}
const hookIds = [...declaration.matchAll(/^\s{2}-\s*id:\s*([^\s#]+)\s*$/gm)].map((match) => match[1]);
if (new Set(hookIds).size !== hookIds.length || hookIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) {
  fail("HOOK_CONFIGURATION_INVALID", "hook ids must be unique kebab-case values");
}

const providerFiles = provider === "github"
  ? [".github/workflows/ci.yml", ".github/workflows/release.yml"]
  : [".gitlab/ci/release-bootstrap-ci.yml", ".gitlab/ci/release-bootstrap-release.yml"];
for (const path of providerFiles) if (!existsSync(join(root, path))) fail("CI_CONFLICT", `missing provider file ${path}`);

const managedPath = join(root, ".release-bootstrap", "managed.json");
if (!existsSync(managedPath)) fail("PROJECT_UNSUPPORTED", ".release-bootstrap/managed.json is required");

let managed;
try {
  managed = JSON.parse(readFileSync(managedPath, "utf8"));
} catch (error) {
  fail("PROJECT_UNSUPPORTED", `Invalid managed manifest: ${error.message}`);
}
if (managed.schemaVersion !== 1 || !managed.files || Array.isArray(managed.files) || typeof managed.files !== "object") {
  fail("PROJECT_UNSUPPORTED", "Unsupported managed manifest schema");
}

for (const [path, expected] of Object.entries(managed.files)) {
  const normalized = normalize(path);
  if (isAbsolute(path) || normalized === ".." || normalized.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    fail("PROJECT_UNSUPPORTED", `Unsafe managed path ${path}`);
  }
  const target = resolve(root, path);
  if (!existsSync(target)) fail("CI_CONFLICT", `missing managed file ${path}`);
  if (digest(readFileSync(target)) !== expected) fail("CI_CONFLICT", `user-modified managed file ${path}`);
}

process.stdout.write(`${JSON.stringify({ schemaVersion: 1, valid: true, files: Object.keys(managed.files).length })}\n`);
