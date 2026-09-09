import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const runtime = fileURLToPath(new URL("./", import.meta.url))
function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), "exui-release-test-"))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const root = join(base, "work")
  mkdirSync(root)
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
  const write = (path, content) => { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), typeof content === "string" ? content : JSON.stringify(content)) }
  write("package.json", { private: true, packageManager: "pnpm@11.9.0" })
  write("pnpm-workspace.yaml", "packages:\n  - packages/*\n")
  write("packages/exui/package.json", { name: "@exre/exui", version: "0.1.0" })
  write("packages/tokens/package.json", { name: "@exre/exui-tokens", version: "0.0.0", private: true })
  write(".changeset/config.json", {})
  git("init", "-b", "main")
  git("config", "user.name", "Release Test")
  git("config", "user.email", "release@example.test")
  git("add", ".")
  git("commit", "-m", "initial")
  const remote = join(base, "remote.git")
  execFileSync("git", ["init", "--bare", remote], { stdio: "ignore" })
  git("remote", "add", "origin", remote)
  git("push", "origin", "main")
  const cli = (file, ...args) => spawnSync(process.execPath, [join(runtime, file), "--root", root, ...args], { encoding: "utf8" })
  return { root, git, write, cli, base }
}
function release(f, extra = false) {
  f.write("packages/exui/package.json", { name: "@exre/exui", version: "0.2.0" })
  if (extra) f.write("source.js", "unrelated")
  f.git("add", ".")
  f.git("commit", "-m", "chore(release): version packages")
  f.git("push", "origin", "main")
  return f.git("rev-parse", "HEAD")
}
function ok(result) { assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout) }
test("an ordinary merge without Changesets is a successful no-op without credentials", (t) => {
  const f = fixture(t)
  assert.equal(ok(f.cli("plan.mjs")).mode, "no-op")
})
test("planning maps the public package to its package-version tag", (t) => {
  const f = fixture(t)
  f.write(".changeset/feature.md", '---\n"@exre/exui": minor\n---\nFeature\n')
  const status = join(f.base, "status.json")
  writeFileSync(status, JSON.stringify({ releases: [{ name: "@exre/exui", oldVersion: "0.1.0", newVersion: "0.2.0", type: "minor", changesets: ["feature"] }] }))
  const plan = ok(f.cli("plan.mjs", "--status-file", status))
  assert.equal(plan.releases[0].tag, "@exre/exui@0.2.0")
})
test("private Changesets dependency entries with type none do not become releases", (t) => {
  const f = fixture(t)
  f.write("packages/showcase/package.json", { name: "showcase", private: true, version: "0.0.0" })
  f.write(".changeset/feature.md", '---\n"@exre/exui": minor\n---\nFeature\n')
  const status = join(f.base, "status.json")
  writeFileSync(status, JSON.stringify({ releases: [
    { name: "@exre/exui", oldVersion: "0.1.0", newVersion: "0.2.0", type: "minor", changesets: ["feature"] },
    { name: "showcase", oldVersion: "0.0.0", newVersion: "0.0.0", type: "none", changesets: [] },
  ] }))
  assert.equal(ok(f.cli("plan.mjs", "--status-file", status)).releases.length, 1)
})
test("a release commit recovers annotated tags idempotently at the same SHA", (t) => {
  const f = fixture(t), sha = release(f)
  const plan = ok(f.cli("plan.mjs"))
  assert.equal(plan.mode, "recover")
  const path = join(f.base, "plan.json")
  writeFileSync(path, JSON.stringify(plan))
  assert.equal(ok(f.cli("tags.mjs", "--plan", path, "--commit", sha)).tags[0].state, "created")
  assert.equal(f.git("cat-file", "-t", "refs/tags/@exre/exui@0.2.0"), "tag")
  assert.equal(ok(f.cli("tags.mjs", "--plan", path, "--commit", sha)).tags[0].state, "existing")
  const context = ok(f.cli("hook-context.mjs", "--tag", "@exre/exui@0.2.0", "--commit", sha, "--provider", "github", "--repository", "caep-dev/exui", "--hook-id", "npm", "--main-ref", "origin/main"))
  assert.equal(context.RELEASE_PACKAGE, "@exre/exui")
  assert.equal(context.RELEASE_VERSION, "0.2.0")
})
test("a private tokens package version bump never becomes a release", (t) => {
  const f = fixture(t)
  f.write(".changeset/feature.md", '---\n"@exre/exui": patch\n---\nFeature\n')
  f.write("packages/tokens/package.json", { name: "@exre/exui-tokens", version: "0.1.0", private: true })
  const status = join(f.base, "status.json")
  writeFileSync(status, JSON.stringify({ releases: [{ name: "@exre/exui", oldVersion: "0.1.0", newVersion: "0.1.1", type: "patch", changesets: ["feature"] }] }))
  const plan = ok(f.cli("plan.mjs", "--status-file", status))
  assert.equal(plan.releases.length, 1)
  assert.equal(plan.releases[0].name, "@exre/exui")
})
test("legacy tokens release tags are rejected even when annotated on the release commit", (t) => {
  const f = fixture(t), sha = release(f)
  f.git("tag", "-a", "@exre/exui-tokens@0.2.0", "-m", "legacy", sha)
  const result = f.cli("hook-context.mjs", "--tag", "@exre/exui-tokens@0.2.0", "--commit", sha, "--provider", "github", "--repository", "caep-dev/exui", "--hook-id", "npm", "--main-ref", "origin/main")
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /TAG_PACKAGE_MISMATCH|Unknown publishable package/)
})
test("release subject alone cannot authorize unrelated file changes", (t) => {
  const f = fixture(t), sha = release(f, true)
  f.git("tag", "-a", "@exre/exui@0.2.0", "-m", "release")
  const result = f.cli("hook-context.mjs", "--tag", "@exre/exui@0.2.0", "--commit", sha, "--provider", "github", "--repository", "caep-dev/exui", "--hook-id", "npm", "--main-ref", "origin/main")
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /RELEASE_DIFF_INVALID/)
})
test("lightweight and mismatched tags never authorize publication", (t) => {
  const f = fixture(t), sha = release(f)
  f.git("tag", "@exre/exui@0.2.0")
  const result = f.cli("hook-context.mjs", "--tag", "@exre/exui@0.2.0", "--commit", sha, "--provider", "github", "--repository", "caep-dev/exui", "--hook-id", "npm", "--main-ref", "origin/main")
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /TAG_UNANNOTATED/)
})
test("a conflicting remote tag is not moved", (t) => {
  const f = fixture(t), old = f.git("rev-parse", "HEAD"), sha = release(f)
  f.git("tag", "-a", "@exre/exui@0.2.0", "-m", "wrong", old)
  f.git("push", "origin", "refs/tags/@exre/exui@0.2.0")
  const plan = ok(f.cli("plan.mjs")), path = join(f.base, "plan.json")
  writeFileSync(path, JSON.stringify(plan))
  const result = f.cli("tags.mjs", "--plan", path, "--commit", sha)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /TAG_CONFLICT/)
  assert.equal(f.git("rev-parse", "@exre/exui@0.2.0^{}"), old)
})
test("a manifest script change disguised as a version commit is rejected", (t) => {
  const f = fixture(t)
  const manifest = JSON.parse(readFileSync(join(f.root, "packages/exui/package.json")))
  f.write("packages/exui/package.json", { ...manifest, version: "0.2.0", scripts: { prepublishOnly: "unexpected" } })
  f.git("add", "."); f.git("commit", "-m", "chore(release): version packages")
  const result = f.cli("plan.mjs")
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /RELEASE_DIFF_INVALID/)
})

