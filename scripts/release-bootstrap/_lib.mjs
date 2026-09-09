import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export function fail(code, message) {
  process.stderr.write(`${code}: ${message}\n`);
  process.exit(1);
}

export function args(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--") || index + 1 >= argv.length) fail("INVALID_ARGUMENT", `Missing value for ${key}`);
    values[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return values;
}

export function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function normalize(path) {
  return path.replaceAll("\\", "/");
}

function manifests(root) {
  const values = [{ path: join(root, "package.json"), directory: "." }];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || [".git", ".changeset", "node_modules"].includes(entry.name)) continue;
      const child = join(directory, entry.name);
      const manifest = join(child, "package.json");
      if (existsSync(manifest)) values.push({ path: manifest, directory: normalize(relative(root, child)) });
      visit(child);
    }
  };
  visit(root);
  return values;
}

function globPattern(pattern) {
  const normalized = normalize(pattern).replace(/^\.\//, "").replace(/\/$/, "");
  let source = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === "*" && normalized[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]+";
    } else {
      source += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

function workspacePatterns(root, manifest) {
  if (Array.isArray(manifest.workspaces)) return manifest.workspaces;
  if (Array.isArray(manifest.workspaces?.packages)) return manifest.workspaces.packages;
  const pnpmWorkspace = join(root, "pnpm-workspace.yaml");
  if (!existsSync(pnpmWorkspace)) return [];
  return readFileSync(pnpmWorkspace, "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/)?.[1]?.trim())
    .filter(Boolean);
}

export function packages(root) {
  const rootManifest = json(join(root, "package.json"));
  const patterns = workspacePatterns(root, rootManifest);
  if (patterns.length === 0) {
    return rootManifest.name && rootManifest.version
      ? [{ ...rootManifest, path: "." }]
      : [];
  }
  const included = patterns.filter((pattern) => !pattern.startsWith("!")).map(globPattern);
  const excluded = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => globPattern(pattern.slice(1)));
  return manifests(root)
    .filter(({ directory }) => directory !== ".")
    .filter(({ directory }) => included.some((matcher) => matcher.test(directory)) && !excluded.some((matcher) => matcher.test(directory)))
    .map(({ path, directory }) => ({ ...json(path), path: directory }))
    .filter((value) => value.name && value.version);
}

export function isWorkspace(root) {
  const rootManifest = json(join(root, "package.json"));
  return Boolean(rootManifest.workspaces || existsSync(join(root, "pnpm-workspace.yaml")));
}

export function pendingChangesets(root) {
  const directory = join(root, ".changeset");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.toLowerCase().endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((name) => name.slice(0, -3))
    .sort();
}

export function validVersion(version) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version);
}

export function adaptiveTag(name, version, workspace) {
  if (!validVersion(version)) fail("INVALID_RELEASE_PLAN", `Invalid version ${version}`);
  return workspace ? `${name}@${version}` : `v${version}`;
}

export function parseTag(tag) {
  if (tag.startsWith("v") && validVersion(tag.slice(1))) return { kind: "single", name: null, version: tag.slice(1) };
  const separator = tag.lastIndexOf("@");
  if (separator <= 0) fail("TAG_INVALID", `Unsupported release tag ${tag}`);
  const name = tag.slice(0, separator);
  const version = tag.slice(separator + 1);
  if (!name || !validVersion(version)) fail("TAG_INVALID", `Unsupported release tag ${tag}`);
  return { kind: "workspace", name, version };
}

export function git(root, gitArgs) {
  try {
    return execFileSync("git", gitArgs, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (error) {
    fail("GIT_STATE_INVALID", error.message);
  }
}

export function resolveRoot(value) {
  const root = resolve(value ?? ".");
  if (!existsSync(join(root, "package.json"))) fail("PROJECT_UNSUPPORTED", `No package.json under ${root}`);
  return root;
}
