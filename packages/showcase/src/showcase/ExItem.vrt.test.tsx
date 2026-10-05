import "@exre/exui/style.css"

import { act, createRef } from "react"
import { createRoot, hydrateRoot, type Root } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { ExForm, ExItem, Form, FormItem, Input, useForm } from "@exre/exui"

const schema = z.object({ name: z.string().min(1), note: z.string() })
let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement("div")
  document.body.replaceChildren(host)
  root = createRoot(host)
})
afterEach(() => root.unmount())

describe("ExItem public presentation contract", () => {
  it("caps and aligns horizontal content, then fills the width after wrapping", async () => {
    host.style.width = "48rem"
    root.render(<ExItem title="Sized" layout="horizontal" contentMaxWidth="16rem" contentAlign="right"><Input /></ExItem>)
    const input = page.getByRole("textbox", { name: "Sized" })
    await expect.element(input).toBeVisible()
    const rect = () => input.element().getBoundingClientRect()
    const item = host.querySelector<HTMLElement>(".ex-item")!
    expect(rect().width).toBeCloseTo(256, 0)
    expect(rect().right).toBeCloseTo(item.getBoundingClientRect().right, 0)
    host.style.width = "22rem"
    expect(rect().width).toBeCloseTo(196, 0)
    host.style.width = "20rem"
    expect(rect().width).toBeCloseTo(320, 0)
    expect(rect().left).toBeCloseTo(item.getBoundingClientRect().left, 0)
    host.style.width = "10rem"
    expect(rect().width).toBeCloseTo(160, 0)
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1)
  })

  it("inherits Form content defaults and allows independent item overrides", async () => {
    function ComposedSizing() {
      const form = useForm({ schema, defaultValues: { name: "", note: "" } })
      return <Form form={form} onSubmit={() => {}} layout="horizontal" contentMaxWidth={256} contentAlign="right">
        <ExItem title="Inherited"><Input /></ExItem>
        <FormItem form={form} name="name" label="Left" control="text" contentAlign="left" />
        <FormItem form={form} name="note" label="Narrow" control="text" contentMaxWidth="8rem" />
      </Form>
    }
    host.style.width = "48rem"
    root.render(<ComposedSizing />)
    await expect.element(page.getByRole("textbox", { name: "Narrow" })).toBeVisible()
    const rect = (name: string) => page.getByRole("textbox", { name, exact: true }).element().getBoundingClientRect()
    expect(rect("Inherited").width).toBeCloseTo(256, 0)
    expect(rect("Left").width).toBeCloseTo(256, 0)
    expect(rect("Left").left).toBeCloseTo(host.getBoundingClientRect().left + 156, 0)
    expect(rect("Narrow").width).toBeCloseTo(128, 0)
    expect(rect("Narrow").right).toBeCloseTo(rect("Inherited").right, 0)
  })

  it("supports ExForm defaults, field overrides, and unconstrained vertical content", async () => {
    host.style.width = "48rem"
    root.render(<ExForm schema={schema} defaultValues={{ name: "", note: "" }} layout="horizontal"
      contentMaxWidth="16rem" contentAlign="right" fields={[
        { name: "name", label: "Configured", control: "text", contentMaxWidth: "8rem", contentAlign: "left" },
        { name: "note", label: "Vertical", control: "text", layout: "vertical" },
      ]} onSubmit={() => {}}><ExItem title="Default"><Input /></ExItem></ExForm>)
    await expect.element(page.getByRole("textbox", { name: "Configured" })).toBeVisible()
    expect(page.getByRole("textbox", { name: "Configured" }).element().getBoundingClientRect().width).toBeCloseTo(128, 0)
    expect(page.getByRole("textbox", { name: "Default" }).element().getBoundingClientRect().width).toBeCloseTo(256, 0)
    expect(page.getByRole("textbox", { name: "Vertical" }).element().getBoundingClientRect().width).toBeCloseTo(768, 0)
  })

  it("can remove an inherited limit and keeps errors within the aligned content", async () => {
    host.style.width = "48rem"
    root.render(<ExForm schema={schema} defaultValues={{ name: "", note: "" }} layout="horizontal"
      contentMaxWidth="16rem" contentAlign="right" fields={[
        { name: "name", label: "Required", control: "text" },
        { name: "note", label: "Full", control: "text", contentMaxWidth: "none" },
      ]} onSubmit={() => {}} />)
    const input = page.getByRole("textbox", { name: "Required" })
    await expect.element(input).toBeVisible()
    expect(page.getByRole("textbox", { name: "Full" }).element().getBoundingClientRect().width).toBeCloseTo(612, 0)
    await page.getByRole("button", { name: "提交" }).click()
    await expect.element(input).toHaveAttribute("aria-invalid", "true")
    const error = document.getElementById(`${input.element().id}-error`)!
    expect(error.getBoundingClientRect().left).toBeCloseTo(input.element().getBoundingClientRect().left, 0)
    expect(error.getBoundingClientRect().width).toBeCloseTo(256, 0)
    expect(host.querySelector("[contentmaxwidth], [contentalign]")).toBeNull()
  })

  it("labels a single direct Input and appends its description without replacing existing references", async () => {
    root.render(<ExItem title="Nickname" desc="Visible to others"><Input aria-describedby="existing-help" /></ExItem>)
    const input = page.getByRole("textbox", { name: "Nickname" })
    await expect.element(input).toBeVisible()
    const element = input.element() as HTMLInputElement
    const id = element.id
    expect(id).not.toBe("")
    expect(element.getAttribute("aria-describedby")).toBe(`existing-help ${id}-description`)
    expect(document.getElementById(`${id}-description`)?.textContent).toBe("Visible to others")
    await page.getByText("Nickname").click()
    expect(document.activeElement).toBe(element)
  })

  it("preserves the direct Input value, change handler, and ref while adding its id", async () => {
    const onChange = vi.fn()
    const ref = createRef<HTMLInputElement>()
    root.render(<ExItem title="Handle"><Input defaultValue="first" onChange={onChange} ref={ref} /></ExItem>)
    const input = page.getByRole("textbox", { name: "Handle" })
    await expect.element(input).toHaveValue("first")
    expect(ref.current).toBe(input.element())
    await input.fill("second")
    expect(ref.current?.value).toBe("second")
    expect(onChange).toHaveBeenCalled()
  })

  it("keeps an explicit Input id, deduplicates description ids, and rejects conflicting ids", async () => {
    root.render(<ExItem title="Email" desc="Help" controlId="email">
      <Input id="email" aria-describedby="other email-description other" />
    </ExItem>)
    await expect.element(page.getByRole("textbox", { name: "Email" })).toBeVisible()
    expect(document.getElementById("email")?.getAttribute("aria-describedby")).toBe("other email-description")
    expect(() => renderToString(<ExItem title="Wrong" controlId="one"><Input id="two" /></ExItem>))
      .toThrow(/ExUI ExItem: controlId must match/)
  })

  it("requires explicit association for wrapped, custom, and multiple controls", async () => {
    root.render(<>
      <ExItem title="Wrapped"><span><Input /></span></ExItem>
      <ExItem title="Custom" desc="Custom help" controlId="custom"><input id="custom" aria-describedby="custom-description" /></ExItem>
      <ExItem title="Multiple"><Input /><Input /></ExItem>
    </>)
    await expect.element(page.getByRole("textbox", { name: "Custom" })).toBeVisible()
    expect(host.querySelector(".ex-item:first-child label")).toBeNull()
    expect(host.querySelector(".ex-item:first-child input")?.id).toBe("")
    expect(host.querySelectorAll(".ex-item:last-child input")).toHaveLength(2)
    await page.getByText("Custom", { exact: true }).click()
    expect(document.activeElement).toBe(document.getElementById("custom"))
  })

  it("retains the generated Input id through server rendering and hydration", async () => {
    const element = <ExItem title="Hydrated" desc="Stable"><Input /></ExItem>
    root.unmount()
    host.innerHTML = renderToString(element)
    const before = host.querySelector("input")?.id
    expect(before).toBeTruthy()
    const hydrated = hydrateRoot(host, element)
    await act(async () => {})
    expect(host.querySelector("input")?.id).toBe(before)
    expect(host.querySelector("label")?.htmlFor).toBe(before)
    expect(host.querySelector("input")?.getAttribute("aria-describedby")).toBe(`${before}-description`)
    hydrated.unmount()
    root = createRoot(host)
  })

  it("wraps by its own width and keeps the control inside very narrow containers", async () => {
    host.style.width = "22rem"
    root.render(<ExItem title="A long title that can wrap" desc="A long description that can wrap" layout="horizontal">
      <Input />
    </ExItem>)
    await expect.element(page.getByRole("textbox", { name: /A long title/ })).toBeVisible()
    const item = host.querySelector<HTMLElement>(".ex-item")!
    const heading = item.querySelector<HTMLElement>(".ex-item-heading")!
    const content = item.querySelector<HTMLElement>(".ex-item-content")!
    expect(Math.abs(heading.getBoundingClientRect().top - content.getBoundingClientRect().top)).toBeLessThan(2)
    host.style.width = "20rem"
    expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(heading.getBoundingClientRect().bottom - 2)
    host.style.width = "10rem"
    expect(content.getBoundingClientRect().right).toBeLessThanOrEqual(item.getBoundingClientRect().right + 1)
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1)
  })

  it("declares its span and retains root div attributes in an independent grid", async () => {
    root.render(<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      <ExItem title="Grid input" span={2} className="consumer-item" style={{ marginTop: "4px" }} data-testid="grid-item">
        <Input />
      </ExItem>
    </div>)
    await expect.element(page.getByRole("textbox", { name: "Grid input" })).toBeVisible()
    const item = page.getByTestId("grid-item").element() as HTMLElement
    expect(item.classList.contains("consumer-item")).toBe(true)
    expect(item.style.marginTop).toBe("4px")
    expect(getComputedStyle(item).gridColumnStart).toBe("span 2")
  })

  it("inherits the form layout, accepts field overrides, and keeps inline items wrapping", async () => {
    function Composed() {
      const form = useForm({ schema, defaultValues: { name: "", note: "" } })
      return <Form form={form} onSubmit={() => {}} layout="inline" columns={{ base: 2 }}>
        <ExItem title="Static"><Input /></ExItem>
        <FormItem form={form} name="name" label="Name" control="text" />
        <FormItem form={form} name="note" label="Note" control="text" layout="vertical" colSpan={2} />
      </Form>
    }
    host.style.width = "20rem"
    root.render(<Composed />)
    await expect.element(page.getByRole("textbox", { name: "Name" })).toBeVisible()
    const items = [...host.querySelectorAll<HTMLElement>(".ex-item")]
    expect(items.map((item) => item.dataset.itemLayout)).toEqual(["horizontal", "horizontal", "vertical"])
    expect(items[2]?.dataset.span).toBe("2")
    expect(items[1]!.getBoundingClientRect().top).toBeGreaterThan(items[0]!.getBoundingClientRect().top)
  })

  it("wraps a narrow field in a wide multi-column form and clamps its span", async () => {
    function Columns() {
      const form = useForm({ schema, defaultValues: { name: "", note: "" } })
      return <Form form={form} onSubmit={() => {}} layout="horizontal" columns={{ base: 2 }}>
        <FormItem form={form} name="name" label="Name" control="text" />
        <FormItem form={form} name="note" label="Note" control="text" colSpan={4} />
      </Form>
    }
    host.style.width = "36rem"
    root.render(<Columns />)
    await expect.element(page.getByRole("textbox", { name: "Name" })).toBeVisible()
    const items = [...host.querySelectorAll<HTMLElement>(".ex-item")]
    const heading = items[0]!.querySelector<HTMLElement>(".ex-item-heading")!
    const content = items[0]!.querySelector<HTMLElement>(".ex-item-content")!
    expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(heading.getBoundingClientRect().bottom - 2)
    expect(items[1]?.dataset.span).toBe("4")
    expect(getComputedStyle(items[1]!).gridColumnStart).toBe("span 2")
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1)
  })

  it("uses the configured field override inside ExForm and preserves noStyle", async () => {
    root.render(<ExForm schema={schema} defaultValues={{ name: "", note: "" }} layout="horizontal"
      fields={[
        { name: "name", label: "Name", control: "text", layout: "vertical" },
        { name: "note", label: "Note", control: "text", noStyle: true, colSpan: 2 },
      ]} onSubmit={() => {}} />)
    await expect.element(page.getByRole("textbox", { name: "Name" })).toBeVisible()
    expect(host.querySelectorAll(".ex-item")).toHaveLength(1)
    expect(host.querySelector<HTMLElement>(".ex-item")?.dataset.itemLayout).toBe("vertical")
    expect(host.querySelector<HTMLInputElement>('input[name="note"]')).not.toBeNull()
    expect(host.querySelector('input[name="note"]')?.closest(".ex-item")).toBeNull()
  })

  it("keeps field description and validation error associations", async () => {
    root.render(<ExForm schema={schema} defaultValues={{ name: "", note: "" }}
      fields={[{ name: "name", label: "Name", description: "Public name", control: "text" }]}
      onSubmit={() => {}} />)
    const input = page.getByRole("textbox", { name: "Name" })
    await expect.element(input).toBeVisible()
    await page.getByRole("button", { name: "提交" }).click()
    await expect.element(page.getByText("Public name")).toBeVisible()
    const element = input.element() as HTMLInputElement
    await expect.poll(() => element.getAttribute("aria-invalid")).toBe("true")
    expect(element.getAttribute("aria-describedby")).toBe(`${element.id}-description ${element.id}-error`)
    expect(host.querySelector(".ex-item-heading")?.contains(document.getElementById(`${element.id}-description`))).toBe(true)
    expect(host.querySelector(".ex-item-content")?.contains(document.getElementById(`${element.id}-error`))).toBe(true)
    expect(getComputedStyle(host.querySelector<HTMLElement>(".ex-item-heading")!).color)
      .toBe(getComputedStyle(host).color)
  })

  it("does not leave a description reference for an empty field description", async () => {
    root.render(<ExForm schema={schema} defaultValues={{ name: "", note: "" }}
      fields={[{ name: "name", label: "Name", description: "", control: "text" }]}
      onSubmit={() => {}} />)
    const input = page.getByRole("textbox", { name: "Name" })
    await expect.element(input).toBeVisible()
    expect((input.element() as HTMLInputElement).getAttribute("aria-describedby")).toBeNull()
    expect(host.querySelector('[data-slot="field-description"]')).toBeNull()
  })
})
