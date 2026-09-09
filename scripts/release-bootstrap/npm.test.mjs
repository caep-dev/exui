import assert from "node:assert/strict"
import test from "node:test"

test("registry classification distinguishes absence from failures and mismatched metadata", async () => {
  const { registryStatus } = await import("./npm.mjs")
  const query = (status, body) => registryStatus("@exre/exui", "0.2.0", async () => new Response(JSON.stringify(body), { status }))
  assert.equal(await query(404, { error: "Not found" }), "absent")
  assert.equal(await query(200, { name: "@exre/exui", version: "0.2.0" }), "present")
  for (const status of [401, 403, 429, 500]) await assert.rejects(query(status, {}), /REGISTRY_UNAVAILABLE/)
  await assert.rejects(query(200, { name: "@exre/exui", version: "0.1.0" }), /REGISTRY_INCONSISTENT/)
  await assert.rejects(registryStatus("@exre/exui", "0.2.0", async () => { throw new Error("timeout") }), /REGISTRY_UNAVAILABLE/)
})
test("publication skips existing versions and never invokes publish on registry errors", async () => {
  const { publishIfMissing } = await import("./npm.mjs")
  let published = 0
  const publish = () => { published++ }
  assert.equal(await publishIfMissing("@exre/exui", "0.2.0", { query: async () => "present", publish }), "existing")
  assert.equal(published, 0)
  await assert.rejects(publishIfMissing("@exre/exui", "0.2.0", { query: async () => { throw new Error("unavailable") }, publish }))
  assert.equal(published, 0)
  assert.equal(await publishIfMissing("@exre/exui", "0.2.0", { query: async () => "absent", publish }), "published")
  assert.equal(published, 1)
})
