import "@exre/exui/style.css"

import type { ReactElement } from "react"
import { StrictMode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  Button,
  GlassSeed,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@exre/exui"

import { GlassSample } from "./GlassSample"

/**
 * Filter id the seed publishes. Repeating it here is deliberate: the value is
 * part of the material's contract, so a rename has to be a visible test change
 * rather than something that silently keeps passing.
 */
const filterReference = 'url("#exui-glass-distortion-v1")'

const referenceVariable = "--_exui-glass-reference"

/** `backdrop-filter` of the base material. */
const baseBlur = "blur(4px)"

const transparent = "rgba(0, 0, 0, 0)"
const neutralBackground = "rgba(255, 255, 255, 0.72)"
const neutralHoverBackground = "rgba(255, 255, 255, 0.82)"
const neutralSelectedBackground = "rgba(235, 235, 235, 0.9)"
const dangerBackground = "rgba(231, 0, 11, 0.9)"

let container: HTMLDivElement
let root: Root

/**
 * Canonical `rgba(r, g, b, a)` for any syntax Chromium may serialize a Token
 * colour as. A `color-mix()` result comes back as `color(srgb …)`, so comparing
 * raw strings would test the serializer instead of the material.
 */
function canonicalColor(value: string): string {
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(value)
  if (srgb) {
    const channels = srgb.slice(1, 4).map((channel) => Math.round(Number(channel) * 255))
    const alpha = srgb[4] === undefined ? 1 : Number(srgb[4])
    return `rgba(${channels.join(", ")}, ${alpha})`
  }

  const functional =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)$/.exec(value)
  if (!functional) {
    return value
  }

  const channels = functional.slice(1, 4).map((channel) => Math.round(Number(channel)))
  const alpha = functional[4] === undefined ? 1 : Number(functional[4])
  return `rgba(${channels.join(", ")}, ${alpha})`
}

function computed(selector: string, property: string, pseudo?: string): string {
  const element = document.querySelector(selector)!
  return getComputedStyle(element, pseudo).getPropertyValue(property).trim()
}

function backgroundColor(selector: string): string {
  return canonicalColor(computed(selector, "background-color"))
}

function mustFind(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector)
  expect(element, `${selector} must be rendered`).not.toBeNull()
  return element!
}

async function waitFor(selector: string): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector(selector)).not.toBeNull()
  return mustFind(selector)
}

/** The pixel terms of a shadow, so serialization order never matters. */
function shadowTerms(value: string): number[] {
  return Array.from(value.matchAll(/(-?\d*\.?\d+)px/g), (match) => Number.parseFloat(match[1]))
}

async function mount(node: ReactElement): Promise<void> {
  root.render(node)
  await document.fonts.ready
}

async function mountSample(withSeed: boolean): Promise<void> {
  await mount(
    <>
      {withSeed ? <GlassSeed /> : null}
      <GlassSample />
    </>
  )
  await expect.element(page.getByTestId("glass-sample")).toBeVisible()
}

beforeEach(() => {
  container = document.createElement("div")
  container.id = "glass-root"
  document.body.replaceChildren(container)
  document.body.style.margin = "0"
  document.documentElement.classList.remove("dark", "pitch-black")
  document.documentElement.classList.add("light")
  document.documentElement.style.removeProperty(referenceVariable)

  root = createRoot(container)
})

afterEach(() => {
  root.unmount()
  document.documentElement.style.removeProperty(referenceVariable)
})

