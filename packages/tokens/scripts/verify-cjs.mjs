import assert from "node:assert"
import { createRequire } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const require = createRequire(import.meta.url)

const cjsModule = require(path.join(packageRoot, "dist", "cjs", "index.js"))
const esmModule = await import(pathToFileURL(path.join(packageRoot, "dist", "index.js")))
const cjsTokens = cjsModule.exuiTokens
const esmTokens = esmModule.exuiTokens
const cjsRecipes = cjsModule.componentRecipes
const esmRecipes = esmModule.componentRecipes

assert.ok(cjsTokens, "the CommonJS entry must export exuiTokens")
assert.deepStrictEqual(cjsTokens, esmTokens, "CommonJS and ESM token trees must be identical")
assert.ok(cjsRecipes, "the CommonJS entry must export componentRecipes")
assert.deepStrictEqual(cjsRecipes, esmRecipes, "CommonJS and ESM recipe trees must be identical")

function assertDeeplyFrozen(value, trail) {
  assert.ok(Object.isFrozen(value), `CommonJS token tree must be frozen at ${trail}`)

  for (const [key, child] of Object.entries(value)) {
    if (child !== null && typeof child === "object") {
      assertDeeplyFrozen(child, `${trail}.${key}`)
    }
  }
}

assertDeeplyFrozen(cjsTokens, "exuiTokens")
assertDeeplyFrozen(cjsRecipes, "componentRecipes")

// Guards against a build that emits an empty or truncated tree rather than a
// wrong one, which deepStrictEqual would accept if both entries were empty.
assert.deepStrictEqual(
  Object.keys(cjsTokens.themes).sort(),
  ["dark", "light", "pitchBlack"],
  "CommonJS token tree must expose every theme"
)
assert.deepStrictEqual(
  Object.keys(cjsTokens.density).sort(),
  ["compact", "standard"],
  "CommonJS token tree must expose every density"
)
assert.equal(
  typeof cjsTokens.typography.fontFamily,
  "string",
  "CommonJS token tree must expose typography"
)
assert.deepStrictEqual(
  Object.keys(cjsRecipes).sort(),
  ["button", "dialog", "formControl", "menu", "sidebarItem", "tabs"],
  "CommonJS recipe tree must expose every first-batch component role"
)

console.log("CommonJS entry verified: require/import parity and deep freeze hold")
