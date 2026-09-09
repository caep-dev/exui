import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { assertPublishableManifest, COMPONENT_PACKAGE_NAME } from "./package-contract.mjs"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const temporaryRoot = await mkdtemp(join(tmpdir(), "exui-pack-check-"))
const pnpmCommand = "pnpm"
const npmCommand = "npm"
const typescriptVersion = "~6.0.2"
const viteVersion = "^8.1.1"
const reactVersion = "19.2.7"

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32" && [pnpmCommand, npmCommand].includes(command),
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.error ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`)
  }

  return result.stdout.trim()
}

function toDependencyPath(value) {
  return value.replaceAll("\\", "/")
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

// The single-package contract forbids any component implementation library
// or React runtime from appearing in a tokens-only dependency tree. The set
// mirrors the bundled implementation closure recorded during the build.
const FORBIDDEN_TOKENS_TREE_PACKAGES = new Set([
  "react",
  "react-dom",
  "react-is",
  "@types/react",
  "@types/react-dom",
  "scheduler",
  "prop-types",
  "radix-ui",
  "@shadcn/react",
  "recharts",
  "react-redux",
  "@reduxjs/toolkit",
  "redux",
  "redux-thunk",
  "reselect",
  "immer",
  "cmdk",
  "vaul",
  "sonner",
  "embla-carousel",
  "embla-carousel-react",
  "embla-carousel-reactive-utils",
  "input-otp",
  "lucide-react",
  "next-themes",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "date-fns",
  "react-day-picker",
  "react-resizable-panels",
  "victory-vendor",
  "es-toolkit",
  "use-sync-external-store",
  "use-callback-ref",
  "use-sidecar",
  "react-remove-scroll",
  "react-remove-scroll-bar",
  "react-style-singleton",
  "aria-hidden",
  "get-nonce",
  "internmap",
  "decimal.js-light",
  "eventemitter3",
  "tiny-invariant",
  "@date-fns/tz",
  "@floating-ui/core",
  "@floating-ui/dom",
  "@floating-ui/react-dom",
  "@floating-ui/utils",
])

function isForbiddenTokensTreePackage(name) {
  return (
    FORBIDDEN_TOKENS_TREE_PACKAGES.has(name) ||
    name.startsWith("@radix-ui/") ||
    name.startsWith("@base-ui/") ||
    name.startsWith("d3-") ||
    name === "@types/react" ||
    name === "@types/react-dom"
  )
}

async function isRealDirectory(candidate) {
  const info = await stat(candidate).catch(() => null)
  return Boolean(info?.isDirectory())
}

// Walks a node_modules tree and returns every installed package name,
// including packages that only exist inside the pnpm virtual store
// (`.pnpm/<entry>/node_modules/<name>`) or in nested node_modules folders.
async function collectInstalledPackageNames(nodeModulesDirectory) {
  const names = new Set()
  const entries = await readdir(nodeModulesDirectory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.name === ".bin") {
      continue
    }
    const entryPath = join(nodeModulesDirectory, entry.name)
    if (!(await isRealDirectory(entryPath))) {
      continue
    }
    if (entry.name.startsWith("@")) {
      for (const scoped of await readdir(entryPath, { withFileTypes: true }).catch(() => [])) {
        const scopedPath = join(entryPath, scoped.name)
        if (await isRealDirectory(scopedPath)) {
          const manifest = join(scopedPath, "package.json")
          const parsed = JSON.parse(await readFile(manifest, "utf8").catch(() => "null"))
          if (parsed?.name) {
            names.add(parsed.name)
          }
        }
      }
    } else {
      const manifest = join(entryPath, "package.json")
      const parsed = JSON.parse(await readFile(manifest, "utf8").catch(() => "null"))
      if (parsed?.name) {
        names.add(parsed.name)
      }
    }
    // pnpm store entries and regular packages can both own a nested
    // node_modules tree; always descend so hidden installs surface.
    for (const nested of await collectInstalledPackageNames(join(entryPath, "node_modules"))) {
      names.add(nested)
    }
  }
  return names
}

async function assertTokensOnlyTree(consumerRoot) {
  const names = await collectInstalledPackageNames(join(consumerRoot, "node_modules"))
  const pnpmStore = await collectInstalledPackageNames(
    join(consumerRoot, "node_modules", ".pnpm")
  )
  for (const name of [...names, ...pnpmStore]) {
    requireCondition(
      !isForbiddenTokensTreePackage(name),
      `tokens-only consumer installed forbidden package ${name}`
    )
  }
  requireCondition(
    names.has("@fontsource-variable/outfit"),
    "tokens-only consumer must install the public font dependency"
  )
  requireCondition(names.has("@exre/exui"), "tokens-only consumer must install the public package")
}

const tokensRuntimeCheck = `
const assert = require("node:assert")

