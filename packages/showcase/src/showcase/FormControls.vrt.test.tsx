import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  Button, Dialog, DialogContent, DialogTitle, DialogTrigger,
  Form, FormItem, ExForm, useForm,
  type FormInstance, type StandardSchemaV1,
} from "@exre/exui"

type Values = { name: string; role: "member" | "admin"; accepted: boolean; tags: string[]; files: File[] }
const defaults: Values = { name: "Ada", role: "member", accepted: false, tags: [], files: [] }
function schemaFor(validate: (input: Values) => StandardSchemaV1.Result<Values>): StandardSchemaV1<Values, Values> {
  return { "~standard": { version: 1, vendor: "exui-control-test", validate: input => validate(input as Values) } }
}
const passSchema = schemaFor(value => ({ value }))
const fileSchema = schemaFor(value => {
  const message = value.files.length === 0 ? "Select at least one file" : value.files.length > 5 ? "At most five files" :
    value.files.some(file => file.size > 4) ? "File exceeds four bytes" : value.files.some(file => file.type !== "text/plain") ? "Only text files" : undefined
  return message ? { issues: [{ message, path: ["files"] }] } : { value }
})
let root: Root
let form: FormInstance<Values, Values>
let viewport: { width: number; height: number }

function Fixture({ schema = passSchema, disabled = false, mode = "onSubmit", onSubmit = () => {} }: {
  schema?: StandardSchemaV1<Values, Values>
  disabled?: boolean
  mode?: "onSubmit" | "onBlur" | "onChange"
  onSubmit?: (values: Values) => void
}) {
  form = useForm({ schema, defaultValues: defaults, mode })
  return <Form form={form} onSubmit={onSubmit} disabled={disabled}>
    <FormItem form={form} name="name" label="Name" control="text" />
    <FormItem form={form} name="role" label="Role" description="Choose permission" control="select" controlProps={{ options: [{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }] }} />
    <FormItem form={form} name="accepted" label="Accepted" control="checkbox" />
    <FormItem form={form} name="tags" label="Tags" control="checkbox-group" controlProps={{ options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] }} />
    <FormItem form={form} name="files" label="Files" control="files" controlProps={{ buttonLabel: "Pick files", accept: "text/plain" }} />
    <button type="submit">Save</button>
  </Form>
}
async function mount(props: Parameters<typeof Fixture>[0] = {}) {
  root.render(<Fixture {...props} />)
  await expect.element(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible()
  await document.fonts.ready
}
function nativeFiles() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  expect(input).not.toBeNull()
  return input!
}
function choose(...files: File[]) {
  const data = new DataTransfer()
  files.forEach(file => data.items.add(file))
  nativeFiles().files = data.files
  nativeFiles().dispatchEvent(new Event("change", { bubbles: true }))
}
const textFile = (name = "note.txt", content = "1234", type = "text/plain") => new File([content], name, { type })

beforeEach(() => {
  viewport = { width: window.innerWidth, height: window.innerHeight }
  const host = document.createElement("div"); document.body.replaceChildren(host); root = createRoot(host)
})
afterEach(async () => { root.unmount(); vi.restoreAllMocks(); await page.viewport(viewport.width, viewport.height) })

