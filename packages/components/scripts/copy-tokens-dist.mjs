import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const tokensWorkspaceRoot = path.resolve(packageRoot, "..", "tokens")
const tokensDistDirectory = path.join(tokensWorkspaceRoot, "dist")
const outputDirectory = path.join(packageRoot, "dist", "tokens")

const cssDeclaration = "declare const css: string\nexport default css\n"

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

async function copyTree(source, target) {
  const entries = await readdir(source, { withFileTypes: true })
  await mkdir(target, { recursive: true })
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)
    if (entry.isDirectory()) {
      await copyTree(sourcePath, targetPath)
    } else {
      await copyFile(sourcePath, targetPath)
    }
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(entry.name)
    }
  }
  return files
}

async function run() {
  requireCondition(
    await pathExists(path.join(tokensDistDirectory, "index.js")),
    "tokens workspace has no built dist. Run pnpm --filter @exre/exui-tokens build first."
  )
  requireCondition(
    await pathExists(path.join(tokensDistDirectory, "cjs", "package.json")),
    "tokens workspace CommonJS output is incomplete. Run pnpm --filter @exre/exui-tokens build first."
  )

  const rootFiles = await listFiles(tokensDistDirectory)
  for (const name of rootFiles) {
    requireCondition(
      /\.(js|d\.ts|css)$/.test(name) || name === "package.json",
      `unexpected file in tokens dist root: ${name}`
    )
  }

  // The copy replaces any previous tokens artifact so stale files from older
  // builds cannot survive into the public package.
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(outputDirectory, { recursive: true })

  for (const name of rootFiles) {
    if (/\.js$/.test(name)) {
      await copyFile(path.join(tokensDistDirectory, name), path.join(outputDirectory, name))
    }
  }
  for (const name of rootFiles) {
    if (/\.d\.ts$/.test(name)) {
      await copyFile(path.join(tokensDistDirectory, name), path.join(outputDirectory, name))
    }
  }
  for (const name of rootFiles) {
    if (name === "style.css" || name === "font.css") {
      await copyFile(path.join(tokensDistDirectory, name), path.join(outputDirectory, name))
    }
  }

  const cjsSource = path.join(tokensDistDirectory, "cjs")
  const cjsOutput = path.join(outputDirectory, "cjs")
  await copyTree(cjsSource, cjsOutput)

  for (const name of ["style.css", "font.css"]) {
    const css = await readFile(path.join(outputDirectory, name), "utf8")
    requireCondition(css.trim().length > 0, `copied tokens ${name} is empty`)
    await writeFile(path.join(outputDirectory, `${name}.d.ts`), cssDeclaration)
  }

  const copied = {
    esmEntry: path.join(outputDirectory, "index.js"),
    cjsEntry: path.join(cjsOutput, "index.js"),
    styleCss: path.join(outputDirectory, "style.css"),
    fontCss: path.join(outputDirectory, "font.css"),
  }
  for (const [label, target] of Object.entries(copied)) {
    requireCondition(await pathExists(target), `tokens artifact was not copied: ${label}`)
  }

  console.log(
    `Copied tokens artifacts into dist/tokens (${rootFiles.filter((name) => name.endsWith(".js")).length} ESM modules, CJS entry, styles, fonts)`
  )
}

await run()
