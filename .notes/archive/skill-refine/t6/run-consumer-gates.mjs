// T6 independent packed-consumer browser gates (test-engineer).
//
// Packs the public @exre/exui tarball, installs it into an isolated React 19
// consumer outside the workspace (plus react, react-dom, lucide-react only),
// builds it with Vite, serves the production build, and drives the real
// Skill examples plus independently authored scenario pages in Playwright
// Chromium. Screenshots and the full log land in notes/skill-refine/assets/t6/.
//
// Usage: node notes/skill-refine/t6/run-consumer-gates.mjs
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const scriptFile = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptFile), "..", "..", "..")
const consumerSrc = join(dirname(scriptFile), "consumer-src")
const skillExamples = join(repoRoot, "skills", "exui-usage", "examples")
const assetsDir = join(repoRoot, "notes", "skill-refine", "assets", "t6")

// CLI: --headed launches a visible Chromium window (real frame rate for
// vaul drawer animations and real pointer event sequences); --only a,b
// restricts the run to the named scenarios.
const cliArgs = process.argv.slice(2)
const headed = cliArgs.includes("--headed")
const onlyIndex = cliArgs.indexOf("--only")
const onlySet =
  onlyIndex !== -1 && cliArgs[onlyIndex + 1] ? new Set(cliArgs[onlyIndex + 1].split(",")) : null

const logFile = join(assetsDir, headed ? "consumer-gates-headed.log" : "consumer-gates.log")
let logStream
function log(message) {
  const line = `${new Date().toISOString()} ${message}`
  console.log(line)
  logStream?.write(line + "\n")
}

function run(command, args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32" && ["pnpm", "npm"].includes(command),
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024,
  })
  const label = `${command} ${args.join(" ")}`
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${label} failed (${result.status}):\n${result.stdout ?? ""}\n${result.stderr ?? ""}`)
  }
  return result
}

async function waitFor(fn, { timeout = 5000, interval = 100, label = "condition" } = {}) {
  const deadline = Date.now() + timeout
  let lastError = "no progress"
  while (Date.now() < deadline) {
    try {
      if (await fn()) {
        return
      }
      lastError = "still false"
    } catch (error) {
      lastError = String(error?.message ?? error)
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error(`timeout after ${timeout}ms waiting for ${label} (${lastError})`)
}

const results = []
function report(name, status, detail = "") {
  results.push({ name, status, detail })
  log(`RESULT ${status} ${name}${detail ? ` — ${detail}` : ""}`)
}

process.on("unhandledRejection", (reason) => {
  log(`unhandled rejection (guarded): ${String(reason).split("\n")[0]}`)
})

// ---------------------------------------------------------------------------
// Fixture scaffolding
// ---------------------------------------------------------------------------
async function scaffold(fixtureRoot, tarballPath) {
  await mkdir(join(fixtureRoot, "src", "examples"), { recursive: true })
  const tarballDependency = tarballPath.split("\\").join("/")

  await writeFile(
    join(fixtureRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "exui-t6-consumer",
        private: true,
        type: "module",
        scripts: { build: "vite build" },
        dependencies: {
          "@exre/exui": `file:${tarballDependency}`,
          react: "19.2.7",
          "react-dom": "19.2.7",
          "lucide-react": "^1.23.0",
        },
        devDependencies: {
          "@types/react": "^19.2.17",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^6.0.3",
          typescript: "~6.0.2",
          vite: "^8.1.1",
        },
      },
      null,
      2
    )}\n`
  )

  for (const file of ["index.html", "vite.config.ts", "tsconfig.json"]) {
    await cp(join(consumerSrc, file), join(fixtureRoot, file))
  }
  await cp(join(consumerSrc, "main.tsx"), join(fixtureRoot, "src", "main.tsx"))

  const exampleFiles = (await readdir(skillExamples)).filter((name) => name.endsWith(".tsx")).sort()
  assert.ok(exampleFiles.length > 0, "no skill examples found to copy")
  for (const file of exampleFiles) {
    await cp(join(skillExamples, file), join(fixtureRoot, "src", "examples", file))
  }
  return exampleFiles
}

// ---------------------------------------------------------------------------
// Playwright helpers
// ---------------------------------------------------------------------------
let browser
let browserFactory
let baseUrl

// Sonner v2 mounts a themed <ol data-sonner-toaster data-sonner-theme=...>
// only while at least one toast is alive — the surrounding <section> is
// just an aria container and carries no theme. Helpers therefore target the
// list element and the per-toast items.
function toasterList(page) {
  return page.locator("ol[data-sonner-toaster]").first()
}

function toastItems(page) {
  return page.locator("[data-sonner-toast]")
}

async function toasterTheme(page) {
  return toasterList(page).getAttribute("data-sonner-theme")
}

