import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import Showcase from "./Showcase"

let container: HTMLDivElement
let root: Root
let originalLanguage: string

beforeEach(async () => {
  originalLanguage = document.documentElement.lang
  window.localStorage.removeItem("exui-showcase-language")
  window.history.replaceState(null, "", "#overview")
  container = document.createElement("div")
  document.body.replaceChildren(container)
  root = createRoot(container)
  root.render(<Showcase />)
  await document.fonts.ready
  await expect.element(page.getByTestId("catalog-heading")).toBeVisible()
})

afterEach(() => {
  root.unmount()
  document.documentElement.lang = originalLanguage
  window.localStorage.removeItem("exui-showcase-language")
  window.history.replaceState(null, "", "#overview")
})

describe("Showcase language", () => {
  it("switches the catalog and page language without losing the active category", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    await page.getByRole("button", { name: "Switch to Chinese" }).click()

    await expect.element(page.getByTestId("catalog-section-title")).toHaveTextContent("表单控件")
    expect(window.location.hash).toBe("#form-controls")
    expect(document.documentElement.lang).toBe("zh-CN")
  })

  it("finds catalog entries by Chinese description and by component name", async () => {
    await page.getByRole("button", { name: "Switch to Chinese" }).click()
    const search = page.getByTestId(
      window.innerWidth < 640 ? "catalog-search-mobile" : "catalog-search-desktop"
    )
    await search.fill("单行文本")
    await expect.element(page.getByText("Input", { exact: true })).toBeVisible()
    await expect.element(page.getByText("Button", { exact: true })).not.toBeInTheDocument()

    await search.fill("Dialog")
    await expect.element(page.getByText("Dialog", { exact: true })).toBeVisible()
  })

  it("remembers a manual language choice across mounts", async () => {
    await page.getByRole("button", { name: "Switch to Chinese" }).click()
    root.unmount()
    root = createRoot(container)
    root.render(<Showcase />)

    await expect.element(page.getByTestId("catalog-heading")).toHaveTextContent("组件目录")
    expect(document.documentElement.lang).toBe("zh-CN")
  })

  it("shows English step controls and validation messages in the form preview", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    await page.getByRole("button", { name: "Open application" }).click()
    await page.getByRole("button", { name: "Next", exact: true }).click()

    await expect.element(page.getByText("Please enter a valid email.", { exact: true })).toBeVisible()
    await expect.element(page.getByText("Please check the following issues", { exact: true })).toBeVisible()
  })

  it("localizes the accessible close control in a Chinese dialog", async () => {
    await page.getByRole("button", { name: "Switch to Chinese" }).click()
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "浏览分类" }).click()
    }
    await page.getByTestId("catalog-category-overlays").click()
    await page.getByRole("button", { name: "打开对话框" }).click()

    await expect.element(page.getByRole("button", { name: "关闭" })).toBeVisible()
  })

  it("uses English file actions in the English form preview", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const selected = new DataTransfer()
    selected.items.add(new File(["hi"], "note.txt", { type: "text/plain" }))
    input.files = selected.files
    input.dispatchEvent(new Event("change", { bubbles: true }))

    await expect.element(page.getByRole("button", { name: "Remove note.txt" })).toBeVisible()
  })

  it("keeps an unfinished form draft when switching language", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Ada")
    await page.getByRole("button", { name: "Switch to Chinese" }).click()

    await expect.element(page.getByRole("textbox", { name: "姓名", exact: true })).toHaveValue("Ada")
  })

  it("updates an existing validation error when the language changes", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    await page.getByRole("button", { name: "Save profile" }).click()
    await expect.element(page.getByText("Please enter your name.", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Switch to Chinese" }).click()
    await expect.element(page.getByText("请输入姓名。", { exact: true })).toBeVisible()
    await expect.element(page.getByText("请检查以下问题", { exact: true })).toBeVisible()
  })

  it("uses the browser language before any manual choice", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "language")
    root.unmount()
    Object.defineProperty(navigator, "language", { configurable: true, value: "zh-CN" })
    try {
      root = createRoot(container)
      root.render(<Showcase />)
      await expect.element(page.getByTestId("catalog-heading")).toHaveTextContent("组件目录")
    } finally {
      if (original) Object.defineProperty(navigator, "language", original)
      else Reflect.deleteProperty(navigator, "language")
    }
  })

  it("keeps Chinese catalog and form content within the viewport", async () => {
    await page.getByRole("button", { name: "Switch to Chinese" }).click()
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)

    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "浏览分类" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
  })
})