async function main() {
  const cjs = require("@exre/exui/tokens")
  const esm = await import("@exre/exui/tokens")

  assert.deepStrictEqual(cjs.exuiTokens, esm.exuiTokens, "CJS and ESM token trees differ")
  assert.deepStrictEqual(cjs.componentRecipes, esm.componentRecipes, "CJS and ESM recipe trees differ")
  assert.ok(Object.isFrozen(cjs.exuiTokens), "token tree must be frozen")
  assert.ok(Object.isFrozen(cjs.componentRecipes.button), "recipe tree must be deeply frozen")
  assert.deepStrictEqual(
    Object.keys(cjs.exuiTokens.themes).sort(),
    ["dark", "light", "pitchBlack"],
    "token tree must expose every theme"
  )
  assert.deepStrictEqual(
    Object.keys(cjs.exuiTokens.density).sort(),
    ["compact", "standard"],
    "token tree must expose every density"
  )

  let componentImportError
  try {
    await import("@exre/exui")
  } catch (error) {
    componentImportError = error
  }
  assert.ok(componentImportError, "importing the component root without React must fail")
  assert.match(
    String(componentImportError.message),
    /react/i,
    "component root must fail with a missing-React error"
  )

  console.log("tokens runtime parity ok:", cjs.exuiTokens.typography.fontFamily.slice(0, 12))
}

void main()
`

async function verifyTokensOnlyConsumer(tarballPath, { packageManager }) {
  const consumerRoot = join(temporaryRoot, `${packageManager}-tokens-consumer`)
  await mkdir(consumerRoot, { recursive: true })
  const manifest = {
    name: `exui-${packageManager}-tokens-consumer`,
    private: true,
    dependencies: {
      "@exre/exui": `file:${toDependencyPath(tarballPath)}`,
    },
  }
  if (packageManager === "npm") {
    // Development tooling for the type and stylesheet checks below; none of
    // it may pull the React runtime into the dependency tree.
    manifest.devDependencies = {
      "@types/node": "^24",
      typescript: typescriptVersion,
      vite: viteVersion,
    }
  }
  await writeFile(
    join(consumerRoot, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  await writeFile(join(consumerRoot, "check.cjs"), tokensRuntimeCheck)

  if (packageManager === "npm") {
    run(npmCommand, ["install", "--no-fund", "--no-audit"], consumerRoot)
  } else {
    run(pnpmCommand, ["install", "--ignore-scripts"], consumerRoot)
  }
  await assertTokensOnlyTree(consumerRoot)
  run("node", ["check.cjs"], consumerRoot)

  return consumerRoot
}

async function verifyTokensTypecheck(tarballPath, consumerRoot) {
  const tokensConsumer = `
import { exuiTokens, componentRecipes } from "@exre/exui/tokens"
import type { ComponentRecipes } from "@exre/exui/tokens"

const recipes: ComponentRecipes = componentRecipes
const themes: string[] = Object.keys(exuiTokens.themes)
const size: string = recipes.button.defaultSize
console.log(themes, size)
`
  const tokensCommonJs = `
