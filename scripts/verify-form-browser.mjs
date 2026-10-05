import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const requireFromShowcase = createRequire(new URL("../packages/showcase/package.json", import.meta.url))

async function verifyFormBrowser(consumerRoot) {
  const { chromium } = requireFromShowcase("playwright")
  const requireFromConsumer = createRequire(join(consumerRoot, "package.json"))
  const { preview } = await import(pathToFileURL(requireFromConsumer.resolve("vite")).href)
  const server = await preview({ configFile: false, root: consumerRoot, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } })
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" })
    page.setDefaultTimeout(10_000)
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(server.resolvedUrls.local[0])
    const input = page.getByLabel("Age", { exact: true })
    const submit = page.getByRole("button", { name: "Save parsed form", exact: true })
    await input.fill("17")
    await submit.click()
    await page.getByText("Adults only", { exact: true }).first().waitFor({ state: "visible" })
    assert.equal(await input.getAttribute("aria-invalid"), "true", "schema errors must reach the bound control")
    assert.equal(await page.getByTestId("submit-count").textContent(), "0", "invalid output must never call onSubmit")
    assert.equal(await page.getByTestId("parsed-result").textContent(), "", "invalid schema cannot produce a result")
    await input.fill("23")
    await submit.click()
    await page.getByTestId("parsed-result").getByText('{"age":23,"type":"number"}', { exact: true }).waitFor()
    assert.equal(await page.getByTestId("submit-count").textContent(), "1", "successful parse calls onSubmit exactly once")
    assert.equal(await input.inputValue(), "23", "parsed numeric output must not replace the string draft")
    assert.equal(await page.getByText("Adults only", { exact: true }).count(), 0, "successful revalidation clears schema errors")
    assert.deepEqual(errors, [], "packed ExForm must not raise browser runtime errors")
    console.log("Packed ExForm browser passed: schema error, aria binding, parsed Output, unchanged Input")
  } finally {
    try {
      await browser?.close()
    } finally {
      await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
    }
  }
}

assert.equal(process.argv.length, 3, "usage: node scripts/verify-form-browser.mjs <consumer-directory>")
await verifyFormBrowser(process.argv[2])
