"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import { useForm as useRHFForm } from "react-hook-form"
import { createCoordinator } from "@/lib/forms/coordinator"
import { registerInternal } from "@/lib/forms/context"
import type { FormInput, FormInstance, FormOptions, FormOutput, FormSchema } from "@/lib/forms/types"

export function useForm<const S extends FormSchema>(options: FormOptions<S>): FormInstance<FormInput<S>, FormOutput<S>> {
  const initialSchema = useRef(options.schema)
  if (initialSchema.current !== options.schema) throw new Error("ExForm: the initial schema reference changed. Keep it stable with a module constant/useMemo, or create a new keyed form instance.")
  const rhf = useRHFForm<FormInput<S>>({ defaultValues: options.defaultValues, mode: "onSubmit", reValidateMode: "onSubmit", shouldUnregister: false, shouldUseNativeValidation: false })
  const core = useRef<ReturnType<typeof createCoordinator<FormInput<S>, FormOutput<S>>> | null>(null)
  if (!core.current) {
    core.current = createCoordinator<FormInput<S>, FormOutput<S>>(rhf, options.schema, options)
    registerInternal(core.current.form, core.current.internal)
  }
  const { form, internal } = core.current
  useEffect(() => internal.activate(), [internal])
  useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  return form
}