describe("glass base material", () => {
  it("paints the neutral material without changing the box", async () => {
    await mountSample(false)

    const treated = mustFind("[data-testid='glass-plain']")
    const control = mustFind("[data-testid='glass-plain-untreated']")
    const treatedStyle = getComputedStyle(treated)
    const controlStyle = getComputedStyle(control)

    expect(canonicalColor(treatedStyle.backgroundColor)).toBe(neutralBackground)
    expect(treatedStyle.backdropFilter).toContain(baseBlur)
    expect(treatedStyle.backdropFilter).toContain("saturate(1.2)")
    // The material's edge is an inset shadow, so an element that never had a
    // border must not grow one.
    expect(treatedStyle.borderTopWidth).toBe("0px")
    expect(shadowTerms(treatedStyle.boxShadow)).toContain(1)
    expect(treatedStyle.boxShadow).toMatch(/rgba\(255, 255, 255, [\d.]+\).*inset/)

    // Geometry, painting order, and clipping are the component's business.
    for (const property of [
      "display",
      "position",
      "padding-top",
      "padding-left",
      "width",
      "height",
      "overflow-x",
      "overflow-y",
      "z-index",
    ] as const) {
      expect(treatedStyle.getPropertyValue(property), property).toBe(
        controlStyle.getPropertyValue(property)
      )
    }
  })

  it("marks only the surfaces that opted in, without spreading to descendants", async () => {
    await mountSample(false)

    const card = mustFind("[data-testid='glass-card']")
    expect(card.classList.contains("ex-glass")).toBe(true)

    const markedInside = Array.from(card.querySelectorAll<HTMLElement>(".ex-glass"), (node) =>
      node.getAttribute("data-testid")
    ).sort()
    expect(markedInside).toEqual([
      "glass-action-button",
      "glass-button",
      "glass-button-danger",
      "glass-nested",
    ])
    expect(mustFind("[data-slot='card-title']").classList.contains("ex-glass")).toBe(false)
  })

  it("does not add the marker to elements that were not asked", async () => {
    await mountSample(false)

    for (const testId of ["glass-sample", "glass-plain-untreated", "glass-tab-plain"]) {
      expect(
        mustFind(`[data-testid='${testId}']`).classList.contains("ex-glass"),
        testId
      ).toBe(false)
    }
  })
})

describe("glass enhancement lifecycle", () => {
  it("leaves the filter out of the chain when no seed is mounted", async () => {
    await mountSample(false)

    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe("")
    const chain = computed("[data-testid='glass-plain']", "backdrop-filter")
    expect(chain).toContain(baseBlur)
    // A missing seed must never leave a dangling URL in an active chain.
    expect(chain).not.toContain("url(")
  })

  it("advertises the filter once the seed is mounted and withdraws it on unmount", async () => {
    await mountSample(true)

    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(filterReference)
    expect(computed("[data-testid='glass-plain']", "backdrop-filter")).toContain(filterReference)

    root.unmount()
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe("")
    // Remounting has to come back, not stay withdrawn.
    root = createRoot(container)
    await mountSample(true)
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(filterReference)
  })

  it("keeps the base blur when the engine rejects the filter chain", async () => {
    const originalSupports = CSS.supports
    CSS.supports = () => false
    // Guard against a stub that silently did not take: the rest of this test is
    // only meaningful if every capability query now reports false.
    expect(CSS.supports("display", "block")).toBe(false)

    try {
      await mountSample(true)

      expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe("")
      const chain = computed("[data-testid='glass-plain']", "backdrop-filter")
      expect(chain).toContain(baseBlur)
      expect(chain).not.toContain("url(")
    } finally {
      CSS.supports = originalSupports
    }
  })

  it("survives a Strict Mode mount and unmount cycle", async () => {
    await mount(
      <StrictMode>
        <GlassSeed />
        <GlassSample />
      </StrictMode>
    )
    await expect.element(page.getByTestId("glass-sample")).toBeVisible()
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(filterReference)

    root.unmount()
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe("")
  })

  it("does not strand a reference when seeds overlap", async () => {
    await mount(
      <>
        <GlassSeed />
        <GlassSeed />
      </>
    )
    await expect
      .poll(() => document.documentElement.style.getPropertyValue(referenceVariable))
      .toBe(filterReference)

    // Removing one of the two must not switch the enhancement off for the one
    // that is still mounted.
    root.render(<GlassSeed />)
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(filterReference)

    // And the last one out must clear the document rather than restore the
    // value it captured while the other seed was still live.
    root.unmount()
    await expect
      .poll(() => document.documentElement.style.getPropertyValue(referenceVariable))
      .toBe("")
  })

  it("restores a reference the host already had instead of clearing it", async () => {
    const hostReference = 'url("#host-owned-filter")'
    document.documentElement.style.setProperty(referenceVariable, hostReference, "important")

    await mountSample(true)
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(filterReference)

    root.unmount()
    expect(document.documentElement.style.getPropertyValue(referenceVariable)).toBe(hostReference)
    expect(document.documentElement.style.getPropertyPriority(referenceVariable)).toBe("important")
  })

  it("reaches portal content through the same document seed", async () => {
    await mountSample(true)

    await page.getByTestId("glass-dialog-trigger").click()
    await expect.element(page.getByTestId("glass-dialog-content")).toBeVisible()
    expect(computed("[data-testid='glass-dialog-content']", "backdrop-filter")).toContain(
      filterReference
    )
  })
})

