import "@exre/exui/style.css"

import { useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  ExForm, useForm,
  type ExFormFooterArguments, type FormInstance, type StandardSchemaV1,
} from "@exre/exui"

type Values = { first: string; second: string; accepted: boolean }
type Result = StandardSchemaV1.Result<Values>
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(yes => { resolve = yes })
  return { promise, resolve }
}
function schemaFor(validate: (value: Values) => Result | Promise<Result>): StandardSchemaV1<Values, Values> {
  return { "~standard": { version: 1, vendor: "exui-step-test", validate: value => validate(value as Values) } }
}
const defaults: Values = { first: "draft", second: "", accepted: false }
const full = schemaFor(value => value.first !== value.second || !value.accepted ? { issues: [
  { message: "Names must match", path: ["first"] },
] } : { value })
const firstScope = schemaFor(value => value.first ? { value } : { issues: [{ message: "First required", path: ["first"] }] })
const lastScope = schemaFor(value => value.accepted ? { value } : { issues: [{ message: "Accept required", path: ["accepted"] }] })
let root: Root
let form: FormInstance<Values, Values>
let navigation: ExFormFooterArguments<Values>

function Footer(args: ExFormFooterArguments<Values>) {
  navigation = args
  return <>
    <output data-testid="step">{args.currentStep}</output>
    <button type="button" onClick={args.back}>Back</button>
    <button type="button" onClick={() => { void args.next() }}>Next</button>
    <button type="submit">Send</button>
  </>
}

function Fixture({ secondScope, controlled = false, onSubmit = () => {}, schema = full }: {
  secondScope: StandardSchemaV1<Values, Values>
  schema?: StandardSchemaV1<Values, Values>
  controlled?: boolean
  onSubmit?: (values: Values) => void
}) {
  form = useForm({ schema, defaultValues: defaults })
  const [current, setCurrent] = useState("a")
  const [title, setTitle] = useState("Initial")
  const [requested, setRequested] = useState("")
  return <>
    <button type="button" data-testid="external-a" onClick={() => setCurrent("a")}>External A</button>
    <button type="button" data-testid="external-c" onClick={() => setCurrent("c")}>External C</button>
    <button type="button" data-testid="confirm" onClick={() => setCurrent(requested)}>Confirm requested step</button>
    <button type="button" data-testid="retitle" onClick={() => setTitle("Retitled")}>Retitle</button>
    <output data-testid="request">{requested}</output>
    <output data-testid="parent-validating">{String(form.state.isValidating)}</output>
    <ExForm form={form} onSubmit={onSubmit} footer={Footer}
      currentStep={controlled ? current : undefined} onStepChange={setRequested}
      // These deliberately get fresh object/array/function references on every state render.
      fields={[
        { name: "first", label: title, control: "text" },
        { name: "second", label: "Second", control: "text" },
        { name: "accepted", label: "Accepted", control: "checkbox" },
      ]}
      steps={[
        { id: "a", title, fields: ["first"], validationSchema: firstScope },
        { id: "b", title: "Second", fields: ["second"], validationSchema: secondScope },
        { id: "c", title: "Acceptance", fields: ["accepted"], validationSchema: lastScope },
        { id: "review", title: "Review", kind: "review", render: snapshot => <output data-testid="review">{snapshot.first}:{snapshot.second}</output> },
      ]} />
  </>
}

async function mount(secondScope: StandardSchemaV1<Values, Values>, controlled = false, onSubmit?: (values: Values) => void) {
  root.render(<Fixture secondScope={secondScope} controlled={controlled} onSubmit={onSubmit} />)
  await expect.element(page.getByTestId("step")).toHaveTextContent("a")
}
async function settled(promise: Promise<boolean>, expected: boolean) {
  let actual: boolean | undefined
  void promise.then(value => { actual = value })
  await expect.poll(() => actual, { timeout: 1000 }).toBe(expected)
}
function controlledScope() {
  const tasks: ReturnType<typeof deferred<Result>>[] = []
  return { tasks, schema: schemaFor(() => { const task = deferred<Result>(); tasks.push(task); return task.promise }) }
}

beforeEach(() => { const host = document.createElement("div"); document.body.replaceChildren(host); root = createRoot(host) })
afterEach(() => { root.unmount(); vi.restoreAllMocks() })