async function waitForTheme(page, expected) {
  await waitFor(async () => (await toasterTheme(page)) === expected, {
    label: `ol[data-sonner-toaster] data-sonner-theme === "${expected}"`,
  })
}

async function htmlHasClass(page, className) {
  return page.evaluate((name) => document.documentElement.classList.contains(name), className)
}

async function scenario(name, options, fn) {
  if (onlySet !== null && !onlySet.has(name)) {
    return
  }
  if (!browser.isConnected()) {
    log("browser disconnected; relaunching chromium")
    browser = await browserFactory()
  }
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1280, height: 900 },
    // Headed runs use the real animation timeline (no reduced-motion
    // emulation) so drawer/tooltip transitions behave as for a real user.
    reducedMotion: headed ? "no-preference" : "reduce",
    colorScheme: options.colorScheme ?? "light",
  })
  const page = await context.newPage()
  page.setDefaultTimeout(10_000)
  const pageErrors = []
  page.on("pageerror", (error) => pageErrors.push(error.message))
  try {
    await fn(page, pageErrors)
    report(name, "PASS")
  } catch (error) {
    let detail = String(error?.message ?? error).split("\n").slice(0, 2).join(" | ")
    try {
      const safeName = name.split("/").join("_")
      await page.screenshot({ path: join(assetsDir, `${safeName}-failure.png`) })
      if (pageErrors.length > 0) {
        detail += ` | pageErrors=[${pageErrors.join("; ").slice(0, 200)}]`
      }
      const html = (await page.content()).replace(/\s+/g, " ").slice(0, 600)
      detail += ` | html=${html}`
    } catch (snapshotError) {
      detail += ` | snapshotError=${String(snapshotError).split("\n")[0]}`
    }
    report(name, "FAIL", detail)
  } finally {
    await context.close().catch(() => {})
  }
}

function shot(page, name) {
  return page.screenshot({ path: join(assetsDir, `${name}.png`) })
}

async function clickDay(page, day, monthIndex = 0) {
  const grids = page.locator(".rdp-month_grid")
  const monthCount = await grids.count()
  const pattern = new RegExp(`^${day}$`)
  const button =
    monthCount > monthIndex
      ? grids.nth(monthIndex).locator("button").filter({ hasText: pattern })
      : page.locator("td.rdp-day button").filter({ hasText: pattern }).nth(monthIndex)
  await button.first().click()
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------
async function scenarioApi(page, pageErrors) {
  await page.goto(`${baseUrl}?case=api`)
  // Sonner only mounts its themed <ol> once at least one toast is active.
  // Click first, then wait for the ol and the visible toast text.
  await page.getByRole("button", { name: "Show success" }).click()
  await toasterList(page).waitFor({ state: "attached" })
  await page.getByText("Saved successfully", { exact: true }).waitFor({ state: "visible" })
  assert.equal(await toasterTheme(page), "light", "provider light must reach the Toaster")
  assert.equal(await toastItems(page).count(), 1)

  await page.getByRole("button", { name: "Show error" }).click()
  await page.getByText("Something went wrong", { exact: true }).waitFor({ state: "visible" })
  assert.equal(await toastItems(page).count(), 2)
  await shot(page, "api-success-error")

  await page.getByRole("button", { name: "Show updating" }).click()
  await page.getByText("Uploading…", { exact: true }).waitFor({ state: "visible", timeout: 1500 })
  await page.getByText("Upload complete", { exact: true }).waitFor({ state: "visible" })
  assert.equal(
    await page.getByText("Uploading…", { exact: true }).count(),
    0,
    "updated toast must replace the loading content in place"
  )
  assert.equal(await toastItems(page).count(), 3)

  await page.getByRole("button", { name: "Show tracked" }).click()
  await page.getByText("Trackable message", { exact: true }).waitFor({ state: "visible" })
  assert.equal(await toastItems(page).count(), 4)

  await page.getByRole("button", { name: "Dismiss tracked" }).click()
  await page.getByText("Trackable message", { exact: true }).waitFor({ state: "hidden" })
  await waitFor(async () => (await toastItems(page).count()) === 3, {
    label: "dismissed toast unmounts, 3 remain",
  })
  await shot(page, "api-after-dismiss")

  assert.deepEqual(pageErrors, [], "api scenario must not raise runtime errors")
}

async function scenarioInherit(page, pageErrors) {
  await page.goto(`${baseUrl}?case=inherit`)
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "light")

  await page.evaluate(() => {
    document.querySelector("ol[data-sonner-toaster]").__t6Marker = "original"
  })

  await page.getByRole("button", { name: "Set dark" }).click()
  await waitForTheme(page, "dark")
  assert.ok(await htmlHasClass(page, "dark"), "provider must apply .dark to <html>")

  await page.getByRole("button", { name: "Set light" }).click()
  await waitForTheme(page, "light")
  assert.ok(await htmlHasClass(page, "light"))

  await page.getByRole("button", { name: "Set system" }).click()
  await waitForTheme(page, "light")
  assert.ok(await htmlHasClass(page, "light"), "system + emulated light resolves to light")

  await page.emulateMedia({ colorScheme: "dark" })
  await waitForTheme(page, "dark")
  assert.ok(await htmlHasClass(page, "dark"), "system + emulated dark resolves to dark")
  await shot(page, "inherit-system-dark")

  const marker = await page.evaluate(() => document.querySelector("ol[data-sonner-toaster]").__t6Marker)
  assert.equal(marker, "original", "the Toaster ol must not remount across theme changes")

  await page.getByRole("button", { name: "Show toast" }).click()
  await page.getByText("Theme probe", { exact: true }).first().waitFor({ state: "visible" })

  await page.emulateMedia({ colorScheme: "light" })
  await waitForTheme(page, "light")

  assert.deepEqual(pageErrors, [], "inherit scenario must not raise runtime errors")
}

