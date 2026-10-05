"use client"

import * as React from "react"
import { YearsDropdown, type DropdownProps } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SelectContent, SelectField, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { FormDateControlProps } from "@/lib/forms/types"
import type { ControlBinding } from "../form-controls"

function parseDate(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(0)
  date.setFullYear(year!, month! - 1, day!)
  date.setHours(12, 0, 0, 0)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day ? date : undefined
}

function formatDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function DateDropdown({ options = [], value, onChange, disabled, "aria-label": label }: DropdownProps) {
  return <SelectField value={String(value ?? "")} disabled={disabled}
    onValueChange={(next) => onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>)}>
    <SelectTrigger aria-label={label} size="sm" className="ex-form-date-dropdown">
      <SelectValue />
    </SelectTrigger>
    <SelectContent position="popper" align="start">
      {options.map((option) => <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
        {option.label}
      </SelectItem>)}
    </SelectContent>
  </SelectField>
}

export function FormDateControl({ binding, min, max, placeholder = "选择日期", todayLabel = "今天", className, glass }: FormDateControlProps & { binding: ControlBinding }) {
  const [open, setOpen] = React.useState(false)
  const value = typeof binding.value === "string" ? binding.value : ""
  const selected = parseDate(value)
  const earliest = parseDate(min)
  const latest = parseDate(max)
  const today = new Date()
  const todayValue = formatDate(today)
  const canSelectToday = (!earliest || todayValue >= formatDate(earliest)) && (!latest || todayValue <= formatDate(latest))
  const displayMonth = selected && (!earliest || selected >= earliest) && (!latest || selected <= latest)
    ? selected : earliest ?? latest ?? new Date()
  const disabled = [earliest && { before: earliest }, latest && { after: latest }].filter((matcher) => matcher !== undefined)
  const chooseDate = (next: Date | undefined) => {
    if (!next) return
    const nextValue = formatDate(next)
    if ((earliest && nextValue < formatDate(earliest)) || (latest && nextValue > formatDate(latest))) return
    binding.onChange(nextValue)
    binding.onBlur()
    setOpen(false)
  }

  return <Popover open={open} onOpenChange={(next) => {
    setOpen(next)
    if (!next) binding.onBlur()
  }}>
    <PopoverTrigger asChild>
      <Button {...binding.accessibility} ref={binding.ref} aria-labelledby={binding.labelId}
        type="button" variant="outline" glass={glass} disabled={binding.disabled}
        className={cn("ex-form-date-trigger", className)} onBlur={() => { if (!open) binding.onBlur() }}>
        <span className={cn(!value && "ex-form-date-placeholder")}>{value || placeholder}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="ex-form-date-popover" glass={glass}>
      <Calendar mode="single" captionLayout="dropdown" selected={selected} defaultMonth={displayMonth}
        startMonth={earliest} endMonth={latest} disabled={disabled}
        onSelect={chooseDate}
        components={{ Dropdown: DateDropdown, YearsDropdown: (props: DropdownProps) => <span className="ex-form-date-year-actions">
          <YearsDropdown {...props} />
          {canSelectToday && <Button type="button" size="xs" variant="ghost" className="ex-form-date-today"
            onClick={() => chooseDate(today)}>{todayLabel}</Button>
          }
        </span> }} />
    </PopoverContent>
  </Popover>
}