describe("ExForm public step navigation", () => {
  it("allows current scope despite a missing future value, then runs the full cross-field rule on final submit", async () => {
    const onSubmit = vi.fn()
    const second = schemaFor(value => value.second ? { value } : { issues: [{ message: "Second required", path: ["second"] }] })
    await mount(second, false, onSubmit)
    form.setValue("first", "")
    expect(await navigation.next()).toBe(false)
    expect(form.state.errors.fields.first?.issues[0]?.message).toBe("First required")
    form.setValue("first", "draft")
    expect(await navigation.next()).toBe(true)
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
    expect(await navigation.next()).toBe(false)
    form.setValue("second", "different")
    expect(await navigation.next()).toBe(true)
    form.setValue("accepted", true)
    expect(await navigation.next()).toBe(true)
    await expect.element(page.getByTestId("review")).toHaveTextContent("draft:different")
    expect(await form.submit()).toEqual({ status: "invalid" })
    expect(onSubmit).not.toHaveBeenCalled()
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    await expect.poll(() => document.activeElement).toBe(page.getByRole("textbox", { name: "Initial" }).element())
    form.setValue("second", "draft")
    expect(await navigation.goTo("review")).toBe(true)
    expect(await form.submit()).toEqual({ status: "submitted" })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("routes an early native submit to next while form.submit rejects premature business submission", async () => {
    const onSubmit = vi.fn()
    await mount(schemaFor(value => ({ value })), false, onSubmit)
    await expect(form.submit()).rejects.toThrow()
    document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
    expect(onSubmit).not.toHaveBeenCalled()
    expect(form.state.submitCount).toBe(0)
  })

  it("cancels B's deferred next immediately when back returns to A without input changes", async () => {
    const { schema, tasks } = controlledScope()
    await mount(schema)
    expect(await navigation.next()).toBe(true)
    const before = form.getValues()
    const pending = navigation.next()
    await expect.poll(() => tasks.length).toBe(1)
    navigation.back()
    await settled(pending, false)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    expect(form.getValues()).toEqual(before)
    tasks[0]!.resolve({ value: defaults })
    await new Promise(resolve => requestAnimationFrame(resolve))
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    expect(tasks).toHaveLength(1)
  })

  it("finishes an independent trigger after cancelling a same-batch navigation scope that remains pending", async () => {
    const { schema: pendingScope, tasks } = controlledScope()
    const fullValidator = vi.fn((value: Values) => ({ value }))
    const fullSchema = schemaFor(fullValidator)
    root.render(<Fixture schema={fullSchema} secondScope={pendingScope} />)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    expect(await navigation.next()).toBe(true)
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")

    // Both demands are queued in this turn so their full/scope work shares a batch.
    const advancing = navigation.next()
    const independent = form.trigger("second")
    let independentResult: boolean | undefined
    void independent.then(value => { independentResult = value })
    await expect.poll(() => tasks.length).toBe(1)
    await expect.poll(() => fullValidator.mock.calls.length).toBe(1)
    expect(form.state.isValidating).toBe(true)

    navigation.back()
    await settled(advancing, false)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    // The cancelled schema stays unresolved here: it cannot hold another demand hostage.
    await expect.poll(() => independentResult, { timeout: 1000 }).toBe(true)
    expect(form.state.isValidating).toBe(false)
    expect(fullValidator).toHaveBeenCalledTimes(1)

    tasks[0]!.resolve({ issues: [{ message: "Cancelled scope failure", path: ["second"] }] })
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    expect(form.state.errors.fields.second).toBeUndefined()
    expect(form.state.errors.root["validation.scope.b"]).toBeUndefined()
    expect(form.state.isValidating).toBe(false)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
  })

  it.each(["reset", "cancelPending", "new-goTo"] as const)("revokes deferred next on %s and denies its late focus/navigation", async operation => {
    const { schema, tasks } = controlledScope()
    await mount(schema)
    expect(await navigation.next()).toBe(true)
    const pending = navigation.next()
    await expect.poll(() => tasks.length).toBe(1)
    if (operation === "new-goTo") expect(await navigation.goTo("a")).toBe(true)
    else form[operation]()
    await settled(pending, false)
    const expected = operation === "cancelPending" ? "b" : "a"
    tasks[0]!.resolve({ issues: [{ message: "obsolete", path: ["second"] }] })
    await new Promise(resolve => requestAnimationFrame(resolve))
    await expect.element(page.getByTestId("step")).toHaveTextContent(expected)
    expect(form.state.errors.fields.second).toBeUndefined()
  })

  it("preserves dirty draft and pending navigation across parent state renders and display-only config changes", async () => {
    const { schema, tasks } = controlledScope()
    await mount(schema)
    form.setValue("first", "edited")
    expect(await navigation.next()).toBe(true)
    const pending = navigation.next()
    await expect.poll(() => tasks.length).toBe(1)
    await expect.element(page.getByTestId("parent-validating")).toHaveTextContent("true")
    await page.getByTestId("retitle").click()
    tasks[0]!.resolve({ value: defaults })
    expect(await pending).toBe(true)
    await expect.element(page.getByTestId("step")).toHaveTextContent("c")
    expect(form.getValues("first")).toBe("edited")
    expect(form.state.isDirty).toBe(true)
    await expect.element(page.getByTestId("parent-validating")).toHaveTextContent("false")
  })

  it("waits for controlled target confirmation and treats unchanged props as an ordinary render", async () => {
    await mount(schemaFor(value => ({ value })), true)
    const pending = navigation.next()
    let completed: boolean | undefined
    void pending.then(value => { completed = value })
    await expect.element(page.getByTestId("request")).toHaveTextContent("b")
    await page.getByTestId("retitle").click()
    expect(completed).toBeUndefined()
    expect(form.state.isValidating).toBe(false)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    await page.getByTestId("confirm").click()
    await settled(pending, true)
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
  })

  it("revokes a controlled deferred request when the parent directly selects a different step", async () => {
    const { schema, tasks } = controlledScope()
    await mount(schema, true)
    const toB = navigation.next()
    await expect.element(page.getByTestId("request")).toHaveTextContent("b")
    await page.getByTestId("confirm").click()
    expect(await toB).toBe(true)
    const pending = navigation.next()
    await expect.poll(() => tasks.length).toBe(1)
    await page.getByTestId("external-a").click()
    await settled(pending, false)
    tasks[0]!.resolve({ value: defaults })
    await new Promise(resolve => requestAnimationFrame(resolve))
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    await expect.element(page.getByTestId("request")).toHaveTextContent("b")
  })

  it("invalidates an intentional scope schema replacement without resetting the draft", async () => {
    const first = controlledScope()
    const replacement = schemaFor(() => ({ issues: [{ message: "New rule", path: ["second"] }] }))
    root.render(<Fixture secondScope={first.schema} />)
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    form.setValue("first", "edited")
    expect(await navigation.next()).toBe(true)
    const pending = navigation.next()
    await expect.poll(() => first.tasks.length).toBe(1)
    root.render(<Fixture secondScope={replacement} />)
    await settled(pending, false)
    first.tasks[0]!.resolve({ value: defaults })
    expect(await navigation.next()).toBe(false)
    expect(form.state.errors.fields.second?.issues[0]?.message).toBe("New rule")
    expect(form.getValues("first")).toBe("edited")
    expect(form.state.isDirty).toBe(true)
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
  })

  it("updates review output on a second value write even when dirty and validation status already have the same flags", async () => {
    await mount(schemaFor(value => ({ value })))
    form.setValue("first", "first edit")
    form.setValue("second", "second edit")
    form.setValue("accepted", true)
    expect(await navigation.goTo("review")).toBe(true)
    await expect.element(page.getByTestId("review")).toHaveTextContent("first edit:second edit")
    expect(form.state.isDirty).toBe(true)
    expect(form.state.validationStatus).toBe("unvalidated")
    form.setValue("first", "later edit")
    await expect.element(page.getByTestId("review")).toHaveTextContent("later edit:second edit")
    expect(form.state.isDirty).toBe(true)
    expect(form.state.validationStatus).toBe("unvalidated")
  })

  it("requests the first step when controlled structure removes the current step and waits for parent confirmation", async () => {
    const requested = vi.fn()
    function DynamicControlled() {
      form = useForm({ schema: full, defaultValues: defaults })
      const [current, setCurrent] = useState("b")
      const [removed, setRemoved] = useState(false)
      const [renderCount, setRenderCount] = useState(0)
      return <>
        <button type="button" data-testid="remove-current-step" onClick={() => setRemoved(true)}>Remove current step</button>
        <button type="button" data-testid="rerender-stale-step" onClick={() => setRenderCount(count => count + 1)}>Render unchanged stale step</button>
        <button type="button" data-testid="confirm-first-step" onClick={() => setCurrent("a")}>Confirm first step</button>
        <output data-testid="render-count">{renderCount}</output>
        <ExForm form={form} onSubmit={() => {}} fields={[]} currentStep={current} onStepChange={requested} footer={Footer}
          steps={removed ? [
            { id: "a", title: "First review", kind: "review", render: snapshot => <output data-testid="first-step-review">{snapshot.first}</output> },
          ] : [
            { id: "a", title: "First review", kind: "review", render: snapshot => <output data-testid="first-step-review">{snapshot.first}</output> },
            { id: "b", title: "Second review", kind: "review", render: snapshot => <output data-testid="second-step-review">{snapshot.first}</output> },
          ]} />
      </>
    }
    root.render(<DynamicControlled />)
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
    form.setValue("first", "preserved draft")
    await expect.element(page.getByTestId("second-step-review")).toHaveTextContent("preserved draft")
    expect(form.state.isDirty).toBe(true)

    const oldNavigation = navigation.goTo("a")
    await expect.poll(() => requested.mock.calls.length).toBe(1)
    expect(requested.mock.calls[0]?.[0]).toBe("a")
    requested.mockClear()
    await page.getByTestId("remove-current-step").click()
    await settled(oldNavigation, false)
    await expect.poll(() => requested.mock.calls.length).toBe(1)
    expect(requested.mock.calls[0]?.[0]).toBe("a")
    // The old prop belongs to a removed committed step; it is awaiting this request's confirmation.
    await expect.element(page.getByTestId("step")).toHaveTextContent("b")
    expect(form.getValues("first")).toBe("preserved draft")
    expect(form.state.isDirty).toBe(true)

    await page.getByTestId("rerender-stale-step").click()
    await expect.element(page.getByTestId("render-count")).toHaveTextContent("1")
    expect(requested).toHaveBeenCalledTimes(1)
    await page.getByTestId("confirm-first-step").click()
    await expect.element(page.getByTestId("step")).toHaveTextContent("a")
    await expect.element(page.getByTestId("first-step-review")).toHaveTextContent("preserved draft")
    expect(form.getValues("first")).toBe("preserved draft")
    expect(form.state.isDirty).toBe(true)
    expect(requested).toHaveBeenCalledTimes(1)
  })
})