async function scenarioExplicit(page, pageErrors) {
  await page.goto(`${baseUrl}?case=explicit`)
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "light")
  assert.ok(await htmlHasClass(page, "dark"), "provider default is dark")
  await shot(page, "explicit-provider-dark-toaster-light")

  for (const providerTheme of ["light", "dark", "system"]) {
    await page.getByRole("button", { name: `Set ${providerTheme}` }).click()
    await waitFor(async () => (await htmlHasClass(page, providerTheme === "system" ? "dark" : providerTheme)), {
      label: `provider html class after ${providerTheme}`,
    })
    await page.waitForTimeout(150)
    assert.equal(await toasterTheme(page), "light", `explicit light must win over provider ${providerTheme}`)
  }

  await page.emulateMedia({ colorScheme: "light" })
  await page.waitForTimeout(200)
  assert.equal(await toasterTheme(page), "light", "explicit light must win over system change")

  await page.getByRole("button", { name: "Show toast" }).click()
  await page.getByText("Explicit probe", { exact: true }).first().waitFor({ state: "visible" })
  await shot(page, "explicit-toast-stays-light")

  assert.deepEqual(pageErrors, [], "explicit scenario must not raise runtime errors")
}

async function scenarioNoProvider(page, pageErrors) {
  await page.goto(`${baseUrl}?case=noprovider`)
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "dark")

  await page.getByText("Standalone toast", { exact: true }).first().waitFor({ state: "visible" })
  await shot(page, "noprovider-system-dark")

  await page.emulateMedia({ colorScheme: "light" })
  await waitForTheme(page, "light")
  await page.emulateMedia({ colorScheme: "dark" })
  await waitForTheme(page, "dark")

  assert.deepEqual(pageErrors, [], "mounting a lone Toaster must not throw")
}

async function scenarioUseThrow(page, pageErrors) {
  await page.goto(`${baseUrl}?case=usethrow`)
  const errorText = page.getByTestId("usethrow-error")
  await errorText.waitFor({ state: "visible" })
  assert.equal(
    await errorText.textContent(),
    "Error: useTheme must be used within a ThemeProvider",
    "public useTheme must keep the original error message outside a provider"
  )
  await shot(page, "usethrow-error")
  assert.deepEqual(pageErrors, [])
}

async function scenarioTokens(page, pageErrors) {
  await page.goto(`${baseUrl}?case=tokens`)
  await page.getByTestId("token-top-keys").waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("token-top-keys").textContent(), "themes,density,typography,radii,shadows")
  assert.equal(
    await page.getByTestId("recipe-keys").textContent(),
    "button,formControl,sidebarItem,menu,dialog,tabs"
  )
  const themes = await page.getByTestId("token-themes").textContent()
  assert.ok(themes.length > 0, "token themes must be non-empty in the browser bundle")
  await shot(page, "tokens-subpath")
  assert.deepEqual(pageErrors, [])
}

