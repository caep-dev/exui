import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import {
  ExForm, Form, FormItem, FormErrorSummary, FormList, useForm, useFieldArray, useWatch,
  type FormInstance, type StandardSchemaV1,
} from "@exre/exui"

type Profile = { message: string; type: string; types: string; issues: string; ref: string }
type Values = { age: string; profile: Profile; rows: { title: string }[]; future?: string }
const defaults: Values = {
  age: "21", profile: { message: "a", type: "b", types: "c", issues: "d", ref: "e" },
  rows: [{ title: "First" }, { title: "Second" }],
}

function schemaFor<I extends Record<string, unknown>, O = I>(validate: (input: I) => StandardSchemaV1.Result<O> | Promise<StandardSchemaV1.Result<O>>): StandardSchemaV1<I, O> {
  return { "~standard": { version: 1, vendor: "exui-browser-test", validate: input => validate(input as I) } }
}
let root: Root
let form: FormInstance<Values, Values>

function Fixture({ schema }: { schema: StandardSchemaV1<Values, Values> }) {
  form = useForm({ schema, defaultValues: defaults })
  return <Form form={form} onSubmit={() => {}}>
    <FormItem form={form} name="age" label="Age" control="number" />
    <FormItem form={form} name="profile.message" label="Message" control="text" />
    <FormItem form={form} name="profile.type" label="Type" control="text" />
    <FormItem form={form} name="profile.types" label="Types" control="text" />
    <FormItem form={form} name="profile.issues" label="Issues" control="text" />
    <FormItem form={form} name="profile.ref" label="Ref" control="text" />
    <FormItem form={form} name="future" label="Future" control="text" />
    <FormList form={form} name="rows" defaultItem={{ title: "New" }} render={({ items }) => items.map(item =>
      <FormItem key={item.key} form={form} name={`rows.${item.index}.title`} label={`Row ${item.index}`} control="text" />
    )} />
    <FormErrorSummary form={form} />
  </Form>
}

async function mount(schema: StandardSchemaV1<Values, Values>) {
  root.render(<Fixture schema={schema} />)
  await expect.element(page.getByRole("textbox", { name: "Message", exact: true })).toBeVisible()
  await document.fonts.ready
}

beforeEach(() => { const host = document.createElement("div"); document.body.replaceChildren(host); root = createRoot(host) })
afterEach(() => { root.unmount(); vi.restoreAllMocks() })

