import "@exre/exui/style.css"

import { StrictMode, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { page } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  Form, FormItem, useForm, useFormContext,
  type FormInstance, type FormSubmitContext, type StandardSchemaV1,
} from "@exre/exui"

type Values = { name: string; email: string }
type Result = StandardSchemaV1.Result<Values>

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function controlledSchema() {
  const calls: { input: Values; task: ReturnType<typeof deferred<Result>> }[] = []
  const schema: StandardSchemaV1<Values, Values> = {
    "~standard": {
      version: 1, vendor: "exui-browser-test",
      validate(input) {
        const task = deferred<Result>()
        calls.push({ input: input as Values, task })
        return task.promise
      },
    },
  }
  return { schema, calls }
}

const defaults: Values = { name: "Ada", email: "ada@example.com" }
const success: Result = { value: defaults }
const failure: Result = { issues: [{ message: "Name rejected", path: ["name"] }] }
let root: Root
let host: HTMLDivElement
let form: FormInstance<Values, Values>

function ContextStatus() {
  const current = useFormContext(form)
  return <output data-testid="context-status">{JSON.stringify({ validating: current.state.isValidating, submitting: current.state.isSubmitting })}</output>
}

function Fixture({ schema, onSubmit = () => {}, onSubmitError, mode = "onSubmit" }: {
  schema: StandardSchemaV1<Values, Values>
  onSubmit?: (values: Values, context: FormSubmitContext<Values>) => void | Promise<void>
  onSubmitError?: (error: unknown) => void
  mode?: "onSubmit" | "onBlur" | "onChange"
}) {
  form = useForm({ schema, defaultValues: defaults, mode })
  return <>
    <button type="button" data-testid="parent-status" disabled={form.state.isValidating || form.state.isSubmitting}>
      {form.state.isSubmitting ? "submitting" : form.state.isValidating ? "validating" : "idle"}
    </button>
    <Form form={form} onSubmit={onSubmit} onSubmitError={onSubmitError}>
      <FormItem form={form} name="name" label="Name" control="text" />
      <FormItem form={form} name="email" label="Email" control="text" />
      <ContextStatus />
      <button type="submit">Save</button>
    </Form>
  </>
}