async function scenarioExampleSidebarDesktop(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/sidebar-layout`)
  const sidebar = page.locator('[data-slot="sidebar"][data-state]')
  const container = page.locator('[data-slot="sidebar-container"]')
  try {
    await sidebar.waitFor({ state: "attached", timeout: 6000 })
    await container.waitFor({ state: "visible", timeout: 6000 })
    assert.equal(await sidebar.getAttribute("data-state"), "expanded")

    await page.locator('[data-slot="sidebar-trigger"]').click()
    await waitFor(async () => (await sidebar.getAttribute("data-state")) === "collapsed", {
      label: "sidebar collapses",
    })
    assert.equal(await sidebar.getAttribute("data-collapsible"), "icon", "collapsible=icon rail mode")
    await page.getByRole("button", { name: "Home", exact: true }).waitFor({ state: "visible" })
    await shot(page, "sidebar-desktop-collapsed")

    await page.locator('[data-slot="sidebar-trigger"]').click()
    await waitFor(async () => (await sidebar.getAttribute("data-state")) === "expanded", {
      label: "sidebar expands again",
    })
    await page.getByRole("button", { name: "Inbox", exact: true }).waitFor({ state: "visible" })
    assert.deepEqual(pageErrors, [], "sidebar desktop must not raise runtime errors")
  } catch (error) {
    // The example as shipped may not render usable desktop chrome at this
    // viewport — surface the actual page state in the failure detail so the
    // report can distinguish a real defect from an example-level gap.
    const headerExists = await sidebar.count()
    const containerExists = await container.count()
    const menuButtonHome = await page.getByRole("button", { name: "Home", exact: true }).count()
    const triggerExists = await page.locator('[data-slot="sidebar-trigger"]').count()
    error.message = `${error.message} | sidebar=${headerExists} container=${containerExists} home=${menuButtonHome} trigger=${triggerExists}`
    throw error
  }
}

async function scenarioExampleSidebarMobile(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/sidebar-layout`)
  const desktopSidebar = page.locator('[data-slot="sidebar"][data-state]')
  assert.equal(
    await desktopSidebar.count(),
    0,
    "on a mobile viewport the Sidebar renders the Sheet branch, not the desktop div"
  )

  // The trigger is the same SidebarTrigger at both viewport widths; it
  // lives in SidebarInset which is always rendered. Playwright's click()
  // produces a real pointer event sequence (pointerdown/pointerup/click)
  // at the element center, which is what Radix Dialog listens for.
  const trigger = page.locator('[data-slot="sidebar-trigger"]')
  assert.equal(await trigger.count(), 1, "exactly one SidebarTrigger on mobile")
  await trigger.waitFor({ state: "visible" })
  await trigger.click()

  // The mobile Sheet opens a Radix Dialog portal. The shadcn sidebar-layout
  // example spreads its own data-slot onto SheetContent, so the most reliable
  // anchor for the open state is the nav button itself (mirrors the
  // passing desktop scenario's assertion) rather than getByRole("dialog"),
  // which would depend on the portal content exposing a role we don't own.
  // The Sheet sometimes needs >8s to surface in headless (portal mount
  // under controlled timing), so allow a generous window and capture full
  // portal diagnostics on failure.
  const homeButton = page.getByRole("button", { name: "Home", exact: true })
  try {
    await homeButton.waitFor({ state: "visible", timeout: 15000 })
  } catch (error) {
    const portalProbe = {
      trigger: await trigger.count(),
      sheetContent: await page.locator('[data-slot="sheet-content"]').count(),
      mobileSidebar: await page.locator('[data-slot="sidebar"][data-mobile="true"]').count(),
      dialogRole: await page.getByRole("dialog").count(),
      homeButton: await homeButton.count(),
      homeVisible: await homeButton.isVisible().catch(() => false),
      body: (await page.locator("body").innerHTML()).replace(/\s+/g, " ").slice(0, 800),
    }
    log(`sidebar-mobile portal probe: ${JSON.stringify(portalProbe)}`)
    error.message = `${error.message} | portal=${JSON.stringify(portalProbe)}`
    throw error
  }
  await shot(page, "sidebar-mobile-open")

  await page.keyboard.press("Escape")
  await homeButton.waitFor({ state: "hidden", timeout: 15000 })
  assert.deepEqual(pageErrors, [], "sidebar mobile must not raise runtime errors")
}

async function scenarioExampleDialog(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/dialog-usage`)
  const trigger = page.getByRole("button", { name: "Delete account" })
  const dialog = page.locator('[data-slot="dialog-content"]')

  await trigger.click()
  await dialog.waitFor({ state: "visible" })
  await page.getByText("This action cannot be undone.").waitFor({ state: "visible" })
  await shot(page, "dialog-open")

  await page.keyboard.press("Escape")
  await dialog.waitFor({ state: "hidden" })
  await waitFor(
    async () =>
      (await page.evaluate(() => document.activeElement?.textContent)) === "Delete account",
    { label: "focus returns to the dialog trigger after Escape" }
  )

  await trigger.click()
  await dialog.waitFor({ state: "visible" })
  await page.getByRole("button", { name: "Cancel" }).click()
  await dialog.waitFor({ state: "hidden" })
  await waitFor(
    async () =>
      (await page.evaluate(() => document.activeElement?.textContent)) === "Delete account",
    { label: "focus returns to the dialog trigger after Cancel" }
  )
  assert.deepEqual(pageErrors, [], "dialog must not raise runtime errors")
}

async function scenarioExampleComboboxSingle(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/combobox-single`)
  const input = page.getByPlaceholder("Select a framework")
  const content = page.locator('[data-slot="combobox-content"]')

  await input.click()
  await content.waitFor({ state: "visible" })
  await page.locator('[data-slot="combobox-item"]', { hasText: "Vue" }).click()
  await page.getByText("Selected: Vue").waitFor({ state: "visible" })
  await shot(page, "combobox-single-vue")

  await input.click()
  await content.waitFor({ state: "visible" })
  await input.fill("sol")
  await page.locator('[data-slot="combobox-item"]', { hasText: "Solid" }).click()
  await page.getByText("Selected: Solid").waitFor({ state: "visible" })
  assert.deepEqual(pageErrors, [], "combobox single must not raise runtime errors")
}