describe("glass interaction states", () => {
  it("marks only the surfaces that already had their own feedback", async () => {
    await mountSample(false)

    for (const testId of ["glass-button", "glass-tab", "glass-input"]) {
      expect(
        mustFind(`[data-testid='${testId}']`).hasAttribute("data-exui-glass-interactive"),
        testId
      ).toBe(true)
    }

    for (const testId of ["glass-plain", "glass-card", "glass-tabs-list", "glass-badge-danger"]) {
      expect(
        mustFind(`[data-testid='${testId}']`).hasAttribute("data-exui-glass-interactive"),
        testId
      ).toBe(false)
    }
  })

  it("switches material on hover only where the component already reacted", async () => {
    await mountSample(false)

    expect(backgroundColor("[data-testid='glass-plain']")).toBe(neutralBackground)

    await page.getByTestId("glass-button").hover()
    await expect
      .poll(() => backgroundColor("[data-testid='glass-button']"))
      .toBe(neutralHoverBackground)

    // A plain div must not start behaving like a button under the pointer.
    await page.getByTestId("glass-plain").hover()
    expect(backgroundColor("[data-testid='glass-plain']")).toBe(neutralBackground)
  })

  it("keeps a disabled surface on the default material when it reports a selected state", async () => {
    await mountSample(false)

    // A pressed control takes the selected material...
    expect(backgroundColor("[data-testid='glass-toggle-pressed']")).toBe(neutralSelectedBackground)
    // ...and the same control, disabled, must not. A disabled control can still
    // carry aria-pressed, so the guard has to cover the selected branch too.
    expect(backgroundColor("[data-testid='glass-toggle-disabled-pressed']")).toBe(neutralBackground)
  })

  it("keeps the focus and invalid rings of a glass form control", async () => {
    await mountSample(false)

    mustFind("[data-testid='glass-input']").focus()

    await expect
      .poll(() => computed("[data-testid='glass-input']", "box-shadow"))
      .toContain("rgba(0, 136, 255, 0.25)")

    expect(computed("[data-testid='glass-input-invalid']", "box-shadow")).toContain(
      "rgba(231, 0, 11, 0.25)"
    )
  })
})

describe("glass danger material", () => {
  it("keeps danger semantics instead of taking the neutral material", async () => {
    await mountSample(false)

    for (const testId of ["glass-button-danger", "glass-badge-danger", "glass-alert"]) {
      expect(backgroundColor(`[data-testid='${testId}']`), testId).toBe(dangerBackground)
    }

    expect(backgroundColor("[data-testid='glass-button']")).toBe(neutralBackground)
  })

  it("publishes the danger semantics even when the material is off", async () => {
    await mountSample(false)

    // The tone marker is what lets a caller add `ex-glass` afterwards and still
    // get the danger material, so it cannot depend on the prop.
    expect(mustFind("[data-testid='glass-badge-danger']").getAttribute("data-exui-glass-tone")).toBe(
      "danger"
    )
    expect(mustFind("[data-testid='glass-alert']").getAttribute("data-exui-glass-tone")).toBe(
      "danger"
    )
    expect(mustFind("[data-testid='glass-button']").hasAttribute("data-exui-glass-tone")).toBe(false)
  })
})

