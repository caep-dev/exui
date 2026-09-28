import type { FieldPath, UseFormReturn, FormState as RHFFormState } from "react-hook-form"
import type { FieldMetadata, Internal, OwnerOptions } from "./context"
import type { FormDefaults, FormErrorInput, FormInstance, FormMode, FormSchema, FormState, FormSubmitResult, FormValidationScope, FormValues } from "./types"
import { assertId, declaredFromValues, equalValue, hasMarked, normalizePaths, overlaps, parsePath, project, readPath, snapshot, within } from "./paths"
import { createErrorBridge, runSchema, schemaRecords } from "./validation"

interface Deferred<T> { promise: Promise<T>; settle(value: T): void }
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let settled = false
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, settle(value) { if (!settled) { settled = true; resolve(value) } } }
}
interface ValidationResult { valid: boolean; output?: unknown; error?: unknown; failed?: boolean; cancelled?: boolean }
interface ScopeDefinition<I extends FormValues> { scope: FormValidationScope<I>; fields: string[]; dependencies: string[]; version: number; owners: Map<object, number> }
interface Demand { full: boolean; names?: string[]; scopeId?: string; scopeVersion?: number; owner?: object; result: Deferred<ValidationResult>; submit?: number; shouldFocus?: boolean }
interface Batch { epoch: number; revision: number; id: number; demands: Demand[]; demandChanged: Deferred<void> }
type ValidationEntry = { kind: "full"; result?: Awaited<ReturnType<typeof runSchema>>; error?: unknown } | { kind: "scope"; id: string; version: number; result?: Awaited<ReturnType<typeof runSchema>>; error?: unknown; cancelled?: boolean }
interface ValidationTask { full: boolean; scopeId?: string; scopeVersion?: number; promise: Promise<ValidationEntry> }
interface Attempt { id: number; epoch: number; revision: number; controller: AbortController; result: Deferred<FormSubmitResult>; phase: "validating" | "submitting"; businessFailed: boolean }
type BaseState<I extends FormValues> = Pick<RHFFormState<I>, "isDirty" | "dirtyFields" | "touchedFields">

