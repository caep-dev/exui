"use client"

import * as React from "react"
import { Field, FieldContent, FieldTitle, FieldDescription, FieldError } from "@/components/ui/field"
import { useFieldArray } from "@/hooks/use-form-field-array"
import { FormContext, getInternal } from "@/lib/forms/context"
import type { FormListProps, FormObjectArrayPath, FormValues } from "@/lib/forms/types"
import { cn } from "@/lib/utils"
import { formColumnStyle } from "./form"

export function FormList<I extends FormValues, O, P extends FormObjectArrayPath<I>>(props: FormListProps<I, O, P>) {
  const { form, name, render, label, description, className, colSpan = "full", columns, layout } = props
  const context = React.useContext(FormContext)
  if (!context || context.form !== form) throw new Error("ExUI FormList: the nearest Form must use the same instance.")
  const internal = getInternal(form)
  React.useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const array = useFieldArray({ form, name })
  const id = `${React.useId()}-${encodeURIComponent(name)}`
  const container = React.useRef<HTMLDivElement | null>(null)
  const labelRef = React.useRef(label)
  labelRef.current = label
  React.useEffect(() => internal.registerField(name, { get label() { return labelRef.current }, container: () => container.current }), [internal, name])
  const operations: typeof array = {
    ...array,
    append: (item) => { if (!context.disabled) array.append(item) },
    insert: (index, item) => { if (!context.disabled) array.insert(index, item) },
    remove: (index) => { if (!context.disabled) array.remove(index) },
    move: (from, to) => { if (!context.disabled) array.move(from, to) },
  }
  return <Field ref={container} className={cn("ex-form-item ex-form-list", className)} data-span={colSpan} data-invalid={array.issues.length > 0}>
    {label != null && <FieldTitle id={`${id}-label`}>{label}</FieldTitle>}
    <FieldContent aria-labelledby={label != null ? `${id}-label` : undefined} className="ex-form-content">
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <div className="ex-form-list-content" data-layout={layout ?? context.layout} style={formColumnStyle(columns ?? context.columns)}>{render(operations)}</div>
      <FieldError errors={array.issues.map((issue) => ({ message: issue.message }))} />
    </FieldContent>
  </Field>
}