describe("glass composition surfaces", () => {
  it("delegates a Bubble's material to its own content and paints the root not at all", async () => {
    await mountSample(false)

    const bubble = mustFind("[data-testid='glass-bubble']")
    expect(bubble.getAttribute("data-exui-glass-delegate")).toBe("bubble")
    // Both markers move: the root keeps neither the class nor a background.
    expect(bubble.classList.contains("ex-glass")).toBe(false)
    expect(canonicalColor(getComputedStyle(bubble).backgroundColor)).toBe(transparent)

    const contents = bubble.querySelectorAll<HTMLElement>("[data-slot='bubble-content']")
    expect(contents).toHaveLength(1)
    expect(canonicalColor(getComputedStyle(contents[0]).backgroundColor)).toBe(neutralBackground)
    expect(shadowTerms(getComputedStyle(contents[0]).boxShadow)).toContain(1)

    // A standalone content keeps its own opt-in.
    expect(backgroundColor("[data-testid='glass-bubble-content']")).toBe(neutralBackground)
  })

  it("moves the native select marker onto the element that paints", async () => {
    await mountSample(false)

    const select = mustFind("[data-testid='glass-native-select']")
    const wrapper = select.parentElement!
    expect(wrapper.getAttribute("data-slot")).toBe("native-select-wrapper")
    expect(wrapper.classList.contains("ex-glass")).toBe(false)
    expect(select.classList.contains("ex-glass")).toBe(true)
    expect(canonicalColor(getComputedStyle(select).backgroundColor)).toBe(neutralBackground)
    // The wrapper must not draw a second surface behind the select.
    expect(canonicalColor(getComputedStyle(wrapper).backgroundColor)).toBe(transparent)
  })

  it("paints an input group once, on its outer surface", async () => {
    await mountSample(false)

    const group = mustFind("[data-testid='glass-input-group']")
    expect(group.getAttribute("data-slot")).toBe("input-group")
    expect(group.classList.contains("ex-glass")).toBe(true)
    expect(canonicalColor(getComputedStyle(group).backgroundColor)).toBe(neutralBackground)
    // The control inside a glass group stays transparent.
    const control = group.querySelector<HTMLElement>("[data-slot='input-group-control']")!
    expect(canonicalColor(getComputedStyle(control).backgroundColor)).toBe(transparent)
  })

  it("stops a command palette from covering the dialog surface", async () => {
    await mountSample(false)

    // A standalone palette is a surface in its own right, so it takes the
    // material.
    expect(backgroundColor("[data-testid='glass-command-standalone']")).toBe(neutralBackground)

    await page.getByTestId("glass-command-trigger").click()
    const dialogSurface = await waitFor("[data-exui-glass-command-dialog]")

    const palette = dialogSurface.querySelector<HTMLElement>("[data-slot='command']")!
    expect(canonicalColor(getComputedStyle(palette).backgroundColor)).toBe(transparent)
  })

  it("switches off a popup's own backdrop layer while the material is on", async () => {
    await mountSample(false)

    await page.getByTestId("glass-menu-trigger").click()
    await expect.element(page.getByTestId("glass-menu-content")).toBeVisible()

    expect(computed("[data-testid='glass-menu-content']", "backdrop-filter")).toContain(baseBlur)
    expect(computed("[data-testid='glass-menu-content']", "backdrop-filter", "::before")).toBe("none")

    // The class entry point has to behave exactly like the prop, including
    // switching that layer off; otherwise the two entry points render
    // differently.
    await page.getByTestId("glass-menu-class-trigger").click()
    await expect.element(page.getByTestId("glass-menu-class-content")).toBeVisible()
    expect(computed("[data-testid='glass-menu-class-content']", "backdrop-filter")).toContain(baseBlur)
    expect(computed("[data-testid='glass-menu-class-content']", "backdrop-filter", "::before")).toBe(
      "none"
    )
  })

  it("keeps a nested surface from inheriting the outer surface's host shadow", async () => {
    await mountSample(false)

    const card = mustFind("[data-testid='glass-card']")
    card.style.setProperty("--_exui-glass-host-shadow", "0 0 0 9px rgb(1, 2, 3)")

    const nestedHostShadow = getComputedStyle(mustFind("[data-testid='glass-nested']"))
      .getPropertyValue("--_exui-glass-host-shadow")
      .trim()
    expect(nestedHostShadow).not.toContain("rgb(1, 2, 3)")
  })
})