async function scenarioExampleComboboxMultiple(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/combobox-multiple`)
  const input = page.getByPlaceholder("Add tags…")
  const content = page.locator('[data-slot="combobox-content"]')
  const chips = page.locator('[data-slot="combobox-chip"]')

  async function selectTag(label) {
    if (!(await content.isVisible())) {
      await input.click()
      await content.waitFor({ state: "visible" })
    }
    await page.locator('[data-slot="combobox-item"]', { hasText: label }).click()
  }

  await selectTag("Design")
  await chips.filter({ hasText: "Design" }).waitFor({ state: "visible" })
  await selectTag("Engineering")
  await chips.filter({ hasText: "Engineering" }).waitFor({ state: "visible" })
  assert.equal(await chips.count(), 2)
  await shot(page, "combobox-multiple-two-chips")

  await selectTag("Design")
  await waitFor(async () => (await chips.count()) === 1, { label: "toggling Design off leaves one chip" })
  assert.ok(await chips.filter({ hasText: "Engineering" }).isVisible())
  assert.deepEqual(pageErrors, [], "combobox multiple must not raise runtime errors")
}

async function scenarioExampleCalendarSingle(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/calendar-single`)
  const monthShort = new Date().toLocaleString("en-US", { month: "short" })
  await clickDay(page, 15)
  await waitFor(
    async () => {
      const text = await page.getByText(/^Selected:/).textContent()
      return new RegExp(`Selected: .*${monthShort} (0?15|15)`).test(text)
    },
    { label: `single selection shows ${monthShort} 15` }
  )
  await shot(page, "calendar-single-selected")
  assert.deepEqual(pageErrors, [], "calendar single must not raise runtime errors")
}

async function scenarioExampleCalendarRange(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/calendar-range`)
  const grids = page.locator(".rdp-month_grid")
  await waitFor(async () => (await grids.count()) === 2, { label: "range calendar shows two months" })

  await clickDay(page, 5, 0)
  await clickDay(page, 12, 0)
  await waitFor(
    async () => {
      const text = await page.locator("p").filter({ hasText: "From:" }).textContent()
      // The readout renders "From: <toDateString> · To: <toDateString>" with
      // either zero-padded or unpadded day numbers; the placeholders must
      // be replaced and both day digits must be present.
      if (text.includes("—")) {
        return false
      }
      return /\bFrom:/.test(text) && /\b0?5\b/.test(text) && /\b0?12\b/.test(text)
    },
    { label: "range selection shows from-day 5 to-day 12 with no placeholders" }
  )
  await shot(page, "calendar-range-selected")
  assert.deepEqual(pageErrors, [], "calendar range must not raise runtime errors")
}

async function scenarioExampleTabs(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/tabs-controlled`)
  await page.getByText("Active tab: account").waitFor({ state: "visible" })
  await page.getByText("Account settings here.").waitFor({ state: "visible" })

  await page.getByRole("tab", { name: "Password" }).click()
  await page.getByText("Active tab: password").waitFor({ state: "visible" })
  await page.getByText("Password settings here.").waitFor({ state: "visible" })
  await page.getByText("Account settings here.").waitFor({ state: "hidden" })

  await page.getByRole("tab", { name: "Notifications" }).click()
  await page.getByText("Active tab: notifications").waitFor({ state: "visible" })
  await page.getByText("Notification settings here.").waitFor({ state: "visible" })
  await shot(page, "tabs-controlled")
  assert.deepEqual(pageErrors, [], "tabs must not raise runtime errors")
}

