import { isDeepStrictEqual } from "node:util"
import { join } from "node:path"
import { adaptiveTag, fail, git, isWorkspace, json, packages, validVersion } from "./_lib.mjs"

export function releaseDiff(root, base, ref) {
  const current = packages(root)
  const releases = []
  for (const pkg of current) {
    const path = `${pkg.path}/package.json`
    const before = JSON.parse(git(root, ["show", `${base}:${path}`]))
    const after = ref ? JSON.parse(git(root, ["show", `${ref}:${path}`])) : json(join(root, path))
    if (before.version !== after.version) {
      if (after.private || !validVersion(after.version)) fail("RELEASE_DIFF_INVALID", `Invalid public version for ${pkg.name}`)
      releases.push({ name: pkg.name, path: pkg.path, oldVersion: before.version, newVersion: after.version, tag: adaptiveTag(pkg.name, after.version, isWorkspace(root)) })
    }
    delete before.version
    delete after.version
    for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const name of new Set([...Object.keys(before[field] ?? {}), ...Object.keys(after[field] ?? {})])) {
        if (before[field]?.[name] === after[field]?.[name]) continue
        const target = current.find((p) => p.name === name)
        if (!target || !before[field]?.[name] || !after[field]?.[name] ||
            ![target.version, `^${target.version}`, `~${target.version}`, `workspace:${target.version}`, `workspace:^${target.version}`, `workspace:~${target.version}`].includes(after[field][name])) {
          fail("RELEASE_DIFF_INVALID", `Unexpected dependency change ${path}: ${name}`)
        }
        before[field][name] = after[field][name]
      }
    }
    if (!isDeepStrictEqual(before, after)) fail("RELEASE_DIFF_INVALID", `Unexpected manifest fields in ${path}`)
  }
  const allowed = new Set(["pnpm-lock.yaml", ...current.map((p) => `${p.path}/package.json`), ...releases.map((p) => `${p.path}/CHANGELOG.md`)])
  const entries = git(root, ["diff", "--no-renames", "--name-status", base, ...(ref ? [ref] : []), "--"]).split(/\r?\n/).filter(Boolean)
  const changed = []
  for (const entry of entries) {
    const [status, path] = entry.split("\t")
    if (!(allowed.has(path) && status !== "D") && !(status === "D" && /^\.changeset\/[a-zA-Z0-9_-]+\.md$/.test(path) && path !== ".changeset/README.md")) fail("RELEASE_DIFF_INVALID", `Unexpected path or operation: ${entry}`)
    changed.push(path)
  }
  if (!ref) {
    for (const path of git(root, ["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/).filter(Boolean)) {
      if (!releases.some((p) => path === `${p.path}/CHANGELOG.md`)) fail("RELEASE_DIFF_INVALID", `Unexpected untracked path: ${path}`)
      changed.push(path)
    }
  }
  if (!releases.length) fail("RELEASE_DIFF_INVALID", "Release commit has no public version changes")
  return { releases, changed: [...new Set(changed)].sort() }
}

export function committedRelease(root, commit = "HEAD") {
  if (git(root, ["log", "-1", "--format=%s", commit]) !== "chore(release): version packages") fail("TAG_COMMIT_UNTRUSTED", "Not a version commit")
  const parents = git(root, ["rev-list", "--parents", "-n", "1", commit]).split(" ")
  if (parents.length !== 2) fail("TAG_COMMIT_UNTRUSTED", "Version commit must have one parent")
  return releaseDiff(root, parents[1], commit)
}
