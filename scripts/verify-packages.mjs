import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { assertPublishableManifest, COMPONENT_PACKAGE_NAME } from "./package-contract.mjs"
import { createFormConsumerFiles } from "./form-consumer-fixture.mjs"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const temporaryRoot = await mkdtemp(join(tmpdir(), "exui-pack-check-"))
const pnpmCommand = "pnpm"
const npmCommand = "npm"
const typescriptVersion = "~6.0.2"
const viteVersion = "^8.1.1"
const reactVersion = "19.2.7"
const tailwindcssVersion = "^4.3.2"
const tailwindcssViteVersion = "^4.3.2"
// The docs theme sheet targets a Fumadocs installation the consumer owns, so
// the range is pinned here rather than declared in the package manifest.
const fumadocsUiVersion = "^16.15.0"

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
  "react-hook-form",
  "@hookform/resolvers",
  "zod",
  "@standard-schema/spec",
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
    name.startsWith("@hookform/") ||
    name.startsWith("@standard-schema/") ||
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
  // Fumadocs is not a dependency of the package, in any field: naming it
  // would let the installer drag the Fumadocs tree, and its React
  // implementation libraries, into this tree.
  requireCondition(
    !names.has("fumadocs-ui") && !pnpmStore.has("fumadocs-ui"),
    "tokens-only consumer installed fumadocs-ui; the package must not declare it"
  )
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

  // Scalable sizes are published in rem against the 16px base so applications
  // can drive them from their own root font size.
  assert.strictEqual(
    cjs.exuiTokens.density.standard.controlHeight,
    "2.25rem",
    "scalable density geometry must ship as rem"
  )
  assert.strictEqual(
    cjs.exuiTokens.density.compact.controlRadius,
    "0.5rem",
    "compact density geometry must ship as rem"
  )
  assert.strictEqual(
    cjs.exuiTokens.typography.bodyFontSize,
    "0.875rem",
    "scalable typography must ship as rem"
  )
  assert.strictEqual(cjs.exuiTokens.radii.large, "0.625rem", "ordinary radii must ship as rem")
  assert.strictEqual(
    cjs.componentRecipes.button.default.height,
    "2.25rem",
    "scalable recipe geometry must ship as rem"
  )
  assert.strictEqual(
    cjs.componentRecipes.tabs.indicator.thickness,
    "0.125rem",
    "scalable indicator thickness must ship as rem"
  )

  // Fixed-pixel exceptions must survive the migration untouched.
  assert.strictEqual(cjs.exuiTokens.radii.full, "9999px", "capsule radii must stay fixed")
  assert.strictEqual(cjs.exuiTokens.radii.none, "0", "the zero radius must stay unitless")
  assert.strictEqual(
    cjs.componentRecipes.menu.separator.thickness,
    "1px",
    "hairline separators must stay fixed"
  )
  assert.strictEqual(
    cjs.exuiTokens.shadows.focus,
    "0 0 0 3px rgba(0, 136, 255, 0.25)",
    "focus rings must stay fixed"
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
import type { ComponentRecipes, RecipeLength } from "@exre/exui/tokens"

const recipes: ComponentRecipes = componentRecipes
const themes: string[] = Object.keys(exuiTokens.themes)
const size: string = recipes.button.defaultSize

// \`RecipeLength\` keeps accepting rem, px, and 0 so existing consumer recipes
// stay valid while built-in values move to rem.
const remLength: RecipeLength = "2.25rem"
const pxLength: RecipeLength = "36px"
const zeroLength: RecipeLength = "0"
// @ts-expect-error A bare number is not a recipe length.
const unitlessLength: RecipeLength = 36
// @ts-expect-error Em values are not recipe lengths.
const emLength: RecipeLength = "1.5em"
// @ts-expect-error Viewport units are not recipe lengths.
const viewportLength: RecipeLength = "2vw"

// A consumer override may mix the new rem values with the retained px values.
const customButtonSize: ComponentRecipes["button"]["default"] = {
  ...componentRecipes.button.default,
  height: "2.5rem",
  paddingInline: "1rem",
  iconSize: "16px",
  radius: "0",
}

console.log(themes, size, remLength, pxLength, zeroLength, customButtonSize.height)
console.log(unitlessLength, emLength, viewportLength)
`
  const tokensCommonJs = `
import tokens = require("@exre/exui/tokens")
const { exuiTokens, componentRecipes } = tokens
const recipes: tokens.ComponentRecipes = componentRecipes
const themes: string[] = Object.keys(exuiTokens.themes)
const size: string = recipes.button.defaultSize
const remLength: tokens.RecipeLength = "2.25rem"
const pxLength: tokens.RecipeLength = "36px"
const zeroLength: tokens.RecipeLength = "0"
// @ts-expect-error Unrelated units must be rejected by the CommonJS declaration.
const emLength: tokens.RecipeLength = "1.5em"
// @ts-expect-error Unknown recipes must be rejected, not silently typed as any.
componentRecipes.nonexistent
// @ts-expect-error A recipe size is a string, not a number.
const invalidSize: number = componentRecipes.button.defaultSize
console.log(themes, size, remLength, pxLength, zeroLength, emLength)
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

// The docs theme sheet ships unprocessed, so the only way to prove the
// contract is to compile it with a real Tailwind build in a consumer that
// installed the Fumadocs version it targets. Mirrors verifyTokensStylesheet.
async function verifyDocsThemeConsumer(tarballPath) {
  const consumerRoot = join(temporaryRoot, "docs-theme-consumer")
  await mkdir(consumerRoot, { recursive: true })
  await writeFile(
    join(consumerRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "exui-docs-theme-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@exre/exui": `file:${toDependencyPath(tarballPath)}`,
          "fumadocs-ui": fumadocsUiVersion,
          react: reactVersion,
          "react-dom": reactVersion,
        },
        devDependencies: {
          "@tailwindcss/vite": tailwindcssViteVersion,
          tailwindcss: tailwindcssVersion,
          vite: viteVersion,
        },
      },
      null,
      2
    )}\n`
  )
  await writeFile(
    join(consumerRoot, "app.css"),
    '@import "tailwindcss";\n@import "@exre/exui/docs/theme.css";\n'
  )
  await writeFile(join(consumerRoot, "theme-entry.ts"), 'import "./app.css"\n')
  await writeFile(
    join(consumerRoot, "vite.config.mjs"),
    `import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    lib: {
      entry: "theme-entry.ts",
      cssFileName: "docs-theme",
      fileName: () => "docs-theme.js",
      formats: ["es"],
    },
    minify: false,
  },
})
`
  )

  // The package never names Fumadocs in a dependency field, so the fixture
  // has to install the Fumadocs version a consumer would own itself.
  run(npmCommand, ["install", "--no-fund", "--no-audit"], consumerRoot)
  run("node", [join(consumerRoot, "node_modules", "vite", "bin", "vite.js"), "build"], consumerRoot)

  const built = await readFile(join(consumerRoot, "dist", "docs-theme.css"), "utf8")

  // The token sheet arrives through the package's own relative import, which
  // only resolves once dist/docs/theme.css sits next to dist/tokens/.
  requireCondition(
    built.includes("--exui-component-"),
    "docs theme build did not resolve the ExUI token sheet"
  )
  // Fumadocs maps its own colour names onto shadcn's short variables without
  // fallbacks; this mapping is what makes an ExUI-themed docs site work.
  requireCondition(
    /--color-fd-background:\s*var\(--background\)/.test(built),
    "docs theme build lost the Fumadocs-to-ExUI colour mapping"
  )
  // The preset's inline source list is what generates the Fumadocs utilities
  // without scanning the fumadocs-ui installation.
  requireCondition(
    (built.match(/\.bg-fd-[a-z0-9-]+/g) ?? []).length > 0,
    "docs theme build generated no Fumadocs utilities"
  )
  requireCondition(
    !/@import\s+["']fumadocs-ui\//.test(built),
    "docs theme build left an unresolved Fumadocs import"
  )

  console.log("docs theme consumer build ok:", built.length, "chars of compiled stylesheet")
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
import { useState } from "react"
import { Button, Card, CardContent, GlassSeed, ThemeProvider, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, Field, Input, Label, Recharts, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig, useIsMobile } from "@exre/exui"

const { BarChart, Bar, XAxis } = Recharts
const chartData = [
  { month: "January", visitors: 10 },
  { month: "February", visitors: 20 },
]

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
} satisfies ChartConfig

export function App() {
  const [submittedEmail, setSubmittedEmail] = useState("")
  return (
    <ThemeProvider>
      <GlassSeed />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Open</Button>
        </DialogTrigger>
        <DialogContent glass>
          <DialogTitle>Subscribe</DialogTitle>
          <DialogDescription>Enter your email to subscribe.</DialogDescription>
          <form onSubmit={(event) => {
            event.preventDefault()
            setSubmittedEmail(String(new FormData(event.currentTarget).get("email")))
          }}>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </Field>
            <Button type="submit">Subscribe</Button>
            <output role="status">{submittedEmail}</output>
          </form>
        </DialogContent>
      </Dialog>
      <Card glass>
        <CardContent>
          <Button glass variant="danger">Delete</Button>
          <span data-testid="glass-class-surface" className="ex-glass rounded-xl p-4">Class entry point</span>
        </CardContent>
      </Card>
      <ChartContainer config={chartConfig} style={{ width: 480, height: 320 }}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <Bar dataKey="visitors" fill="var(--color-visitors)" isAnimationActive={false} />
          <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
      <span>{useIsMobile() ? "mobile" : "desktop"}</span>
    </ThemeProvider>
  )
}


`
  // The glass prop is a boolean on a fixed set of surfaces; these cases fail the
  // type-check when the prop is widened, when it leaks onto a DOM element, or
  // when the seed silently starts accepting content.
  const glassTypes = `
import { Button, GlassSeed } from "@exre/exui"

// @ts-expect-error glass is a boolean, not a string.
export const wrongType = <Button glass="yes">Nope</Button>

// @ts-expect-error a DOM element has no glass prop; use the ex-glass class instead.
export const onDomElement = <div glass>Nope</div>

// @ts-expect-error GlassSeed takes no children and renders no content of its own.
export const withChildren = <GlassSeed>Nope</GlassSeed>
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
  await writeFile(join(consumerRoot, "glass-types.tsx"), glassTypes)
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
        include: ["app.tsx", "main.tsx", "glass-types.tsx"],
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
import { Button, Card, GlassSeed, Field, Input, Label, ChartContainer, ChartTooltip } from "@exre/exui"
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
    // The seed must render its static markup without touching a browser global,
    // and the material must render with and without the seed.
    createElement(GlassSeed),
    createElement(Button, { variant: "default" }, "Continue"),
    createElement(Button, { glass: true }, "Glass"),
    createElement(Card, { glass: true }, createElement("span", null, "Glass card")),
    createElement(Field, null, createElement(Label, { htmlFor: "email" }, "Email"), createElement(Input, { id: "email", type: "email" })),
    createElement(ChartContainer, { config }, createElement("span", null, "chart")),
    createElement(ChartTooltip, null)
  )
)

assert.match(html, /Continue/, "SSR output must contain the rendered button")
assert.match(html, /type="email"/, "SSR output must contain the rendered form control")
assert.match(html, /exui-glass-distortion-v1/, "SSR output must contain the static filter definition")
assert.match(html, /aria-hidden="true"/, "the seed must stay out of the accessibility tree on the server")
assert.match(html, /ex-glass/, "SSR output must contain the material marker")
assert.doesNotMatch(html, /glass="/, "the glass prop must never reach the server markup as an attribute")

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
  // Run Vite's preview in a child process so Windows releases its native
  // bindings before the parent removes the isolated consumer directory.
  console.log(run(process.execPath, [join(repositoryRoot, "scripts", "verify-react-browser.mjs"), consumerRoot], consumerRoot))
}

// Each version is installed outside the workspace, so workspace overrides
// cannot silently replace the consumer's schema implementation.
async function verifyFormConsumer(tarballPath, zodVersion) {
  const consumerRoot = join(temporaryRoot, `form-zod-${zodVersion}`)
  await mkdir(consumerRoot, { recursive: true })
  await writeFile(join(consumerRoot, "package.json"), `${JSON.stringify({
    name: `exui-form-zod-${zodVersion.replaceAll(".", "-")}`,
    private: true,
    type: "module",
    dependencies: {
      "@exre/exui": `file:${toDependencyPath(tarballPath)}`,
      react: reactVersion,
      "react-dom": reactVersion,
      zod: zodVersion,
    },
    devDependencies: {
      "@types/node": "^24",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: typescriptVersion,
      vite: viteVersion,
    },
  }, null, 2)}\n`)
  for (const [filename, source] of Object.entries(createFormConsumerFiles())) {
    await writeFile(join(consumerRoot, filename), source)
  }
  run(npmCommand, ["install", "--no-fund", "--no-audit"], consumerRoot)
  requireCondition(
    JSON.parse(await readFile(join(consumerRoot, "node_modules", "zod", "package.json"), "utf8")).version === zodVersion,
    `form consumer must install exactly Zod ${zodVersion}`
  )
  const installed = await collectInstalledPackageNames(join(consumerRoot, "node_modules"))
  for (const name of ["react-hook-form", "@hookform/resolvers", "@standard-schema/spec"]) {
    requireCondition(!installed.has(name), `form consumer must not install ${name}`)
  }
  run("node", [join(consumerRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], consumerRoot)
  run("node", [join(consumerRoot, "node_modules", "vite", "bin", "vite.js"), "build"], consumerRoot)
  run("node", [join(consumerRoot, "node_modules", "vite", "bin", "vite.js"), "build", "--ssr", "server.tsx", "--outDir", "ssr"], consumerRoot)
  run("node", ["smoke.mjs"], consumerRoot)
  console.log(run(process.execPath, [join(repositoryRoot, "scripts", "verify-form-browser.mjs"), consumerRoot], consumerRoot))
  logStage(`Zod ${zodVersion}: strict types, SSR, production build and ExForm browser passed`)
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
    "dist/docs/theme.css",
    "types/index.d.ts",
    "types/index.css.d.ts",
    "types/docs/theme.css.d.ts",
    "types/vendor/vendor-packages.json",
    "src/index.ts",
    "src/index.css",
    "src/docs/theme.css",
    "components.json",
  ])

  const packedTokenCss = readPackedText(componentPackage.filename, "package/dist/tokens/style.css")
  const componentVariableCount = (packedTokenCss.match(/--exui-component-/g) ?? []).length
  requireCondition(componentVariableCount > 0, "packed tokens stylesheet contains no component recipe CSS variables")

  // The glass group is the one Token group whose emitted values are references
  // rather than literals, so a count of variable names cannot tell whether the
  // material survived packing. Read the declarations themselves.
  const themeBlock = (selector) => {
    const start = packedTokenCss.indexOf(`${selector} {`)
    requireCondition(start >= 0, `packed tokens stylesheet is missing the ${selector} block`)
    return packedTokenCss.slice(start, packedTokenCss.indexOf("}", start))
  }
  const lightBlock = themeBlock(":root")

  for (const leaf of ["background", "foreground", "border", "shadow", "blur", "saturation"]) {
    requireCondition(
      lightBlock.includes(`--exui-glass-${leaf}:`),
      `packed tokens stylesheet does not declare --exui-glass-${leaf} for the light theme`
    )
  }
  requireCondition(
    lightBlock.includes("--exui-glass-foreground: var(--exui-text-primary);"),
    "the packed material foreground must stay a reference to the semantic text Token"
  )
  requireCondition(
    lightBlock.includes("--exui-glass-shadow: inset 0 0 0"),
    "the packed material edge must stay an inset shadow rather than a border width"
  )
  requireCondition(
    lightBlock.includes("--exui-glass-danger-background: color-mix(in srgb, var(--exui-control-danger)"),
    "the packed danger material must stay a color-mix over the semantic danger colour"
  )
  requireCondition(
    lightBlock.includes("--exui-glass-danger-foreground: var(--exui-control-danger-foreground);"),
    "the packed danger material must keep its danger foreground"
  )

  // The material is retinted per theme through the neutral values, and the
  // danger states follow `control.danger` through the reference above.
  for (const selector of [".dark", ".pitch-black"]) {
    const block = themeBlock(selector)
    for (const leaf of ["background", "border"]) {
      requireCondition(
        block.includes(`--exui-glass-${leaf}:`),
        `packed tokens stylesheet does not retint --exui-glass-${leaf} for ${selector}`
      )
    }
    requireCondition(
      !block.includes("--exui-glass-background: rgba(255, 255, 255, 0.72);"),
      `${selector} must not reuse the light material surface colour`
    )
  }

  const npmTokensConsumer = await verifyTokensOnlyConsumer(componentPackage.filename, { packageManager: "npm" })
  await verifyTokensTypecheck(componentPackage.filename, npmTokensConsumer)
  await verifyTokensStylesheet(componentPackage.filename, npmTokensConsumer)
  await verifyDocsThemeConsumer(componentPackage.filename)
  await verifyTokensOnlyConsumer(componentPackage.filename, { packageManager: "pnpm" })
  await verifyReactConsumer(componentPackage.filename)
  await verifyFormConsumer(componentPackage.filename, "3.25.28")
  await verifyFormConsumer(componentPackage.filename, "4.6.5")

  logStage(`all stages finished in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
  console.log(`Packed tokens CSS contains ${componentVariableCount} component recipe variables`)
  console.log("Package and packed-consumer validation passed")
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