async function scenarioExampleTooltip(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/tooltip-toolbar`)
  const tooltip = page.locator('[data-slot="tooltip-content"]')

  const boldButton = page.getByRole("button", { name: "Bold", exact: true })
  const italicButton = page.getByRole("button", { name: "Italic", exact: true })
  await boldButton.waitFor({ state: "visible" })

  // ExUI's TooltipProvider defaults delayDuration to 0 (tooltip.tsx), so the
  // tooltip surfaces immediately on hover. Playwright's default hover()
  // scrolls the element into view and moves the mouse to its center with a
  // real mousemove that Radix Tooltip's pointerover listener picks up;
  // hover({force:true}) skipped intermediate movement and was the cause of
  // the earlier BLOCKED reopen-after-hide failure.
  await boldButton.hover()
  await waitFor(async () => (await tooltip.count()) === 1 && (await tooltip.isVisible()), {
    timeout: 5000,
    label: "tooltip-content opens on hover (Bold)",
  }).catch(async (error) => {
    const probe = {
      tooltipContent: await tooltip.count(),
      tooltipState: await tooltip.getAttribute("data-state").catch(() => null),
      boldButton: await boldButton.count(),
      underlineButton: await page.getByRole("button", { name: "Underline", exact: true }).count(),
      body: (await page.locator("body").innerHTML()).replace(/\s+/g, " ").slice(0, 500),
    }
    throw new Error(`${error.message} | probe=${JSON.stringify(probe)}`)
  })
  assert.ok(
    (await tooltip.textContent()).trim().includes("Bold"),
    `tooltip text must include "Bold", got "${(await tooltip.textContent()).trim()}"`
  )
  await shot(page, "tooltip-bold-visible")

  await page.mouse.move(900, 900)
  // Use detached instead of hidden: Radix unmounts TooltipContent when the
  // tooltip closes, so the element is removed from the portal rather than
  // merely hidden. detached is the most precise signal that the tooltip
  // actually closed and gives a generous window for headless pointer-leave.
  await tooltip.waitFor({ state: "detached", timeout: 15000 })

  await italicButton.hover()
  await tooltip.waitFor({ state: "visible", timeout: 15000 })
  assert.ok((await tooltip.textContent()).trim().includes("Italic"))

  // Keyboard / focus path is part of the documented contract ("appear on
  // hover and focus"); verify it independently of the hover sequence.
  await page.mouse.move(900, 900)
  await tooltip.waitFor({ state: "detached", timeout: 15000 })
  await boldButton.focus()
  await tooltip.waitFor({ state: "visible", timeout: 15000 })
  assert.ok((await tooltip.textContent()).trim().includes("Bold"))
  assert.deepEqual(pageErrors, [], "tooltip must not raise runtime errors")
}

async function scenarioExampleMessageScroller(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/message-scroller-usage`)
  const viewport = page.locator('[data-slot="message-scroller-viewport"]')
  await viewport.waitFor({ state: "visible" })
  const atBottom = () =>
    viewport.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 4)
  const dims = () =>
    viewport.evaluate((el) => ({
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }))

  // Generate enough messages to guarantee overflow against the harness-
  // supplied 24rem viewport height.
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole("button", { name: "Add message" }).click()
    await page.waitForTimeout(80)
  }
  await page.waitForTimeout(200)
  assert.ok(await atBottom(), "scroller pins new messages at the bottom")

  await viewport.evaluate((el) => {
    el.scrollTop = 0
    el.dispatchEvent(new Event("scroll", { bubbles: true }))
  })
  const scrollButton = page.locator('[data-slot="message-scroller-button"]')
  await waitFor(async () => (await scrollButton.getAttribute("data-active")) === "true", {
    label: "scroll-to-bottom button activates when away from the bottom",
  }).catch(async (error) => {
    const d = await dims()
    throw new Error(`${error.message} | dims=${JSON.stringify(d)}`)
  })
  await scrollButton.click()
  await waitFor(atBottom, { label: "button returns the viewport to the bottom" })
  await shot(page, "message-scroller-bottom")
  assert.deepEqual(pageErrors, [], "message scroller must not raise runtime errors")
}

