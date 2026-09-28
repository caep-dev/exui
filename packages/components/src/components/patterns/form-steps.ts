import type { Internal } from "@/lib/forms/context"
import { assertId, normalizePaths, within } from "@/lib/forms/paths"
import type { FormErrors, FormInstance, FormPath, FormStep, FormValidationScope, FormValues } from "@/lib/forms/types"

interface Navigation {
  owner: object
  version: number
  from: string | undefined
  to?: string
  promise: Promise<boolean>
  settle(value: boolean): void
}

function deferred(from: string | undefined, version: number): Navigation {
  let resolve!: (value: boolean) => void
  let settled = false
  const promise = new Promise<boolean>((done) => { resolve = done })
  return { owner: {}, version, from, promise, settle(value) { if (!settled) { settled = true; resolve(value) } } }
}

export function stepStructure<I extends FormValues>(steps: readonly FormStep<I>[], fieldNames: readonly string[]): string {
  const seen = new Set<string>()
  const attribution = new Map<string, string>()
  const entries = steps.map((step) => {
    assertId(step.id)
    if (seen.has(step.id)) throw new Error(`ExUI ExForm: duplicate step id '${step.id}'.`)
    seen.add(step.id)
    if (step.kind === "review") return [step.id, "review"]
    const fields = normalizePaths(step.fields)
    for (const name of fields) {
      if (!fieldNames.includes(name)) throw new Error(`ExUI ExForm: step field '${name}' is not a configured field or list.`)
      if (attribution.has(name)) throw new Error(`ExUI ExForm: '${name}' belongs to more than one step.`)
      attribution.set(name, step.id)
    }
    return [step.id, "edit", fields, normalizePaths(step.validationDependencies ?? [])]
  })
  if (steps.length) for (const name of fieldNames) {
    if (!attribution.has(name)) throw new Error(`ExUI ExForm: '${name}' must belong to one editable step.`)
  }
  return JSON.stringify(entries)
}

// This owns only navigation tasks. Values, errors and validation batches stay in
// the single form instance and navigation cancels only its validation demands.
export class FormStepsController<I extends FormValues, O> {
  private steps: readonly FormStep<I>[]
  private structure: string
  private controlled: boolean
  private current: string | undefined
  private removedControlledCurrent?: string
  private onChange?: (id: string) => void
  private active = true
  private navigationVersion = 0
  private task?: Navigation
  private listeners = new Set<() => void>()
  private releaseScopes: (() => void)[] = []
  private scopeOwner = {}
  private scopeSchemas = new Map<string, unknown>()

