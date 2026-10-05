"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useForm } from "@/hooks/use-form"
import { useWatch as useRHFWatch } from "react-hook-form"
import { FormContext, getInternal } from "@/lib/forms/context"
import { readPath, parsePath, normalizePaths } from "@/lib/forms/paths"
import type { ExFormSchemaProps, ExFormInstanceProps, ExFormCommonProps, ExFormFooterArguments, FormSchema, FormValues, FormInstance, FormFieldArray, FormErrors, FormSnapshot, FormValidationScope } from "@/lib/forms/types"
import { FormShell, RetainStepFieldsContext } from "./form"
import { FormItem } from "./form-item"
import { FormList } from "./form-list"
import { FormStepsController, stepStructure } from "./form-steps"

export function ExForm<const S extends FormSchema>(props: ExFormSchemaProps<S>): React.ReactElement
export function ExForm<I extends FormValues, O>(props: ExFormInstanceProps<I, O>): React.ReactElement
export function ExForm(props: unknown): React.ReactElement {
  const runtime = props as ExFormSchemaProps<FormSchema> | ExFormInstanceProps<FormValues, unknown>
  if (runtime.form && "schema" in runtime && runtime.schema !== undefined) throw new Error("ExUI ExForm: pass either schema or form, never both.")
  return runtime.form ? <ConfiguredForm {...runtime} form={runtime.form} /> : <SchemaForm {...runtime as ExFormSchemaProps<FormSchema>} />
}

function SchemaForm<S extends FormSchema>(props: ExFormSchemaProps<S>) {
  const { schema, defaultValues, mode, reValidateMode, ...configuration } = props
  const form = useForm({ schema, defaultValues, mode, reValidateMode })
  return <ConfiguredForm {...configuration} form={form} />
}

function ConfiguredForm<I extends FormValues, O>(props: ExFormCommonProps<I, O> & { form: FormInstance<I, O> }) {
  const { form, children, fields, steps = [], currentStep, onStepChange, footer, submitLabel = "提交", resetLabel, backLabel = "上一步", nextLabel = "下一步", stepsAriaLabel = "表单步骤", ...formProps } = props
  const internal = getInternal(form)
  useRHFWatch({ control: internal.rhf.control })
  const state = React.useSyncExternalStore(internal.subscribe, internal.getSnapshot, internal.getServerSnapshot)
  const names = fields.map((field) => field.name)
  names.forEach(parsePath)
  if (new Set(names).size !== names.length) throw new Error("ExUI ExForm: configured field paths must be unique.")
  const structure = stepStructure(steps, names)
  const initial = React.useRef({ steps, names, currentStep })
  const controller = React.useMemo(() => new FormStepsController(form, internal, initial.current.steps, initial.current.names, initial.current.currentStep), [form, internal])
  const actualStep = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  React.useEffect(() => { controller.activate(); return () => controller.dispose() }, [controller])
  React.useEffect(() => { controller.update(steps, names, currentStep, onStepChange) })
  const namesKey = JSON.stringify([...names].sort())
  React.useEffect(() => internal.declareFields(JSON.parse(namesKey) as string[]), [internal, namesKey])
  // Config metadata survives step unmounts; mounted FormItem supplies the focus
  // target. Labels are read from the latest display configuration.
  const display = React.useRef({ fields, steps })
  display.current = { fields, steps }
  React.useEffect(() => {
    const releases = (JSON.parse(namesKey) as string[]).map((name) => internal.registerField(name, {
      get label() { return display.current.fields.find((field) => field.name === name)?.label },
      get stepId() { return controller.stepFor(name) },
    }))
    return () => releases.forEach((release) => release())
  }, [internal, controller, structure, namesKey])
  const footerArgs: ExFormFooterArguments<I> = {
    state, currentStep: actualStep, isFirstStep: controller.isFirst, isLastStep: controller.isLast,
    next: controller.next, back: controller.back, goTo: controller.goTo,
    submit: () => form.submit(), reset: () => form.reset(),
  }
  const step = steps.find((entry) => entry.id === actualStep)
  const visible = step && step.kind !== "review" ? fields.filter((field) => step.fields.includes(field.name)) : fields
  const uiDisabled = Boolean(formProps.disabled) || state.isSubmitting
  const errorHandler = (error: unknown) => formProps.onSubmitError?.(error)
  return <RetainStepFieldsContext.Provider value={steps.length > 0}><FormShell {...formProps} form={form} routing={{
    canSubmit: () => controller.isLast,
    onDomSubmit: () => controller.isLast ? form.submit() : controller.next(),
    onReset: controller.reset, onCancel: controller.cancel,
    focusErrors: (errors: FormErrors<I>) => controller.focusErrors(errors),
    navigateToField: controller.navigateToField,
  }}>
    {steps.length > 0 && <ol className="ex-form-steps" data-span="full" aria-label={stepsAriaLabel}>{steps.map((entry, index) => <li key={entry.id}>
      <button type="button" aria-current={entry.id === actualStep ? "step" : undefined} disabled={uiDisabled}
        onClick={() => { void controller.goTo(entry.id).catch(errorHandler) }}>{index + 1}. {entry.title}</button>
    </li>)}</ol>}
    {children}
    {step?.kind === "review" ? <div className="ex-form-review" data-span="full">{step.render(form.getValues())}</div> : visible.map((field) => <ConfiguredField key={field.name} form={form} configuration={field as unknown as RuntimeConfiguration} />)}
    <div className="ex-form-footer" data-span="full">
      {typeof footer === "function" ? footer(footerArgs) : footer !== undefined ? footer : <>
        {steps.length > 0 && !controller.isFirst && <Button type="button" variant="outline" disabled={uiDisabled} onClick={controller.back}>{backLabel}</Button>}
        {resetLabel != null && <Button type="button" variant="outline" disabled={uiDisabled} onClick={() => form.reset()}>{resetLabel}</Button>}
        {controller.isLast ? <Button type="submit" disabled={uiDisabled}>{submitLabel}</Button> : <Button type="button" disabled={uiDisabled || state.isValidating} onClick={() => { void controller.next().catch(errorHandler) }}>{nextLabel}</Button>}
      </>}
    </div>
  </FormShell></RetainStepFieldsContext.Provider>
}