describe("Form public control adapters", () => {
  it("places Select label, help, invalid state, blur and registered focus on its real trigger", async () => {
    await mount()
    const trigger = page.getByRole("combobox", { name: "Role", exact: true })
    await expect.element(trigger).toBeVisible()
    const element = trigger.element() as HTMLElement
    const labels = document.querySelectorAll("label")
    expect(Array.from(labels).some(label => label.htmlFor === element.id && label.textContent?.includes("Role"))).toBe(true)
    const item = element.closest<HTMLElement>('[data-slot="field"]')!
    const heading = item.querySelector<HTMLElement>(".ex-item-heading")!
    const description = item.querySelector<HTMLElement>('[data-slot="field-description"]')!
    const content = item.querySelector<HTMLElement>('[data-slot="field-content"]')!
    const label = heading.querySelector<HTMLElement>('[data-slot="field-label"]')!
    expect(label.textContent).toContain("Role")
    expect(description.parentElement).toBe(heading)
    expect(heading.nextElementSibling).toBe(content)
    expect(content.contains(description)).toBe(false)
    expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(label.getBoundingClientRect().bottom - 1)
    expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.getBoundingClientRect().bottom - 1)
    expect(content.querySelector('[data-slot="field-error"]')).toBeNull()
    const titleColor = getComputedStyle(label).color
    expect(element.getAttribute("aria-describedby")?.split(" ").map(id => document.getElementById(id)?.textContent).join(" ")).toContain("Choose permission")
    form.setError("role", { message: "Permission unavailable" })
    await expect.element(trigger).toHaveAttribute("aria-invalid", "true")
    const error = content.querySelector<HTMLElement>('[data-slot="field-error"]')!
    expect(error.textContent).toBe("Permission unavailable")
    expect(getComputedStyle(label).color).toBe(titleColor)
    expect(getComputedStyle(error).color).not.toBe(titleColor)
    form.setFocus("role")
    await expect.poll(() => document.activeElement).toBe(element)
    await page.getByRole("textbox", { name: "Name", exact: true }).click()
    expect(form.getFieldState("role").isTouched).toBe(true)
    expect(form.getFieldState("role").issues[0]?.message).toBe("Permission unavailable")
    await trigger.click()
    await page.getByRole("option", { name: "Admin", exact: true }).click()
    expect(form.getValues("role")).toBe("admin")
  })

  it("binds booleans and string arrays as values without submitting control buttons", async () => {
    const onSubmit = vi.fn()
    await mount({ onSubmit })
    await page.getByRole("checkbox", { name: "Accepted", exact: true }).click()
    await page.getByRole("checkbox", { name: "Alpha", exact: true }).click()
    await page.getByRole("checkbox", { name: "Beta", exact: true }).click()
    expect(form.getValues("accepted")).toBe(true)
    expect(form.getValues("tags")).toEqual(["a", "b"])
    await page.getByRole("checkbox", { name: "Alpha", exact: true }).click()
    expect(form.getValues("tags")).toEqual(["b"])
    expect(onSubmit).not.toHaveBeenCalled()
    expect(form.state.submitCount).toBe(0)
  })

  it("binds radio and multi-select values while keeping multi-select search text out of the field value", async () => {
    function Choices() {
      form = useForm({ schema: passSchema, defaultValues: defaults })
      return <Form form={form} onSubmit={() => {}}>
        <FormItem form={form} name="role" label="Radio role" control="radio-group" controlProps={{ options: [{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }] }} />
        <FormItem form={form} name="tags" label="Multi tags" control="multi-select" controlProps={{ options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] }} />
      </Form>
    }
    root.render(<Choices />)
    await expect.element(page.getByRole("radiogroup", { name: "Radio role", exact: true })).toBeVisible()
    await page.getByRole("radio", { name: "Admin", exact: true }).click()
    expect(form.getValues("role")).toBe("admin")
    const input = page.getByRole("combobox", { name: "Multi tags", exact: true })
    await input.fill("Al")
    expect(form.getValues("tags")).toEqual([])
    await page.getByRole("option", { name: "Alpha", exact: true }).click()
    expect(form.getValues("tags")).toEqual(["a"])
    expect(form.state.submitCount).toBe(0)
  })

  it.each(["onSubmit", "onBlur", "onChange"] as const)("uses only public %s validation and preserves manual errors across change and blur", async mode => {
    const validator = vi.fn((value: Values) => ({ value }))
    const schema = schemaFor(validator)
    await mount({ schema, mode, onSubmit: () => {} })
    const submitted = form.submit()
    expect(await submitted).toEqual({ status: "submitted" })
    expect(validator).toHaveBeenCalledTimes(1)
    form.setError("name", { message: "Keep manual" })
    const input = page.getByRole("textbox", { name: "Name", exact: true })
    await input.fill("New")
    if (mode === "onChange") await expect.poll(() => validator.mock.calls.length).toBe(2)
    else expect(validator).toHaveBeenCalledTimes(1)
    page.getByRole("button", { name: "Save", exact: true }).element().focus()
    if (mode === "onBlur") await expect.poll(() => validator.mock.calls.length).toBe(2)
    expect(form.getFieldState("name").issues.some(issue => issue.source === "manual")).toBe(true)
  })

  it("preserves a server error across blur and same-value writes but clears only that server path on actual changes", async () => {
    function Server() {
      form = useForm({ schema: passSchema, defaultValues: defaults, mode: "onBlur" })
      return <Form form={form} onSubmit={(_data, context) => {
        context.setFieldError("name", { message: "Server name" })
        context.setFieldError("role", { message: "Server role" })
      }}><FormItem form={form} name="name" label="Name" control="text" /></Form>
    }
    root.render(<Server />)
    await expect.element(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible()
    expect(await form.submit()).toEqual({ status: "failed" })
    form.setError("name", { message: "Manual name" })
    form.setValue("name", "Ada")
    const input = page.getByRole("textbox", { name: "Name", exact: true }).element()
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(form.getFieldState("name").issues.map(issue => issue.source)).toEqual(expect.arrayContaining(["manual", "server"]))
    form.setValue("name", "Grace")
    expect(form.getFieldState("name").issues.map(issue => issue.source)).toEqual(["manual"])
    expect(form.getFieldState("role").issues[0]?.source).toBe("server")
  })

  it("keeps disabled values in full validation and the submitted output", async () => {
    const onSubmit = vi.fn()
    const schema = schemaFor(value => !value.accepted ? { issues: [{ message: "Acceptance required", path: ["accepted"] }] } : { value })
    await mount({ schema, disabled: true, onSubmit })
    await expect.element(page.getByRole("textbox", { name: "Name", exact: true })).toBeDisabled()
    expect(await form.submit()).toEqual({ status: "invalid" })
    form.setValue("accepted", true)
    expect(await form.submit()).toEqual({ status: "submitted" })
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ ...defaults, accepted: true })
  })

  it("provides same-source typed render and error accessibility when noStyle removes the built-in shell", async () => {
    function Bare() {
      form = useForm({ schema: passSchema, defaultValues: defaults })
      return <Form form={form} onSubmit={() => {}}><FormItem form={form} name="name" noStyle render={({ field, state, accessibility }) =>
        <div data-testid="bare">
          <label htmlFor={accessibility.id}>Custom name</label>
          <input {...accessibility} ref={field.ref} value={field.value} onChange={event => field.onChange(event.target.value)} onBlur={field.onBlur} />
          {state.invalid ? <span id={accessibility["aria-describedby"]}>{state.issues.map(issue => issue.message).join(", ")}</span> : null}
        </div>
      } /></Form>
    }
    root.render(<Bare />)
    const input = page.getByRole("textbox", { name: "Custom name", exact: true })
    await expect.element(input).toBeVisible()
    await input.fill("Custom draft")
    expect(form.getValues("name")).toBe("Custom draft")
    form.setError("name", { message: "Custom error" })
    await expect.element(input).toHaveAttribute("aria-invalid", "true")
    const describedBy = input.element().getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe("Custom error")
    form.setFocus("name")
    await expect.poll(() => document.activeElement).toBe(input.element())
  })
})

