import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { extractBareSpecifiers } from "./module-specifiers.mjs"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const distRoot = path.join(packageRoot, "dist")
const typesRoot = path.join(packageRoot, "types")

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function pathExists(candidate) {
  try {
    await stat(candidate)
    return true
  } catch {
    return false
  }
}

async function collectFiles(directory, extension) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath, extension)))
    } else if (entry.name.endsWith(extension)) {
      files.push(entryPath)
    }
  }
  return files
}

function isHostRuntime(specifier) {
  return (
    specifier === "react" ||
    specifier === "react-dom" ||
    specifier.startsWith("react/") ||
    specifier.startsWith("react-dom/")
  )
}

async function run() {
  const requiredFiles = [
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
  ]
  for (const relative of requiredFiles) {
    requireCondition(
      await pathExists(path.join(packageRoot, relative)),
      `public artifact is missing: ${relative}`
    )
  }

  // The component bundle may only import the host runtime as external
  // modules; every implementation library must have been bundled in.
  const bundle = await readFile(path.join(distRoot, "exui.js"), "utf8")
  const bundleExternals = extractBareSpecifiers(bundle)
  const illegalExternals = [...bundleExternals].filter((specifier) => !isHostRuntime(specifier))
  requireCondition(
    illegalExternals.length === 0,
    `dist/exui.js keeps external imports that were supposed to be bundled: ${illegalExternals.join(", ")}`
  )
  requireCondition(bundleExternals.has("react"), "dist/exui.js does not import React as an external module")

  // Shipped declarations may only reference React, React DOM, and files
  // inside the package.
  const declarationFiles = await collectFiles(typesRoot, ".d.ts")
  requireCondition(declarationFiles.length > 0, "types/ contains no declaration files")
  for (const file of declarationFiles) {
    const text = await readFile(file, "utf8")
    const offenders = [...extractBareSpecifiers(text)].filter((specifier) => !isHostRuntime(specifier))
    requireCondition(
      offenders.length === 0,
      `${path.relative(packageRoot, file)} keeps third-party module references: ${offenders.join(", ")}`
    )
  }

  // Token declarations and runtime must stay framework-neutral.
  const tokensDeclarations = [
    ...(await collectFiles(path.join(distRoot, "tokens"), ".d.ts")),
  ]
  for (const file of tokensDeclarations) {
    const text = await readFile(file, "utf8")
    const offenders = [...extractBareSpecifiers(text)]
    requireCondition(
      offenders.length === 0,
      `${path.relative(packageRoot, file)} must not reference external modules: ${offenders.join(", ")}`
    )
  }

  const cjsMarker = JSON.parse(await readFile(path.join(distRoot, "tokens", "cjs", "package.json"), "utf8"))
  requireCondition(cjsMarker.type === "commonjs", "dist/tokens/cjs must be marked as CommonJS")

  const tokenCss = await readFile(path.join(distRoot, "tokens", "style.css"), "utf8")
  const variableCount = (tokenCss.match(/--exui-component-/g) ?? []).length
  requireCondition(variableCount > 0, "dist/tokens/style.css contains no component recipe variables")
  requireCondition(
    tokenCss.includes(".dark") && tokenCss.includes(".pitch-black"),
    "dist/tokens/style.css must keep every theme block"
  )

  const fontCss = await readFile(path.join(distRoot, "tokens", "font.css"), "utf8")
  requireCondition(
    fontCss.includes("@fontsource-variable/outfit"),
    "dist/tokens/font.css must keep its resolvable font dependency import"
  )

  const componentCss = await readFile(path.join(distRoot, "index.css"), "utf8")
  requireCondition(
    (componentCss.match(/--exui-/g) ?? []).length > 0,
    "dist/index.css no longer contains token variables"
  )
  requireCondition(
    componentCss.includes("@font-face"),
    "dist/index.css no longer contains the bundled font faces"
  )

  const notices = await readFile(path.join(distRoot, "third-party-notices.md"), "utf8")
  requireCondition(notices.includes("## "), "third-party notices list no packages")

  const internalReferences = []
  for (const file of [
    path.join(distRoot, "exui.js"),
    ...declarationFiles,
    ...tokensDeclarations,
  ]) {
    const text = await readFile(file, "utf8")
    if (text.includes("@exre/exui-tokens")) {
      internalReferences.push(path.relative(packageRoot, file))
    }
  }
  requireCondition(
    internalReferences.length === 0,
    `public artifacts reference the internal tokens workspace: ${internalReferences.join(", ")}`
  )

  console.log(
    `Public artifact check passed (${declarationFiles.length} declaration files, ${variableCount} component recipe variables)`
  )
}

await run()
