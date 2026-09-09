import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  assertPublishableManifest,
  COMPONENT_PACKAGE_NAME,
  TOKEN_PACKAGE_NAME,
} from "./package-contract.mjs"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const temporaryRoot = await mkdtemp(join(tmpdir(), "exui-pack-check-"))
const pnpmCommand = "pnpm"

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32" && command === pnpmCommand,
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.error ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`)
  }

  return result.stdout.trim()
}

function pack(packageDirectory) {
  const output = run(
    pnpmCommand,
    ["pack", "--json", "--pack-destination", temporaryRoot],
    packageDirectory
  )
  return JSON.parse(output)
}

function readPackedManifest(tarballPath) {
  return JSON.parse(readPackedText(tarballPath, "package/package.json"))
}

function readPackedText(tarballPath, packedPath) {
  // Relative archive names work with BSD tar and avoid GNU tar's drive-letter parsing.
  return run("tar", ["-xOf", basename(tarballPath), packedPath], dirname(tarballPath))
}

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function requirePackedPaths(packResult, requiredPaths) {
  const paths = new Set(packResult.files.map((file) => file.path))
  for (const requiredPath of requiredPaths) {
    requireCondition(paths.has(requiredPath), `${packResult.name} tarball is missing ${requiredPath}`)
  }
}

async function verifyRootBoundary() {
  const rootManifest = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"))
  const showcaseManifest = JSON.parse(
    await readFile(join(repositoryRoot, "packages", "showcase", "package.json"), "utf8")
  )

  requireCondition(rootManifest.private === true, "root package must remain private")
  requireCondition(rootManifest.name !== "@exre/exui", "root package must not duplicate the component package name")
  requireCondition(showcaseManifest.private === true, "showcase package must remain private")
  requireCondition(showcaseManifest.name !== "@exre/exui", "showcase must not use a public package name")
}

async function verifyConsumer(componentTarball, tokenTarball) {
  const consumerRoot = join(temporaryRoot, "consumer")
  await writeFile(
    join(temporaryRoot, "consumer-package.json"),
    JSON.stringify(
      {
        name: "exui-packed-consumer",
        private: true,
        type: "module",
        scripts: { build: "vite build", "verify:cjs": "node cjs-check.cjs" },
        dependencies: {
          "@exre/exui": `file:${componentTarball}`,
          "@exre/exui-tokens": `file:${tokenTarball}`,
          react: "19.2.7",
          "react-dom": "19.2.7",
          vite: "^8.1.1",
        },
      },
      null,
      2
    ) + "\n"
  )

  await mkdir(consumerRoot, { recursive: true })
  await writeFile(join(consumerRoot, "package.json"), await readFile(join(temporaryRoot, "consumer-package.json"), "utf8"))
  await writeFile(
    join(consumerRoot, "pnpm-workspace.yaml"),
    `packages:\n  - .\noverrides:\n  '@exre/exui-tokens': 'file:${tokenTarball.replaceAll("\\", "/")}'\n`
  )
  await writeFile(
    join(consumerRoot, "index.html"),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src.ts"></script></body></html>\n'
  )
  await writeFile(
    join(consumerRoot, "src.ts"),
    'import "@exre/exui-tokens/font.css"\nimport "@exre/exui-tokens/style.css"\nimport "@exre/exui/style.css"\nimport { componentRecipes, exuiTokens } from "@exre/exui-tokens"\nimport { Button } from "@exre/exui"\nconsole.log(exuiTokens.themes.light.control.primary, componentRecipes.button.defaultSize, Button)\n'
  )

  // The packed tarball is what non-ESM consumers load, so `require` has to be
  // exercised against the installed package rather than the local build.
  await writeFile(
    join(consumerRoot, "cjs-check.cjs"),
    `const assert = require("node:assert")
const { componentRecipes: cjsRecipes, exuiTokens: cjsTokens } = require("@exre/exui-tokens")

async function main() {
  const { componentRecipes: esmRecipes, exuiTokens: esmTokens } = await import("@exre/exui-tokens")

  assert.deepStrictEqual(cjsTokens, esmTokens, "packed CJS and ESM token trees differ")
  assert.ok(Object.isFrozen(cjsTokens), "packed CJS token tree must be frozen")
  assert.deepStrictEqual(cjsRecipes, esmRecipes, "packed CJS and ESM recipe trees differ")
  assert.ok(Object.isFrozen(cjsRecipes.button.default), "packed recipe tree must be deeply frozen")
  assert.deepStrictEqual(
    Object.keys(cjsTokens.themes).sort(),
    ["dark", "light", "pitchBlack"],
    "packed CJS token tree must expose every theme"
  )
  console.log("packed cjs+esm parity ok:", cjsTokens.typography.fontFamily.slice(0, 20))
}

