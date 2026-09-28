"use client"

import * as React from "react"
import { FormContext, getInternal } from "@/lib/forms/context"
import type { FormErrorNode, FormErrorSummaryProps, FormPath, FormValues } from "@/lib/forms/types"
import { cn } from "@/lib/utils"

export function FormErrorSummary<I extends FormValues, O>({ form, className, title = "请检查以下问题" }: FormErrorSummaryProps<I, O>) {
  const context = React.useContext(FormContext)
  if (!context || context.form !== form) throw new Error("ExUI FormErrorSummary: the nearest Form must use the same instance.")
  const internal = getInternal(form)
  const state = React.useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const fields = (Object.entries(state.errors.fields) as [string, FormErrorNode | undefined][]).filter((entry): entry is [string, FormErrorNode] => Boolean(entry[1]?.issues.length))
  const roots = Object.entries(state.errors.root).filter(([, node]) => node.issues.length)
  if (!fields.length && !roots.length) return null
  return <div role="alert" className={cn("ex-form-summary", className)} data-span="full">
    <p className="ex-form-summary-title">{title}</p>
    <ul>{fields.map(([name, node]) => <li key={name}>
      <button type="button" onClick={() => internal.navigateToField(name as FormPath<I>)} className="ex-form-summary-link">
        {internal.getFieldMetadata(name)?.label ?? name}: {[...new Set(node!.issues.map((issue) => issue.message))].join("；")}
      </button>
    </li>)}{roots.map(([key, node]) => <li key={`root:${key}`}>{[...new Set(node.issues.map((issue) => issue.message))].join("；")}</li>)}</ul>
  </div>
}