import tokens = require("@exre/exui/tokens")
const { exuiTokens, componentRecipes } = tokens
const recipes: tokens.ComponentRecipes = componentRecipes
const themes: string[] = Object.keys(exuiTokens.themes)
const size: string = recipes.button.defaultSize
// @ts-expect-error Unknown recipes must be rejected, not silently typed as any.
componentRecipes.nonexistent
// @ts-expect-error A recipe size is a string, not a number.
const invalidSize: number = componentRecipes.button.defaultSize
console.log(themes, size)
`
  const sharedOptions = {
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    types: ["node"],
  }
  await writeFile(join(consumerRoot, "tokens.ts"), tokensConsumer)
  await writeFile(join(consumerRoot, "tokens.mts"), tokensConsumer)
  await writeFile(join(consumerRoot, "tokens.cts"), tokensCommonJs)
  await writeFile(
    join(consumerRoot, "tsconfig.bundler.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          ...sharedOptions,
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2023",
          lib: ["ES2023", "DOM"],
        },
        include: ["tokens.ts"],
      },
      null,
      2
    )}\n`
  )
  await writeFile(
    join(consumerRoot, "tsconfig.nodenext.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          ...sharedOptions,
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
        include: ["tokens.mts", "tokens.cts"],
      },
      null,
      2
    )}\n`
  )

  run("node", [join(consumerRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.bundler.json"], consumerRoot)
  const nodeNextFiles = run("node", [join(consumerRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.nodenext.json", "--listFiles"], consumerRoot)
  requireCondition(
    nodeNextFiles.replaceAll("\\", "/").split(/\r?\n/).some(
      (file) => file.endsWith("/node_modules/@exre/exui/dist/tokens/cjs/index.d.ts")
    ),
    "NodeNext CommonJS consumer must resolve the tokens require declaration entry"
  )
}

async function verifyTokensStylesheet(tarballPath, consumerRoot) {
  await writeFile(
    join(consumerRoot, "style-entry.ts"),
    'import "@exre/exui/tokens/style.css"\nimport "@exre/exui/tokens/font.css"\n'
  )
  await writeFile(
    join(consumerRoot, "vite.config.mjs"),
    `import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: "style-entry.ts",
      cssFileName: "tokens",
      fileName: () => "tokens.js",
      formats: ["es"],
    },
    minify: false,
  },
})
`
  )
  run("node", [join(consumerRoot, "node_modules", "vite", "bin", "vite.js"), "build"], consumerRoot)
  const built = await readFile(join(consumerRoot, "dist", "tokens.css"), "utf8")
  requireCondition(
    (built.match(/--exui-component-/g) ?? []).length > 0,
    "tokens stylesheet build contains no component recipe variables"
  )
  requireCondition(built.includes("@font-face"), "tokens stylesheet build lost the font faces")
  requireCondition(
    built.includes("@fontsource-variable/outfit") || built.includes("Outfit"),
    "tokens stylesheet build did not resolve the font dependency"
  )
  requireCondition(!built.includes("--tw-"), "tokens stylesheet build leaked component Tailwind styles")
}

async function verifyReactConsumer(tarballPath) {
  const consumerRoot = join(temporaryRoot, "react-consumer")
  await mkdir(consumerRoot, { recursive: true })
  await writeFile(
    join(consumerRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "exui-react-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@exre/exui": `file:${toDependencyPath(tarballPath)}`,
          react: reactVersion,
          "react-dom": reactVersion,
        },
        devDependencies: {
          "@types/node": "^24",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          typescript: typescriptVersion,
          vite: viteVersion,
        },
      },
      null,
      2
    )}\n`
  )

  const application = `
import "@exre/exui/style.css"
import { Button, ThemeProvider, Dialog, DialogTrigger, DialogContent, Field, Input, Label, ChartContainer, ChartTooltip, ChartConfig, useIsMobile } from "@exre/exui"

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
} satisfies ChartConfig

export function App() {
  return (
    <ThemeProvider>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Open</Button>
        </DialogTrigger>
        <DialogContent>
          <form>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" />
            </Field>
          </form>
        </DialogContent>
      </Dialog>
      <ChartContainer config={chartConfig}>
        <span>chart</span>
      </ChartContainer>
      <span>{useIsMobile() ? "mobile" : "desktop"}</span>
      <ChartTooltip />
    </ThemeProvider>
  )
}
`
  const entry = `
import { createRoot } from "react-dom/client"
import { App } from "./app"

const container = document.getElementById("app")
if (container) {
  createRoot(container).render(<App />)
}
`
  await writeFile(join(consumerRoot, "app.tsx"), application)
  await writeFile(join(consumerRoot, "main.tsx"), entry)
  await writeFile(
    join(consumerRoot, "index.html"),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/main.tsx"></script></body></html>\n'
  )
  await writeFile(
    join(consumerRoot, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          target: "ES2023",
          lib: ["ES2023", "DOM", "DOM.Iterable"],
          types: ["node", "vite/client"],
        },
        include: ["app.tsx", "main.tsx"],
      },
      null,
      2
    )}\n`
  )
  await writeFile(
    join(consumerRoot, "vite.config.mjs"),
    `import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: { minify: false },
})
`
  )
  const serverSmoke = `
import { renderToString } from "react-dom/server"
import { createElement } from "react"
import { Button, Field, Input, Label, ChartContainer, ChartTooltip } from "@exre/exui"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"
import assert from "node:assert/strict"

// The theme provider intentionally targets browser consumers and reads
// localStorage during render, so server rendering covers the remaining
// public surface.
const config = { visitors: { label: "Visitors", color: "var(--chart-1)" } }