describe("Form local file lifecycle", () => {
  it.each([0, 1, 5, 6])("validates %s files through the schema, after proving the empty branch fails", async count => {
    await mount({ schema: fileSchema })
    expect(await form.trigger()).toBe(false)
    expect(form.getFieldState("files").issues[0]?.message).toBe("Select at least one file")
    form.setValue("files", Array.from({ length: count }, (_, index) => textFile(`${index}.txt`)))
    expect(await form.trigger()).toBe(count >= 1 && count <= 5)
    if (count === 6) expect(form.getFieldState("files").issues[0]?.message).toBe("At most five files")
  })

  it("validates exact size and type boundaries through the schema without filtering the input", async () => {
    await mount({ schema: fileSchema })
    form.setValue("files", [textFile("large.txt", "12345")])
    expect(await form.trigger()).toBe(false)
    expect(form.getFieldState("files").issues[0]?.message).toBe("File exceeds four bytes")
    form.setValue("files", [textFile()])
    expect(await form.trigger()).toBe(true)
    const invalid = textFile("picture.png", "1234", "image/png")
    choose(invalid)
    await expect.poll(() => form.getValues("files").length).toBe(2)
    expect(await form.trigger()).toBe(false)
    expect(form.getValues("files")[1]).toBe(invalid)
    expect(form.getFieldState("files").issues[0]?.message).toBe("Only text files")
  })

  it("appends picker, drop and paste files, permits same-file reselection and resets the native input", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem")
    await mount({ schema: fileSchema })
    expect(nativeFiles().hidden).toBe(true)
    // element() rejects ambiguous accessible matches, so the picker must be unique.
    const picker = page.getByRole("button", { name: "Files", exact: true }).element()
    expect(picker).not.toBe(nativeFiles())
    const file = textFile()
    choose(file)
    await expect.poll(() => form.getValues("files").length).toBe(1)
    expect(nativeFiles().value).toBe("")
    choose(file)
    await expect.poll(() => form.getValues("files").length).toBe(2)
    const target = page.getByRole("button", { name: "Files", exact: true }).element()
    const dropped = new DataTransfer()
    dropped.items.add(textFile("drop.txt"))
    const drop = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dropped })
    expect(target.dispatchEvent(drop)).toBe(false)
    await expect.poll(() => form.getValues("files").length).toBe(3)
    const pasted = new DataTransfer()
    pasted.items.add(textFile("paste.txt"))
    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: pasted })
    expect(target.dispatchEvent(paste)).toBe(false)
    await expect.poll(() => form.getValues("files").length).toBe(4)
    const plain = new DataTransfer()
    plain.setData("text/plain", "ordinary text")
    expect(target.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: plain }))).toBe(true)
    expect(form.getValues("files")).toHaveLength(4)
    // Remove the second occurrence by its rendered position; duplicate names remain distinct entries.
    const removeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).filter(button => /remove|delete|移除|删除/i.test(button.getAttribute("aria-label") ?? button.textContent ?? ""))
    expect(removeButtons).toHaveLength(4)
    removeButtons[1]!.click()
    await expect.poll(() => form.getValues("files").length).toBe(3)
    expect(form.getValues("files").map(item => item.name)).toEqual(["note.txt", "drop.txt", "paste.txt"])
    form.reset()
    await expect.poll(() => form.getValues("files").length).toBe(0)
    expect(nativeFiles().value).toBe("")
    choose(file)
    await expect.poll(() => form.getValues("files").length).toBe(1)
    expect(storage).not.toHaveBeenCalled()
  })

  it("releases every object URL it creates on reset and unmount", async () => {
    const created: string[] = []
    const revoked: string[] = []
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => { const url = `blob:exui-test-${created.length}`; created.push(url); return url })
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(url => { revoked.push(url) })
    await mount()
    choose(textFile())
    await expect.poll(() => form.getValues("files").length).toBe(1)
    form.reset()
    await expect.poll(() => form.getValues("files").length).toBe(0)
    expect(created.every(url => revoked.includes(url))).toBe(true)
    choose(textFile("again.txt"))
    await expect.poll(() => form.getValues("files").length).toBe(1)
    root.render(<p>Unmounted</p>)
    await expect.element(page.getByText("Unmounted", { exact: true })).toBeVisible()
    expect(created.every(url => revoked.includes(url))).toBe(true)
  })
})

