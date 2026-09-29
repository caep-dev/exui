"use client"

import * as React from "react"
import { useController, useWatch as useRHFWatch } from "react-hook-form"
import { FieldError } from "@/components/ui/field"
import { FormContext, getInternal } from "@/lib/forms/context"
import type { FormFieldState, FormIssue, FormItemProps, FormPath, FormPathValue, FormRenderArguments, FormValues } from "@/lib/forms/types"
import { cn } from "@/lib/utils"
import { equalValue, normalizePaths, snapshot as immutableSnapshot } from "@/lib/forms/paths"
import { FormControl } from "./form-controls"
import { ExItem } from "./ex-item"
import { RetainStepFieldsContext } from "./form"

export function FormItem<I extends FormValues, O, P extends FormPath<I>>(props: FormItemProps<I, O, P>) {
  const { form, name, dependencies = [], visibleWhen, disabledWhen, preserve = true, label, description,
    disabled = false, validationScope } = props
  const context = React.useContext(FormContext)
  if (!context || context.form !== form) throw new Error("ExUI FormItem: the nearest Form must use the same instance.")
  const internal = getInternal(form)
  const retainStepFields = React.useContext(RetainStepFieldsContext)
  const state = React.useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const dependencyValues = useRHFWatch({ control: internal.rhf.control, name: dependencies as FormPath<I>[] })
  const snapshot = form.getValues()
  const visible = visibleWhen?.(snapshot) ?? true
  const isDisabled = context.disabled || disabled || (disabledWhen?.(snapshot) ?? false)
  const id = `${React.useId()}-${encodeURIComponent(name)}`
  const labelId = label != null ? `${id}-label` : undefined
  const errorId = `${id}-error`
  const descriptionId = description !== null && description !== undefined && description !== false && description !== ""
    ? `${id}-description`
    : undefined
  const container = React.useRef<HTMLDivElement | null>(null)
  const target = React.useRef<HTMLElement | null>(null)
  const fieldState = form.getFieldState(name)
  const ownIssues = state.errors.fields[name]?.issues ?? []
  const labelRef = React.useRef(label)
  labelRef.current = label
  const unmount = React.useRef({ version: 0, latest: { name, preserve, retainStepFields } })
  unmount.current.latest = { name, preserve, retainStepFields }
  React.useEffect(() => {
    const cell = unmount.current
    cell.version++
    return () => {
      const version = ++cell.version
      // A Strict Mode effect probe reconnects in the same turn. Delete only an
      // actual unmount, so the probe does not erase a still-visible draft.
      queueMicrotask(() => {
        const latest = cell.latest
        if (version === cell.version && !latest.preserve && !latest.retainStepFields) internal.deleteField(latest.name)
      })
    }
  }, [internal])
  React.useEffect(() => internal.registerField(name, {
    get label() { return labelRef.current },
    container: () => container.current, focus: () => target.current,
  }), [internal, name])
  React.useEffect(() => {
    if (!visible && !preserve) internal.deleteField(name)
  }, [internal, name, visible, preserve])
  const scopeId = validationScope?.id
  const scopeSchema = validationScope?.validationSchema
  const scopeFieldsKey = JSON.stringify(normalizePaths(validationScope?.fields ?? []))
  const scopeDepsKey = JSON.stringify(normalizePaths(validationScope?.validationDependencies ?? []))
  const stableScope = React.useMemo(() => scopeId && scopeSchema ? {
    id: scopeId, validationSchema: scopeSchema,
    fields: JSON.parse(scopeFieldsKey) as FormPath<I>[], validationDependencies: JSON.parse(scopeDepsKey) as FormPath<I>[],
  } : undefined, [scopeId, scopeSchema, scopeFieldsKey, scopeDepsKey])
  React.useEffect(() => stableScope ? internal.declareScope(stableScope) : undefined, [internal, stableScope])
  const previousDeps = React.useRef<unknown>(immutableSnapshot(dependencyValues))
  React.useEffect(() => {
    const before = previousDeps.current
    previousDeps.current = immutableSnapshot(dependencyValues)
    if (equalValue(before, dependencyValues) || !dependencies.length) return
    // The core applies the configured event/revalidation mode to dependencies.
    internal.dependencyChange(name, stableScope)
  }, [dependencyValues, internal, name, stableScope, dependencies.length])
  if (!visible) return null
  return <BoundFormItem<I, O, P> configuration={props} isDisabled={Boolean(isDisabled)} id={id} labelId={labelId} container={container} target={target}
    describedBy={[descriptionId, ownIssues.length > 0 && errorId].filter(Boolean).join(" ") || undefined}
    fieldState={fieldState} ownIssues={ownIssues} formatIssue={context.formatIssue} />
}

interface BoundProps {
  id: string; labelId?: string; describedBy?: string
  container: React.RefObject<HTMLDivElement | null>; target: React.RefObject<HTMLElement | null>
  fieldState: FormFieldState
  ownIssues: readonly FormIssue[]
  formatIssue?: (message: string) => string
}

function BoundFormItem<I extends FormValues, O, P extends FormPath<I>>(props: { configuration: FormItemProps<I, O, P>; isDisabled: boolean } & BoundProps) {
  const { id, labelId, describedBy, container, target, isDisabled: disabled, fieldState, ownIssues, formatIssue } = props
  const { form, name, label, description, required, noStyle, className, colSpan = 1, layout, contentMaxWidth, contentAlign } = props.configuration
  const internal = getInternal(form)
  const { field } = useController({ control: internal.rhf.control, name, shouldUnregister: false })
  const accessibility = { id, name, "aria-invalid": ownIssues.length > 0, "aria-describedby": describedBy, "aria-required": required }
  const binding = {
    value: form.getValues(name),
    onChange: (next: FormPathValue<I, P>) => internal.bindingChange(name, () => field.onChange(next)),
    onBlur: () => internal.bindingBlur(name, () => field.onBlur()),
    ref: (element: HTMLElement | null) => { target.current = element; field.ref(element) },
  }
  const renderArgs: FormRenderArguments<I, P> = { field: binding, state: { ...fieldState, disabled: Boolean(disabled) }, accessibility }
  const control = props.configuration.render ? props.configuration.render(renderArgs) : <FormControl control={props.configuration.control!}
    controlProps={props.configuration.controlProps as Record<string, unknown> | undefined}
    binding={{ ...binding, onChange: (next: unknown) => binding.onChange(next as FormPathValue<I, P>), disabled: Boolean(disabled), accessibility, labelId }} />
  if (noStyle) return <>{control}</>
  return <ExItem ref={container} className={cn("ex-form-item", className)} span={colSpan} layout={layout}
    contentMaxWidth={contentMaxWidth} contentAlign={contentAlign}
    title={label != null ? <>{label}{required && <span aria-hidden="true">*</span>}</> : undefined}
    desc={description} controlId={id} data-invalid={ownIssues.length > 0} data-disabled={disabled}>
    <>{control}
      <FieldError id={`${id}-error`} errors={ownIssues.map((issue) => ({ message: formatIssue?.(issue.message) ?? issue.message }))} />
    </>
  </ExItem>
}