const html = renderToString(
  createElement(
    "div",
    null,
    createElement(Button, { variant: "default" }, "Continue"),
    createElement(Field, null, createElement(Label, { htmlFor: "email" }, "Email"), createElement(Input, { id: "email", type: "email" })),
    createElement(ChartContainer, { config }, createElement("span", null, "chart")),
    createElement(ChartTooltip, null)
  )
)

assert.match(html, /Continue/, "SSR output must contain the rendered button")
assert.match(html, /type="email"/, "SSR output must contain the rendered form control")

const require = createRequire(import.meta.url)
const rootReact = require.resolve("react")
const packageEntryPath = fileURLToPath(import.meta.resolve("@exre/exui"))
const packageReact = createRequire(
  path.join(path.dirname(packageEntryPath), "package.json")
).resolve("react")
assert.equal(rootReact, packageReact, "the package must share the consumer React instance")

console.log("react consumer SSR smoke ok:", html.length, "chars, single React instance")
`
  await writeFile(join(consumerRoot, "smoke.mjs"), serverSmoke)

  run(npmCommand, ["install", "--no-fund", "--no-audit"], consumerRoot)
  run("node", [join(consumerRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], consumerRoot)

  // @vitejs/plugin-react is a development requirement of the fixture only;
  // install it after the package tree assertions would have run.
  run(npmCommand, ["install", "--no-fund", "--no-audit", "--save-dev", "@vitejs/plugin-react@^6"], consumerRoot)
  run("node", [join(consumerRoot, "node_modules", "vite", "bin", "vite.js"), "build"], consumerRoot)
  run("node", ["smoke.mjs"], consumerRoot)
}

function logStage(message) {
  console.log(`[verify-packages] ${message}`)
}

try {
  const startedAt = Date.now()
  logStage(`node ${process.versions.node}, npm ${run(npmCommand, ["--version"])}, pnpm ${run(pnpmCommand, ["--version"])}`)

  await verifyRootBoundary()

  const componentPackage = pack(resolve(repositoryRoot, "packages", "components"))
  const componentManifest = readPackedManifest(componentPackage.filename)

  assertPublishableManifest(componentManifest, {
    expectedName: COMPONENT_PACKAGE_NAME,
    expectedVersion: componentPackage.version,
  })

  requireCondition(componentManifest.name === "@exre/exui", "component tarball has the wrong package name")
  requireCondition(componentManifest.main === "./dist/exui.js", "component tarball changed its main entry")
  requireCondition(componentManifest.types === "./types/index.d.ts", "component tarball changed its types entry")
  requireCondition(
    !Object.values({ ...componentManifest.dependencies, ...componentManifest.optionalDependencies, ...componentManifest.peerDependencies })
      .some((version) => String(version).startsWith("workspace:")),
    "component tarball contains an unresolved workspace protocol in its production graph"
  )

  requirePackedPaths(componentPackage, [
    "dist/exui.js",
    "dist/index.css",
    "dist/bundled-modules.json",
    "dist/third-party-notices.md",
    "dist/tokens/index.js",
    "dist/tokens/index.d.ts",
    "dist/tokens/cjs/index.js",
    "dist/tokens/cjs/index.d.ts",
    "dist/tokens/cjs/package.json",
    "dist/tokens/style.css",
    "dist/tokens/style.css.d.ts",
    "dist/tokens/font.css",
    "dist/tokens/font.css.d.ts",
    "types/index.d.ts",
    "types/index.css.d.ts",
    "types/vendor/vendor-packages.json",
    "src/index.ts",
    "src/index.css",
    "components.json",
  ])

  const packedTokenCss = readPackedText(componentPackage.filename, "package/dist/tokens/style.css")
  const componentVariableCount = (packedTokenCss.match(/--exui-component-/g) ?? []).length
  requireCondition(componentVariableCount > 0, "packed tokens stylesheet contains no component recipe CSS variables")

  const npmTokensConsumer = await verifyTokensOnlyConsumer(componentPackage.filename, { packageManager: "npm" })
  await verifyTokensTypecheck(componentPackage.filename, npmTokensConsumer)
  await verifyTokensStylesheet(componentPackage.filename, npmTokensConsumer)
  await verifyTokensOnlyConsumer(componentPackage.filename, { packageManager: "pnpm" })
  await verifyReactConsumer(componentPackage.filename)

  logStage(`all stages finished in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
  console.log(`Packed tokens CSS contains ${componentVariableCount} component recipe variables`)
  console.log("Package and packed-consumer validation passed")
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
