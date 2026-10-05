import "@exre/exui/style.css"
import "./Showcase.css"

import { createRoot } from "react-dom/client"
import { page } from "vitest/browser"
import { expect, it } from "vitest"
import { FormExamples } from "./FormExamples"

it("lets Showcase visitors change shared sizing and preview narrow rows without losing drafts", async () => {
  const host = document.createElement("div")
  host.style.width = "48rem"
  document.body.replaceChildren(host)
  const root = createRoot(host)
  try {
    root.render(<FormExamples />)
    const input = page.getByRole("textbox", { name: "Inherited content", exact: true })
    const override = page.getByRole("textbox", { name: "Local override", exact: true })
    await expect.element(input).toBeVisible()
    await input.fill("Preserved draft")
    await page.getByRole("button", { name: "12rem", exact: true }).click()
    await expect.poll(() => input.element().getBoundingClientRect().width).toBeCloseTo(192, 0)
    const rightAlignedLeft = input.element().getBoundingClientRect().left
    await page.getByRole("button", { name: "Align content left", exact: true }).click()
    await expect.poll(() => input.element().getBoundingClientRect().left).toBeLessThan(rightAlignedLeft - 20)
    expect(override.element().getBoundingClientRect().width).toBeCloseTo(160, 0)
    expect(page.getByRole("textbox", { name: "Configured content", exact: true }).element().getBoundingClientRect().width).toBeCloseTo(192, 0)
    await page.getByRole("button", { name: "Narrow preview", exact: true }).click()
    await expect.poll(() => input.element().getBoundingClientRect().width).toBeCloseTo(320, 0)
    expect(override.element().getBoundingClientRect().width).toBeCloseTo(320, 0)
    await expect.element(input).toHaveValue("Preserved draft")
  } finally {
    root.unmount()
  }
})
