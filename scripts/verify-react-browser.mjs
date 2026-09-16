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

    // The packed stylesheet must follow the application root font size with no
    // extra consumer configuration, and it must not fight an application that
    // sets one of its own.
    const setRootFontSize = (value) =>
      page.evaluate((fontSize) => {
        document.documentElement.style.fontSize = fontSize
      }, value)
    const measure = (locator, property) =>
      locator.evaluate((element, name) => {
        const style = getComputedStyle(element)
        return {
          value: Number.parseFloat(style.getPropertyValue(name)),
          rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
        }
      }, property)
    const closeEnough = (actual, expected, label) => {
      assert.ok(
        Math.abs(actual - expected) <= 0.5,
        `${label}: expected about ${expected}px, received ${actual}px`
      )
    }
    // Buttons use `transition-all`, so a root font size change animates the
    // geometry. Wait for the transition to settle before measuring.
    const settle = (selector, property, expected) =>
      page.waitForFunction(
        ({ selector: target, property: cssProperty, expected: value }) => {
          const element = document.querySelector(target)
          if (!element) {
            return false
          }
          const actual = Number.parseFloat(getComputedStyle(element).getPropertyValue(cssProperty))
          return Number.isFinite(actual) && Math.abs(actual - value) <= 0.5
        },
        { selector, property, expected }
      )
    const triggerSelector = "[aria-haspopup='dialog']"

    await setRootFontSize("16px")
    try {
      await settle(triggerSelector, "height", 36)
      const base = await measure(trigger, "height")
      assert.equal(base.rootFontSize, 16, "the application root font size must remain 16px")
      closeEnough(base.value, 36, "the default Button height at a 16px root font size")

      await setRootFontSize("32px")
      await settle(triggerSelector, "height", 72)
      await settle(triggerSelector, "font-size", 28)
      const doubled = await measure(trigger, "height")
      assert.equal(doubled.rootFontSize, 32, "the application root font size must reach 32px")
      closeEnough(doubled.value, 72, "the default Button height at a 32px root font size")
      closeEnough(
        (await measure(trigger, "font-size")).value,
        28,
        "the default Button font size at a 32px root font size"
      )
      closeEnough(
        (await measure(trigger, "border-top-width")).value,
        1,
        "the default Button hairline border at a 32px root font size"
      )
      closeEnough(
        (await measure(trigger, "border-radius")).value,
        9999,
        "the default Button capsule radius at a 32px root font size"
      )

      await trigger.click()
      const scaledDialog = page.getByRole("dialog", { name: "Subscribe" })
      await scaledDialog.waitFor({ state: "visible" })
      await page.waitForFunction(() => {
        const element = document.querySelector("[data-slot='dialog-content']")
        if (!element) {
          return false
        }
        return Math.abs(Number.parseFloat(getComputedStyle(element).paddingTop) - 48) <= 0.5
      })
      const scaledPadding = await measure(scaledDialog, "padding-top")
      closeEnough(scaledPadding.value, 48, "the portal Dialog padding at a 32px root font size")
      await page.keyboard.press("Escape")
      await scaledDialog.waitFor({ state: "hidden" })
    } finally {
      await setRootFontSize("16px")
    }

    await settle(triggerSelector, "height", 36)
    const restored = await measure(trigger, "height")
    closeEnough(restored.value, 36, "the default Button height after restoring the root font size")

    assert.deepEqual(pageErrors, [], "packed consumer must not raise browser runtime errors")
    console.log("Packed browser consumer passed: chart hover/legend, dialog portal, form submission, focus return, rem scaling")
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