describe("ExForm container layout and Dialog", () => {
  it.each([320, 375, 390, 1000])("lays out a %spx container without overflowing long labels, errors or filenames", async width => {
    await page.viewport(width, 844)
    function Layout() {
      form = useForm({ schema: passSchema, defaultValues: { ...defaults, files: [textFile(`${"long_filename_".repeat(20)}.txt`)] } })
      return <div data-testid="layout-container" style={{ width, maxWidth: "100%" }}><ExForm form={form} onSubmit={() => {}} columns={{ base: 1, sm: 2, md: 3 }} fields={[
        { name: "name", label: "Long label ".repeat(30), control: "text" },
        { name: "role", label: "Role", control: "select", controlProps: { options: [{ value: "member", label: "Member" }] } },
        { name: "files", label: "Files", control: "files" },
      ]} /></div>
    }
    root.render(<Layout />)
    await expect.element(page.getByTestId("layout-container")).toBeVisible()
    form.setError("name", { message: "UnbrokenIssue".repeat(60) })
    await document.fonts.ready
    const container = page.getByTestId("layout-container").element() as HTMLElement
    await expect.poll(() => container.scrollWidth - container.clientWidth).toBeLessThanOrEqual(1)
    const input = document.querySelector<HTMLInputElement>('input[name="name"]')!
    const role = page.getByRole("combobox", { name: "Role", exact: true }).element()
    if (width < 480) {
      expect(Math.abs(input.getBoundingClientRect().left - role.getBoundingClientRect().left)).toBeLessThanOrEqual(1)
      expect(role.getBoundingClientRect().top).toBeGreaterThan(input.getBoundingClientRect().bottom)
    }
  })

  it("uses a narrow Dialog container at a wide viewport and restores trigger focus on Escape", async () => {
    await page.viewport(1280, 900)
    function Modal() {
      form = useForm({ schema: passSchema, defaultValues: defaults })
      return <Dialog><DialogTrigger asChild><Button>Open form dialog</Button></DialogTrigger>
        <DialogContent style={{ width: 320, maxWidth: "calc(100vw - 2rem)", maxHeight: 300, overflowY: "auto" }}>
          <DialogTitle>Form dialog</DialogTitle>
          <ExForm form={form} onSubmit={() => {}} columns={{ base: 1, sm: 2, md: 3 }} fields={[
            { name: "name", label: "Name", control: "text" },
            { name: "role", label: "Role", control: "select", controlProps: { options: [{ value: "member", label: "Member" }] } },
            { name: "files", label: "Files", control: "files" },
          ]} />
        </DialogContent>
      </Dialog>
    }
    root.render(<Modal />)
    const trigger = page.getByRole("button", { name: "Open form dialog", exact: true })
    await trigger.click()
    const dialog = page.getByRole("dialog")
    await expect.element(dialog).toBeVisible()
    const name = page.getByRole("textbox", { name: "Name", exact: true }).element()
    const role = page.getByRole("combobox", { name: "Role", exact: true }).element()
    expect(Math.abs(name.getBoundingClientRect().left - role.getBoundingClientRect().left)).toBeLessThanOrEqual(1)
    expect(role.getBoundingClientRect().top).toBeGreaterThan(name.getBoundingClientRect().bottom)
    form.scrollToField("files", { focus: true })
    await expect.poll(() => document.activeElement).toBe(page.getByRole("button", { name: "Files", exact: true }).element())
    await expect.poll(() => (dialog.element() as HTMLElement).scrollTop).toBeGreaterThan(0)
    name.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }))
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.poll(() => document.activeElement).toBe(trigger.element())
  })
})
