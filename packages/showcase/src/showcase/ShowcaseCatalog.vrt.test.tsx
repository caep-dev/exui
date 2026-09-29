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
      "71 catalogue entries"
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

  it("shows every built-in form input and submits the date draft", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-form-controls").click()

    const gallery = page.getByText("Every built-in input type").element().closest("article")!
    expect(gallery.querySelectorAll(".ex-form-item")).toHaveLength(14)
    expect(gallery.querySelector('input[type="date"]')).toBeNull()
    expect(gallery.querySelector('input[type="password"]')).not.toBeNull()
    expect(gallery.querySelector('input[type="file"]')).not.toBeNull()
    await expect.element(page.getByRole("button", { name: "Birth date" })).toBeVisible()

    await page.getByRole("button", { name: "Date", exact: true }).click()
    await page.getByRole("button", { name: /February 12th, 1995/ }).click()
    await page.getByRole("button", { name: "Show values" }).click()
    await expect.element(page.getByText(/"date": "1995-02-12"/)).toBeVisible()
  })

  it("filters the full public inventory by component name", async () => {
    const search = page.getByTestId(
      window.innerWidth < 640 ? "catalog-search-mobile" : "catalog-search-desktop"
    )
    await search.fill("Dialog")

    await expect.element(page.getByText("Dialog", { exact: true })).toBeVisible()
    await expect.element(page.getByText("Button", { exact: true })).not.toBeInTheDocument()
  })

  it("shows the managed notification demo in Feedback", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-feedback").click()

    await expect.element(page.getByTestId("ex-message-demo")).toBeVisible()
    await page.getByRole("button", { name: "Show success message" }).click()
    await expect.element(page.getByText("Changes saved", { exact: true })).toBeVisible()
  })

  it("completes and dismisses a loading notification from the demo", async () => {
    if (window.innerWidth < 640) {
      await page.getByRole("button", { name: "Browse categories" }).click()
    }
    await page.getByTestId("catalog-category-feedback").click()

    await page.getByRole("button", { name: "Start loading message" }).click()
    await expect.element(page.getByText("Saving changes", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Complete loading message" }).click()
    await expect.element(page.getByText("Changes saved", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Start loading message" }).click()
    await page.getByRole("button", { name: "Dismiss loading message" }).click()
    await expect.element(page.getByText("Saving changes", { exact: true })).not.toBeInTheDocument()
  })
})
