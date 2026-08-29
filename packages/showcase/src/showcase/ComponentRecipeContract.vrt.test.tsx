import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page, userEvent } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ComponentRecipeContract } from "./Showcase"

type ThemeName = "light" | "dark" | "pitch-black"
type ElementLocator = { element(): Element }

const themes: ThemeName[] = ["light", "dark", "pitch-black"]
let container: HTMLDivElement
let root: Root

function pixels(value: string): number {
  return Number.parseFloat(value)
}

function colorFromVariable(name: string): string {
  const probe = document.createElement("span")
  probe.style.color = `var(${name})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function resolvedProperty(property: string, variable: string): string {
  const probe = document.createElement("span")
  probe.style.setProperty(property, `var(${variable})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property).trim()
  probe.remove()
  return value
}

function computed(locator: ElementLocator, property: string): string {
  return getComputedStyle(locator.element()).getPropertyValue(property).trim()
}

function expectRecipeState(locator: ElementLocator, prefix: string): void {
  expect(computed(locator, "background-color")).toBe(
    resolvedProperty("background-color", `${prefix}-background`)
  )
  expect(computed(locator, "color")).toBe(
    resolvedProperty("color", `${prefix}-foreground`)
  )
  expect(computed(locator, "border-color")).toBe(
    resolvedProperty("border-color", `${prefix}-border`)
  )
  expect(computed(locator, "box-shadow")).toBe(
    resolvedProperty("box-shadow", `${prefix}-shadow`)
  )
  expect(computed(locator, "opacity")).toBe(
    resolvedProperty("opacity", `${prefix}-opacity`)
  )
}

function setTheme(theme: ThemeName): void {
  document.documentElement.classList.remove("light", "dark", "pitch-black")
  document.documentElement.classList.add(theme)
}

beforeEach(async () => {
  container = document.createElement("div")
  container.id = "visual-root"
  document.body.replaceChildren(container)
  document.body.style.margin = "0"

  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
  document.head.append(style)

  root = createRoot(container)
  root.render(<ComponentRecipeContract />)
  await document.fonts.ready
  await expect.element(page.getByTestId("recipe-contract")).toBeVisible()
})

afterEach(() => {
  root.unmount()
  document.documentElement.classList.remove("light", "dark", "pitch-black")
})

