import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { args, fail, git, json, resolveRoot } from "./_lib.mjs"
import { releaseDiff } from "./release-diff.mjs"

const options = args(process.argv.slice(2))
const root = resolveRoot(options.root)
const plan = json(options.plan)
if (plan.mode !== "version" || !plan.releases?.length) fail("INVALID_RELEASE_PLAN", "Expected version plan")
if (options.verify !== "true") {
  if (git(root, ["status", "--porcelain"])) fail("RELEASE_DIFF_INVALID", "Versioning requires a clean checkout")
  try {
    const output = execFileSync(process.execPath, [join(root, "node_modules/@changesets/cli/bin.js"), "version"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    process.stderr.write(output)
  } catch (error) { fail("CHANGESETS_VERSION_FAILED", error.stderr?.toString() || "Changesets failed") }
}
const result = releaseDiff(root, "HEAD")
if (result.releases.length !== plan.releases.length || result.releases.some((r) => !plan.releases.some((p) => p.name === r.name && p.oldVersion === r.oldVersion && p.newVersion === r.newVersion))) {
  fail("RELEASE_DIFF_INVALID", "Versioned tree differs from the release plan")
}
process.stdout.write(`${JSON.stringify({ schemaVersion: 1, changed: result.changed })}\n`)