describe("glass sidebar branches", () => {
  it("carries the material on whichever branch the viewport renders", async () => {
    const isMobileViewport = window.innerWidth < 768

    await mount(
      <SidebarProvider>
        <Sidebar glass collapsible="offcanvas" className="layout-marker">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Overview</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger data-testid="glass-branch-trigger" />
      </SidebarProvider>
    )
    await expect.element(page.getByTestId("glass-branch-trigger")).toBeVisible()

    if (isMobileViewport) {
      // The mobile sidebar is a Sheet, so its surface only exists once opened.
      // Only the marker is carried over from the caller; the branch still
      // ignores `className` exactly as it did before the material existed.
      await page.getByTestId("glass-branch-trigger").click()
      const sheetContent = await waitFor("[data-mobile='true']")
      expect(sheetContent.classList.contains("ex-glass")).toBe(true)
      expect(canonicalColor(getComputedStyle(sheetContent).backgroundColor)).toBe(neutralBackground)
      expect(sheetContent.classList.contains("layout-marker")).toBe(false)
    } else {
      const inner = mustFind("[data-slot='sidebar-inner']")
      expect(inner.classList.contains("ex-glass")).toBe(true)
      expect(canonicalColor(getComputedStyle(inner).backgroundColor)).toBe(neutralBackground)

      // The caller's className keeps its existing destination and must not
      // paint a second surface behind the panel.
      const sidebarContainer = mustFind("[data-slot='sidebar-container']")
      expect(sidebarContainer.classList.contains("layout-marker")).toBe(true)
      expect(sidebarContainer.classList.contains("ex-glass")).toBe(false)
    }
  })

  it("carries the material on the non-collapsible branch", async () => {
    await mount(
      <SidebarProvider>
        <Sidebar glass collapsible="none">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Overview</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )
    await document.fonts.ready

    const sidebar = await waitFor("[data-slot='sidebar']")
    expect(sidebar.classList.contains("ex-glass")).toBe(true)
    expect(canonicalColor(getComputedStyle(sidebar).backgroundColor)).toBe(neutralBackground)
  })
})

describe("glass prop surface", () => {
  it("never leaks the prop as a DOM attribute", async () => {
    await mountSample(false)

    expect(document.querySelectorAll("[glass]")).toHaveLength(0)
  })

  it("accepts the material through the prop and through an explicit class", async () => {
    await mount(<Button glass>Wrapped</Button>)
    const button = await waitFor("[data-slot='button']")
    expect(button.classList.contains("ex-glass")).toBe(true)
    expect(button.hasAttribute("glass")).toBe(false)

    root.unmount()
    root = createRoot(container)
    await mount(<Button glass={false} className="ex-glass">Explicit</Button>)
    const explicit = await waitFor("[data-slot='button']")
    expect(explicit.classList.contains("ex-glass")).toBe(true)
  })

  it("does not treat a lookalike class as the material", async () => {
    await mount(<Button className="ex-glass-lookalike">Lookalike</Button>)
    const button = await waitFor("[data-slot='button']")

    expect(button.classList.contains("ex-glass")).toBe(false)
    expect(getComputedStyle(button).backdropFilter).toBe("none")
  })
})
