"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SelectField, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Combobox, ComboboxChips, ComboboxChip, ComboboxChipsInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty, useComboboxAnchor } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { FormFilesControl } from "./form-controls/files"

// Values are erased only inside the adapter boundary. Public FormItem props
// select the compatible adapter and retain each input path's exact value type.
export interface ControlBinding {
  value: unknown
  onChange(value: unknown): void
  onBlur(): void
  ref(element: HTMLElement | null): void
  disabled: boolean
  accessibility: {
    id: string
    name: string
    "aria-invalid": boolean
    "aria-describedby"?: string
    "aria-required"?: boolean
  }
  labelId?: string
}

interface Option { value: string; label: React.ReactNode; disabled?: boolean }
interface ChoiceProps { options: readonly Option[]; placeholder?: React.ReactNode; className?: string; glass?: boolean; size?: "sm" | "default" }
export interface RuntimeControlProps {
  control: string
  controlProps?: Record<string, unknown>
  binding: ControlBinding
}

function groupBlur(binding: ControlBinding, event: React.FocusEvent<HTMLElement>) {
  if (!event.currentTarget.contains(event.relatedTarget)) binding.onBlur()
}

function MultiSelectControl({ binding, options, placeholder, className }: ChoiceProps & { binding: ControlBinding }) {
  const anchor = useComboboxAnchor()
  const value = Array.isArray(binding.value) ? binding.value as string[] : []
  const labels = new Map(options.map((option) => [option.value, option.label]))
  return <Combobox<string, true>
    multiple items={options.map((option) => option.value)} value={value}
    itemToStringLabel={(item) => typeof labels.get(item) === "string" ? labels.get(item) as string : item}
    onValueChange={(next) => binding.onChange(next)}
    disabled={binding.disabled} name={binding.accessibility.name}
    onOpenChange={(open) => { if (!open) binding.onBlur() }}
  >
    <ComboboxChips ref={anchor} className={cn("ex-form-multiselect", className)} onBlur={(event) => groupBlur(binding, event)}>
      {value.map((item) => <ComboboxChip key={item} aria-label={typeof labels.get(item) === "string" ? String(labels.get(item)) : item}>{labels.get(item) ?? item}</ComboboxChip>)}
      <ComboboxChipsInput {...binding.accessibility} ref={binding.ref} disabled={binding.disabled}
        aria-labelledby={binding.labelId} placeholder={typeof placeholder === "string" ? placeholder : undefined} />
    </ComboboxChips>
    <ComboboxContent anchor={anchor}>
      <ComboboxEmpty>无匹配选项</ComboboxEmpty>
      <ComboboxList>{(item: string) => {
        const option = options.find((candidate) => candidate.value === item)
        return <ComboboxItem key={item} value={item} disabled={option?.disabled}>{option?.label ?? item}</ComboboxItem>
      }}</ComboboxList>
    </ComboboxContent>
  </Combobox>
}

export function FormControl({ control, controlProps = {}, binding }: RuntimeControlProps) {
  const common = { ...binding.accessibility, disabled: binding.disabled, ref: binding.ref, onBlur: binding.onBlur }
  if (["text", "email", "password", "number", "date"].includes(control)) {
    return <Input {...controlProps as React.ComponentProps<typeof Input>} {...common} type={control}
      value={typeof binding.value === "string" ? binding.value : ""} onChange={(event) => binding.onChange(event.target.value)} />
  }
  if (control === "textarea") return <Textarea {...controlProps as React.ComponentProps<typeof Textarea>} {...common}
    value={typeof binding.value === "string" ? binding.value : ""} onChange={(event) => binding.onChange(event.target.value)} />
  if (control === "checkbox") return <Checkbox {...controlProps as React.ComponentProps<typeof Checkbox>} {...common}
    checked={binding.value === true} onCheckedChange={(next) => binding.onChange(next === true)} />
  if (control === "switch") return <Switch {...controlProps as React.ComponentProps<typeof Switch>} {...common}
    checked={binding.value === true} onCheckedChange={(next) => binding.onChange(next === true)} />
  if (control === "files") return <FormFilesControl binding={binding} {...controlProps} />
  const choices = controlProps as unknown as ChoiceProps
  const options = choices.options ?? []
  if (control === "select") return <SelectField name={binding.accessibility.name}
    disabled={binding.disabled} value={typeof binding.value === "string" ? binding.value : ""} onValueChange={binding.onChange}>
    <SelectTrigger {...common} aria-labelledby={binding.labelId} className={cn("ex-form-select", choices.className)} glass={choices.glass} size={choices.size}>
      <SelectValue placeholder={choices.placeholder} />
    </SelectTrigger>
    <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent>
  </SelectField>
  if (control === "multi-select") return <MultiSelectControl binding={binding} {...choices} />
  if (control === "radio-group") {
    const first = options.findIndex((option) => !option.disabled)
    return <RadioGroup {...binding.accessibility} aria-labelledby={binding.labelId} disabled={binding.disabled}
      className={choices.className} value={typeof binding.value === "string" ? binding.value : ""}
      onValueChange={binding.onChange} onBlur={(event) => groupBlur(binding, event)}>
      {options.map((option, index) => <label key={option.value} className="ex-form-choice" htmlFor={`${binding.accessibility.id}-${index}`}>
        <RadioGroupItem id={`${binding.accessibility.id}-${index}`} value={option.value} disabled={option.disabled || binding.disabled}
          ref={index === first ? binding.ref : undefined} aria-invalid={binding.accessibility["aria-invalid"]}
          aria-describedby={binding.accessibility["aria-describedby"]} />{option.label}
      </label>)}
    </RadioGroup>
  }
  if (control === "checkbox-group") {
    const first = options.findIndex((option) => !option.disabled)
    const value = Array.isArray(binding.value) ? binding.value as string[] : []
    return <div role="group" {...binding.accessibility} aria-labelledby={binding.labelId} className={cn("ex-form-choices", choices.className)} onBlur={(event) => groupBlur(binding, event)}>
      {options.map((option, index) => <label key={option.value} className="ex-form-choice" htmlFor={`${binding.accessibility.id}-${index}`}>
        <Checkbox id={`${binding.accessibility.id}-${index}`} ref={index === first ? binding.ref : undefined}
          disabled={binding.disabled || option.disabled} checked={value.includes(option.value)}
          aria-invalid={binding.accessibility["aria-invalid"]} aria-describedby={binding.accessibility["aria-describedby"]}
          onCheckedChange={(checked) => binding.onChange(checked === true ? [...value.filter((item) => item !== option.value), option.value] : value.filter((item) => item !== option.value))} />{option.label}
      </label>)}
    </div>
  }
  if (control === "select-or-input") return <>
    <Input {...common} className={choices.className} list={`${binding.accessibility.id}-options`}
      placeholder={typeof choices.placeholder === "string" ? choices.placeholder : undefined}
      value={typeof binding.value === "string" ? binding.value : ""} onChange={(event) => binding.onChange(event.target.value)} />
    <datalist id={`${binding.accessibility.id}-options`}>{options.filter((option) => !option.disabled).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</datalist>
  </>
  throw new Error(`ExUI Form: unknown control '${control}'.`)
}