test("real Changesets versioning returns JSON and limits the staged paths", (t) => {
  const f = fixture(t)
  f.write(".gitignore", "node_modules/\n")
  f.write(".changeset/config.json", { changelog: "@changesets/cli/changelog", commit: false, baseBranch: "main", access: "public", updateInternalDependencies: "patch" })
  f.write(".changeset/feature.md", '---\n"@exre/exui": minor\n---\nFeature\n')
  f.git("add", "."); f.git("commit", "-m", "feature")
  const dependencies = fileURLToPath(new URL("../../node_modules", import.meta.url))
  symlinkSync(dependencies, join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir")
  const path = join(f.base, "plan.json")
  writeFileSync(path, JSON.stringify({ mode: "version", releases: [{ name: "@exre/exui", oldVersion: "0.1.0", newVersion: "0.2.0" }] }))
  const result = ok(f.cli("version.mjs", "--plan", path))
  assert.deepEqual(result.changed, [".changeset/feature.md", "packages/exui/CHANGELOG.md", "packages/exui/package.json"])
  assert.equal(JSON.parse(readFileSync(join(f.root, "packages/exui/package.json"))).version, "0.2.0")
  f.write("unexpected.js", "unrelated")
  const rejected = f.cli("version.mjs", "--plan", path, "--verify", "true")
  assert.notEqual(rejected.status, 0)
  assert.match(rejected.stderr, /RELEASE_DIFF_INVALID/)
})
