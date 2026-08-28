import { copyFile, mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const sourceDirectory = path.join(packageRoot, "src")
const outputDirectory = path.join(packageRoot, "dist")

await mkdir(outputDirectory, { recursive: true })
await Promise.all([
  copyFile(path.join(sourceDirectory, "style.css"), path.join(outputDirectory, "style.css")),
  copyFile(path.join(sourceDirectory, "font.css"), path.join(outputDirectory, "font.css")),
])