async function scenarioExampleSelect(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/select-usage`)
  const comboboxes = page.getByRole("combobox")
  await waitFor(async () => (await comboboxes.count()) === 2, {
    label: "both select triggers render",
  })

  // Simplified Select (options prop): open, choose, verify the readout.
  await comboboxes.first().click()
  await page.getByRole("option", { name: "Version 2.0" }).click()
  await page.getByText("Selected: 2.0").waitFor({ state: "visible" })
  await shot(page, "select-usage-simplified")

  // Composed SelectField with groups: open the second trigger, choose from
  // a grouped list, verify the readout.
  await comboboxes.nth(1).click()
  await page.getByRole("option", { name: "Blueberry" }).click()
  await page.getByText("Selected: blueberry").waitFor({ state: "visible" })
  await shot(page, "select-usage-grouped")
  assert.deepEqual(pageErrors, [], "select example must not raise runtime errors")
}

async function scenarioExampleSonner(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/sonner-notifications`)
  // The example never auto-fires; trigger the first toast to mount the ol.
  await page.getByRole("button", { name: "Success", exact: true }).click()
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "dark")

  await page.getByRole("button", { name: "Error", exact: true }).click()
  await page.getByText("Something went wrong", { exact: true }).waitFor({ state: "visible" })

  await page.getByRole("button", { name: "Loading, then success", exact: true }).click()
  await page.getByText("Uploading…", { exact: true }).waitFor({ state: "visible", timeout: 1500 })
  await page.getByText("Upload complete", { exact: true }).waitFor({ state: "visible" })

  await page.getByRole("button", { name: "Dismiss all" }).click()
  await page.getByText("Saved successfully", { exact: true }).waitFor({ state: "hidden" })
  await shot(page, "example-sonner-after-dismiss-all")

  // Re-fire success so a toast (and therefore the themed ol) stays alive
  // across the remaining explicit-theme assertions.
  await page.getByRole("button", { name: "Success", exact: true }).click()
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "dark")

  // Provider row renders before the explicit-theme row; disambiguate by order.
  const lightButtons = page.getByRole("button", { name: "light", exact: true })
  await lightButtons.nth(1).click()
  await waitForTheme(page, "light")
  await shot(page, "example-sonner-explicit-light")

  await page.getByRole("button", { name: "unset (follows provider)", exact: true }).click()
  await waitForTheme(page, "dark")

  await page.getByRole("button", { name: "dark", exact: true }).first().click()
  await waitForTheme(page, "dark")
  assert.ok(await htmlHasClass(page, "dark"))
  assert.deepEqual(pageErrors, [], "the sonner example must not raise runtime errors")
}

