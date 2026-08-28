import { mkdir, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const cjsDirectory = path.join(packageRoot, "dist", "cjs")

// The package is `"type": "module"`, so the CommonJS output needs its own scope
// marker or Node parses `dist/cjs/index.js` as ESM.
await mkdir(cjsDirectory, { recursive: true })
await writeFile(
  path.join(cjsDirectory, "package.json"),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`
)
