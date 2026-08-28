import assert from "node:assert"
import { createRequire } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const require = createRequire(import.meta.url)

const cjsTokens = require(path.join(packageRoot, "dist", "cjs", "index.js")).exuiTokens
const esmTokens = (await import(pathToFileURL(path.join(packageRoot, "dist", "index.js")))).exuiTokens

assert.ok(cjsTokens, "the CommonJS entry must export exuiTokens")
assert.deepStrictEqual(cjsTokens, esmTokens, "CommonJS and ESM token trees must be identical")

function assertDeeplyFrozen(value, trail) {
  assert.ok(Object.isFrozen(value), `CommonJS token tree must be frozen at ${trail}`)

  for (const [key, child] of Object.entries(value)) {
    if (child !== null && typeof child === "object") {
      assertDeeplyFrozen(child, `${trail}.${key}`)
    }
  }
}

assertDeeplyFrozen(cjsTokens, "exuiTokens")

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

console.log("CommonJS entry verified: require/import parity and deep freeze hold")
