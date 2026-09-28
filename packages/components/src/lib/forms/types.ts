import type * as React from "react"
import type { DefaultValues, FieldNamesMarkedBoolean, FieldPathValue, FieldPath } from "react-hook-form"
import type { StandardSchemaV1 } from "./standard-schema"
import type { Input } from "@/components/ui/input"
import type { Textarea } from "@/components/ui/textarea"
import type { Checkbox } from "@/components/ui/checkbox"
import type { Switch } from "@/components/ui/switch"

export type FormValues = Record<string, unknown>
export type FormSchema = StandardSchemaV1<FormValues, unknown>
export type FormInput<S extends FormSchema> = StandardSchemaV1.InferInput<S>
export type FormOutput<S extends FormSchema> = StandardSchemaV1.InferOutput<S>
export type FormMode = "onSubmit" | "onBlur" | "onChange"
type Dangerous = "__proto__" | "prototype" | "constructor"
// A list row exposes index:number, so consumers naturally interpolate ${number}.
// Integer/nonnegative validation is repeated by every runtime path entry point.
type Index = `${number}`
type SafeKey<K> = K extends string ? K extends Dangerous | `${string}.${string}` | "" ? never : K : never
type Native = Date | File | FileList | Blob | RegExp | Map<unknown, unknown> | Set<unknown>
type SafePaths<T, Seen = never> = T extends Native ? never : T extends readonly (infer V)[]
  ? number extends T["length"] ? Index | (V extends Seen ? never : `${Index}.${SafePaths<V, Seen | T>}`)
    : { [K in Exclude<keyof T, keyof readonly unknown[]> & string]: K | (T[K] extends Seen ? never : `${K}.${SafePaths<T[K], Seen | T>}`) }[Exclude<keyof T, keyof readonly unknown[]> & string]
  : T extends object ? { [K in keyof T & string as SafeKey<K>]: SafeKey<K> | (NonNullable<T[K]> extends Seen ? never : `${SafeKey<K>}.${SafePaths<NonNullable<T[K]>, Seen | T>}`) } extends infer M ? M[keyof M] & string : never : never
