"use client"

import * as React from "react"
import { FormContext, getInternal } from "@/lib/forms/context"
import type { FormColumns, FormErrors, FormInstance, FormProps, FormValues } from "@/lib/forms/types"
import { cn } from "@/lib/utils"

export const RetainStepFieldsContext = React.createContext(false)

// Private extension used by the configuration layer, never exported at the root.
export interface FormRouting<I extends FormValues> {
  canSubmit?(): boolean
  onDomSubmit?(): void | Promise<unknown>
  onReset?(): void
  onCancel?(): void
  focusErrors?(errors: FormErrors<I>): void
  navigateToField?(name: string): void
}

export function formColumnStyle(columns: FormColumns = {}): React.CSSProperties {
  const base = columns.base ?? 1
  const sm = columns.sm ?? base
  const md = columns.md ?? sm
  const lg = columns.lg ?? md
  for (const value of [base, sm, md, lg]) {
    if (!Number.isInteger(value) || value < 1 || value > 4) throw new Error("ExUI Form: columns must be between 1 and 4.")
  }
  return { "--ex-form-base": base, "--ex-form-sm": sm, "--ex-form-md": md, "--ex-form-lg": lg } as React.CSSProperties
}

export function Form<I extends FormValues, O>(props: FormProps<I, O>) {
  return <FormShell {...props} />
}

export function FormShell<I extends FormValues, O>(props: FormProps<I, O> & { routing?: FormRouting<I> }) {
  const { form, children, onSubmit, onInvalid, onSubmitError, submitErrorMessage, formatIssue, issueSeparator, disabled = false,
    clearOnDestroy = false, layout = "vertical", columns, name, className, style, routing } = props
  const internal = getInternal(form)
  const state = React.useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const owner = React.useRef({})
  const options = { onSubmit, onInvalid, onSubmitError, submitErrorMessage, ...routing }
  const latest = React.useRef({ options, clearOnDestroy })
  latest.current = { options, clearOnDestroy }
  React.useEffect(() => {
    const release = internal.connect(owner.current, latest.current.options)
    return () => {
      release()
      if (latest.current.clearOnDestroy) form.reset()
    }
  }, [internal, form])
  React.useEffect(() => { internal.updateOwner(owner.current, options) })
  const context = React.useMemo(() => ({ form, disabled: disabled || state.isSubmitting, layout, columns, formatIssue, issueSeparator }), [form, disabled, state.isSubmitting, layout, columns, formatIssue, issueSeparator])
  const onDomSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      Promise.resolve(routing?.onDomSubmit ? routing.onDomSubmit() : form.submit()).catch((error: unknown) => onSubmitError?.(error))
    } catch (error) { onSubmitError?.(error) }
  }
  return <FormContext.Provider value={{ ...context, form: form as unknown as FormInstance<FormValues, unknown> }}>
    <form noValidate name={name} className={cn("ex-form", className)} style={style} onSubmit={onDomSubmit}
      onReset={(event) => { event.preventDefault(); form.reset() }} aria-busy={state.isSubmitting || state.isValidating}>
      <div className="ex-form-container">
        <div className="ex-form-grid" data-layout={layout} style={formColumnStyle(columns)}>{children}</div>
      </div>
    </form>
  </FormContext.Provider>
}