  constructor(private form: FormInstance<I, O>, private internal: Internal<I, O>, steps: readonly FormStep<I>[], fields: readonly string[], current?: string) {
    this.steps = steps
    this.structure = stepStructure(steps, fields)
    this.controlled = current !== undefined
    this.current = current ?? steps[0]?.id
    this.assertCurrent(this.current)
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.current
  private emit() { this.listeners.forEach((listener) => listener()) }
  private assertCurrent(id: string | undefined) {
    if (id !== undefined && !this.steps.some((step) => step.id === id)) throw new Error(`ExUI ExForm: unknown current step '${id}'.`)
  }
  private clearTask() {
    this.navigationVersion++
    if (this.task) { this.internal.cancelValidationOwner(this.task.owner); this.task.settle(false); this.task = undefined }
  }
  activate() { this.active = true }
  dispose() { this.active = false; this.clearTask(); this.releaseScopes.forEach((release) => release()); this.releaseScopes = []; this.scopeSchemas.clear() }
  update(steps: readonly FormStep<I>[], fields: readonly string[], current: string | undefined, onChange?: (id: string) => void) {
    const structure = stepStructure(steps, fields)
    const structureChanged = structure !== this.structure
    const currentRemoved = structureChanged && current === this.current && this.current !== undefined
      && this.steps.some((step) => step.id === this.current) && !steps.some((step) => step.id === this.current)
    const schemas = new Map(steps.filter((step) => step.kind !== "review").map((step) => [step.id, step.validationSchema]))
    const definitionsChanged = structureChanged || schemas.size !== this.scopeSchemas.size || [...schemas].some(([id, schema]) => this.scopeSchemas.get(id) !== schema)
    this.onChange = onChange
    this.controlled = current !== undefined
    if (definitionsChanged) {
      this.clearTask()
      this.releaseScopes.forEach((release) => release())
      this.releaseScopes = []
    }
    this.steps = steps
    this.structure = structure
    if (definitionsChanged) {
      this.scopeSchemas = schemas
      this.releaseScopes = steps.filter((step) => step.kind !== "review").map((step) => this.internal.declareScope(this.scope(step), this.scopeOwner))
    }
    if (this.controlled) {
      if (!steps.some((step) => step.id === current)) {
        // A committed structure can remove a previously valid controlled id.
        // Keep that historical id pending its parent's confirmation; unrelated
        // unknown ids remain usage errors, including on ordinary rerenders.
        if (!currentRemoved && current !== this.removedControlledCurrent) this.assertCurrent(current)
        this.removedControlledCurrent = current
        const first = steps[0]?.id
        if (first === undefined) {
          if (this.current !== undefined) { this.current = undefined; this.emit() }
        } else if (currentRemoved || definitionsChanged) {
          this.apply(this.begin(), first)
        }
        return
      }
      this.removedControlledCurrent = undefined
      this.assertCurrent(current)
      if (current !== this.current) {
        const task = this.task
        if (task && task.to === current && task.from === this.current && task.version === this.navigationVersion) {
          this.current = current
          this.task = undefined
          task.settle(true)
        } else { this.clearTask(); this.current = current }
        this.emit()
      }
    } else {
      this.removedControlledCurrent = undefined
      if (!this.steps.some((step) => step.id === this.current)) {
        this.current = this.steps[0]?.id
        this.emit()
      }
    }
  }
  private scope(step: FormStep<I>): FormValidationScope<I> {
    if (step.kind === "review") throw new Error("ExUI ExForm: review steps have no validation scope.")
    return { id: step.id, fields: step.fields, validationSchema: step.validationSchema, validationDependencies: step.validationDependencies }
  }
  private alive(task: Navigation) { return this.active && this.task === task && task.version === this.navigationVersion && this.current === task.from }
  private apply(task: Navigation, to: string) {
    if (!this.alive(task)) return
    task.to = to
    if (this.controlled) {
      // The task stays pending until this exact request is confirmed by props.
      this.onChange?.(to)
    } else {
      this.current = to
      this.task = undefined
      this.emit()
      task.settle(true)
      this.onChange?.(to)
    }
  }
  private begin(): Navigation {
    this.clearTask()
    const task = deferred(this.current, this.navigationVersion)
    this.task = task
    return task
  }
  get index() { return this.steps.findIndex((step) => step.id === this.current) }
  get isFirst() { return !this.steps.length || this.index === 0 }
  get isLast() { return !this.steps.length || this.index === this.steps.length - 1 }
  next = (): Promise<boolean> => {
    const index = this.index
    if (index < 0 || index >= this.steps.length - 1) { this.clearTask(); return Promise.resolve(false) }
    return this.goTo(this.steps[index + 1].id)
  }
  back = (): void => {
    const task = this.begin()
    if (this.index <= 0) { this.task = undefined; task.settle(false); return }
    this.apply(task, this.steps[this.index - 1].id)
  }
  goTo = (id: string): Promise<boolean> => {
    this.assertCurrent(id)
    const task = this.begin()
    const from = this.index
    const target = this.steps.findIndex((step) => step.id === id)
    if (target === from) { this.task = undefined; task.settle(true); return task.promise }
    void (async () => {
      if (target > from) for (let index = Math.max(0, from); index < target; index++) {
        if (!this.alive(task)) return
        const step = this.steps[index]
        if (step.kind !== "review" && !(await this.internal.validateOwnedScope(this.scope(step), task.owner))) {
          if (this.task === task) { this.task = undefined; task.settle(false) }
          return
        }
      }
      this.apply(task, id)
    })().catch(() => { if (this.task === task) { this.task = undefined; task.settle(false) } })
    return task.promise
  }
  cancel = () => { this.clearTask() }
  reset = () => {
    const task = this.begin()
    const first = this.steps[0]?.id
    if (!first || this.current === first) { this.task = undefined; task.settle(false); return }
    this.apply(task, first)
  }
  stepFor(name: string): string | undefined {
    return this.steps.find((step) => step.kind !== "review" && step.fields.some((path) => within(name, path)))?.id
  }
  private focus(name: string, version: number, step: string | undefined, frame = 0) {
    if (!this.active || version !== this.navigationVersion || this.current !== step || typeof document === "undefined") return
    const meta = this.internal.getFieldMetadata(name)
    const target = typeof meta?.focus === "function" ? meta.focus() : meta?.focus
    const container = typeof meta?.container === "function" ? meta.container() : meta?.container
    if (target?.isConnected || container?.isConnected) { this.form.scrollToField(name as FormPath<I>, { focus: true }); return }
    if (frame < 2 && typeof requestAnimationFrame === "function") requestAnimationFrame(() => this.focus(name, version, step, frame + 1))
  }
  navigateToField = (name: string): void => {
    const step = this.stepFor(name)
    const task = this.begin()
    if (!step || step === this.current) {
      this.task = undefined
      task.settle(true)
      this.focus(name, task.version, this.current)
      return
    }
    this.apply(task, step)
    void task.promise.then((arrived) => { if (arrived) this.focus(name, task.version, step) })
  }
  focusErrors = (errors: FormErrors<I>): void => {
    const names = Object.keys(errors.fields)
    const sorted = [...names].sort((a, b) => {
      const aStep = this.steps.findIndex((step) => step.id === this.stepFor(a))
      const bStep = this.steps.findIndex((step) => step.id === this.stepFor(b))
      return (aStep < 0 ? Infinity : aStep) - (bStep < 0 ? Infinity : bStep)
    })
    if (sorted[0]) this.navigateToField(sorted[0])
  }
}