export type FormPath<I extends FormValues> = Exclude<SafePaths<I>, "root" | `root.${string}`> & FieldPath<I>
export type FormPathValue<I extends FormValues, P extends FormPath<I>> = FieldPathValue<I, P>
export type FormErrorPath<I extends FormValues> = FormPath<I> | "root" | `root.${string}`
export type DeepReadonlySnapshot<T> = T extends Native ? T : T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: DeepReadonlySnapshot<T[K]> } : T
export type FormSnapshot<T> = DeepReadonlySnapshot<T>
export type FormDefaults<I extends FormValues> = DefaultValues<I>
export type SnapshotPathTuple<I extends FormValues, P extends readonly FormPath<I>[]> = { readonly [K in keyof P]: P[K] extends FormPath<I> ? FormSnapshot<FormPathValue<I, P[K]>> : never }
export interface FormOptions<S extends FormSchema> { schema: S; defaultValues: FormDefaults<NoInfer<FormInput<S>>>; mode?: FormMode; reValidateMode?: FormMode }
export interface FormIssue extends StandardSchemaV1.Issue { readonly source: "schema" | "server" | "manual" | "execution"; readonly scopeId?: string }
export interface FormErrorNode { readonly issues: readonly FormIssue[] }
export interface FormErrors<I extends FormValues> { readonly fields: Readonly<Partial<Record<FormPath<I>, FormErrorNode>>>; readonly root: Readonly<Record<string, FormErrorNode>> }
export interface FormState<I extends FormValues> {
  readonly isDirty: boolean
  readonly dirtyFields: FormSnapshot<Partial<FieldNamesMarkedBoolean<I>>>
  readonly touchedFields: FormSnapshot<Partial<FieldNamesMarkedBoolean<I>>>
  readonly errors: FormErrors<I>
  readonly isValidating: boolean
  readonly isSubmitting: boolean
  readonly submitCount: number
  readonly validationStatus: "unvalidated" | "valid" | "invalid"
}
export interface FormFieldState { readonly isDirty: boolean; readonly isTouched: boolean; readonly isValidating: boolean; readonly invalid: boolean; readonly issues: readonly FormIssue[] }
export interface FormErrorInput { message: string; issues?: readonly StandardSchemaV1.Issue[] }
export interface FormValidationScope<I extends FormValues> { id: string; fields: readonly FormPath<I>[]; validationSchema: FormSchema; validationDependencies?: readonly FormPath<I>[] }
export type FormSubmitResult = { status: "submitted" | "invalid" | "failed" | "cancelled" }
export interface FormSubmitContext<I extends FormValues> { readonly signal: AbortSignal; setFieldError<P extends FormPath<I>>(name: P, error: FormErrorInput): void; setFormError(error: string | FormErrorInput): void }
export type FormSubmitHandler<I extends FormValues, O> = (data: O, context: FormSubmitContext<I>) => void | Promise<void>
declare const instanceBrand: unique symbol
export interface FormInstance<I extends FormValues, O> {
  readonly [instanceBrand]: { readonly input: I; readonly output: O }
  readonly state: FormState<I>
  getValues(): FormSnapshot<I>
  getValues<P extends FormPath<I>>(name: P): FormSnapshot<FormPathValue<I, P>>
  setValue<P extends FormPath<I>>(name: P, value: NoInfer<FormPathValue<I, P>>, options?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }): void
  reset(values?: FormDefaults<I>): void
  resetField<P extends FormPath<I>>(name: P, options?: { defaultValue?: FormPathValue<I, P> }): void
  setError(name: FormErrorPath<I>, error: FormErrorInput): void
  clearErrors(names?: FormErrorPath<I> | readonly FormErrorPath<I>[]): void
  getFieldState(name: FormPath<I>): FormFieldState
  setFocus(name: FormPath<I>, options?: { shouldSelect?: boolean }): void
  scrollToField(name: FormPath<I>, options?: { focus?: boolean; behavior?: ScrollBehavior }): void
  trigger(names?: FormPath<I> | readonly FormPath<I>[], options?: { shouldFocus?: boolean }): Promise<boolean>
  validateScope(scope: FormValidationScope<I>, options?: { shouldFocus?: boolean }): Promise<boolean>
  submit(): Promise<FormSubmitResult>
  cancelPending(): void
}
type MutableArray<V> = Exclude<V, undefined> extends (infer E)[] ? number extends Exclude<V, undefined>["length"] ? E : never : never
export type FormObjectArrayPath<I extends FormValues> = { [P in FormPath<I>]: [MutableArray<FormPathValue<I, P>>] extends [never] ? never : MutableArray<FormPathValue<I, P>> extends FormValues ? P : never }[FormPath<I>]
export type FormArrayItem<I extends FormValues, P extends FormObjectArrayPath<I>> = MutableArray<FormPathValue<I, P>> extends infer E extends FormValues ? E : never
export interface FormFieldArray<I extends FormValues, P extends FormObjectArrayPath<I>> {
  readonly items: readonly { readonly key: string; readonly index: number }[]
  append(item: NoInfer<FormArrayItem<I, P>>): void
  insert(index: number, item: NoInfer<FormArrayItem<I, P>>): void
  remove(index: number | readonly number[]): void
  move(from: number, to: number): void
  readonly issues: readonly FormIssue[]
}
export type FormLayout = "vertical" | "horizontal" | "inline"
export type FormColumnCount = 1 | 2 | 3 | 4
export interface FormColumns { base?: FormColumnCount; sm?: FormColumnCount; md?: FormColumnCount; lg?: FormColumnCount }
export interface FormLayoutOptions { layout?: FormLayout; columns?: FormColumns }
export interface FormRenderArguments<I extends FormValues, P extends FormPath<I>> {
  field: { readonly value: FormSnapshot<FormPathValue<I, P>>; onChange(next: NoInfer<FormPathValue<I, P>>): void; onBlur(): void; ref(element: HTMLElement | null): void }
  state: FormFieldState & { readonly disabled: boolean }
  accessibility: { id: string; name: P; "aria-invalid": boolean; "aria-describedby"?: string; "aria-required"?: boolean }
}
export interface FormFieldBase<I extends FormValues, P extends FormPath<I>> {
  name: P; label?: React.ReactNode; description?: React.ReactNode; required?: boolean; disabled?: boolean
  dependencies?: readonly FormPath<I>[]; visibleWhen?: (snapshot: FormSnapshot<I>) => boolean; disabledWhen?: (snapshot: FormSnapshot<I>) => boolean
  preserve?: boolean; validationScope?: FormValidationScope<I>; colSpan?: FormColumnCount | "full"; className?: string; noStyle?: boolean
}
type BindingProps = "name" | "value" | "defaultValue" | "checked" | "defaultChecked" | "onChange" | "onValueChange" | "onCheckedChange" | "onBlur" | "ref" | "id" | "disabled" | "aria-invalid" | "aria-describedby" | "required"
export type FormInputControlProps = Omit<React.ComponentProps<typeof Input>, BindingProps | "type">
export type FormTextareaControlProps = Omit<React.ComponentProps<typeof Textarea>, BindingProps>
export type FormCheckboxControlProps = Omit<React.ComponentProps<typeof Checkbox>, BindingProps>
export type FormSwitchControlProps = Omit<React.ComponentProps<typeof Switch>, BindingProps>
export interface FormSelectOption<V extends string> { value: NoInfer<V>; label: React.ReactNode; disabled?: boolean }
export interface FormSelectControlProps<V extends string> { options: readonly FormSelectOption<V>[]; placeholder?: string; className?: string; glass?: boolean }
export interface FormMultiSelectControlProps<V extends string> { options: readonly FormSelectOption<V>[]; placeholder?: string; className?: string }
export interface FormSelectOrInputControlProps { options: readonly { value: string; label?: string; disabled?: boolean }[]; placeholder?: string; className?: string; glass?: boolean }
export interface FormFilesControlProps { accept?: string; buttonLabel?: React.ReactNode; description?: React.ReactNode; className?: string; formatFileSize?: (bytes: number) => string; removeFileLabel?: (file: File) => string }
type Builtin<C extends string, Props> = { control: C; controlProps?: Props; render?: never }
type TextControl<V> = [Exclude<V, undefined>] extends [string] ? string extends Exclude<V, undefined> ? Builtin<"text" | "email" | "password" | "number" | "date", FormInputControlProps> | Builtin<"textarea", FormTextareaControlProps> | Builtin<"select-or-input", FormSelectOrInputControlProps> : never : never
type BooleanControl<V> = [Exclude<V, undefined>] extends [boolean] ? boolean extends Exclude<V, undefined> ? Builtin<"checkbox", FormCheckboxControlProps> | Builtin<"switch", FormSwitchControlProps> : never : never
type EnumControl<V> = [Exclude<V, undefined>] extends [string] ? Builtin<"select" | "radio-group", FormSelectControlProps<Exclude<V, undefined> & string>> : never
type ArrayControl<V> = [MutableArray<V>] extends [never] ? never : [MutableArray<V>] extends [string] ? Builtin<"checkbox-group" | "multi-select", FormMultiSelectControlProps<MutableArray<V> & string>> : [Exclude<V, undefined>] extends [File[]] ? Builtin<"files", FormFilesControlProps> : never
export type FormFieldBinding<I extends FormValues, P extends FormPath<I>> = TextControl<FormPathValue<I, P>> | BooleanControl<FormPathValue<I, P>> | EnumControl<FormPathValue<I, P>> | ArrayControl<FormPathValue<I, P>> | { render: (args: FormRenderArguments<I, P>) => React.ReactNode; control?: never; controlProps?: never }
export type FormItemProps<I extends FormValues, O, P extends FormPath<I>> = { form: FormInstance<I, O>; children?: never } & FormFieldBase<NoInfer<I>, P> & FormFieldBinding<NoInfer<I>, P>
export type FormOrdinaryFieldConfig<I extends FormValues> = { [P in FormPath<I>]: FormFieldBase<I, P> & FormFieldBinding<I, P> & { kind?: "field" } }[FormPath<I>]
export type FormListConfig<I extends FormValues> = { [P in FormObjectArrayPath<I>]: { kind: "list"; name: P; defaultItem: NoInfer<FormArrayItem<I, P>>; itemFields: readonly FormFieldConfig<FormArrayItem<I, P>>[]; label?: React.ReactNode; description?: React.ReactNode; className?: string; colSpan?: FormColumnCount | "full" } & FormLayoutOptions }[FormObjectArrayPath<I>]
export type FormFieldConfig<I extends FormValues> = FormOrdinaryFieldConfig<I> | FormListConfig<I>
export type FormListProps<I extends FormValues, O, P extends FormObjectArrayPath<I>> = { form: FormInstance<I, O>; name: P; defaultItem: NoInfer<FormArrayItem<I, P>>; render: (array: FormFieldArray<NoInfer<I>, P>) => React.ReactNode; label?: React.ReactNode; description?: React.ReactNode; className?: string; colSpan?: FormColumnCount | "full" } & FormLayoutOptions
export interface FormProps<I extends FormValues, O> extends FormLayoutOptions {
  form: FormInstance<I, O>; onSubmit: FormSubmitHandler<NoInfer<I>, NoInfer<O>>; children: React.ReactNode
  name?: string; disabled?: boolean; clearOnDestroy?: boolean; onInvalid?: (errors: FormErrors<NoInfer<I>>) => void; onSubmitError?: (error: unknown) => void; submitErrorMessage?: string; formatIssue?: (message: string) => string; issueSeparator?: string; className?: string; style?: React.CSSProperties
  onReset?: never; noValidate?: never
}
export interface FormErrorSummaryProps<I extends FormValues, O> { form: FormInstance<I, O>; className?: string; title?: React.ReactNode }
export type FormStep<I extends FormValues> = ({ id: string; title: React.ReactNode; kind?: "edit"; fields: readonly FormPath<I>[]; validationSchema: FormSchema; validationDependencies?: readonly FormPath<I>[]; render?: never } | { id: string; title: React.ReactNode; kind: "review"; render: (snapshot: FormSnapshot<I>) => React.ReactNode; fields?: never; validationSchema?: never; validationDependencies?: never })
export interface ExFormFooterArguments<I extends FormValues> { state: FormState<I>; currentStep?: string; isFirstStep: boolean; isLastStep: boolean; next(): Promise<boolean>; back(): void; goTo(id: string): Promise<boolean>; submit(): Promise<FormSubmitResult>; reset(): void }
export type ExFormCommonProps<I extends FormValues, O> = Omit<FormProps<I, O>, "form" | "children"> & { fields: readonly FormFieldConfig<NoInfer<I>>[]; steps?: readonly FormStep<NoInfer<I>>[]; currentStep?: string; onStepChange?: (id: string) => void; footer?: React.ReactNode | ((args: ExFormFooterArguments<NoInfer<I>>) => React.ReactNode); submitLabel?: React.ReactNode; resetLabel?: React.ReactNode; backLabel?: React.ReactNode; nextLabel?: React.ReactNode; stepsAriaLabel?: string; errorSummaryTitle?: React.ReactNode }
export type ExFormSchemaProps<S extends FormSchema> = FormOptions<S> & ExFormCommonProps<FormInput<S>, FormOutput<S>> & { form?: never }
export type ExFormInstanceProps<I extends FormValues, O> = ExFormCommonProps<I, O> & { form: FormInstance<I, O>; schema?: never; defaultValues?: never; mode?: never; reValidateMode?: never }