describe.each(themes)("%s recipe contract", (theme) => {
  it("resolves canonical geometry, typography, chrome, and real states", async () => {
    setTheme(theme)
    const viewportName = window.innerWidth >= 1000 ? "desktop" : "mobile"

    const buttonSizes = [
      ["recipe-button-small", 32, 12, 4, 12],
      ["recipe-button-default", 36, 12, 6, 14],
      ["recipe-button-large", 40, 16, 6, 14],
    ] as const
    for (const [testId, height, paddingInline, gap, fontSize] of buttonSizes) {
      const locator = page.getByTestId(testId)
      const button = getComputedStyle(locator.element())
      expect(pixels(button.height)).toBe(height)
      expect(pixels(button.paddingInlineStart)).toBe(paddingInline)
      expect(pixels(button.columnGap)).toBe(gap)
      expect(pixels(button.borderRadius)).toBe(9999)
      expect(pixels(button.fontSize)).toBe(fontSize)
      expect(button.fontFamily).toBe(
        resolvedProperty("font-family", `--exui-component-button-${testId.replace("recipe-button-", "")}-font-family`)
      )
      expect(button.fontWeight).toBe("500")
      const icon = locator.element().querySelector("svg")!
      expect(pixels(getComputedStyle(icon).width)).toBe(16)
    }

    const iconButton = page.getByTestId("recipe-button-icon")
    expect(pixels(computed(iconButton, "width"))).toBe(36)
    expect(pixels(computed(iconButton, "height"))).toBe(36)
    expect(pixels(computed(iconButton, "padding-inline-start"))).toBe(0)
    expect(pixels(computed(iconButton, "column-gap"))).toBe(0)
    expect(pixels(computed(iconButton, "border-radius"))).toBe(9999)
    expect(pixels(getComputedStyle(iconButton.element().querySelector("svg")!).width)).toBe(16)

    const primaryLocator = page.getByTestId("recipe-primary")
    const button = getComputedStyle(primaryLocator.element())
    expect(pixels(button.height)).toBe(36)
    expect(pixels(button.paddingInlineStart)).toBe(12)
    expect(pixels(button.columnGap)).toBe(6)
    expect(pixels(button.borderRadius)).toBe(9999)
    expect(button.fontFamily).toContain("Outfit Variable")
    expectRecipeState(primaryLocator, "--exui-component-button-primary-default")
    await primaryLocator.hover()
    expectRecipeState(primaryLocator, "--exui-component-button-primary-hover")
    expectRecipeState(
      page.getByTestId("recipe-button-disabled"),
      "--exui-component-button-primary-disabled"
    )

    const inputLocator = page.getByTestId("recipe-input-default")
    const input = getComputedStyle(inputLocator.element())
    expect(pixels(input.height)).toBe(36)
    expect(pixels(input.paddingInlineStart)).toBe(12)
    expect(pixels(input.paddingBlockStart)).toBe(4)
    expect(pixels(input.borderRadius)).toBe(14)
    expect(input.backgroundColor).toBe(
      resolvedProperty("background-color", "--exui-component-form-control-base-background")
    )
    expect(input.color).toBe(
      resolvedProperty("color", "--exui-component-form-control-base-foreground")
    )
    expect(input.borderColor).toBe(
      resolvedProperty("border-color", "--exui-component-form-control-base-border")
    )
    expect(input.boxShadow).toBe(
      resolvedProperty("box-shadow", "--exui-component-form-control-base-shadow")
    )
    expect(pixels(input.fontSize)).toBe(14)
    expect(pixels(input.lineHeight)).toBe(20)
    expect(input.fontWeight).toBe("400")
    expectRecipeState(
      page.getByTestId("recipe-input-invalid"),
      "--exui-component-form-control-invalid"
    )
    expectRecipeState(
      page.getByTestId("recipe-input-disabled"),
      "--exui-component-form-control-disabled"
    )

    const sidebarLocator = page.getByTestId("recipe-sidebar-default")
    const sidebar = getComputedStyle(sidebarLocator.element())
    expect(pixels(sidebar.minHeight)).toBe(32)
    expect(pixels(sidebar.paddingInlineStart)).toBe(12)
    expect(pixels(sidebar.columnGap)).toBe(8)
    expect(pixels(sidebar.borderRadius)).toBe(14)
    expect(pixels(sidebar.fontSize)).toBe(14)
    expect(sidebar.fontWeight).toBe("400")
    expectRecipeState(sidebarLocator, "--exui-component-sidebar-item-default")
    await sidebarLocator.hover()
    expectRecipeState(sidebarLocator, "--exui-component-sidebar-item-hover")
    expectRecipeState(
      page.getByTestId("recipe-sidebar-active"),
      "--exui-component-sidebar-item-active"
    )
    expectRecipeState(
      page.getByTestId("recipe-sidebar-disabled"),
      "--exui-component-sidebar-item-disabled"
    )
    const nested = getComputedStyle(page.getByTestId("recipe-sidebar-nested").element())
    expect(pixels(nested.minHeight)).toBe(32)
    expect(pixels(nested.paddingInlineStart)).toBe(12)
    expect(pixels(nested.fontSize)).toBe(12)
    const iconOnly = page.getByTestId("recipe-sidebar-icon-only")
    expect(pixels(computed(iconOnly, "width"))).toBe(32)
    expect(pixels(computed(iconOnly, "height"))).toBe(32)
    expect(pixels(computed(iconOnly, "padding-inline-start"))).toBe(8)
    expect(pixels(computed(iconOnly, "padding-block-start"))).toBe(8)
    expect(pixels(computed(iconOnly, "column-gap"))).toBe(0)
    expect(pixels(computed(iconOnly, "border-radius"))).toBe(14)
    expect(pixels(computed(iconOnly, "font-size"))).toBe(14)
    expect(computed(iconOnly, "font-weight")).toBe("400")
    expect(pixels(getComputedStyle(iconOnly.element().querySelector("svg")!).width)).toBe(16)

    const menu = getComputedStyle(page.getByTestId("recipe-menu-surface").element())
    expect(pixels(menu.paddingTop)).toBe(6)
    expect(pixels(menu.borderRadius)).toBe(22)
    expect(menu.backgroundColor).toBe(colorFromVariable("--exui-component-menu-surface-background"))
    expect(menu.color).toBe(colorFromVariable("--exui-component-menu-surface-foreground"))
    expect(menu.borderColor).toBe(colorFromVariable("--exui-component-menu-surface-border"))
    expect(menu.boxShadow).toBe(resolvedProperty("box-shadow", "--exui-component-menu-surface-shadow"))

    const dialog = getComputedStyle(page.getByTestId("recipe-dialog-surface").element())
    expect(pixels(dialog.paddingTop)).toBe(24)
    expect(pixels(dialog.rowGap)).toBe(24)
    expect(pixels(dialog.borderRadius)).toBe(26)
    expect(dialog.backgroundColor).toBe(colorFromVariable("--exui-component-dialog-surface-background"))
    expect(dialog.color).toBe(colorFromVariable("--exui-component-dialog-surface-foreground"))
    expect(dialog.borderColor).toBe(colorFromVariable("--exui-component-dialog-surface-border"))
    expect(dialog.boxShadow).toBe(resolvedProperty("box-shadow", "--exui-component-dialog-surface-shadow"))

    const tabsList = getComputedStyle(page.getByTestId("recipe-tabs-default-list").element())
    expect(pixels(tabsList.height)).toBe(36)
    expect(pixels(tabsList.paddingTop)).toBe(4)
    expect(pixels(tabsList.columnGap)).toBe(4)
    expect(pixels(tabsList.borderRadius)).toBe(14)
    expect(tabsList.backgroundColor).toBe(colorFromVariable("--exui-component-tabs-default-list-background"))
    expect(tabsList.color).toBe(colorFromVariable("--exui-component-tabs-list-foreground"))
    expectRecipeState(
      page.getByTestId("recipe-tab-default-overview"),
      "--exui-component-tabs-trigger-selected"
    )

    const focusedInput = page.getByTestId("recipe-input-focus")
    await focusedInput.click()
    expectRecipeState(focusedInput, "--exui-component-form-control-focus")

    await expect.element(page.getByTestId("recipe-contract")).toMatchScreenshot(`recipe-contract-${theme}-${viewportName}`)
  })

  it("enters menu, tabs, and dialog states through real interaction", async () => {
    setTheme(theme)
    const viewportName = window.innerWidth >= 1000 ? "desktop" : "mobile"

    await page.getByTestId("recipe-tab-line-details").click()
    await expect.element(page.getByTestId("recipe-tab-line-details")).toHaveAttribute("aria-selected", "true")
    const lineList = page.getByTestId("recipe-tabs-line-list")
    expect(computed(lineList, "background-color")).toBe(
      resolvedProperty("background-color", "--exui-component-tabs-line-list-background")
    )
    const lineTrigger = page.getByTestId("recipe-tab-line-details")
    expect(computed(lineTrigger, "background-color")).toBe(
      resolvedProperty("background-color", "--exui-component-tabs-line-trigger-selected-background")
    )
    expect(computed(lineTrigger, "color")).toBe(
      resolvedProperty("color", "--exui-component-tabs-trigger-selected-foreground")
    )
    const indicator = getComputedStyle(lineTrigger.element(), "::after")
    expect(pixels(indicator.height)).toBe(2)
    expect(indicator.opacity).toBe("1")
    expect(indicator.backgroundColor).toBe(
      colorFromVariable("--exui-component-tabs-indicator-background")
    )
    await expect.element(page.getByTestId("recipe-tabs")).toMatchScreenshot(`recipe-tabs-${theme}-${viewportName}`)

    await page.getByRole("button", { name: "Test real menu" }).click()
    const menu = page.getByTestId("recipe-menu-content")
    await expect.element(menu).toBeVisible()
    expect(pixels(computed(menu, "padding-top"))).toBe(6)
    expect(pixels(computed(menu, "border-radius"))).toBe(22)
    expect(computed(menu, "background-color")).toBe(
      colorFromVariable("--exui-component-menu-surface-background")
    )
    expect(computed(menu, "border-color")).toBe(
      colorFromVariable("--exui-component-menu-surface-border")
    )
    expect(computed(menu, "box-shadow")).toBe(
      resolvedProperty("box-shadow", "--exui-component-menu-surface-shadow")
    )
    const standardItem = page.getByTestId("recipe-menu-item")
    expect(pixels(computed(standardItem, "padding-inline-start"))).toBe(12)
    expect(pixels(computed(standardItem, "padding-block-start"))).toBe(8)
    expect(pixels(computed(standardItem, "column-gap"))).toBe(10)
    expect(pixels(computed(standardItem, "border-radius"))).toBe(14)
    expect(pixels(computed(standardItem, "font-size"))).toBe(14)
    expect(computed(standardItem, "font-weight")).toBe("500")
    await userEvent.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(standardItem.element())
    await expect.element(standardItem).toHaveAttribute("data-highlighted", "")
    expectRecipeState(standardItem, "--exui-component-menu-item-focus")
    const checkedItem = page.getByTestId("recipe-menu-checked")
    expect(computed(checkedItem, "background-color")).toBe(
      colorFromVariable("--exui-component-menu-checked-item-background")
    )
    expect(computed(checkedItem, "color")).toBe(
      colorFromVariable("--exui-component-menu-checked-item-foreground")
    )
    expect(computed(page.getByTestId("recipe-menu-destructive"), "color")).toBe(
      colorFromVariable("--exui-component-menu-item-destructive-foreground")
    )
    expectRecipeState(
      page.getByTestId("recipe-menu-disabled"),
      "--exui-component-menu-item-disabled"
    )
    await expect.element(menu).toMatchScreenshot(`recipe-menu-${theme}-${viewportName}`)
    await userEvent.keyboard("{Escape}")

    await page.getByTestId("recipe-select-trigger").click()
    const selectContent = page.getByTestId("recipe-select-content")
    await expect.element(selectContent).toBeVisible()
    await userEvent.keyboard("{ArrowDown}")
    const selectItem = page.getByTestId("recipe-select-second")
    expect(document.activeElement).toBe(selectItem.element())
    await expect.element(selectItem).toHaveAttribute("data-highlighted", "")
    expectRecipeState(selectItem, "--exui-component-menu-item-focus")
    await userEvent.keyboard("{Escape}")

    await page.getByTestId("recipe-dialog-trigger").click()
    const dialog = page.getByTestId("recipe-dialog-content")
    await expect.element(dialog).toBeVisible()
    const dialogStyle = getComputedStyle(dialog.element())
    expect(pixels(dialogStyle.paddingTop)).toBe(24)
    expect(pixels(dialogStyle.rowGap)).toBe(24)
    expect(pixels(dialogStyle.borderRadius)).toBe(26)
    expect(dialogStyle.backgroundColor).toBe(colorFromVariable("--exui-component-dialog-surface-background"))
    expect(dialogStyle.color).toBe(colorFromVariable("--exui-component-dialog-surface-foreground"))
    expect(dialogStyle.borderColor).toBe(colorFromVariable("--exui-component-dialog-surface-border"))
    expect(dialogStyle.boxShadow).toBe(resolvedProperty("box-shadow", "--exui-component-dialog-surface-shadow"))
    const overlay = document.querySelector<HTMLElement>("[data-slot='dialog-overlay']")!
    expect(getComputedStyle(overlay).backgroundColor).toBe(
      colorFromVariable("--exui-component-dialog-overlay-background")
    )
    const title = getComputedStyle(page.getByTestId("recipe-dialog-title").element())
    const header = getComputedStyle(page.getByTestId("recipe-dialog-title").element().parentElement!)
    expect(pixels(header.rowGap)).toBe(6)
    expect(title.fontFamily).toBe(resolvedProperty("font-family", "--exui-component-dialog-title-font-family"))
    expect(pixels(title.fontSize)).toBe(16)
    expect(title.fontWeight).toBe("500")
    expect(pixels(title.lineHeight)).toBe(20)
    expect(title.color).toBe(colorFromVariable("--exui-component-dialog-title-foreground"))
    const description = getComputedStyle(page.getByTestId("recipe-dialog-description").element())
    expect(pixels(description.fontSize)).toBe(14)
    expect(description.fontWeight).toBe("400")
    expect(pixels(description.lineHeight)).toBe(20)
    expect(description.color).toBe(colorFromVariable("--exui-component-dialog-description-foreground"))
    await expect.element(dialog).toMatchScreenshot(`recipe-dialog-${theme}-${viewportName}`)
  })
})
