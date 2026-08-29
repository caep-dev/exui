"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

type SelectOption = {
  label: React.ReactNode
  value: string
  disabled?: boolean
}

type SelectProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  "onValueChange" | "defaultValue" | "value" | "disabled"
> & {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: React.ReactNode
  defaultValue?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
}

function Select({
  options,
  value,
  onChange,
  placeholder,
  defaultValue,
  disabled = false,
  className,
  size = "default",
  ...props
}: SelectProps) {
  return (
    <SelectField
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={onChange}
      {...props}
    >
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectField>
  )
}

function SelectField({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select-field" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1.5 p-0", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex h-[var(--exui-component-form-control-base-height)] w-fit items-center justify-between gap-[var(--exui-component-form-control-base-gap)] rounded-[var(--exui-component-form-control-base-radius)] border [border-color:var(--exui-component-form-control-base-border)] [background:var(--exui-component-form-control-base-background)] px-[var(--exui-component-form-control-base-padding-inline)] py-[var(--exui-component-form-control-base-padding-block)] [color:var(--exui-component-form-control-base-foreground)] [box-shadow:var(--exui-component-form-control-base-shadow)] [font-family:var(--exui-component-form-control-base-font-family)] text-[length:var(--exui-component-form-control-base-font-size)] leading-[var(--exui-component-form-control-base-line-height)] font-[number:var(--exui-component-form-control-base-font-weight)] whitespace-nowrap transition-[color,box-shadow,background-color] outline-none hover:[background:var(--exui-component-form-control-hover-background)] hover:[color:var(--exui-component-form-control-hover-foreground)] hover:[border-color:var(--exui-component-form-control-hover-border)] hover:[box-shadow:var(--exui-component-form-control-hover-shadow)] hover:opacity-[var(--exui-component-form-control-hover-opacity)] focus-visible:[background:var(--exui-component-form-control-focus-background)] focus-visible:[color:var(--exui-component-form-control-focus-foreground)] focus-visible:[border-color:var(--exui-component-form-control-focus-border)] focus-visible:[box-shadow:var(--exui-component-form-control-focus-shadow)] focus-visible:opacity-[var(--exui-component-form-control-focus-opacity)] disabled:cursor-not-allowed disabled:[background:var(--exui-component-form-control-disabled-background)] disabled:[color:var(--exui-component-form-control-disabled-foreground)] disabled:[border-color:var(--exui-component-form-control-disabled-border)] disabled:[box-shadow:var(--exui-component-form-control-disabled-shadow)] disabled:opacity-[var(--exui-component-form-control-disabled-opacity)] aria-invalid:[background:var(--exui-component-form-control-invalid-background)] aria-invalid:[color:var(--exui-component-form-control-invalid-foreground)] aria-invalid:[border-color:var(--exui-component-form-control-invalid-border)] aria-invalid:[box-shadow:var(--exui-component-form-control-invalid-shadow)] aria-invalid:opacity-[var(--exui-component-form-control-invalid-opacity)] data-placeholder:[color:var(--exui-component-form-control-base-placeholder)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-[var(--exui-component-form-control-base-gap)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--exui-component-menu-surface-radius)] border [border-color:var(--exui-component-menu-surface-border)] [background:var(--exui-component-menu-surface-background)] p-[var(--exui-component-menu-surface-padding)] [color:var(--exui-component-menu-surface-foreground)] [box-shadow:var(--exui-component-menu-surface-shadow)] duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150", position ==="popper"&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && ""
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-3 py-2.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-[var(--exui-component-menu-item-gap)] rounded-[var(--exui-component-menu-item-radius)] border [border-color:var(--exui-component-menu-item-default-border)] [background:var(--exui-component-menu-item-default-background)] py-[var(--exui-component-menu-item-padding-block)] pr-8 pl-[var(--exui-component-menu-item-padding-inline)] text-[length:var(--exui-component-menu-item-font-size)] font-[number:var(--exui-component-menu-item-font-weight)] [color:var(--exui-component-menu-item-default-foreground)] [box-shadow:var(--exui-component-menu-item-default-shadow)] opacity-[var(--exui-component-menu-item-default-opacity)] outline-hidden select-none hover:[background:var(--exui-component-menu-item-hover-background)] hover:[color:var(--exui-component-menu-item-hover-foreground)] hover:[border-color:var(--exui-component-menu-item-hover-border)] hover:[box-shadow:var(--exui-component-menu-item-hover-shadow)] hover:opacity-[var(--exui-component-menu-item-hover-opacity)] active:[background:var(--exui-component-menu-item-active-background)] active:[color:var(--exui-component-menu-item-active-foreground)] active:[border-color:var(--exui-component-menu-item-active-border)] active:[box-shadow:var(--exui-component-menu-item-active-shadow)] active:opacity-[var(--exui-component-menu-item-active-opacity)] focus:[background:var(--exui-component-menu-item-focus-background)] focus:[color:var(--exui-component-menu-item-focus-foreground)] focus:[border-color:var(--exui-component-menu-item-focus-border)] focus:[box-shadow:var(--exui-component-menu-item-focus-shadow)] focus:opacity-[var(--exui-component-menu-item-focus-opacity)] data-highlighted:[background:var(--exui-component-menu-item-hover-background)] data-highlighted:[color:var(--exui-component-menu-item-hover-foreground)] data-highlighted:[border-color:var(--exui-component-menu-item-hover-border)] data-highlighted:[box-shadow:var(--exui-component-menu-item-hover-shadow)] data-highlighted:opacity-[var(--exui-component-menu-item-hover-opacity)] focus:data-highlighted:[background:var(--exui-component-menu-item-focus-background)] focus:data-highlighted:[color:var(--exui-component-menu-item-focus-foreground)] focus:data-highlighted:[border-color:var(--exui-component-menu-item-focus-border)] focus:data-highlighted:[box-shadow:var(--exui-component-menu-item-focus-shadow)] focus:data-highlighted:opacity-[var(--exui-component-menu-item-focus-opacity)] data-checked:[background:var(--exui-component-menu-checked-item-background)] data-checked:[color:var(--exui-component-menu-checked-item-foreground)] data-disabled:pointer-events-none data-disabled:[background:var(--exui-component-menu-item-disabled-background)] data-disabled:[color:var(--exui-component-menu-item-disabled-foreground)] data-disabled:[border-color:var(--exui-component-menu-item-disabled-border)] data-disabled:[box-shadow:var(--exui-component-menu-item-disabled-shadow)] data-disabled:opacity-[var(--exui-component-menu-item-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-[var(--exui-component-menu-item-gap)]",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center [color:var(--exui-component-menu-checked-item-indicator)]">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1.5 my-[var(--exui-component-menu-separator-margin-block)] h-[var(--exui-component-menu-separator-thickness)] [background:var(--exui-component-menu-separator-color)]",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectField,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
