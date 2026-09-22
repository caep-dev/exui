import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import Showcase from "./Showcase"

let container: HTMLDivElement
let root: Root

beforeEach(async () => {
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
  window.history.replaceState(null, "", "#overview")
})

describe("Showcase catalog", () => {
  it("reports the full catalogue entry count from the rendered inventory", async () => {
    await expect.element(page.getByTestId("catalog-result-count")).toHaveTextContent(
      "66 catalogue entries"
    )
  })

  it("keeps the summary metrics in a three-column group", () => {
    const metrics = page.getByTestId("catalog-summary-metrics").element()
    expect(getComputedStyle(metrics).gridTemplateColumns.split(" ")).toHaveLength(3)
  })

  it("switches to a semantic category and keeps it in the URL", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()

    await expect.element(page.getByTestId("catalog-section-title")).toHaveTextContent(
      "Form controls"
    )
    expect(window.location.hash).toBe("#form-controls")
    await expect.element(page.getByText("Input", { exact: true })).toBeVisible()
  })

  it("filters the full public inventory by component name", async () => {
    const search = page.getByTestId(
      window.innerWidth < 640 ? "catalog-search-mobile" : "catalog-search-desktop"
    )
    await search.fill("Dialog")

    await expect.element(page.getByText("Dialog", { exact: true })).toBeVisible()
    await expect.element(page.getByText("Button", { exact: true })).not.toBeInTheDocument()
  })
})
