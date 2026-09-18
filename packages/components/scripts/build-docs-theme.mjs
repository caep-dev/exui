import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { DOCS_THEME_IMPORTS, extractCssImports } from "./docs-theme-contract.mjs"

// This step belongs to `build:types`, not to `build`: `clean-types.mjs` opens
// that script by deleting `types/` outright, so anything that produces a
// declaration there has to be part of the same chain. Placing it in `build`
// instead leaves `dist/docs/theme.css` without its declaration the moment
// `build:types` runs again — which `pnpm typecheck` does on its own, and which
// `verify-packages.mjs` then reports as a missing packed file.
//
// Running here is also what lets `bundle-types.mjs`, the last step of
// `build:types`, validate the new declaration.
const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const sourceFile = path.join(packageRoot, "src", "docs", "theme.css")
const distDirectory = path.join(packageRoot, "dist", "docs")
const typesDirectory = path.join(packageRoot, "types", "docs")

// The stylesheet ships unprocessed: the three imports have to reach the
// consumer's Tailwind build, which is the same shape Fumadocs publishes its
// own `css/*` sheets in. Only the import contract is verified here.
const cssDeclaration = "declare const css: string\nexport default css\n"

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const source = await readFile(sourceFile, "utf8")

requireCondition(
  !source.includes("@exre/exui-tokens"),
  "src/docs/theme.css must not reference the private tokens workspace"
)

const imports = extractCssImports(source)
requireCondition(
  JSON.stringify(imports) === JSON.stringify(DOCS_THEME_IMPORTS),
  `src/docs/theme.css must import ${DOCS_THEME_IMPORTS.join(", ")} in that order, received ${JSON.stringify(imports)}`
)

await mkdir(distDirectory, { recursive: true })
await writeFile(path.join(distDirectory, "theme.css"), source, "utf8")

await mkdir(typesDirectory, { recursive: true })
await writeFile(path.join(typesDirectory, "theme.css.d.ts"), cssDeclaration, "utf8")

for (const target of [
  path.join(distDirectory, "theme.css"),
  path.join(typesDirectory, "theme.css.d.ts"),
]) {
  const written = await readFile(target, "utf8")
  requireCondition(written.trim().length > 0, `docs theme artifact is empty: ${target}`)
}

console.log(
  `Placed the Fumadocs UI theme sheet (${DOCS_THEME_IMPORTS.length} pinned imports, ${source.length} bytes)`
)
