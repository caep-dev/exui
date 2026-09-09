import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { setTimeout } from "node:timers/promises"
import { args, json, packages, resolveRoot } from "./_lib.mjs"
import { assertPublishableManifest, COMPONENT_PACKAGE_NAME, OFFICIAL_NPM_REGISTRY, PUBLIC_PACKAGE_NAMES, TOKEN_PACKAGE_NAME } from "../package-contract.mjs"

export async function registryStatus(name, version, fetcher = fetch) {
  let response
  try {
    response = await fetcher(`${OFFICIAL_NPM_REGISTRY}${encodeURIComponent(name)}/${encodeURIComponent(version)}`, { signal: AbortSignal.timeout(15000), redirect: "error" })
  } catch { throw new Error("REGISTRY_UNAVAILABLE: request failed or timed out") }
  if (response.status !== 200 && response.status !== 404) throw new Error(`REGISTRY_UNAVAILABLE: HTTP ${response.status}`)
  let body
  try { body = await response.json() } catch { throw new Error("REGISTRY_INCONSISTENT: invalid JSON") }
  if (response.status === 404 && typeof body.error === "string" && body.error) return "absent"
  if (response.status === 200 && body.name === name && body.version === version) return "present"
  throw new Error("REGISTRY_INCONSISTENT: unexpected package metadata")
}

export async function publishIfMissing(name, version, { query = registryStatus, publish }) {
  const state = await query(name, version)
  if (state === "present") return "existing"
  if (state !== "absent") throw new Error("REGISTRY_INCONSISTENT: unknown publication state")
  await publish()
  return "published"
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true" || process.env.GITHUB_REPOSITORY !== "caep-dev/exui") throw new Error("PUBLICATION_CONTEXT_REQUIRED: use the tag-npm workflow")
  const options = args(process.argv.slice(2)), root = resolveRoot(options.root)
  const context = json(options.context)
  const { RELEASE_PACKAGE: name, RELEASE_VERSION: version } = context
  if (!PUBLIC_PACKAGE_NAMES.includes(name)) throw new Error("TAG_PACKAGE_MISMATCH")
  const available = packages(root), target = available.find((p) => p.name === name)
  if (!target || target.version !== version) throw new Error("TAG_VERSION_MISMATCH")
  const result = await publishIfMissing(name, version, { publish: async () => {
    const tokenVersion = available.find((p) => p.name === TOKEN_PACKAGE_NAME)?.version
    if (name === COMPONENT_PACKAGE_NAME) {
      // Independent tag jobs may start in either order. Wait only for confirmed absence.
      let ready = false
      for (let attempt = 0; attempt < 24; attempt++) {
        if (await registryStatus(TOKEN_PACKAGE_NAME, tokenVersion) === "present") { ready = true; break }
        if (attempt < 23) await setTimeout(5000)
      }
      if (!ready) throw new Error("DEPENDENCY_NOT_PUBLISHED: retry after the tokens tag workflow succeeds")
    }
    const temp = mkdtempSync(join(tmpdir(), "exui-npm-"))
    try {
      const output = execFileSync("pnpm", ["--filter", name, "pack", "--json", "--pack-destination", temp], { cwd: root, encoding: "utf8" })
      const packed = JSON.parse(output)
      const tarball = resolve(packed.filename)
      if (tarball !== join(temp, basename(tarball))) throw new Error("PACK_PATH_INVALID")
      const manifest = JSON.parse(execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }))
      assertPublishableManifest(manifest, { expectedName: name, expectedVersion: version, tokenVersion })
      execFileSync("npm", ["publish", tarball, "--access", "public", "--registry", OFFICIAL_NPM_REGISTRY, "--provenance", "--ignore-scripts", "--tag", version.includes("-") ? "next" : "latest"], { cwd: root, stdio: "inherit" })
    } finally { rmSync(temp, { recursive: true, force: true }) }
  } })
  process.stdout.write(`${name}@${version}: ${result}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
