import { readFile, writeFile } from "node:fs/promises"

const cssDts = "declare const css: string\nexport default css\n"
const indexDtsPath = new URL("../types/index.d.ts", import.meta.url)
const cssDtsPath = new URL("../types/index.css.d.ts", import.meta.url)

const indexDts = await readFile(indexDtsPath, "utf8")

await writeFile(
  indexDtsPath,
  indexDts.replace(/^import "\.\/index\.css";\r?\n/, "")
)
await writeFile(cssDtsPath, cssDts)
