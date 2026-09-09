import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

// The controller reuses the workspace's pinned browser tooling. The page
// itself serves only the isolated consumer's production build and tarball.
const requireFromShowcase = createRequire(new URL("../packages/showcase/package.json", import.meta.url))

async function verifyReactBrowser(consumerRoot) {
  const { chromium } = requireFromShowcase("playwright")
  const requireFromConsumer = createRequire(join(consumerRoot, "package.json"))
  const { preview } = await import(pathToFileURL(requireFromConsumer.resolve("vite")).href)
  const server = await preview({
    configFile: false,
    root: consumerRoot,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  })
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" })
    page.setDefaultTimeout(10_000)
    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    await page.goto(server.resolvedUrls.local[0])

    // Real chart data must reach ExUI's legend and tooltip via the same
    // Recharts context. A placeholder child or empty SSR result cannot pass.
    const bars = page.locator(".recharts-bar-rectangle")
    await bars.nth(1).waitFor({ state: "visible" })
    assert.equal(await bars.count(), 2, "both chart data points must render")
    const legend = page.locator(".recharts-legend-wrapper")
    await legend.getByText("Visitors", { exact: true }).waitFor({ state: "visible" })

    const tooltip = page.locator(".recharts-tooltip-wrapper")
    for (const [index, month, value] of [[0, "January", "10"], [1, "February", "20"]]) {
      await bars.nth(index).hover()
      await tooltip.getByText(month, { exact: true }).waitFor({ state: "visible" })
      await tooltip.getByText("Visitors", { exact: true }).waitFor({ state: "visible" })
      await tooltip.getByText(value, { exact: true }).waitFor({ state: "visible" })
    }
    await page.mouse.move(1000, 800)
    await tooltip.waitFor({ state: "hidden" })

    const trigger = page.getByRole("button", { name: "Open", exact: true })
    await trigger.click()
    const dialog = page.getByRole("dialog", { name: "Subscribe" })
    await dialog.waitFor({ state: "visible" })
    assert.equal(await dialog.evaluate((element) => element.closest("#app") === null), true,
      "DialogContent must mount through its portal outside the application root")
    await dialog.getByLabel("Email", { exact: true }).fill("reader@example.com")
    await dialog.getByRole("button", { name: "Subscribe", exact: true }).click()
    await dialog.getByRole("status").getByText("reader@example.com", { exact: true }).waitFor()
    await page.keyboard.press("Escape")
    await dialog.waitFor({ state: "hidden" })
    await page.waitForFunction(() => document.activeElement?.textContent === "Open")

    assert.deepEqual(pageErrors, [], "packed consumer must not raise browser runtime errors")
    console.log("Packed browser consumer passed: chart hover/legend, dialog portal, form submission, focus return")
  } finally {
    try {
      await browser?.close()
    } finally {
      await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
    }
  }
}

assert.equal(process.argv.length, 3, "usage: node scripts/verify-react-browser.mjs <consumer-directory>")
await verifyReactBrowser(process.argv[2])
