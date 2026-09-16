// T6 tokens-only isolation gates (test-engineer).
//
// Installs only the packed @exre/exui tarball (no react, no react-dom, no
// type packages) into a throwaway fixture and verifies the documented
// token-only contract with real Node resolution: ESM and CJS entries load,
// data is deeply frozen, stylesheets and fonts ship, and the React component
// root fails with a missing-React error rather than silently degrading.
//
// Usage: node notes/skill-refine/t6/run-tokens-only.mjs
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createWriteStream, existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptFile = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptFile), "..", "..", "..")
const assetsDir = join(repoRoot, "notes", "skill-refine", "assets", "t6")
const logFile = join(assetsDir, "tokens-only.log")
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

async function main() {
  await mkdir(assetsDir, { recursive: true })
  logStream = createWriteStream(logFile, { flags: "w" })

  const fixtureRoot = await mkdtemp(join(tmpdir(), "exui-t6-tokens-only-"))
  log(`fixture root: ${fixtureRoot}`)
  try {
    log("packing @exre/exui tarball…")
    const packOutput = run(
      "pnpm",
      ["pack", "--json", "--pack-destination", fixtureRoot],
      join(repoRoot, "packages", "components")
    )
    const tarballField = JSON.parse(packOutput.stdout.trim()).filename
    const tarballPath = (isAbsolute(tarballField) ? tarballField : join(fixtureRoot, tarballField))
      .split("\\")
      .join("/")
    log(`tarball: ${tarballPath}`)

    await writeFile(
      join(fixtureRoot, "package.json"),
      `${JSON.stringify(
        {
          name: "exui-t6-tokens-only",
          private: true,
          type: "module",
          dependencies: {
            "@exre/exui": `file:${tarballPath}`,
          },
        },
        null,
        2
      )}\n`
    )

    log("npm install (tarball only)…")
    run("npm", ["install", "--no-fund", "--no-audit"], fixtureRoot)
    log("npm install done")

    const nodeModules = join(fixtureRoot, "node_modules")
    const reactArtifacts = ["react", "react-dom", "@types/react", "@types/react-dom"]
    const absent = reactArtifacts.filter((name) => !existsSync(join(nodeModules, name)))
    assert.deepEqual(absent, reactArtifacts, "no React artifacts may appear in the tokens-only tree")
    const lsReact = run("npm", ["ls", "react"], fixtureRoot, { allowFailure: true })
    assert.notEqual(lsReact.status, 0, "npm ls react must fail in a tokens-only install")
    log(`npm ls react exit=${lsReact.status} (expected non-zero)`)
    report("tokens-only-no-react", "PASS", reactArtifacts.join(", ") + " absent from the tree")

    // ESM entry
    const esm = run(
      "node",
      [
        "-e",
        `import(${JSON.stringify("@exre/exui/tokens")}).then((m) => {
  const keys = Object.keys(m.exuiTokens).join(",");
  if (keys !== "themes,density,typography,radii,shadows") { throw new Error("unexpected token keys: " + keys); }
  if (Object.keys(m.componentRecipes).join(",") !== "button,formControl,sidebarItem,menu,dialog,tabs") { throw new Error("unexpected recipes"); }
  if (!Object.isFrozen(m.exuiTokens) || !Object.isFrozen(m.exuiTokens.themes)) { throw new Error("tokens must be deeply frozen"); }
  console.log("esm ok");
})`,
      ],
      fixtureRoot
    )
    assert.ok(esm.stdout.includes("esm ok"), "ESM tokens import must succeed")
    report("tokens-esm", "PASS", "ESM entry loads, frozen, expected keys")

    // CJS entry
    const cjs = run(
      "node",
      [
        "-e",
        `const m = require(${JSON.stringify("@exre/exui/tokens")});
if (Object.keys(m.exuiTokens).join(",") !== "themes,density,typography,radii,shadows") { throw new Error("unexpected token keys"); }
if (!Object.isFrozen(m.exuiTokens)) { throw new Error("cjs tokens must be frozen"); }
console.log("cjs ok");`,
      ],
      fixtureRoot
    )
    assert.ok(cjs.stdout.includes("cjs ok"), "CJS tokens require must succeed")
    report("tokens-cjs", "PASS", "require export loads and is frozen")

    // React root must fail loudly without React installed
    const root = run(
      "node",
      [
        "-e",
        `import(${JSON.stringify("@exre/exui")}).then(
  () => { console.error("unexpected success"); process.exit(1); },
  (error) => {
    const text = String(error && error.stack || error);
    console.log("root failure:", text.split("\\n")[0]);
    process.exit(/react/i.test(text) ? 0 : 2);
  }
)`,
      ],
      fixtureRoot,
      { allowFailure: true }
    )
    assert.equal(root.status, 0, `component root must fail with a React-related error, got exit ${root.status}`)
    log(root.stdout.trim())
    report("tokens-only-root-fails", "PASS", "component root fails with missing-React error")

    // Stylesheets and fonts ship in the tarball
    const packageDist = join(nodeModules, "@exre", "exui", "dist", "tokens")
    for (const file of ["style.css", "font.css", "index.js", "cjs/index.js"]) {
      assert.ok(existsSync(join(packageDist, file)), `tokens artifact missing: ${file}`)
    }
    const styleCss = await readFile(join(packageDist, "style.css"), "utf8")
    assert.ok(styleCss.includes(":root"), "token stylesheet defines :root light values")
    assert.ok(styleCss.includes(".dark"), "token stylesheet defines .dark values")
    assert.ok(styleCss.includes(".pitch-black"), "token stylesheet defines .pitch-black values")
    report("tokens-stylesheets", "PASS", "style.css/font.css ship with light, dark, pitch-black layers")
  } finally {
    logStream?.end()
    await rm(fixtureRoot, { recursive: true, force: true })
  }

  const failed = results.filter((entry) => entry.status === "FAIL")
  log(`summary: ${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length > 0 || results.length === 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  log(`driver crashed: ${error?.stack ?? error}`)
  process.exitCode = 1
})
