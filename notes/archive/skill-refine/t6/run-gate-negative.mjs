// T6 example-gate negative demo (test-engineer).
//
// Proves the exui-usage example gate fails loudly on a temporary copy of the
// skill — without touching the workspace inputs: a type-broken but properly
// linked example must fail compilation with a diagnostic pointing at the
// file, a forbidden import must be rejected by the static scan, and an
// orphan example must be rejected by the documentation-link check.
//
// Usage: node notes/skill-refine/t6/run-gate-negative.mjs
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createWriteStream } from "node:fs"
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptFile = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptFile), "..", "..", "..")
const skillRoot = join(repoRoot, "skills", "exui-usage")
const gateScript = join(skillRoot, "scripts", "verify-examples.mjs")
const assetsDir = join(repoRoot, "notes", "skill-refine", "assets", "t6")
const logFile = join(assetsDir, "gate-negative.log")
let logStream

function log(message) {
  const line = `${new Date().toISOString()} ${message}`
  console.log(line)
  logStream?.write(line + "\n")
}

function run(command, args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32" && ["pnpm", "npm"].includes(command),
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024,
  })
  const label = `${command} ${args.join(" ")}`
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${label} failed (${result.status}):\n${result.stdout ?? ""}\n${result.stderr ?? ""}`)
  }
  return result
}

const results = []
function report(name, status, detail = "") {
  results.push({ name, status, detail })
  log(`RESULT ${status} ${name}${detail ? ` — ${detail}` : ""}`)
}

async function freshSkillCopy(tempRoot, label) {
  const skillCopy = join(tempRoot, `skill-${label}`)
  await cp(skillRoot, skillCopy, { recursive: true })
  return skillCopy
}

async function linkExample(skillCopy, relativeExample) {
  const skillFile = join(skillCopy, "SKILL.md")
  const current = await readFile(skillFile, "utf8")
  await writeFile(skillFile, `${current}\n[t6 negative demo](${relativeExample})\n`)
}

async function main() {
  await mkdir(assetsDir, { recursive: true })
  logStream = createWriteStream(logFile, { flags: "w" })

  const tempRoot = await mkdtemp(join(tmpdir(), "exui-t6-gate-negative-"))
  log(`temp root: ${tempRoot}`)
  try {
    log("packing @exre/exui tarball once for reuse…")
    const packOutput = run(
      "pnpm",
      ["pack", "--json", "--pack-destination", tempRoot],
      join(repoRoot, "packages", "components")
    )
    const tarballField = JSON.parse(packOutput.stdout.trim()).filename
    const tarballPath = isAbsolute(tarballField) ? tarballField : join(tempRoot, tarballField)
    log(`tarball: ${tarballPath}`)

    // Case A: scanner-clean, documented, type-broken example -> compile failure
    const caseA = await freshSkillCopy(tempRoot, "broken-types")
    await writeFile(
      join(caseA, "examples", "t6-broken-prop.tsx"),
      `import { Button } from "@exre/exui"

export default function T6BrokenProp() {
  return <Button variant="not-a-real-variant">broken</Button>
}
`
    )
    await linkExample(caseA, "examples/t6-broken-prop.tsx")
    const resultA = run(
      "node",
      [gateScript, "--skill", caseA, "--repo", repoRoot, "--tarball", tarballPath],
      repoRoot,
      { allowFailure: true }
    )
    log(`case A exit=${resultA.status}`)
    log(`case A stderr: ${String(resultA.stderr).trim().split("\n").slice(0, 6).join("\n")}`)
    assert.notEqual(resultA.status, 0, "type-broken example must fail the gate")
    assert.ok(
      String(resultA.stderr).includes("example compilation failed"),
      "failure must come from the compile stage"
    )
    assert.ok(
      String(resultA.stderr).includes("t6-broken-prop"),
      "the compiler diagnostic must point at the broken example"
    )
    report("gate-negative-type-broken", "PASS", `exit=${resultA.status}, diagnostic points at t6-broken-prop.tsx`)

    // Case B: forbidden import -> static scan rejection
    const caseB = await freshSkillCopy(tempRoot, "foreign-import")
    await writeFile(
      join(caseB, "examples", "t6-foreign-sonner.tsx"),
      `import { toast as foreignToast } from "sonner"

export default function T6ForeignSonner() {
  return <button onClick={() => foreignToast("nope")}>bad</button>
}
`
    )
    await linkExample(caseB, "examples/t6-foreign-sonner.tsx")
    const resultB = run(
      "node",
      [gateScript, "--skill", caseB, "--repo", repoRoot, "--tarball", tarballPath],
      repoRoot,
      { allowFailure: true }
    )
    log(`case B exit=${resultB.status}`)
    log(`case B stderr: ${String(resultB.stderr).trim().split("\n").slice(0, 6).join("\n")}`)
    assert.notEqual(resultB.status, 0, "forbidden sonner import must fail the gate")
    assert.ok(
      String(resultB.stderr).includes('import "sonner" is not allowed'),
      "failure must name the forbidden import"
    )
    report("gate-negative-forbidden-import", "PASS", `exit=${resultB.status}, import "sonner" rejected`)

    // Case C: orphan example (no document links it) -> link check rejection
    const caseC = await freshSkillCopy(tempRoot, "orphan")
    await writeFile(
      join(caseC, "examples", "t6-orphan.tsx"),
      `import { Badge } from "@exre/exui"

export default function T6Orphan() {
  return <Badge>orphan</Badge>
}
`
    )
    const resultC = run(
      "node",
      [gateScript, "--skill", caseC, "--repo", repoRoot, "--tarball", tarballPath],
      repoRoot,
      { allowFailure: true }
    )
    log(`case C exit=${resultC.status}`)
    log(`case C stderr: ${String(resultC.stderr).trim().split("\n").slice(0, 6).join("\n")}`)
    assert.notEqual(resultC.status, 0, "orphan example must fail the gate")
    assert.ok(
      String(resultC.stderr).includes("not linked from any skill document"),
      "failure must come from the documentation-link check"
    )
    report("gate-negative-orphan-example", "PASS", `exit=${resultC.status}, orphan rejected`)

    // Control: the untouched copy must still pass, proving the gate is not
    // simply rejecting everything and the workspace skill is clean.
    const control = await freshSkillCopy(tempRoot, "control")
    const controlResult = run(
      "node",
      [gateScript, "--skill", control, "--repo", repoRoot, "--tarball", tarballPath],
      repoRoot,
      { allowFailure: true }
    )
    log(`control exit=${controlResult.status}`)
    assert.equal(controlResult.status, 0, "untouched skill copy must pass the gate")
    report("gate-negative-control-passes", "PASS", "untouched skill copy still passes")
  } finally {
    logStream?.end()
    await rm(tempRoot, { recursive: true, force: true })
  }

  const failed = results.filter((entry) => entry.status === "FAIL")
  log(`summary: ${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  log(`driver crashed: ${error?.stack ?? error}`)
  process.exitCode = 1
})
