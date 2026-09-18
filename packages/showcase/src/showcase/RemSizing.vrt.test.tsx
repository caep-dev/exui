import "@exre/exui/style.css"

import type { ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { page, userEvent } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@exre/exui"

import { ComponentRecipeContract } from "./Showcase"

type ElementLocator = { element(): Element }

/**
 * Root font sizes used by the scaling matrix. The middle entry is 16px * 1.333
 * and exercises fractional layout, the last one doubles every scalable length.
 */
const scalingMatrix = [
  { rootFontSize: "16px", rootPixels: 16, scale: 1 },
  { rootFontSize: "21.328px", rootPixels: 21.328, scale: 1.333 },
  { rootFontSize: "32px", rootPixels: 32, scale: 2 },
] as const

/** Chromium lays out in 1/64px steps, so the matrix compares within 0.1 CSS px. */
const tolerance = 0.1

/**
 * Overlay placement is measured from rendered rects rather than computed
 * styles. A trigger whose text width is fractional leaves up to about a pixel
 * of slack, which the computed-style tolerance above is too tight to absorb.
 */
const positionTolerance = 1

let container: HTMLDivElement
let root: Root
let injectedStyle: HTMLStyleElement
let environment: EnvironmentSnapshot

function pixels(value: string): number {
  return Number.parseFloat(value)
}

function computed(locator: ElementLocator, property: string): string {
  return getComputedStyle(locator.element()).getPropertyValue(property).trim()
}

function describeLocator(locator: ElementLocator): string {
  const element = locator.element()
  return element.getAttribute("data-testid") ?? element.tagName.toLowerCase()
}

function locate(testId: string): ElementLocator {
  return {
    element: () => page.getByTestId(testId).element(),
  }
}

function expectScaled(actual: number, base: number, scale: number, label: string): void {
  expect(Math.abs(actual - base * scale), `${label} must scale from ${base}px`).toBeLessThanOrEqual(
    tolerance
  )
}

function expectScaledProperty(
  locator: ElementLocator,
  property: string,
  base: number,
  scale: number
): void {
  expectScaled(
    pixels(computed(locator, property)),
    base,
    scale,
    `${property} of ${describeLocator(locator)}`
  )
}

function expectFixedProperty(locator: ElementLocator, property: string, base: number): void {
  expect(
    Math.abs(pixels(computed(locator, property)) - base),
    `${property} of ${describeLocator(locator)} must stay fixed at ${base}px`
  ).toBeLessThanOrEqual(tolerance)
}

/** The pixel terms of a shadow, so a shadow can be checked without depending on serialization order. */
function pixelTerms(value: string): number[] {
  return Array.from(value.matchAll(/(-?\d*\.?\d+)px/g), (match) => Number.parseFloat(match[1]))
}

/**
 * Fixed shadow geometry, as the y-offset and blur radius of each of the two
 * layers. The zero offsets and zero spread radii are not asserted, because
 * Chromium's serialization decides whether it prints them.
 */
const fixedShadowTerms = [4, 8, 30, 40]

function expectFixedShadow(label: string, value: string): void {
  const nonZeroTerms = pixelTerms(value).filter((term) => term !== 0)
  expect(nonZeroTerms, `${label} must keep its fixed pixel geometry`).toEqual(fixedShadowTerms)
}

function resolvedLength(variable: string): number {
  const probe = document.createElement("div")
  probe.style.display = "block"
  probe.style.height = `var(${variable})`
  document.body.append(probe)
  const value = pixels(getComputedStyle(probe).height)
  probe.remove()
  return value
}

function setRootFontSize(value: string): void {
  document.documentElement.style.fontSize = value
}

/** The environment a case is allowed to change, captured so it can be put back. */
interface EnvironmentSnapshot {
  fontValue: string
  fontPriority: string
  rootClassName: string
  bodyMargin: string
  scrollX: number
  scrollY: number
}

function snapshotEnvironment(): EnvironmentSnapshot {
  const rootStyle = document.documentElement.style
  return {
    fontValue: rootStyle.getPropertyValue("font-size"),
    fontPriority: rootStyle.getPropertyPriority("font-size"),
    rootClassName: document.documentElement.className,
    bodyMargin: document.body.style.margin,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
}

/**
 * Restore the captured environment rather than clearing it, so an inline value
 * an application or another case installed survives this suite.
 */
function restoreEnvironment(snapshot: EnvironmentSnapshot): void {
  const rootStyle = document.documentElement.style
  if (snapshot.fontValue === "") {
    rootStyle.removeProperty("font-size")
  } else {
    rootStyle.setProperty("font-size", snapshot.fontValue, snapshot.fontPriority)
  }
  document.documentElement.className = snapshot.rootClassName
  document.body.style.margin = snapshot.bodyMargin
  window.scrollTo(snapshot.scrollX, snapshot.scrollY)
}

/** How an open overlay sits relative to its trigger and the viewport. */
interface OverlayGeometry {
  side: string
  /** The gap between the trigger and the overlay along the placement axis. */
  gap: number
  /** How much the trigger and the overlay still overlap across the placement axis. */
  crossAxisOverlap: number
  /** Whether the trigger's centre still falls inside the overlay across that axis. */
  triggerCentreInsideOverlay: boolean
  /** Whether the overlay stays inside the viewport on the placement axis. */
  insideViewport: boolean
}

function measureOverlay(contentTestId: string, triggerTestId: string): OverlayGeometry {
  const contentElement = locate(contentTestId).element()
  const content = contentElement.getBoundingClientRect()
  const trigger = locate(triggerTestId).element().getBoundingClientRect()
  const side = contentElement.getAttribute("data-side") ?? ""
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight

  const alongMainAxis = side === "bottom" || side === "top"
  const gap =
    side === "bottom"
      ? content.top - trigger.bottom
      : side === "top"
        ? trigger.top - content.bottom
        : side === "right"
          ? content.left - trigger.right
          : side === "left"
            ? trigger.left - content.right
            : Number.NaN

  const crossAxisOverlap = alongMainAxis
    ? Math.min(content.right, trigger.right) - Math.max(content.left, trigger.left)
    : Math.min(content.bottom, trigger.bottom) - Math.max(content.top, trigger.top)

  const triggerCentre = alongMainAxis
    ? trigger.left + trigger.width / 2
    : trigger.top + trigger.height / 2
  const triggerCentreInsideOverlay = alongMainAxis
    ? triggerCentre >= content.left - 1 && triggerCentre <= content.right + 1
    : triggerCentre >= content.top - 1 && triggerCentre <= content.bottom + 1

  const insideViewport = alongMainAxis
    ? content.top >= -1 && content.bottom <= viewportHeight + 1
    : content.left >= -1 && content.right <= viewportWidth + 1

  return { side, gap, crossAxisOverlap, triggerCentreInsideOverlay, insideViewport }
}

/**
 * Read the overlay geometry once it stops moving. Radix repositions an open
 * overlay asynchronously through its resize observer, so a single read after a
 * root font size change can still return the previous placement.
 */
async function settleOverlay(contentTestId: string, triggerTestId: string): Promise<OverlayGeometry> {
  let previous = measureOverlay(contentTestId, triggerTestId)

  for (let attempt = 0; attempt < 15; attempt += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const next = measureOverlay(contentTestId, triggerTestId)
    const moved =
      Math.abs(next.gap - previous.gap) > 0.05 ||
      Math.abs(next.crossAxisOverlap - previous.crossAxisOverlap) > 0.05 ||
      next.side !== previous.side
    previous = next
    if (!moved) {
      break
    }
  }

  return previous
}

function RemSizingExtras() {
  return (
    // `justifyItems` is set inline because the Showcase has no Tailwind build of
    // its own and can only use classes that the component bundle already ships.
    <div
      data-testid="rem-sizing-extras"
      className="grid gap-4 p-6"
      style={{ justifyItems: "start" }}
    >
      <Switch data-testid="rem-sizing-switch-checked" defaultChecked aria-label="Checked switch" />
      <Switch data-testid="rem-sizing-switch-unchecked" aria-label="Unchecked switch" />
      <Tooltip open>
        <TooltipTrigger asChild>
          <button data-testid="rem-sizing-tooltip-anchor-right" type="button">
            Anchor
          </button>
        </TooltipTrigger>
        <TooltipContent data-testid="rem-sizing-tooltip-right" side="right">
          Hi
        </TooltipContent>
      </Tooltip>
      <Tooltip open>
        <TooltipTrigger asChild>
          <button data-testid="rem-sizing-tooltip-anchor-left" type="button">
            Anchor
          </button>
        </TooltipTrigger>
        <TooltipContent data-testid="rem-sizing-tooltip-left" side="left">
          Hi
        </TooltipContent>
      </Tooltip>
      <Tooltip open>
        <TooltipTrigger asChild>
          <button data-testid="rem-sizing-tooltip-anchor-top" type="button">
            Anchor
          </button>
        </TooltipTrigger>
        <TooltipContent data-testid="rem-sizing-tooltip-top" side="top">
          Hi
        </TooltipContent>
      </Tooltip>
      <Tooltip open>
        <TooltipTrigger asChild>
          <button data-testid="rem-sizing-tooltip-anchor-bottom" type="button">
            Anchor
          </button>
        </TooltipTrigger>
        <TooltipContent data-testid="rem-sizing-tooltip-bottom" side="bottom">
          Hi
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function RemSizingFixture() {
  return (
    <TooltipProvider>
      <ComponentRecipeContract />
      <RemSizingExtras />
    </TooltipProvider>
  )
}

function RemSizingMenuFixture() {
  return (
    <div className="p-6">
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger asChild>
          <button data-testid="rem-sizing-menu-anchor" type="button">
            Menu anchor
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-testid="rem-sizing-menu">
          <DropdownMenuItem data-testid="rem-sizing-menu-item">
            Item with shortcut
            <DropdownMenuShortcut data-testid="rem-sizing-menu-shortcut">Cmd+K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator data-testid="rem-sizing-menu-separator" />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function RemSizingTooltipFixture() {
  return (
    <TooltipProvider>
      <RemSizingExtras />
    </TooltipProvider>
  )
}

async function mount(node: ReactElement): Promise<void> {
  root.render(node)
  await document.fonts.ready
}

beforeEach(() => {
  environment = snapshotEnvironment()

  container = document.createElement("div")
  container.id = "rem-sizing-root"
  document.body.replaceChildren(container)
  document.body.style.margin = "0"
  document.documentElement.classList.remove("dark", "pitch-black")
  document.documentElement.classList.add("light")

  injectedStyle = document.createElement("style")
  injectedStyle.textContent =
    "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
  document.head.append(injectedStyle)

  root = createRoot(container)
})

afterEach(() => {
  root.unmount()
  injectedStyle.remove()
  restoreEnvironment(environment)
})

describe.each(scalingMatrix)(
  "scalable recipe geometry at a $rootFontSize root font size",
  ({ rootFontSize, rootPixels, scale }) => {
    it("scales text, spacing, icons, and geometry while fixed effects stay put", async () => {
      setRootFontSize(rootFontSize)
      await mount(<RemSizingFixture />)
      await expect.element(page.getByTestId("recipe-contract")).toBeVisible()

      const buttonSizes = [
        ["recipe-button-small", 32, 12, 4, 12],
        ["recipe-button-default", 36, 12, 6, 14],
        ["recipe-button-large", 40, 16, 6, 14],
        ["recipe-button-icon", 36, 0, 0, 14],
      ] as const
      for (const [testId, height, paddingInline, gap, fontSize] of buttonSizes) {
        const locator = locate(testId)
        expectScaledProperty(locator, "height", height, scale)
        expectScaledProperty(locator, "padding-inline-start", paddingInline, scale)
        expectScaledProperty(locator, "column-gap", gap, scale)
        expectScaledProperty(locator, "font-size", fontSize, scale)
        // Capsule radii and hairline borders are fixed effects, not geometry.
        expectFixedProperty(locator, "border-radius", 9999)
        expectFixedProperty(locator, "border-top-width", 1)
        const icon = locator.element().querySelector("svg")!
        expectScaled(pixels(getComputedStyle(icon).width), 16, scale, `${testId} icon width`)
      }

      // ActionButton replaces the capsule with the tighter shared radius, which
      // is ordinary geometry and therefore has to scale with the root font size.
      const actionButtons = [
        "recipe-action-button-default",
        "recipe-action-button-secondary",
        "recipe-action-button-danger",
        "recipe-action-button-small",
        "recipe-action-button-large",
      ] as const
      for (const testId of actionButtons) {
        expectScaledProperty(locate(testId), "border-radius", 12, scale)
      }

      const input = locate("recipe-input-default")
      expectScaledProperty(input, "height", 36, scale)
      expectScaledProperty(input, "padding-inline-start", 12, scale)
      expectScaledProperty(input, "padding-block-start", 4, scale)
      expectScaledProperty(input, "border-radius", 14, scale)
      expectScaledProperty(input, "font-size", 14, scale)
      expectScaledProperty(input, "line-height", 20, scale)
      expectFixedProperty(input, "border-top-width", 1)

      const sidebarCases = [
        ["recipe-sidebar-default", 32, 12, 8, 14],
        ["recipe-sidebar-nested", 32, 12, 8, 12],
        ["recipe-sidebar-icon-only", 32, 8, 0, 14],
      ] as const
      for (const [testId, minHeight, paddingInline, gap, fontSize] of sidebarCases) {
        const locator = locate(testId)
        expectScaledProperty(locator, "min-height", minHeight, scale)
        expectScaledProperty(locator, "padding-inline-start", paddingInline, scale)
        expectScaledProperty(locator, "column-gap", gap, scale)
        expectScaledProperty(locator, "border-radius", 14, scale)
        expectScaledProperty(locator, "font-size", fontSize, scale)
        const icon = locator.element().querySelector("svg")
        if (icon) {
          expectScaled(pixels(getComputedStyle(icon).width), 16, scale, `${testId} icon width`)
        }
      }

      const menuSurface = locate("recipe-menu-surface")
      expectScaledProperty(menuSurface, "padding-top", 6, scale)
      expectScaledProperty(menuSurface, "border-radius", 22, scale)
      expectFixedProperty(menuSurface, "border-top-width", 1)
      expectFixedShadow("the menu surface shadow", computed(menuSurface, "box-shadow"))

      const dialogSurface = locate("recipe-dialog-surface")
      expectScaledProperty(dialogSurface, "padding-top", 24, scale)
      expectScaledProperty(dialogSurface, "row-gap", 24, scale)
      expectScaledProperty(dialogSurface, "border-radius", 26, scale)
      expectFixedProperty(dialogSurface, "border-top-width", 1)
      expectFixedShadow("the dialog surface shadow", computed(dialogSurface, "box-shadow"))

      const tabsList = locate("recipe-tabs-default-list")
      expectScaledProperty(tabsList, "height", 36, scale)
      expectScaledProperty(tabsList, "padding-top", 4, scale)
      expectScaledProperty(tabsList, "column-gap", 4, scale)
      expectScaledProperty(tabsList, "border-radius", 14, scale)

      const tabsTrigger = locate("recipe-tab-default-overview")
      expectScaledProperty(tabsTrigger, "padding-inline-start", 12, scale)
      expectScaledProperty(tabsTrigger, "padding-block-start", 4, scale)
      expectScaledProperty(tabsTrigger, "column-gap", 8, scale)
      expectScaledProperty(tabsTrigger, "border-radius", 14, scale)
      expectScaledProperty(tabsTrigger, "font-size", 14, scale)

      await page.getByTestId("recipe-tab-line-details").click()
      const indicator = getComputedStyle(
        page.getByTestId("recipe-tab-line-details").element(),
        "::after"
      )
      expectScaled(pixels(indicator.height), 2, scale, "tabs indicator thickness")
      expect(indicator.opacity).toBe("1")

      // The Switch thumb correction is scalable geometry, so both states must
      // keep landing flush inside the track at every root font size.
      for (const testId of ["rem-sizing-switch-checked", "rem-sizing-switch-unchecked"]) {
        const locator = locate(testId)
        const switchElement = locator.element()
        const track = getComputedStyle(switchElement)
        expectScaled(pixels(track.width), 44, scale, `${testId} track width`)
        expectScaled(pixels(track.height), 20, scale, `${testId} track height`)
        expectFixedProperty(locator, "border-top-width", 2)

        const thumb = switchElement.querySelector<HTMLElement>("[data-slot='switch-thumb']")!
        const thumbStyle = getComputedStyle(thumb)
        expectScaled(pixels(thumbStyle.width), 24, scale, `${testId} thumb width`)
        expectScaled(pixels(thumbStyle.height), 16, scale, `${testId} thumb height`)

        const trackBox = switchElement.getBoundingClientRect()
        const thumbBox = thumb.getBoundingClientRect()
        const contentLeft = trackBox.left + pixels(track.borderLeftWidth)
        const contentRight = trackBox.right - pixels(track.borderRightWidth)
        const gapToEdge =
          testId === "rem-sizing-switch-checked"
            ? contentRight - thumbBox.right
            : thumbBox.left - contentLeft
        expect(
          Math.abs(gapToEdge),
          `${testId} thumb must stay flush with the track`
        ).toBeLessThanOrEqual(0.5)
      }

      // The Tooltip arrow keeps its correction expressed in rem so it survives
      // a root font size change, and it stays aligned on whichever surface edge
      // collision resolution chooses.
      const tooltipCases = [
        "rem-sizing-tooltip-right",
        "rem-sizing-tooltip-left",
        "rem-sizing-tooltip-top",
        "rem-sizing-tooltip-bottom",
      ] as const
      for (const testId of tooltipCases) {
        await expect.element(page.getByTestId(testId)).toBeVisible()
      }

      expectScaledProperty(locate("rem-sizing-tooltip-right"), "border-radius", 14, scale)
      expectScaledProperty(locate("rem-sizing-tooltip-right"), "padding-inline-start", 12, scale)
      expectScaledProperty(locate("rem-sizing-tooltip-right"), "font-size", 12, scale)

      for (const testId of tooltipCases) {
        const content = locate(testId).element()
        const arrow = content.querySelector("svg")!
        expectScaled(pixels(getComputedStyle(arrow).width), 10, scale, `${testId} arrow width`)
        expectScaled(pixels(getComputedStyle(arrow).height), 10, scale, `${testId} arrow height`)
        expectScaled(pixels(getComputedStyle(arrow).borderRadius), 2, scale, `${testId} arrow radius`)

        // The pull-back that tucks the rotated arrow into the surface is the
        // active part of the arrow correction, so it must stay a subtraction of
        // a rem value rather than a frozen pixel offset.
        const arrowCorrection = getComputedStyle(arrow).getPropertyValue("--tw-translate-y")
        expect(arrowCorrection, `${testId} arrow correction must subtract a rem value`).toMatch(
          /calc\(-50% - \.?\d*\.?\d+rem\)/
        )
        expectScaled(
          Number.parseFloat(/(-?\d*\.?\d+)rem/.exec(arrowCorrection)![1]) * rootPixels,
          2,
          scale,
          `${testId} arrow correction`
        )

        // Whichever side collision resolution picked, the arrow must keep
        // straddling that surface edge. This checks Radix's placement against
        // the surface edge, not the magnitude of the correction above.
        const side = content.getAttribute("data-side")
        expect(["top", "right", "bottom", "left"], `${testId} must report its resolved side`).toContain(
          side
        )
        const contentBox = content.getBoundingClientRect()
        const arrowBox = arrow.getBoundingClientRect()
        const aligned =
          side === "right"
            ? arrowBox.left <= contentBox.left + 0.5 && contentBox.left <= arrowBox.right + 0.5
            : side === "left"
              ? arrowBox.left <= contentBox.right + 0.5 && contentBox.right <= arrowBox.right + 0.5
              : side === "bottom"
                ? arrowBox.top <= contentBox.top + 0.5 && contentBox.top <= arrowBox.bottom + 0.5
                : arrowBox.top <= contentBox.bottom + 0.5 && contentBox.bottom <= arrowBox.bottom + 0.5
        expect(aligned, `${testId} arrow must align with the ${side} edge`).toBe(true)
      }

      // The opened Dialog proves portal content consumes the same root font size
      // and that the overlay blur radius scales with it.
      await page.getByTestId("recipe-dialog-trigger").click()
      const dialog = locate("recipe-dialog-content")
      await expect.element(page.getByTestId("recipe-dialog-content")).toBeVisible()
      expectScaledProperty(dialog, "padding-top", 24, scale)
      expectScaledProperty(dialog, "row-gap", 24, scale)
      expectScaledProperty(dialog, "border-radius", 26, scale)
      expectScaledProperty(locate("recipe-dialog-title"), "font-size", 16, scale)
      expectScaledProperty(locate("recipe-dialog-title"), "line-height", 20, scale)
      expectScaledProperty(locate("recipe-dialog-description"), "font-size", 14, scale)
      expectScaledProperty(locate("recipe-dialog-description"), "line-height", 20, scale)

      const overlay = document.querySelector<HTMLElement>("[data-slot='dialog-overlay']")!
      expectScaled(
        pixels(getComputedStyle(overlay).backdropFilter.replace(/[^0-9.]/g, "")),
        4,
        scale,
        "dialog overlay backdrop blur"
      )

      // Escape still closes the portal and returns focus to the trigger.
      await userEvent.keyboard("{Escape}")
      await expect
        .poll(() => document.querySelector("[data-testid='recipe-dialog-content']"))
        .toBeNull()
      const trigger = locate("recipe-dialog-trigger").element()
      await expect.poll(() => document.activeElement).toBe(trigger)
    })

    it("scales the opened menu while its separator and tracking stay fixed", async () => {
      setRootFontSize(rootFontSize)
      await mount(<RemSizingMenuFixture />)

      const menuContent = locate("rem-sizing-menu")
      await expect.element(page.getByTestId("rem-sizing-menu")).toBeVisible()
      expectScaledProperty(menuContent, "padding-top", 6, scale)
      expectScaledProperty(menuContent, "border-radius", 22, scale)

      const item = locate("rem-sizing-menu-item")
      expectScaledProperty(item, "padding-inline-start", 12, scale)
      expectScaledProperty(item, "padding-block-start", 8, scale)
      expectScaledProperty(item, "column-gap", 10, scale)
      expectScaledProperty(item, "border-radius", 14, scale)
      expectScaledProperty(item, "font-size", 14, scale)

      // A separator is a hairline: it must not grow with the root font size.
      expectFixedProperty(locate("rem-sizing-menu-separator"), "height", 1)

      const shortcut = locate("rem-sizing-menu-shortcut")
      expectScaledProperty(shortcut, "font-size", 12, scale)
      // `0.1em` tracking follows the element font size, which is the intended em
      // behaviour rather than a pixel conversion.
      expectScaled(pixels(computed(shortcut, "letter-spacing")), 1.2, scale, "shortcut tracking")
      // `margin-inline-start: auto` still pushes the shortcut to the item edge.
      const itemBox = item.element().getBoundingClientRect()
      const shortcutBox = shortcut.element().getBoundingClientRect()
      const itemContentRight =
        itemBox.right -
        pixels(computed(item, "padding-inline-end")) -
        pixels(computed(item, "border-right-width"))
      expect(Math.abs(itemContentRight - shortcutBox.right)).toBeLessThanOrEqual(0.5)
    })
  }
)

describe("root font size contract", () => {
  it("updates an open portal overlay when the root font size changes", async () => {
    setRootFontSize("16px")
    await mount(<RemSizingFixture />)
    await page.getByTestId("recipe-dialog-trigger").click()

    const dialog = locate("recipe-dialog-content")
    await expect.element(page.getByTestId("recipe-dialog-content")).toBeVisible()
    expectScaledProperty(dialog, "padding-top", 24, 1)

    setRootFontSize("32px")
    expectScaledProperty(dialog, "padding-top", 24, 2)
    expectScaledProperty(locate("recipe-dialog-title"), "font-size", 16, 2)
    await expect.element(page.getByTestId("recipe-dialog-content")).toBeVisible()

    const overlay = document.querySelector<HTMLElement>("[data-slot='dialog-overlay']")!
    expect(pixels(getComputedStyle(overlay).backdropFilter.replace(/[^0-9.]/g, ""))).toBeCloseTo(8, 1)

    // A Dialog is viewport-centred rather than trigger-anchored, so the
    // applicable post-scale placement check is that it still fits the viewport.
    const dialogBox = locate("recipe-dialog-content").element().getBoundingClientRect()
    expect(dialogBox.top, "the scaled dialog must stay inside the viewport").toBeGreaterThanOrEqual(-1)
    expect(dialogBox.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight + 1)

    setRootFontSize("16px")
    expectScaledProperty(dialog, "padding-top", 24, 1)
  })

  it("keeps an open Menu anchored to its trigger when the root font size changes", async () => {
    setRootFontSize("16px")
    await mount(<RemSizingMenuFixture />)
    await expect.element(page.getByTestId("rem-sizing-menu")).toBeVisible()
    expectScaledProperty(locate("rem-sizing-menu"), "padding-top", 6, 1)
    const before = await settleOverlay("rem-sizing-menu", "rem-sizing-menu-anchor")

    setRootFontSize("32px")
    await expect.element(page.getByTestId("rem-sizing-menu")).toBeVisible()
    expectScaledProperty(locate("rem-sizing-menu"), "padding-top", 6, 2)
    expectScaledProperty(locate("rem-sizing-menu-item"), "font-size", 14, 2)
    const after = await settleOverlay("rem-sizing-menu", "rem-sizing-menu-anchor")

    // The open overlay must still point at the same trigger across the scale.
    expect(before.triggerCentreInsideOverlay, "the menu points at its trigger before scaling").toBe(
      true
    )
    expect(after.triggerCentreInsideOverlay, "the menu still points at its trigger").toBe(true)
    expect(after.crossAxisOverlap, "the menu must still overlap its trigger").toBeGreaterThan(0)

    // `sideOffset` is a numeric positioning prop, so it keeps its pixel value
    // instead of being multiplied by the root font size.
    expect(
      Math.abs(before.gap - 4),
      "the menu sideOffset before scaling"
    ).toBeLessThanOrEqual(positionTolerance)
    expect(after.gap, "the menu sideOffset must not scale").toBeLessThanOrEqual(
      4 + positionTolerance
    )
    expect(after.gap, "the menu must stay adjacent to its trigger").toBeGreaterThanOrEqual(
      -positionTolerance
    )

    expect(after.insideViewport, "the scaled menu must stay inside the viewport").toBe(true)
  })

  it("keeps an open Tooltip anchored to its trigger when the root font size changes", async () => {
    setRootFontSize("16px")
    await mount(<RemSizingTooltipFixture />)
    await expect.element(page.getByTestId("rem-sizing-tooltip-right")).toBeVisible()
    const before = await settleOverlay("rem-sizing-tooltip-right", "rem-sizing-tooltip-anchor-right")

    setRootFontSize("32px")
    await expect.element(page.getByTestId("rem-sizing-tooltip-right")).toBeVisible()
    expectScaledProperty(locate("rem-sizing-tooltip-right"), "padding-inline-start", 12, 2)
    const after = await settleOverlay("rem-sizing-tooltip-right", "rem-sizing-tooltip-anchor-right")

    expect(after.triggerCentreInsideOverlay, "the tooltip still points at its trigger").toBe(true)
    expect(after.crossAxisOverlap, "the tooltip must still overlap its trigger").toBeGreaterThan(0)

    // The surface sits one arrow height away: Radix adds the arrow height to the
    // numeric `sideOffset` (0 here), and ExUI's own arrow is scalable geometry,
    // so this gap follows the root font size while the offset does not.
    expect(
      Math.abs(before.gap - 10),
      "the tooltip arrow gap before scaling"
    ).toBeLessThanOrEqual(positionTolerance)
    expect(Math.abs(after.gap - 20), "the tooltip arrow gap after scaling").toBeLessThanOrEqual(
      positionTolerance
    )

    expect(after.insideViewport, "the scaled tooltip must stay inside the viewport").toBe(true)
  })

  it("keeps the scaled recipe contract reachable through scrolling", async () => {
    setRootFontSize("32px")
    await mount(<RemSizingFixture />)
    await expect.element(page.getByTestId("recipe-contract")).toBeVisible()

    const documentHeight = document.documentElement.scrollHeight
    expect(documentHeight).toBeGreaterThan(document.documentElement.clientHeight)

    const extras = locate("rem-sizing-extras").element()
    const topBeforeScroll = extras.getBoundingClientRect().top
    expect(topBeforeScroll).toBeGreaterThan(document.documentElement.clientHeight)

    window.scrollTo(0, documentHeight)
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const topAfterScroll = extras.getBoundingClientRect().top
    expect(topAfterScroll).toBeLessThan(topBeforeScroll)
    expect(topAfterScroll).toBeLessThan(document.documentElement.clientHeight)
  })

  it("never sets a root font size of its own", async () => {
    setRootFontSize("20px")
    await mount(<RemSizingFixture />)
    await expect.element(page.getByTestId("recipe-contract")).toBeVisible()

    // Every rule must be visited, including the ones Tailwind nests inside
    // `@layer`, `@media`, and `@supports` blocks.
    const flattenStyleRules = (rules: CSSRuleList | CSSRule[]): CSSStyleRule[] => {
      const collected: CSSStyleRule[] = []
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          collected.push(rule)
        }
        const nested = (rule as CSSGroupingRule).cssRules
        if (nested && nested.length > 0) {
          collected.push(...flattenStyleRules(nested))
        }
      }
      return collected
    }

    const declaredRootFontSizes: string[] = []
    let scannedRuleCount = 0
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const rule of flattenStyleRules(rules)) {
        scannedRuleCount += 1
        const selectsRoot = rule.selectorText
          .split(",")
          .map((selector) => selector.trim())
          .some((selector) => selector === ":root" || selector === "html")
        const declared = rule.style.getPropertyValue("font-size")
        if (selectsRoot && declared) {
          declaredRootFontSizes.push(`${rule.selectorText}{font-size:${declared}}`)
        }
      }
    }

    // Guard against the scan silently finding nothing to inspect.
    expect(scannedRuleCount).toBeGreaterThan(500)
    expect(declaredRootFontSizes).toEqual([])
    expect(document.documentElement.style.fontSize).toBe("20px")
    // 36px at a 16px base must follow the application root font size, both in
    // the component geometry and in the exposed density token itself.
    expectScaledProperty(locate("recipe-button-default"), "height", 36, 1.25)
    expectScaled(resolvedLength("--density-control-height"), 36, 1.25, "density control height")
  })

  it("restores a captured root font size, its priority, and the theme", () => {
    const rootStyle = document.documentElement.style
    rootStyle.setProperty("font-size", "13px", "important")
    document.documentElement.className = "custom-theme extra"
    document.body.style.margin = "5px"
    const snapshot = snapshotEnvironment()

    // Simulate another case or the application replacing the environment.
    rootStyle.setProperty("font-size", "26px")
    document.documentElement.className = "light"
    document.body.style.margin = "0px"

    restoreEnvironment(snapshot)

    expect(rootStyle.getPropertyValue("font-size"), "the value must be restored").toBe("13px")
    expect(rootStyle.getPropertyPriority("font-size"), "the priority must be restored").toBe(
      "important"
    )
    expect(document.documentElement.className, "the theme classes must be restored").toBe(
      "custom-theme extra"
    )
    expect(document.body.style.margin, "the body margin must be restored").toBe("5px")
  })
})