describe("Form public schema and error contract", () => {
  it("renders the error summary in ExForm only when explicitly composed", async () => {
    const schema = z.object({ age: z.string().min(1, "Enter your age") })
    const fields = [{ name: "age", label: "Age", control: "number" }] as const
    root.render(<ExForm schema={schema} defaultValues={{ age: "" }} fields={fields} onSubmit={() => {}} />)
    await expect.element(page.getByRole("spinbutton", { name: "Age" })).toBeVisible()
    await page.getByRole("button", { name: "提交" }).click()
    await expect.element(page.getByText("请检查以下问题", { exact: true })).not.toBeInTheDocument()

    root.render(<ExForm key="with-summary" schema={schema} defaultValues={{ age: "" }} fields={fields} onSubmit={() => {}}>
      <FormErrorSummary />
    </ExForm>)
    await expect.element(page.getByRole("spinbutton", { name: "Age" })).toBeVisible()
    await page.getByRole("button", { name: "提交" }).click()
    await expect.element(page.getByText("请检查以下问题", { exact: true })).toBeVisible()
    await expect.element(page.getByRole("button", { name: "Age: Enter your age" })).toBeVisible()
  })

  it("submits transformed Output while watch and getValues retain the original Input", async () => {
    const schema = z.object({ age: z.string().regex(/^\d+$/).transform(Number) })
    let current!: FormInstance<z.input<typeof schema>, z.output<typeof schema>>
    const onSubmit = vi.fn()
    function Transformed() {
      current = useForm({ schema, defaultValues: { age: "invalid" } })
      const watchedAge = useWatch({ form: current, name: "age" })
      return <Form form={current} onSubmit={onSubmit}><FormItem form={current} name="age" label="Age" control="number" /><output data-testid="watched-age">{watchedAge}</output></Form>
    }
    root.render(<Transformed />)
    await expect.element(page.getByRole("spinbutton", { name: "Age" })).toBeVisible()
    expect(await current.submit()).toEqual({ status: "invalid" })
    expect(onSubmit).not.toHaveBeenCalled()
    current.setValue("age", "42")
    expect(await current.submit()).toEqual({ status: "submitted" })
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ age: 42 })
    expect(current.getValues()).toEqual({ age: "42" })
    await expect.element(page.getByTestId("watched-age")).toHaveTextContent("42")
  })

  it("retains parent and metadata-named child issues, duplicate diagnoses and their exact original paths", async () => {
    const issues: StandardSchemaV1.Issue[] = [
      { message: "Profile invalid", path: ["profile"] },
      ...["message", "type", "types", "issues", "ref"].map(key => ({ message: `${key} invalid`, path: ["profile", { key }] })),
      { message: "message invalid", path: ["profile", "message"] },
    ]
    await mount(schemaFor(() => ({ issues })))
    expect(await form.trigger()).toBe(false)
    expect(form.state.errors.fields.profile?.issues).toHaveLength(1)
    expect(form.state.errors.fields["profile.message"]?.issues).toHaveLength(2)
    for (const key of ["type", "types", "issues", "ref"] as const) {
      expect(form.state.errors.fields[`profile.${key}`]?.issues[0]?.path).toEqual(["profile", { key }])
    }
    form.clearErrors("profile.message")
    expect(form.state.errors.fields["profile.message"]).toBeUndefined()
    expect(form.state.errors.fields.profile?.issues[0]?.message).toBe("Profile invalid")
    expect(form.state.errors.fields["profile.type"]?.issues).toHaveLength(1)
    expect(form.getFieldState("profile").invalid).toBe(true)
    form.setFocus("profile.ref")
    await expect.poll(() => document.activeElement).toBe(page.getByRole("textbox", { name: "Ref", exact: true }).element())
  })

  it("routes undeclared, symbol and unsafe issue paths to root without prototype pollution", async () => {
    const symbol = Symbol("unknown")
    const issues: StandardSchemaV1.Issue[] = [
      { message: "Safe object segment", path: [{ key: "profile" }, { key: "message" }] },
      { message: "Dangerous path", path: ["__proto__", "exuiPolluted"] },
      { message: "Dangerous constructor", path: ["profile", "constructor", "prototype"] },
      { message: "Symbol path", path: [symbol] },
      { message: "Unknown path", path: ["unknown"] },
      { message: "Root failure" },
    ]
    await mount(schemaFor(() => ({ issues })))
    expect(await form.trigger()).toBe(false)
    expect(form.state.errors.fields["profile.message"]?.issues[0]?.message).toBe("Safe object segment")
    expect(Object.values(form.state.errors.root).flatMap(node => node.issues)).toHaveLength(5)
    expect((Object.prototype as Record<string, unknown>).exuiPolluted).toBeUndefined()
    expect(Object.keys(form.state.errors.fields)).toEqual(["profile.message"])
    expect(Object.getPrototypeOf(form.state.errors.fields)).toBeNull()
    expect(Object.getPrototypeOf(form.state.errors.root)).toBeNull()
  })

  it("keeps full, scope, manual and server owners independent until their documented lifecycle clears them", async () => {
    let failFull = true
    let failScope = true
    const schema = schemaFor<Values>(() => failFull ? { issues: [{ message: "full", path: ["profile", "message"] }] } : { value: defaults })
    const scopeSchema = schemaFor<Values>(() => failScope ? { issues: [{ message: "scope", path: ["profile", "message"] }] } : { value: defaults })
    let active!: FormInstance<Values, Values>
    function Owners() {
      active = useForm({ schema, defaultValues: defaults })
      return <Form form={active} onSubmit={(_data, context) => context.setFieldError("profile.message", { message: "server" })}>
        <FormItem form={active} name="profile.message" label="Message" control="text" />
      </Form>
    }
    root.render(<Owners />)
    await expect.element(page.getByRole("textbox", { name: "Message", exact: true })).toBeVisible()
    // Prove both validators can fail before exercising their success branches.
    expect(await active.trigger()).toBe(false)
    expect(await active.validateScope({ id: "profile", fields: ["profile.message"], validationSchema: scopeSchema })).toBe(false)
    active.setError("profile.message", { message: "manual" })
    expect(active.getFieldState("profile.message").issues.map(issue => issue.message)).toEqual(expect.arrayContaining(["full", "scope", "manual"]))
    failFull = false
    expect(await active.submit()).toEqual({ status: "failed" })
    // Submit is full authority and removes previous schema owners, but preserves manual.
    expect(active.getFieldState("profile.message").issues.map(issue => issue.source)).toEqual(expect.arrayContaining(["manual", "server"]))
    failFull = true
    expect(await active.trigger("profile.message")).toBe(false)
    expect(await active.validateScope({ id: "profile", fields: ["profile.message"], validationSchema: scopeSchema })).toBe(false)
    expect(active.getFieldState("profile.message").issues).toHaveLength(4)
    failScope = false
    expect(await active.validateScope({ id: "profile", fields: ["profile.message"], validationSchema: scopeSchema })).toBe(true)
    expect(active.getFieldState("profile.message").issues.map(issue => issue.message)).toEqual(expect.arrayContaining(["full", "manual", "server"]))
    active.setValue("profile.message", "changed")
    expect(active.getFieldState("profile.message").issues.map(issue => issue.message)).toEqual(expect.arrayContaining(["full", "manual"]))
    expect(active.getFieldState("profile.message").issues.some(issue => issue.source === "server")).toBe(false)
  })

  it("projects only declared scope fields and dependencies, preserves missing properties and sparse array indices", async () => {
    await mount(schemaFor<Values>(input => input.future === undefined ? { issues: [{ message: "Future required", path: ["future"] }] } : { value: input }))
    // The missing/undefined branch demonstrably fails full validation.
    expect(await form.trigger()).toBe(false)
    expect(form.state.errors.fields.future?.issues[0]?.message).toBe("Future required")
    let projected: unknown
    const scope = schemaFor<Values>(input => { projected = input; return { value: input } })
    expect(await form.validateScope({ id: "first", fields: ["rows.1.title"], validationDependencies: ["profile.message"], validationSchema: scope })).toBe(true)
    const expectedRows = new Array<{ title: string }>(2)
    expectedRows[1] = { title: "Second" }
    expect(projected).toEqual({ rows: expectedRows, profile: { message: "a" } })
    expect(Object.hasOwn(projected as object, "future")).toBe(false)
    expect(Object.hasOwn((projected as Values).rows, 0)).toBe(false)
    expect(form.state.validationStatus).toBe("invalid")
    const outside = schemaFor<Values>(() => ({ issues: [{ message: "Outside projection", path: ["future"] }] }))
    expect(await form.validateScope({ id: "outside", fields: ["age"], validationSchema: outside })).toBe(false)
    expect(form.state.errors.root["validation.scope.outside"]?.issues[0]?.message).toBe("Outside projection")
    expect(form.state.errors.fields.future?.issues).toHaveLength(1)
  })

  it("never exposes mutable object or array containers through getValues", async () => {
    await mount(schemaFor(input => ({ value: input })))
    const snapshot = form.getValues()
    try { (snapshot.profile as Profile).message = "mutated externally" } catch { /* Frozen snapshots are also acceptable. */ }
    try { (snapshot.rows as Values["rows"]).push({ title: "external" }) } catch { /* Frozen snapshots are also acceptable. */ }
    expect(form.getValues("profile.message")).toBe("a")
    expect(form.getValues("rows")).toHaveLength(2)
    expect(form.state.isDirty).toBe(false)
  })
})

