"use client"

import { useRef } from "react"
import { useWatch as useRHFWatch, type FieldPath } from "react-hook-form"
import { getInternal } from "@/lib/forms/context"
import { equalValue, parsePath, snapshot } from "@/lib/forms/paths"
import type { FormInstance, FormPath, FormPathValue, FormSnapshot, FormValues, SnapshotPathTuple } from "@/lib/forms/types"

export function useWatch<I extends FormValues, O, P extends FormPath<I>>(options: { form: FormInstance<I, O>; name: P }): FormSnapshot<FormPathValue<I, P>>
export function useWatch<I extends FormValues, O, P extends readonly FormPath<I>[]>(options: { form: FormInstance<I, O>; name: P }): SnapshotPathTuple<I, P>
export function useWatch<I extends FormValues, O>(options: { form: FormInstance<I, O>; name: FormPath<I> | readonly FormPath<I>[] }): unknown {
  const internal = getInternal(options.form)
  const names = typeof options.name === "string" ? [options.name] : options.name
  names.forEach(parsePath)
  const value = useRHFWatch({ control: internal.rhf.control, name: options.name as FieldPath<I>, exact: false })
  const cached = useRef<{ value: unknown } | null>(null)
  if (!cached.current || !equalValue(cached.current.value, value)) cached.current = { value: snapshot(value) }
  return cached.current.value
}
