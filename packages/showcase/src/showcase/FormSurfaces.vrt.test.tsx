import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, expect, it } from "vitest"
import { z } from "zod"
import { ExForm } from "@exre/exui"

const schema = z.object({
  text: z.string(), search: z.array(z.string()), date: z.string(),
  files: z.array(z.custom<File>()),
})
let root: Root

beforeEach(() => {
  const host = document.createElement("div")
  document.body.replaceChildren(host)
  root = createRoot(host)
})
afterEach(() => root.unmount())

it("uses the same idle field background across form controls", async () => {
  root.render(<ExForm schema={schema} defaultValues={{ text: "", search: [], date: "", files: [] }}
    fields={[
      { name: "text", label: "Plain", control: "text" },
      { name: "search", label: "Search", control: "multi-select", controlProps: { options: [{ value: "one", label: "One" }] } },
      { name: "date", label: "Date", control: "date" },
      { name: "files", label: "Files", control: "files" },
    ]} onSubmit={() => {}} />)
  await expect.element(page.getByRole("textbox", { name: "Plain" })).toBeVisible()

  const field = (label: string) => [...document.querySelectorAll<HTMLElement>('[data-slot="field"]')]
    .find((item) => item.querySelector('[data-slot="field-label"]')?.textContent === label)!
  const background = (element: Element) => getComputedStyle(element).backgroundColor
  const colors = {
    plain: background(field("Plain").querySelector('[data-slot="input"]')!),
    search: background(field("Search").querySelector('.ex-form-multiselect')!),
    date: background(field("Date").querySelector('.ex-form-date-trigger')!),
    files: background(field("Files").querySelector('.ex-form-files button')!),
  }
  expect(new Set(Object.values(colors)).size, JSON.stringify(colors)).toBe(1)
})