async function mount(node: ReactElement) {
  root.render(node)
  await expect.element(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible()
  await document.fonts.ready
}

async function called(calls: unknown[], count: number) {
  await expect.poll(() => calls.length).toBe(count)
}

async function promptly<T>(promise: Promise<T>, expected: T) {
  let result: T | undefined
  void promise.then(value => { result = value })
  await expect.poll(() => result, { timeout: 1000 }).toEqual(expected)
}

beforeEach(() => {
  host = document.createElement("div")
  document.body.replaceChildren(host)
  root = createRoot(host)
})
afterEach(() => { root.unmount(); vi.restoreAllMocks() })

describe("Form public async coordination", () => {
  it.each(["throw", "reject"] as const)("reports schema %s undefined as execution failure rather than an invalid schema result", async operation => {
    const onSubmit = vi.fn()
    const onSubmitError = vi.fn()
    const schema: StandardSchemaV1<Values, Values> = {
      "~standard": { version: 1, vendor: "exui-undefined-failure-test", validate() {
        if (operation === "throw") throw undefined
        return Promise.reject(undefined)
      } },
    }
    await mount(<Fixture schema={schema} onSubmit={onSubmit} onSubmitError={onSubmitError} />)
    // The direct schema probe proves this is the rejection branch, not a successful undefined output.
    let rejected = false
    try { await schema["~standard"].validate(defaults) } catch { rejected = true }
    expect(rejected).toBe(true)
    expect(await form.submit()).toEqual({ status: "failed" })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onSubmitError).toHaveBeenCalledTimes(1)
    expect(onSubmitError.mock.calls[0]?.[0]).toBeUndefined()
    expect(form.state.errors.root.execution?.issues[0]?.source).toBe("execution")
    expect(form.state.isSubmitting).toBe(false)
  })

  it("does not interpret an empty FailureResult issue array as success or invoke the callback with undefined", async () => {
    const onSubmit = vi.fn()
    const schema: StandardSchemaV1<Values, Values> = {
      "~standard": { version: 1, vendor: "exui-empty-failure-test", validate: () => ({ issues: [] }) },
    }
    await mount(<Fixture schema={schema} onSubmit={onSubmit} />)
    const result = await schema["~standard"].validate(defaults)
    expect("value" in result).toBe(false)
    expect(await form.trigger()).toBe(false)
    expect(await form.submit()).toEqual({ status: "invalid" })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(form.state.validationStatus).toBe("invalid")
  })

  it.each([false, true])("rejects a real invalid sample before discarding an obsolete result (old success: %s)", async (oldSuccess) => {
    const { schema, calls } = controlledSchema()
    await mount(<Fixture schema={schema} />)
    const guard = form.trigger()
    await called(calls, 1)
    calls[0]!.task.resolve(failure)
    expect(await guard).toBe(false)
    expect(form.state.errors.fields.name?.issues[0]?.message).toBe("Name rejected")

    const old = form.trigger("name")
    await called(calls, 2)
    form.setValue("name", "new snapshot")
    const current = form.trigger("name")
    await called(calls, 3)
    expect(calls[2]!.input.name).toBe("new snapshot")
    await promptly(old, false)
    calls[2]!.task.resolve(oldSuccess ? failure : success)
    expect(await current).toBe(!oldSuccess)
    calls[1]!.task.resolve(oldSuccess ? success : failure)
    await Promise.resolve()
    await expect.poll(() => form.state.errors.fields.name?.issues.length ?? 0).toBe(oldSuccess ? 1 : 0)
    expect(form.state.isValidating).toBe(false)
  })

  it("merges pending targets into a new snapshot when the next request names an unrelated field", async () => {
    const { schema, calls } = controlledSchema()
    await mount(<Fixture schema={schema} />)
    const first = form.trigger("name")
    await called(calls, 1)
    const second = form.trigger("email")
    await called(calls, 2)
    await promptly(first, false)
    calls[1]!.task.resolve({ issues: [
      { message: "Name still invalid", path: ["name"] },
      { message: "Email invalid", path: ["email"] },
    ] })
    expect(await second).toBe(false)
    expect(form.state.errors.fields.name?.issues[0]?.message).toBe("Name still invalid")
    expect(form.state.errors.fields.email?.issues[0]?.message).toBe("Email invalid")
    calls[0]!.task.resolve(success)
    await Promise.resolve()
    expect(form.getFieldState("name").invalid).toBe(true)
  })

  it("coalesces synchronous requests, keeps local success unvalidated and never manufactures valid by clearing errors", async () => {
    const { schema, calls } = controlledSchema()
    await mount(<Fixture schema={schema} />)
    const name = form.trigger("name")
    const email = form.trigger("email")
    await called(calls, 1)
    calls[0]!.task.resolve(success)
    expect(await name).toBe(true)
    expect(await email).toBe(true)
    expect(form.state.validationStatus).toBe("unvalidated")
    const full = form.trigger()
    await called(calls, 2)
    calls[1]!.task.resolve(failure)
    expect(await full).toBe(false)
    form.clearErrors()
    expect(form.state.validationStatus).toBe("invalid")
  })

  it.each(["reset", "cancelPending", "unmount"] as const)("settles a pending batch immediately on %s and swallows its late rejection", async (operation) => {
    const { schema, calls } = controlledSchema()
    const unhandled = vi.fn((event: PromiseRejectionEvent) => event.preventDefault())
    window.addEventListener("unhandledrejection", unhandled)
    try {
      await mount(<StrictMode><Fixture schema={schema} /></StrictMode>)
      const pending = form.trigger()
      await called(calls, 1)
      if (operation === "unmount") root.render(<p>Disconnected</p>)
      else form[operation]()
      await promptly(pending, false)
      if (operation === "unmount") await mount(<StrictMode><Fixture schema={schema} /></StrictMode>)
      calls[0]!.task.reject(new Error("obsolete validator rejection"))
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      expect(form.state.errors.fields).toEqual({})
      expect(form.state.isValidating).toBe(false)
      expect(unhandled).not.toHaveBeenCalled()
    } finally { window.removeEventListener("unhandledrejection", unhandled) }
  })

  it.each(["setValue", "trigger"] as const)("cancels preflight promptly on %s, releases its lock and denies the old validator submit permission", async (operation) => {
    const { schema, calls } = controlledSchema()
    const onSubmit = vi.fn()
    await mount(<Fixture schema={schema} onSubmit={onSubmit} />)
    const first = form.submit()
    expect(form.submit()).toBe(first)
    expect(form.state.submitCount).toBe(1)
    await called(calls, 1)
    let background: Promise<boolean> | undefined
    if (operation === "setValue") form.setValue("name", "Grace")
    else background = form.trigger("email")
    await promptly(first, { status: "cancelled" })
    expect(form.state.isSubmitting).toBe(false)
    calls[0]!.task.resolve(success)
    if (background) {
      await called(calls, 2)
      calls[1]!.task.resolve(success)
      await background
    }
    expect(onSubmit).not.toHaveBeenCalled()
    const retry = form.submit()
    await called(calls, background ? 3 : 2)
    calls.at(-1)!.task.resolve({ value: { ...defaults, name: form.getValues("name") } })
    expect(await retry).toEqual({ status: "submitted" })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(form.state.submitCount).toBe(2)
  })

  it("absorbs queued blur into preflight and records touched during the submit lock without spawning a replacement batch", async () => {
    const { schema, calls } = controlledSchema()
    const callback = deferred<void>()
    const onSubmit = vi.fn(() => callback.promise)
    await mount(<Fixture schema={schema} mode="onBlur" onSubmit={onSubmit} />)
    const input = page.getByRole("textbox", { name: "Name", exact: true }).element() as HTMLInputElement
    input.focus()
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    const submitted = form.submit()
    await called(calls, 1)
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    calls[0]!.task.resolve(success)
    await expect.poll(() => onSubmit.mock.calls.length).toBe(1)
    expect(form.getFieldState("name").isTouched).toBe(true)
    expect(calls).toHaveLength(1)
    expect(form.submit()).toBe(submitted)
    callback.resolve()
    expect(await submitted).toEqual({ status: "submitted" })
  })

  it("reports a business failure for the submitted snapshot while protecting an edited draft from stale server errors", async () => {
    const { schema, calls } = controlledSchema()
    const callback = deferred<void>()
    let context!: FormSubmitContext<Values>
    await mount(<Fixture schema={schema} onSubmit={(_data, next) => { context = next; return callback.promise }} />)
    const pending = form.submit()
    await called(calls, 1)
    calls[0]!.task.resolve(success)
    await expect.poll(() => context).toBeDefined()
    form.setValue("name", "New draft")
    context.setFieldError("name", { message: "Old name already taken" })
    context.setFormError("Old submission rejected")
    expect(form.state.errors.fields.name).toBeUndefined()
    expect(form.state.errors.root.submit).toBeUndefined()
    callback.resolve()
    expect(await pending).toEqual({ status: "failed" })
    expect(form.getValues("name")).toBe("New draft")
  })

  it("cancels a forever pending callback, blocks its context and prevents its finally from unlocking a new attempt", async () => {
    const { schema, calls } = controlledSchema()
    const callbacks = [deferred<void>(), deferred<void>()]
    const contexts: FormSubmitContext<Values>[] = []
    await mount(<Fixture schema={schema} onSubmit={(_data, context) => {
      contexts.push(context)
      return callbacks[contexts.length - 1]!.promise
    }} />)
    const first = form.submit()
    await called(calls, 1)
    calls[0]!.task.resolve(success)
    await expect.poll(() => contexts.length).toBe(1)
    await expect.element(page.getByTestId("parent-status")).toHaveTextContent("submitting")
    await expect.element(page.getByTestId("context-status")).toHaveTextContent('"submitting":true')
    form.cancelPending()
    await promptly(first, { status: "cancelled" })
    expect(contexts[0]!.signal.aborted).toBe(true)
    await expect.element(page.getByTestId("parent-status")).toBeEnabled()
    const second = form.submit()
    await called(calls, 2)
    calls[1]!.task.resolve(success)
    await expect.poll(() => contexts.length).toBe(2)
    contexts[0]!.setFieldError("name", { message: "obsolete" })
    contexts[0]!.setFormError("obsolete root")
    callbacks[0]!.resolve()
    await Promise.resolve()
    expect(form.state.isSubmitting).toBe(true)
    expect(form.submit()).toBe(second)
    expect(form.state.errors.fields.name).toBeUndefined()
    expect(form.state.errors.root.submit).toBeUndefined()
    callbacks[1]!.resolve()
    expect(await second).toEqual({ status: "submitted" })
    await expect.element(page.getByTestId("parent-status")).toHaveTextContent("idle")
    await expect.element(page.getByTestId("context-status")).toHaveTextContent('"submitting":false')
    expect(form.state.submitCount).toBe(2)
  })

  it("updates a parent that only reads form.state during validation start, completion and cancellation", async () => {
    const { schema, calls } = controlledSchema()
    await mount(<Fixture schema={schema} />)
    const first = form.trigger()
    await called(calls, 1)
    await expect.element(page.getByTestId("parent-status")).toBeDisabled()
    await expect.element(page.getByTestId("context-status")).toHaveTextContent('"validating":true')
    calls[0]!.task.resolve(success)
    expect(await first).toBe(true)
    await expect.element(page.getByTestId("parent-status")).toBeEnabled()
    const next = form.trigger()
    await called(calls, 2)
    form.cancelPending()
    expect(await next).toBe(false)
    await expect.element(page.getByTestId("parent-status")).toHaveTextContent("idle")
    await expect.element(page.getByTestId("context-status")).toHaveTextContent('"validating":false')
    calls[1]!.task.resolve(failure)
    await Promise.resolve()
    expect(form.state.errors.fields.name).toBeUndefined()
  })
})
