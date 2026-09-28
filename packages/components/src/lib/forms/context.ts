import { createContext } from "react"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { FormColumns, FormErrors, FormInstance, FormLayout, FormState, FormSubmitHandler, FormValidationScope, FormValues } from "./types"

export interface FieldMetadata {
  label?: ReactNode
  stepId?: string
  container?: HTMLElement | null | (() => HTMLElement | null)
  focus?: HTMLElement | null | (() => HTMLElement | null)
}
export interface OwnerOptions<I extends FormValues, O> {
  onSubmit: FormSubmitHandler<I, O>
  onInvalid?: (errors: FormErrors<I>) => void
  onSubmitError?: (error: unknown) => void
  submitErrorMessage?: string
  canSubmit?: () => boolean
  onReset?: () => void
  onCancel?: () => void
  focusErrors?: (errors: FormErrors<I>) => void
  navigateToField?: (name: string) => void
}
export interface Internal<I extends FormValues, O> {
  rhf: UseFormReturn<I>
  subscribe(listener: () => void): () => void
  getSnapshot(): FormState<I>
  getServerSnapshot(): FormState<I>
  connect(owner: object, options: OwnerOptions<I, O>): () => void
  updateOwner(owner: object, options: OwnerOptions<I, O>): void
  bindingChange(name: string, write: () => void): void
  bindingBlur(name: string, write: () => void): void
  dependencyChange(name: string, scope?: FormValidationScope<I>): void
  navigateToField(name: string): void
  invalidate(name?: string): void
  deleteField(name: string): void
  registerField(name: string, metadata: FieldMetadata): () => void
  getFieldMetadata(name: string): FieldMetadata | undefined
  getMetadata(): ReadonlyMap<string, FieldMetadata>
  declareFields(paths: readonly string[]): () => void
  declareScope(scope: FormValidationScope<I>, owner?: object): () => void
  validateOwnedScope(scope: FormValidationScope<I>, owner: object): Promise<boolean>
  cancelValidationOwner(owner: object): void
  transformArray(name: string, mapIndex: (index: number) => number | undefined, write: () => void): void
  transaction(write: () => void): void
  activate(): () => void
}
export interface FormContextValue {
  form: FormInstance<FormValues, unknown>
  disabled?: boolean
  layout?: FormLayout
  columns?: FormColumns
}
export const FormContext = createContext<FormContextValue | null>(null)
const internals = new WeakMap<object, unknown>()
export function registerInternal<I extends FormValues, O>(form: FormInstance<I, O>, internal: Internal<I, O>): void { internals.set(form, internal) }
export function getInternal<I extends FormValues, O>(form: FormInstance<I, O>): Internal<I, O> {
  const internal = internals.get(form)
  if (!internal) throw new Error("ExForm: expected an instance created by ExUI useForm; external RHF instances are unsupported.")
  return internal as Internal<I, O>
}