export function createCoordinator<I extends FormValues, O>(rhf: UseFormReturn<I>, schema: FormSchema, options: { mode?: FormMode; reValidateMode?: FormMode }): { form: FormInstance<I, O>; internal: Internal<I, O> } {
  const bridge = createErrorBridge(rhf)
  const listeners = new Set<() => void>()
  const metadata = new Map<string, FieldMetadata>()
  const metadataLayers = new Map<string, { token: object; metadata: FieldMetadata }[]>()
  const fieldDeclarations = new Map<string, number>()
  const scopes = new Map<string, ScopeDefinition<I>>()
  const scopeVersions = new Map<string, number>()
  let epoch = 0, revision = 0, requestId = 0, attemptId = 0, submitCount = 0
  let validationStatus: FormState<I>["validationStatus"] = "unvalidated"
  let revalidating = false
  let connected: { owner: object; options: OwnerOptions<I, O> } | undefined
  let active: Batch | undefined
  let queued: Demand[] = []
  let flushQueued = false
  let attempt: Attempt | undefined
  let transactionDepth = 0, publishPending = false
  let base: BaseState<I> = rhf.formState
  let cached: FormState<I>

  function buildSnapshot(): FormState<I> {
    return snapshot({ isDirty: base.isDirty, dirtyFields: base.dirtyFields, touchedFields: base.touchedFields, errors: bridge.derive(), isValidating: !!active || queued.length > 0, isSubmitting: !!attempt, submitCount, validationStatus }) as FormState<I>
  }
  cached = buildSnapshot()
  const serverSnapshot = cached
  function publish(): void {
    if (transactionDepth) { publishPending = true; return }
    const next = buildSnapshot()
    if (equalValue(cached, next)) return
    cached = next
    for (const listener of listeners) listener()
  }
  function transaction(write: () => void): void {
    transactionDepth++
    try { write() } finally { transactionDepth--; if (!transactionDepth && publishPending) { publishPending = false; publish() } }
  }
  function mode(): FormMode { return revalidating ? options.reValidateMode ?? "onChange" : options.mode ?? "onSubmit" }
  function settleAttempt(current: Attempt, status: FormSubmitResult["status"]): void {
    current.result.settle({ status })
    if (attempt?.id === current.id) { attempt = undefined; publish() }
  }
  function cancelAttempt(): void { if (attempt) { const current = attempt; current.controller.abort(); settleAttempt(current, "cancelled") } }
  function discardBatch(batch: Batch, carry: boolean): Demand[] {
    batch.demandChanged.settle(undefined)
    for (const demand of batch.demands) demand.result.settle({ valid: false, cancelled: true })
    if (attempt?.phase === "validating" && batch.demands.some(d => d.submit === attempt?.id)) cancelAttempt()
    return carry ? batch.demands.filter(d => !d.submit).map(d => ({ ...d, result: deferred<ValidationResult>() })) : []
  }
  function cancelValidations(): void {
    if (active) discardBatch(active, false)
    active = undefined
    for (const demand of queued) demand.result.settle({ valid: false, cancelled: true })
    queued = []
    publish()
  }
  function cancel(notify = true): void {
    epoch++
    transaction(() => { cancelAttempt(); cancelValidations(); if (notify) connected?.options.onCancel?.(); publish() })
  }
  function currentAttempt(current: Attempt): boolean { return attempt?.id === current.id && current.epoch === epoch && !current.controller.signal.aborted }
  function isCurrent(batch: Batch): boolean { return active === batch && batch.epoch === epoch && batch.revision === revision && batch.id === requestId }
  function declared(): Set<string> {
    const paths = declaredFromValues(rhf.getValues())
    for (const path of fieldDeclarations.keys()) paths.add(path)
    for (const path of metadata.keys()) paths.add(path)
    for (const def of scopes.values()) for (const path of [...def.fields, ...def.dependencies]) paths.add(path)
    return paths
  }
  function focusErrors(): void {
    const errors = bridge.derive()
    if (connected?.options.focusErrors) connected.options.focusErrors(errors)
    else { const path = Object.keys(errors.fields)[0]; if (path) internal.navigateToField(path) }
  }
  function removeExecution(owner: string): void { bridge.update(record => record.issue.source === "execution" && record.owner === owner) }
  function execution(error: unknown, owner: string, scopeId?: string): void {
    bridge.add("root.execution", { message: connected?.options.submitErrorMessage ?? "表单操作失败，请重试。" }, "execution", owner)
    // Keep the originating scope owner on execution records as well as schema records.
    if (scopeId) bridge.update(record => record.issue.source === "execution" && record.owner === owner, bridge.read().filter(record => record.issue.source === "execution" && record.owner === owner).map(record => ({ ...record, issue: { ...record.issue, scopeId } })))
    try { connected?.options.onSubmitError?.(error) } catch { /* callback errors must not strand a lock */ }
  }
  async function execute(batch: Batch): Promise<void> {
    const value = snapshot(rhf.getValues())
    const available = declared()
    const fullDemands = batch.demands.filter(d => d.full)
    const scopeIds = [...new Set(batch.demands.flatMap(d => d.scopeId ? [d.scopeId] : []))]
    const tasks: ValidationTask[] = [
      ...(fullDemands.length ? [{ full: true, promise: runSchema(schema, value).then(result => ({ kind: "full" as const, result }), error => ({ kind: "full" as const, error })) }] : []),
      ...scopeIds.map(id => {
        const def = scopes.get(id)
        return { full: false, scopeId: id, scopeVersion: def?.version ?? -1, promise: (async (): Promise<ValidationEntry> => {
          if (!def) return { kind: "scope", id, version: -1, cancelled: true }
          try { return { kind: "scope", id, version: def.version, result: await runSchema(def.scope.validationSchema, project(value, [...def.fields, ...def.dependencies])) } }
          catch (error) { return { kind: "scope", id, version: def.version, error } }
        })() }
      }),
    ]
    let results: ValidationEntry[] = []
    while (isCurrent(batch)) {
      // Revoked validators have no waiting rights. Keep each surviving task's
      // original Promise, including a scope still needed by another owner.
      const required = tasks.filter(task => batch.demands.some(demand => task.full ? demand.full : demand.scopeId === task.scopeId && demand.scopeVersion === task.scopeVersion))
      const completed = await Promise.race([
        Promise.all(required.map(task => task.promise)).then(entries => ({ kind: "results" as const, entries })),
        batch.demandChanged.promise.then(() => ({ kind: "changed" as const })),
      ])
      if (completed.kind === "results") { results = completed.entries; break }
    }
    if (!isCurrent(batch)) return
    transaction(() => {
      for (const entry of results) {
        if (!isCurrent(batch)) return
        const demands = entry.kind === "full" ? batch.demands.filter(d => d.full) : batch.demands.filter(d => d.scopeId === entry.id && d.scopeVersion === entry.version)
        if (!demands.length || (entry.kind === "scope" && scopes.get(entry.id)?.version !== entry.version)) continue
        const owner = entry.kind === "full" ? "full" : `scope:${entry.id}`
        if ("error" in entry) {
          execution(entry.error, owner, entry.kind === "scope" ? entry.id : undefined)
          if (entry.kind === "full" && demands.some(d => !d.names)) validationStatus = "invalid"
          for (const d of demands) d.result.settle({ valid: false, error: entry.error, failed: true })
          continue
        }
        if (!("result" in entry) || !entry.result) { for (const d of demands) d.result.settle({ valid: false, cancelled: true }); continue }
        removeExecution(owner)
        const def = entry.kind === "scope" ? scopes.get(entry.id) : undefined
        const failureWithoutIssues = entry.result.issues !== undefined && entry.result.issues.length === 0
        const records = schemaRecords(entry.result.issues ?? [], available, def ? { id: def.scope.id, projection: [...def.fields, ...def.dependencies] } : undefined)
        const complete = entry.kind === "full" && demands.some(d => !d.names)
        const selected = normalizePaths(demands.flatMap(d => d.names ?? []))
        const additions = entry.kind === "scope" || complete ? records : records.filter(record => record.target.kind === "root" || selected.some(name => record.target.kind === "field" && within(record.target.path, name)))
        bridge.update(record => record.issue.source === "schema" && (complete || (record.owner === owner && (entry.kind === "scope" || record.target.kind === "root" || selected.some(name => record.target.kind === "field" && within(record.target.path, name))))), additions)
        if (complete) validationStatus = entry.result.issues !== undefined ? "invalid" : "valid"
        for (const d of demands) {
          const relevant = entry.kind === "scope" || !d.names ? records : records.filter(record => record.target.kind === "root" || d.names?.some(name => record.target.kind === "field" && within(record.target.path, name)))
          const valid = !failureWithoutIssues && !relevant.length
          d.result.settle({ valid, ...("value" in entry.result ? { output: entry.result.value } : {}) })
          if (!valid && d.shouldFocus) focusErrors()
        }
      }
      if (active === batch) active = undefined
      publish()
    })
  }
  function flush(): void {
    flushQueued = false
    if (!queued.length) return
    const demands = queued
    queued = []
    if (active) demands.push(...discardBatch(active, true))
    const batch: Batch = { epoch, revision, id: ++requestId, demands, demandChanged: deferred<void>() }
    active = batch
    publish()
    void execute(batch).catch(error => { if (isCurrent(batch)) { for (const d of batch.demands) d.result.settle({ valid: false, error, failed: true }); active = undefined; publish() } })
  }
  function request(demand: Omit<Demand, "result">, explicit = true): Promise<ValidationResult> {
    if (explicit && attempt?.phase === "validating" && !demand.submit) cancelAttempt()
    const next = { ...demand, result: deferred<ValidationResult>() }
    queued.push(next)
    if (!flushQueued) { flushQueued = true; queueMicrotask(flush) }
    publish()
    return next.result.promise
  }
  function invalidate(name?: string): void {
    if (name) parsePath(name)
    revision++
    validationStatus = "unvalidated"
    transaction(() => {
      if (attempt?.phase === "validating") cancelAttempt()
      if (active) { queued.push(...discardBatch(active, true)); active = undefined }
      bridge.update(record => record.issue.source === "server" && (!name || (record.target.kind === "field" && overlaps(record.target.path, name))))
      if (queued.length && !flushQueued) { flushQueued = true; queueMicrotask(flush) }
      publish()
    })
  }
  function defineScope(scope: FormValidationScope<I>, owner?: object): ScopeDefinition<I> {
    assertId(scope.id)
    const fields = normalizePaths(scope.fields), dependencies = normalizePaths(scope.validationDependencies ?? [])
    const previous = scopes.get(scope.id)
    const same = previous && previous.scope.validationSchema === scope.validationSchema && equalValue(previous.fields, fields) && equalValue(previous.dependencies, dependencies)
    if (same) { if (owner) previous.owners.set(owner, (previous.owners.get(owner) ?? 0) + 1); return previous }
    if (previous && owner && [...previous.owners.keys()].some(existing => existing !== owner)) throw new Error(`ExForm: incompatible committed definitions for scope "${scope.id}".`)
    if (previous) {
      transaction(() => {
        cancelScope(scope.id)
        bridge.update(record => record.owner === `scope:${scope.id}` && (record.issue.source === "schema" || record.issue.source === "execution"))
        publish()
      })
    }
    const version = (scopeVersions.get(scope.id) ?? 0) + 1
    scopeVersions.set(scope.id, version)
    const def: ScopeDefinition<I> = { scope, fields, dependencies, version, owners: previous?.owners ?? new Map() }
    if (owner) def.owners.set(owner, (def.owners.get(owner) ?? 0) + 1)
    scopes.set(scope.id, def)
    return def
  }
  function removeDemands(matches: (demand: Demand) => boolean): void {
    const remove = (demand: Demand) => { if (matches(demand)) { demand.result.settle({ valid: false, cancelled: true }); return false } return true }
    queued = queued.filter(remove)
    if (active) {
      const batch = active
      const remaining = batch.demands.filter(remove)
      if (remaining.length !== batch.demands.length) {
        batch.demands = remaining
        const changed = batch.demandChanged
        batch.demandChanged = deferred<void>()
        if (!remaining.length) active = undefined
        changed.settle(undefined)
      }
    }
    publish()
  }
  function cancelScope(id: string): void { removeDemands(demand => demand.scopeId === id) }
  function validateScope(scope: FormValidationScope<I>, owner?: object, shouldFocus = false): Promise<boolean> {
    const def = defineScope(scope)
    return request({ full: false, scopeId: scope.id, scopeVersion: def.version, owner, shouldFocus }).then(r => r.valid)
  }
  function schedule(name: string, event: "onBlur" | "onChange", scope?: FormValidationScope<I>): void {
    if (attempt || mode() !== event) return
    if (scope) void validateScope(scope)
    else void request({ full: true, names: [name] }, false)
  }
  function reset(values?: FormDefaults<I>): void {
    transaction(() => {
      cancel(false)
      revision++
      rhf.reset(values)
      bridge.clear()
      base = { isDirty: false, dirtyFields: {}, touchedFields: {} } as BaseState<I>
      submitCount = 0; revalidating = false; validationStatus = "unvalidated"
      connected?.options.onReset?.()
      publish()
    })
  }
  function submit(): Promise<FormSubmitResult> {
    if (attempt) return attempt.result.promise
    if (!connected) return Promise.reject(new Error("ExForm: submit requires a connected Form."))
    if (connected.options.canSubmit && !connected.options.canSubmit()) return Promise.reject(new Error("ExForm: submit is available only on the final step; use next/goTo first."))
    const current: Attempt = { id: ++attemptId, epoch, revision, controller: new AbortController(), result: deferred<FormSubmitResult>(), phase: "validating", businessFailed: false }
    attempt = current; submitCount++
    transaction(() => {
      bridge.update(record => record.issue.source === "server" || record.issue.source === "execution")
      // Absorb queued event validation into the authoritative complete preflight.
      for (const d of queued) d.result.settle({ valid: false, cancelled: true })
      queued = []
      if (active) { discardBatch(active, false); active = undefined }
      // discardBatch can only cancel the attempt if its batch belongs to this attempt.
      publish()
    })
    const ownerOptions = connected.options
    void request({ full: true, submit: current.id }, false).then(async result => {
      if (!currentAttempt(current)) return
      if (result.cancelled) { current.controller.abort(); settleAttempt(current, "cancelled"); return }
      if (result.failed) { revalidating = true; settleAttempt(current, "failed"); return }
      if (!result.valid) {
        revalidating = true
        try { ownerOptions.onInvalid?.(bridge.derive()); focusErrors() } catch { /* remain unlocked */ }
        settleAttempt(current, "invalid"); return
      }
      if (current.revision !== revision) { current.controller.abort(); settleAttempt(current, "cancelled"); return }
      current.phase = "submitting"; publish()
      function businessError(name: string, error: FormErrorInput): void {
        if (!currentAttempt(current)) return
        current.businessFailed = true
        if (current.revision !== revision) return
        bridge.add(name, error, "server", `submit:${current.id}`)
        publish()
      }
      try {
        await ownerOptions.onSubmit(result.output as O, { signal: current.controller.signal, setFieldError: (name, error) => businessError(name, error), setFormError: error => businessError("root.submit", typeof error === "string" ? { message: error } : error) })
        if (currentAttempt(current)) { if (current.businessFailed) revalidating = true; settleAttempt(current, current.businessFailed ? "failed" : "submitted") }
      } catch (error) {
        if (currentAttempt(current)) {
          revalidating = true
          if (current.revision === revision) execution(error, `submit:${current.id}`)
          else { try { ownerOptions.onSubmitError?.(error) } catch { /* preserve failed settlement */ } }
          settleAttempt(current, "failed")
        }
      }
    }).catch(error => { if (currentAttempt(current)) { execution(error, `submit:${current.id}`); settleAttempt(current, "failed") } })
    return current.result.promise
  }
  const facade = {
    get state() { return cached },
    getValues(name?: string) { if (name) parsePath(name); return snapshot(name ? readPath(rhf.getValues(), name) : rhf.getValues()) },
    setValue(name: string, value: unknown, setOptions?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }) {
      parsePath(name)
      transaction(() => {
        if (!equalValue(readPath(rhf.getValues(), name), value)) invalidate(name)
        rhf.setValue(name as FieldPath<I>, value as never, { shouldDirty: setOptions?.shouldDirty ?? true, shouldTouch: setOptions?.shouldTouch ?? false, shouldValidate: false })
        publish()
      })
      if (setOptions?.shouldValidate) void request({ full: true, names: [name] })
    },
    reset,
    resetField(name: string, resetOptions?: { defaultValue?: unknown }) {
      parsePath(name)
      transaction(() => { invalidate(name); rhf.resetField(name as FieldPath<I>, resetOptions as never); bridge.clear([name]); publish() })
    },
    setError(name: string, error: FormErrorInput) { transaction(() => { bridge.add(name, error, "manual", "manual"); publish() }) },
    clearErrors(names?: string | readonly string[]) { transaction(() => { bridge.clear(names === undefined ? undefined : typeof names === "string" ? [names] : names); publish() }) },
    getFieldState(name: string) {
      parsePath(name)
      const issues = bridge.read().filter(record => record.target.kind === "field" && within(record.target.path, name)).map(record => record.issue)
      const demands = [...(active?.demands ?? []), ...queued]
      return snapshot({ isDirty: hasMarked(readPath(base.dirtyFields, name)), isTouched: hasMarked(readPath(base.touchedFields, name)), invalid: !!issues.length, issues, isValidating: demands.some(d => d.full ? !d.names || d.names.some(p => overlaps(p, name)) : scopes.get(d.scopeId ?? "")?.fields.some(p => overlaps(p, name))) })
    },
    setFocus(name: string, focusOptions?: { shouldSelect?: boolean }) {
      parsePath(name)
      const target = metadata.get(name)?.focus
      const element = typeof target === "function" ? target() : target
      if (element?.isConnected) { element.focus(); if (focusOptions?.shouldSelect && "select" in element && typeof element.select === "function") element.select() }
    },
    scrollToField(name: string, scrollOptions?: { focus?: boolean; behavior?: ScrollBehavior }) {
      parsePath(name)
      const field = metadata.get(name)
      const target = field?.container ?? field?.focus
      const element = typeof target === "function" ? target() : target
      if (!element?.isConnected) return
      let behavior = scrollOptions?.behavior ?? "smooth"
      if (element.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches) behavior = "auto"
      element.scrollIntoView({ behavior, block: "nearest", inline: "nearest" })
      if (scrollOptions?.focus) facade.setFocus(name)
    },
    trigger(names?: string | readonly string[], triggerOptions?: { shouldFocus?: boolean }) { const paths = names === undefined ? undefined : normalizePaths(typeof names === "string" ? [names] : names); return request({ full: true, names: paths, shouldFocus: triggerOptions?.shouldFocus }).then(r => r.valid) },
    validateScope(scope: FormValidationScope<I>, validateOptions?: { shouldFocus?: boolean }) { return validateScope(scope, undefined, validateOptions?.shouldFocus) },
    submit,
    cancelPending() { cancel() },
  }
  const form = facade as unknown as FormInstance<I, O>
  const internal: Internal<I, O> = {
    rhf,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => cached,
    getServerSnapshot: () => serverSnapshot,
    connect(owner, ownerOptions) {
      if (connected && connected.owner !== owner) throw new Error("ExForm: one instance can connect to only one Form.")
      transaction(() => { epoch++; cancelAttempt(); cancelValidations(); connected = { owner, options: ownerOptions }; publish() })
      return () => { if (connected?.owner !== owner) return; cancel(); connected = undefined }
    },
    updateOwner(owner, ownerOptions) { if (connected?.owner === owner) connected.options = ownerOptions },
    bindingChange(name, write) {
      parsePath(name)
      const before = snapshot(readPath(rhf.getValues(), name))
      transaction(() => { write(); if (!equalValue(before, readPath(rhf.getValues(), name))) invalidate(name); publish() })
      schedule(name, "onChange")
    },
    bindingBlur(name, write) { parsePath(name); transaction(() => { write(); publish() }); schedule(name, "onBlur") },
    dependencyChange(name, scope) { parsePath(name); schedule(name, "onChange", scope) },
    navigateToField(name) { parsePath(name); if (connected?.options.navigateToField) connected.options.navigateToField(name); else facade.scrollToField(name, { focus: true }) },
    invalidate,
    deleteField(name) { parsePath(name); transaction(() => { invalidate(name); rhf.unregister(name as FieldPath<I>); bridge.clear([name]); publish() }) },
    registerField(name, field) {
      parsePath(name)
      const layer = { token: {}, metadata: field }
      const layers = metadataLayers.get(name) ?? []
      layers.push(layer); metadataLayers.set(name, layers)
      function updateMetadata(): void {
        const merged: FieldMetadata = {}
        const keys = ["label", "stepId", "container", "focus"] as const
        for (const key of keys) Object.defineProperty(merged, key, { enumerable: true, get() {
          const current = metadataLayers.get(name) ?? []
          for (let n = current.length - 1; n >= 0; n--) { const value = current[n].metadata[key]; if (value !== undefined) return value }
          return undefined
        } })
        if (metadataLayers.get(name)?.length) metadata.set(name, merged)
        else { metadataLayers.delete(name); metadata.delete(name) }
      }
      updateMetadata()
      let cleaned = false
      return () => { if (cleaned) return; cleaned = true; const current = metadataLayers.get(name); if (current) metadataLayers.set(name, current.filter(item => item.token !== layer.token)); updateMetadata() }
    },
    getFieldMetadata: name => metadata.get(name),
    getMetadata: () => metadata,
    declareFields(paths) {
      paths.forEach(parsePath)
      for (const path of paths) fieldDeclarations.set(path, (fieldDeclarations.get(path) ?? 0) + 1)
      let cleaned = false
      return () => { if (cleaned) return; cleaned = true; for (const path of paths) { const count = (fieldDeclarations.get(path) ?? 0) - 1; if (count > 0) fieldDeclarations.set(path, count); else fieldDeclarations.delete(path) } }
    },
    declareScope(scope, owner) {
      const committedOwner = owner ?? {}
      defineScope(scope, committedOwner)
      let cleaned = false
      return () => {
        if (cleaned) return
        cleaned = true
        const current = scopes.get(scope.id)
        if (!current) return
        const count = (current.owners.get(committedOwner) ?? 0) - 1
        if (count > 0) current.owners.set(committedOwner, count)
        else current.owners.delete(committedOwner)
        if (!current.owners.size) transaction(() => {
          cancelScope(scope.id)
          scopes.delete(scope.id)
          bridge.update(record => record.owner === `scope:${scope.id}` && (record.issue.source === "schema" || record.issue.source === "execution"))
          publish()
        })
      }
    },
    validateOwnedScope(scope, owner) { return validateScope(scope, owner) },
    cancelValidationOwner(owner) { removeDemands(demand => demand.owner === owner) },
    transformArray(name, mapIndex, write) {
      parsePath(name)
      transaction(() => {
        invalidate(name)
        const records = bridge.read().flatMap(record => {
          if (record.target.kind !== "field" || !record.target.path.startsWith(`${name}.`)) return [record]
          const rest = record.target.path.slice(name.length + 1), [part, ...suffix] = rest.split(".")
          if (!/^(0|[1-9]\d*)$/.test(part)) return [record]
          const next = mapIndex(Number(part))
          return next === undefined ? [] : [{ ...record, target: { kind: "field" as const, path: `${name}.${next}${suffix.length ? `.${suffix.join(".")}` : ""}` } }]
        })
        write(); bridge.write(records); publish()
      })
      void request({ full: true, names: [name] }, false)
    },
    transaction,
    activate() {
      const unsubscribe = rhf.subscribe({ formState: { isDirty: true, dirtyFields: true, touchedFields: true, errors: true }, callback(state) { base = { ...base, ...state }; publish() } })
      publish()
      let cleaned = false
      return () => { if (cleaned) return; cleaned = true; unsubscribe(); cancel() }
    },
  }
  return { form, internal }
}
