"use client"

import { useContext, useSyncExternalStore } from "react"
import { FormContext, getInternal } from "@/lib/forms/context"
import type { FormInstance, FormValues } from "@/lib/forms/types"

export function useFormContext<I extends FormValues, O>(expected: FormInstance<I, O>): FormInstance<I, O>
export function useFormContext<I extends FormValues = FormValues, O = unknown>(): FormInstance<I, O>
export function useFormContext<I extends FormValues, O>(expected?: FormInstance<I, O>): FormInstance<I, O> {
  const context = useContext(FormContext)
  if (!context) throw new Error("ExForm: useFormContext requires a Form provider.")
  if (expected && context.form !== expected) throw new Error("ExForm: expected instance does not match the nearest Form provider.")
  const form = context.form as unknown as FormInstance<I, O>
  const internal = getInternal(form)
  useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  return form
}