void main()
`
  )

  run(pnpmCommand, ["install", "--ignore-scripts"], consumerRoot)
  run(pnpmCommand, ["build"], consumerRoot)
  run(pnpmCommand, ["verify:cjs"], consumerRoot)
}

try {
  await verifyRootBoundary()

  const tokenPackage = pack(resolve(repositoryRoot, "packages", "tokens"))
  const componentPackage = pack(resolve(repositoryRoot, "packages", "components"))
  const tokenManifest = readPackedManifest(tokenPackage.filename)
  const componentManifest = readPackedManifest(componentPackage.filename)

  assertPublishableManifest(tokenManifest, {
    expectedName: TOKEN_PACKAGE_NAME,
    expectedVersion: tokenPackage.version,
  })
  assertPublishableManifest(componentManifest, {
    expectedName: COMPONENT_PACKAGE_NAME,
    expectedVersion: componentPackage.version,
    tokenVersion: tokenManifest.version,
  })

  requireCondition(tokenManifest.name === "@exre/exui-tokens", "token tarball has the wrong package name")
  requireCondition(
    tokenManifest.exports?.["."]?.import === "./dist/index.js",
    "token tarball changed its ESM import entry"
  )
  requireCondition(
    tokenManifest.exports?.["."]?.require === "./dist/cjs/index.js",
    "token tarball lost its CommonJS require entry"
  )
  requireCondition(
    tokenManifest.main === "./dist/cjs/index.js",
    "token tarball main must point at the CommonJS entry for legacy resolvers"
  )
  requireCondition(
    tokenManifest.module === "./dist/index.js",
    "token tarball changed its ESM module entry"
  )
  requireCondition(componentManifest.name === "@exre/exui", "component tarball has the wrong package name")
  requireCondition(componentManifest.main === "./dist/exui.js", "component tarball changed its main entry")
  requireCondition(componentManifest.types === "./types/index.d.ts", "component tarball changed its types entry")
  requireCondition(
    componentManifest.exports?.["./style.css"]?.default === "./dist/index.css",
    "component tarball changed its style.css entry"
  )
  requireCondition(!tokenManifest.dependencies?.react, "token tarball must not depend on React")
  requireCondition(!tokenManifest.peerDependencies?.react, "token tarball must not peer-depend on React")
  requireCondition(
    !String(componentManifest.dependencies?.["@exre/exui-tokens"]).startsWith("workspace:"),
    "component tarball contains an unresolved workspace protocol"
  )
  requireCondition(
    !Object.values(componentManifest.dependencies ?? {}).some((version) => String(version).startsWith("workspace:")),
    "component tarball contains a workspace-only dependency"
  )
  requireCondition(
    componentManifest.peerDependencies?.react === ">=19.0.0 <20",
    "component tarball changed the React peer contract"
  )

  requirePackedPaths(tokenPackage, [
    "dist/index.js",
    "dist/index.d.ts",
    "dist/cjs/index.js",
    "dist/cjs/package.json",
    "dist/style.css",
    "dist/font.css",
  ])
  const packedTokenCss = readPackedText(tokenPackage.filename, "package/dist/style.css")
  const componentVariableCount = (packedTokenCss.match(/--exui-component-/g) ?? []).length
  requireCondition(componentVariableCount > 0, "token tarball contains no component recipe CSS variables")
  requireCondition(
    tokenPackage.files.every((file) => /^(dist\/|LICENSE$|README\.md$|package\.json$)/.test(file.path)),
    "token tarball contains undeclared source or framework files"
  )
  requirePackedPaths(componentPackage, [
    "dist/exui.js",
    "dist/index.css",
    "types/index.d.ts",
    "types/index.css.d.ts",
    "src/index.ts",
    "src/index.css",
    "components.json",
  ])

  await verifyConsumer(componentPackage.filename, tokenPackage.filename)
  console.log(`Packed token CSS contains ${componentVariableCount} component recipe variables`)
  console.log("Package and packed-consumer validation passed")
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
