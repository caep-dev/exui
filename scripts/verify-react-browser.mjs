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

    // The modal arrives through the same public root export. Its responsive
    // rules must be in the stylesheet on first paint, not decided by script.
    const responsiveRule = await page.evaluate(() =>
      [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...sheet.cssRules]
        } catch {
          return []
        }
      })
        .filter((rule) => rule instanceof CSSMediaRule)
        .map((rule) => rule.cssText)
        // The full-screen layout rule, not the static-viewport fallback beside it.
        .filter((text) => text.includes("data-mobile-fullscreen") && /inset:\s*0/.test(text))
    )
    assert.equal(responsiveRule.length, 1,
      "the packed stylesheet must carry exactly one modal full-screen media rule")
    assert.match(responsiveRule[0], /max-width:\s*100%/, "the full-screen rule must lift the width cap")

    const modalTrigger = page.getByRole("button", { name: "Open modal", exact: true })
    await modalTrigger.click()
    const modal = page.getByRole("dialog", { name: "Project profile" })
    await modal.waitFor({ state: "visible" })
    assert.equal(await modal.evaluate((element) => element.closest("#app") === null), true,
      "Modal must mount through its portal outside the application root")
    assert.equal(await modal.evaluate((element) => element.getAttribute("aria-describedby")),
      await page.locator("[data-slot='dialog-description']").getAttribute("id"),
      "the description must be wired to the element that carries it")

    // The reduce path is the context default here: no motion, but fully usable.
    const reduced = await modal.evaluate((element) => {
      const style = getComputedStyle(element)
      return { name: style.animationName, duration: style.animationDuration }
    })
    assert.equal(reduced.name, "none", "the packed modal must drop its motion under reduce")
    assert.equal(reduced.duration, "0s", "and must not wait out a duration")

    // Crossing the breakpoint keeps one tree: the draft, the file control, and
    // the footer stay where the consumer put them.
    await modal.getByLabel("Draft", { exact: true }).fill("kept draft")
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await modal.evaluate((element) => Math.round(element.getBoundingClientRect().width)), 390,
      "a narrow viewport must fill the screen")
    await page.setViewportSize({ width: 1280, height: 900 })
    assert.equal(await modal.getByLabel("Draft", { exact: true }).inputValue(), "kept draft",
      "the draft must survive a breakpoint change")
    assert.equal(await page.locator("#modal-file").count(), 1, "the file control must be the same one")

    // A real outside click is a trusted pointer sequence closing the modal, and
    // focus must come back to the trigger that opened it.
    const box = await modal.boundingBox()
    await page.mouse.click(Math.max(4, Math.round(box.x) - 12), 4)
    await modal.waitFor({ state: "hidden" })
    await page.waitForFunction(() => document.activeElement?.textContent === "Open modal")

    // A notification from the packed public API must reach its bundled host.
    await page.getByRole("button", { name: "Notify", exact: true }).click()
    await page.locator("[data-sonner-toast]").getByText("Packed message ready", { exact: true })
      .waitFor({ state: "visible" })

    // The packed tarball has to ship the material itself: the seed's filter, the
    // class entry point on an element that is not an ExUI component, the prop
    // entry point, and the danger material. Only computed styles are read here;
    // this does not judge how the refraction renders.
    const seedFilter = page.locator("[data-slot='glass-seed'] filter")
    assert.equal(await seedFilter.count(), 1, "the packed seed must declare exactly one filter")
    assert.equal(
      await seedFilter.getAttribute("id"),
      "exui-glass-distortion-v1",
      "the packed seed must keep the documented filter id"
    )

    const classSurface = page.locator("[data-testid='glass-class-surface']")
    const classSurfaceStyle = await classSurface.evaluate((element) => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, backdrop: style.backdropFilter, borderRadius: style.borderRadius }
    })
    assert.match(classSurfaceStyle.backdrop, /blur\(/, "a plain element using the class must take the material")
    assert.notEqual(classSurfaceStyle.background, "rgba(0, 0, 0, 0)", "the material must paint a background")
    assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue("--_exui-glass-reference")),
      'url("#exui-glass-distortion-v1")',
      "a mounted seed must publish the filter reference on the document root")
    assert.match(classSurfaceStyle.backdrop, /url\(/, "a mounted seed must reach the material's chain")
    assert.equal(
      await classSurface.evaluate((element) => getComputedStyle(element).borderTopWidth),
      "0px",
      "the material's edge must not become a border width"
    )

    const dangerButton = page.getByRole("button", { name: "Delete", exact: true })
    const dangerBackground = await dangerButton.evaluate((element) => getComputedStyle(element).backgroundColor)
    const dangerChannels = (dangerBackground.match(/[\d.]+/g) ?? []).map(Number)
    assert.ok(
      dangerChannels[0] > dangerChannels[1] && dangerBackground.includes("0.9"),
      `the danger surface must keep the danger material instead of the neutral one: ${dangerBackground}`
    )

    assert.equal(await page.locator("[glass]").count(), 0, "the glass prop must never reach the DOM as an attribute")

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

    // Motion preference is a browser setting, so the normal path needs its own
    // context: the modal must run its own opacity-only keyframes, and the old
    // Dialog on the same page must keep the zoom it has always had.
    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "no-preference" })
    const motionErrors = []
    motionPage.on("pageerror", (error) => motionErrors.push(error.message))
    try {
      await motionPage.goto(server.resolvedUrls.local[0])
      await motionPage.getByRole("button", { name: "Open modal", exact: true }).click()
      const motionModal = motionPage.getByRole("dialog", { name: "Project profile" })
      await motionModal.waitFor({ state: "visible" })
      const motion = await motionModal.evaluate((element) => {
        const overlay = document.querySelector(".ex-modal-overlay")
        return {
          name: getComputedStyle(element).animationName,
          duration: getComputedStyle(element).animationDuration,
          overlayName: overlay ? getComputedStyle(overlay).animationName : null,
        }
      })
      assert.equal(motion.name, "ex-modal-in", "the packed modal must fade in with its own keyframes")
      assert.equal(motion.overlayName, "ex-modal-in", "the overlay must share them")
      assert.equal(motion.duration, "0.1s", "and use the dialog recipe duration")
      await motionPage.keyboard.press("Escape")
      await motionModal.waitFor({ state: "hidden" })

      await motionPage.getByRole("button", { name: "Open", exact: true }).click()
      const legacyDialog = motionPage.getByRole("dialog", { name: "Subscribe" })
      await legacyDialog.waitFor({ state: "visible" })
      assert.equal(await legacyDialog.evaluate((element) => getComputedStyle(element).animationName), "enter",
        "the existing Dialog must keep its own enter animation")
      await motionPage.keyboard.press("Escape")
      await legacyDialog.waitFor({ state: "hidden" })

      assert.deepEqual(motionErrors, [], "packed consumer must not raise browser runtime errors with motion enabled")
    } finally {
      await motionPage.close()
    }

    assert.deepEqual(pageErrors, [], "packed consumer must not raise browser runtime errors")
    console.log("Packed browser consumer passed: chart hover/legend, dialog portal, form submission, focus return, managed notification, glass material, rem scaling, modal portal/fullscreen/motion")
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