describe("Form object list identity and issue movement", () => {
  it("keeps stable keys, compares dirty against defaults and remaps independent parent/row diagnostics", async () => {
    const schema = schemaFor<Values>(() => ({ value: defaults }))
    let array!: ReturnType<typeof useFieldArray<Values, Values, "rows">>
    function List() {
      form = useForm({ schema, defaultValues: defaults })
      array = useFieldArray({ form, name: "rows" })
      return <Form form={form} onSubmit={() => {}}>{array.items.map(item =>
        <FormItem key={item.key} form={form} name={`rows.${item.index}.title`} label={`Row ${item.index}`} control="text" />
      )}</Form>
    }
    root.render(<List />)
    await expect.element(page.getByRole("textbox", { name: "Row 0", exact: true })).toBeVisible()
    const keys = array.items.map(item => item.key)
    form.setError("rows", { message: "Array issue" })
    form.setError("rows.0.title", { message: "First issue", issues: [{ message: "First issue", path: ["rows", 0, "title"] }] })
    form.setError("rows.1.title", { message: "Second issue" })
    array.move(0, 1)
    await expect.poll(() => array.items.map(item => item.key)).toEqual([keys[1], keys[0]])
    expect(form.getValues("rows")).toEqual([{ title: "Second" }, { title: "First" }])
    expect(form.state.isDirty).toBe(true)
    expect(form.state.errors.fields["rows.1.title"]?.issues[0]?.message).toBe("First issue")
    expect(form.state.errors.fields["rows.1.title"]?.issues[0]?.path).toEqual(["rows", 0, "title"])
    form.clearErrors("rows.1.title")
    expect(form.state.errors.fields.rows?.issues[0]?.message).toBe("Array issue")
    expect(form.state.errors.fields["rows.0.title"]?.issues[0]?.message).toBe("Second issue")
    array.move(1, 0)
    await expect.poll(() => form.state.isDirty).toBe(false)
    array.insert(0, { title: "New" })
    await expect.poll(() => array.items.length).toBe(3)
    expect(form.state.errors.fields["rows.2.title"]?.issues[0]?.message).toBe("Second issue")
    array.remove(0)
    await expect.poll(() => array.items.length).toBe(2)
    expect(array.items.map(item => item.key)).toEqual(keys)
    expect(form.state.errors.fields["rows.1.title"]?.issues[0]?.message).toBe("Second issue")
    array.remove(1)
    await expect.poll(() => array.items.length).toBe(1)
    expect(form.state.errors.fields["rows.1.title"]).toBeUndefined()
    expect(form.getValues("rows.0")).toEqual({ title: "First" })
    expect(Object.hasOwn(form.getValues("rows.0"), "id")).toBe(false)
  })
})
