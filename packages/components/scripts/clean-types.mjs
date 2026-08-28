import { rm } from "node:fs/promises"

const typesDir = new URL("../types", import.meta.url)

await rm(typesDir, { recursive: true, force: true })