async function scenarioExampleThemeProvider(page, pageErrors) {
  await page.goto(`${baseUrl}?case=example/theme-provider-usage`)
  await page.getByRole("button", { name: "Show a toast" }).click()
  await toasterList(page).waitFor({ state: "attached" })
  await waitForTheme(page, "light")
  assert.equal(await page.locator("code").textContent(), "system")

  await page.getByText("The Toaster follows the provider theme", { exact: true }).waitFor({ state: "visible" })

  await page.getByRole("button", { name: "dark", exact: true }).click()
  await waitForTheme(page, "dark")
  assert.equal(await page.locator("code").textContent(), "dark")

  await page.getByRole("button", { name: "system", exact: true }).click()
  // Toast may auto-dismiss during the assertion chain; re-fire if needed.
  if ((await toastItems(page).count()) === 0) {
    await page.getByRole("button", { name: "Show a toast" }).click()
    await toasterList(page).waitFor({ state: "attached" })
  }
  await waitForTheme(page, "light")
  assert.equal(await page.locator("code").textContent(), "system")

  await page.emulateMedia({ colorScheme: "dark" })
  await waitForTheme(page, "dark")
  await shot(page, "example-theme-provider-system-dark")

  assert.equal(
    await page.evaluate(() => localStorage.getItem("exui-example-theme")),
    "system",
    "theme choice persists in localStorage under the storage key"
  )
  await page.reload()
  await page.locator("code").waitFor({ state: "visible" })
  assert.equal(await page.locator("code").textContent(), "system", "choice survives reload")
  assert.deepEqual(pageErrors, [], "the theme provider example must not raise runtime errors")
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  await mkdir(assetsDir, { recursive: true })
  const { createWriteStream } = await import("node:fs")
  logStream = createWriteStream(logFile, { flags: "w" })

  const fixtureRoot = await mkdtemp(join(tmpdir(), "exui-t6-consumer-"))
  let server
  log(`fixture root: ${fixtureRoot}`)

  try {
    log("packing @exre/exui tarball…")
    const packOutput = run(
      "pnpm",
      ["pack", "--json", "--pack-destination", fixtureRoot],
      join(repoRoot, "packages", "components")
    )
    const tarballField = JSON.parse(packOutput.stdout.trim()).filename
    const tarballPath = isAbsolute(tarballField) ? tarballField : join(fixtureRoot, tarballField)
    log(`tarball: ${tarballPath}`)

    const exampleFiles = await scaffold(fixtureRoot, tarballPath)
    log(`scaffolded consumer with ${exampleFiles.length} skill examples`)

    log("npm install…")
    run("npm", ["install", "--no-fund", "--no-audit"], fixtureRoot)
    log("npm install done")

    const nodeModules = join(fixtureRoot, "node_modules")
    const bundledLibraries = ["sonner", "react-day-picker", "recharts", "next-themes", "cmdk", "vaul"]
    for (const library of bundledLibraries) {
      const { existsSync } = await import("node:fs")
      assert.equal(
        existsSync(join(nodeModules, library)),
        false,
        `${library} must not be installed in the consumer tree (bundled into @exre/exui)`
      )
    }
    const { existsSync } = await import("node:fs")
    assert.ok(existsSync(join(nodeModules, "react")), "react installs as the declared host dependency")
    assert.ok(existsSync(join(nodeModules, "lucide-react")), "lucide-react installs as the documented icon dependency")

    const packedMeta = JSON.parse(await readFile(join(nodeModules, "@exre", "exui", "package.json"), "utf8"))
    assert.equal(packedMeta.dependencies?.["next-themes"] ?? null, null, "packed package must not depend on next-themes")
    log(`packed package dependencies: ${JSON.stringify(packedMeta.dependencies ?? {})}`)
    log(`packed package peerDependencies: ${JSON.stringify(packedMeta.peerDependencies ?? {})}`)
    report("dependency-isolation", "PASS", `bundled libraries absent: ${bundledLibraries.join(", ")}`)

    log("vite build…")
    run("npm", ["run", "build"], fixtureRoot)
    log("vite build done")

    const requireFromShowcase = createRequire(join(repoRoot, "packages", "showcase", "package.json"))
    const requireFromFixture = createRequire(join(fixtureRoot, "package.json"))
    const { chromium } = requireFromShowcase("playwright")
    const { preview } = await import(pathToFileURL(requireFromFixture.resolve("vite")).href)

    server = await preview({
      configFile: false,
      root: fixtureRoot,
      logLevel: "error",
      preview: { host: "127.0.0.1", port: 0 },
    })
    baseUrl = server.resolvedUrls.local[0]
    log(`preview server: ${baseUrl}`)

    browserFactory = () => chromium.launch({ headless: !headed })
    browser = await browserFactory()
    browser.on("disconnected", () => log("browser disconnected event"))
    log(`browser mode: ${headed ? "headed" : "headless"}${onlySet ? ` (only: ${[...onlySet].join(",")})` : ""}`)

    await scenario("api", { colorScheme: "light" }, scenarioApi)
    await scenario("inherit", { colorScheme: "light" }, scenarioInherit)
    await scenario("explicit", { colorScheme: "dark" }, scenarioExplicit)
    await scenario("noprovider", { colorScheme: "dark" }, scenarioNoProvider)
    await scenario("usethrow", { colorScheme: "light" }, scenarioUseThrow)
    await scenario("tokens", { colorScheme: "light" }, scenarioTokens)
    await scenario("example/sidebar-desktop", { colorScheme: "light" }, scenarioExampleSidebarDesktop)
    await scenario(
      "example/sidebar-mobile",
      { viewport: { width: 375, height: 667 }, colorScheme: "light" },
      scenarioExampleSidebarMobile
    )
    await scenario("example/dialog", { colorScheme: "light" }, scenarioExampleDialog)
    await scenario("example/combobox-single", { colorScheme: "light" }, scenarioExampleComboboxSingle)
    await scenario("example/combobox-multiple", { colorScheme: "light" }, scenarioExampleComboboxMultiple)
    await scenario("example/calendar-single", { colorScheme: "light" }, scenarioExampleCalendarSingle)
    await scenario("example/calendar-range", { colorScheme: "light" }, scenarioExampleCalendarRange)
    await scenario("example/tabs", { colorScheme: "light" }, scenarioExampleTabs)
    await scenario("example/tooltip", { colorScheme: "light" }, scenarioExampleTooltip)
    await scenario("example/message-scroller", { colorScheme: "light" }, scenarioExampleMessageScroller)
    await scenario("example/select-usage", { colorScheme: "light" }, scenarioExampleSelect)
    await scenario("example/sonner-notifications", { colorScheme: "dark" }, scenarioExampleSonner)
    await scenario("example/theme-provider-usage", { colorScheme: "light" }, scenarioExampleThemeProvider)
  } finally {
    const closeWithTimeout = async (closeable, label, timeoutMs = 5000) => {
      try {
        await Promise.race([
          closeable(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} close timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ])
      } catch (error) {
        log(`cleanup warning (${label}): ${String(error).split("\n")[0]}`)
      }
    }
    await closeWithTimeout(() => browser?.close(), "browser", 4000)
    await closeWithTimeout(() => server?.httpServer?.close(), "server", 4000)
    logStream?.end()
    try {
      await rm(fixtureRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch (error) {
      log(`fixture cleanup warning: ${String(error).split("\n")[0]}`)
    }
  }

  const failed = results.filter((entry) => entry.status === "FAIL")
  log(`summary: ${results.length - failed.length}/${results.length} scenarios passed`)
  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  log(`driver crashed: ${error?.stack ?? error}`)
  process.exitCode = 1
})