// The recursive renderer erases its already-checked configuration at this
// boundary; public fields/defaultItem/render still use distributed path types.
interface RuntimeConfiguration {
  kind?: "field" | "list"
  name: string
  label?: React.ReactNode
  defaultItem?: FormValues
  itemFields?: readonly RuntimeConfiguration[]
  dependencies?: readonly string[]
  visibleWhen?: (snapshot: FormSnapshot<FormValues>) => boolean
  disabledWhen?: (snapshot: FormSnapshot<FormValues>) => boolean
  validationScope?: FormValidationScope<FormValues>
  [key: string]: unknown
}
type RuntimeArray = FormFieldArray<FormValues, never>
const RuntimeItem = FormItem as unknown as React.ComponentType<{ form: unknown } & RuntimeConfiguration>
const RuntimeList = FormList as unknown as React.ComponentType<{ form: unknown; name: string; defaultItem: FormValues; render(array: RuntimeArray): React.ReactNode } & Record<string, unknown>>

function ConfiguredField<I extends FormValues, O>({ form, configuration, prefix = "" }: { form: FormInstance<I, O>; configuration: RuntimeConfiguration; prefix?: string }) {
  const name = prefix ? `${prefix}.${configuration.name}` : configuration.name
  if (configuration.kind === "list") return <RuntimeList {...configuration} name={name} form={form} defaultItem={configuration.defaultItem!}
    render={(array) => <ConfiguredRows form={form} configuration={configuration} name={name} array={array} />} />
  return <RelativeItem form={form} configuration={configuration} name={name} prefix={prefix} />
}

function RelativeItem<I extends FormValues, O>({ form, configuration, name, prefix }: { form: FormInstance<I, O>; configuration: RuntimeConfiguration; name: string; prefix: string }) {
  const { visibleWhen, disabledWhen, dependencies, validationScope, ...rest } = configuration
  const relativeSnapshot = (value: FormSnapshot<FormValues>) => prefix ? readPath(value, prefix) as FormSnapshot<FormValues> : value
  const scopeId = validationScope?.id
  const scopeSchema = validationScope?.validationSchema
  const fieldsKey = JSON.stringify(normalizePaths(validationScope?.fields ?? []))
  const depsKey = JSON.stringify(normalizePaths(validationScope?.validationDependencies ?? []))
  const scope = React.useMemo(() => {
    if (!scopeId || !scopeSchema) return undefined
    const fields = JSON.parse(fieldsKey) as string[]
    const validationDependencies = JSON.parse(depsKey) as string[]
    if (!prefix) return { id: scopeId, validationSchema: scopeSchema, fields, validationDependencies }
    const source = scopeSchema
    return {
      id: `${prefix.replace(/[^a-zA-Z0-9_-]/g, "_")}_${scopeId}`,
      fields: fields.map((path) => `${prefix}.${path}`),
      validationDependencies: validationDependencies.map((path) => `${prefix}.${path}`),
      validationSchema: { "~standard": { version: 1 as const, vendor: "exui-relative-scope", async validate(value: unknown) {
        const result = await source["~standard"].validate(readPath(value, prefix))
        if (result.issues) return { issues: result.issues.map((issue) => ({ ...issue, path: [...parsePath(prefix), ...(issue.path ?? [])] })) }
        return result
      } } },
    } satisfies FormValidationScope<FormValues>
  }, [prefix, scopeId, scopeSchema, fieldsKey, depsKey])
  return <RuntimeItem {...rest} form={form} name={name}
    dependencies={dependencies?.map((path) => prefix ? `${prefix}.${path}` : path)} validationScope={scope}
    visibleWhen={visibleWhen ? (value) => visibleWhen(relativeSnapshot(value)) : undefined}
    disabledWhen={disabledWhen ? (value) => disabledWhen(relativeSnapshot(value)) : undefined} />
}

function ConfiguredRows<I extends FormValues, O>({ form, configuration, name, array }: { form: FormInstance<I, O>; configuration: RuntimeConfiguration; name: string; array: RuntimeArray }) {
  const context = React.useContext(FormContext)
  return <div className="ex-form-list-rows">{array.items.map(({ key, index }) => <div key={key} className="ex-form-list-row">
    <div className="ex-form-row-grid" data-layout={configuration.layout as string | undefined}>{configuration.itemFields!.map((field) => <ConfiguredField key={field.name} form={form} configuration={field} prefix={`${name}.${index}`} />)}</div>
    <div className="ex-form-row-actions">
      <Button type="button" variant="outline" disabled={context?.disabled || index === 0} onClick={() => array.move(index, index - 1)} aria-label={`上移第 ${index + 1} 项`}>上移</Button>
      <Button type="button" variant="outline" disabled={context?.disabled || index === array.items.length - 1} onClick={() => array.move(index, index + 1)} aria-label={`下移第 ${index + 1} 项`}>下移</Button>
      <Button type="button" variant="outline" disabled={context?.disabled} onClick={() => array.remove(index)} aria-label={`删除第 ${index + 1} 项`}>删除</Button>
    </div>
  </div>)}<Button type="button" variant="outline" disabled={context?.disabled} onClick={() => array.append(configuration.defaultItem as never)}>添加</Button></div>
}
