"use client"

import { useSyncExternalStore } from "react"
import { useFieldArray as useRHFFieldArray, type FieldArray, type FieldArrayPath } from "react-hook-form"
import { getInternal } from "@/lib/forms/context"
import { parsePath, readPath, snapshot } from "@/lib/forms/paths"
import type { FormArrayItem, FormFieldArray, FormInstance, FormObjectArrayPath, FormValues } from "@/lib/forms/types"

export function useFieldArray<I extends FormValues, O, P extends FormObjectArrayPath<I>>(options: { form: FormInstance<I, O>; name: P }): FormFieldArray<I, P> {
  parsePath(options.name)
  const internal = getInternal(options.form)
  useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const fieldArray = useRHFFieldArray({ control: internal.rhf.control, name: options.name as unknown as FieldArrayPath<I>, shouldUnregister: false })
  function length(): number { const value = readPath(internal.rhf.getValues(), options.name); if (value === undefined) return 0; if (!Array.isArray(value)) throw new Error(`ExForm: "${options.name}" is not an object array.`); return value.length }
  function check(index: number, insert = false): void { if (!Number.isInteger(index) || index < 0 || index >= length() + (insert ? 1 : 0)) throw new Error(`ExForm: array index ${index} is out of bounds for "${options.name}".`) }
  function checkItem(item: FormArrayItem<I, P>): void { if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("ExForm: field arrays require complete object items.") }
  return {
    items: snapshot(fieldArray.fields.map((field, index) => ({ key: field.id, index }))),
    append(item) { checkItem(item); internal.transformArray(options.name, index => index, () => fieldArray.append(item as unknown as FieldArray<I, FieldArrayPath<I>>, { shouldFocus: false })) },
    insert(index, item) { check(index, true); checkItem(item); internal.transformArray(options.name, old => old >= index ? old + 1 : old, () => fieldArray.insert(index, item as unknown as FieldArray<I, FieldArrayPath<I>>, { shouldFocus: false })) },
    remove(indices) {
      const values = [...new Set(typeof indices === "number" ? [indices] : indices)].sort((a, b) => a - b)
      values.forEach(index => check(index))
      if (!values.length) return
      internal.transformArray(options.name, old => values.includes(old) ? undefined : old - values.filter(index => index < old).length, () => fieldArray.remove(values))
    },
    move(from, to) {
      check(from); check(to)
      if (from === to) return
      internal.transformArray(options.name, old => old === from ? to : from < to && old > from && old <= to ? old - 1 : from > to && old >= to && old < from ? old + 1 : old, () => fieldArray.move(from, to))
    },
    issues: options.form.getFieldState(options.name).issues,
  }
}
