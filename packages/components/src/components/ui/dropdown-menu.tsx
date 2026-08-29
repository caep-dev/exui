"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

const menuItemRecipeClasses =
  "relative flex cursor-default items-center gap-[var(--exui-component-menu-item-gap)] rounded-[var(--exui-component-menu-item-radius)] border [border-color:var(--exui-component-menu-item-default-border)] [background:var(--exui-component-menu-item-default-background)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)] text-[length:var(--exui-component-menu-item-font-size)] font-[number:var(--exui-component-menu-item-font-weight)] [color:var(--exui-component-menu-item-default-foreground)] [box-shadow:var(--exui-component-menu-item-default-shadow)] opacity-[var(--exui-component-menu-item-default-opacity)] outline-hidden select-none hover:[background:var(--exui-component-menu-item-hover-background)] hover:[color:var(--exui-component-menu-item-hover-foreground)] hover:[border-color:var(--exui-component-menu-item-hover-border)] hover:[box-shadow:var(--exui-component-menu-item-hover-shadow)] hover:opacity-[var(--exui-component-menu-item-hover-opacity)] active:[background:var(--exui-component-menu-item-active-background)] active:[color:var(--exui-component-menu-item-active-foreground)] active:[border-color:var(--exui-component-menu-item-active-border)] active:[box-shadow:var(--exui-component-menu-item-active-shadow)] active:opacity-[var(--exui-component-menu-item-active-opacity)] focus:[background:var(--exui-component-menu-item-focus-background)] focus:[color:var(--exui-component-menu-item-focus-foreground)] focus:[border-color:var(--exui-component-menu-item-focus-border)] focus:[box-shadow:var(--exui-component-menu-item-focus-shadow)] focus:opacity-[var(--exui-component-menu-item-focus-opacity)] data-highlighted:[background:var(--exui-component-menu-item-hover-background)] data-highlighted:[color:var(--exui-component-menu-item-hover-foreground)] data-highlighted:[border-color:var(--exui-component-menu-item-hover-border)] data-highlighted:[box-shadow:var(--exui-component-menu-item-hover-shadow)] data-highlighted:opacity-[var(--exui-component-menu-item-hover-opacity)] data-disabled:pointer-events-none data-disabled:[background:var(--exui-component-menu-item-disabled-background)] data-disabled:[color:var(--exui-component-menu-item-disabled-foreground)] data-disabled:[border-color:var(--exui-component-menu-item-disabled-border)] data-disabled:[box-shadow:var(--exui-component-menu-item-disabled-shadow)] data-disabled:opacity-[var(--exui-component-menu-item-disabled-opacity)] data-inset:pl-9.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const menuKeyboardFocusRecipeClasses =
  "focus:data-highlighted:[background:var(--exui-component-menu-item-focus-background)] focus:data-highlighted:[color:var(--exui-component-menu-item-focus-foreground)] focus:data-highlighted:[border-color:var(--exui-component-menu-item-focus-border)] focus:data-highlighted:[box-shadow:var(--exui-component-menu-item-focus-shadow)] focus:data-highlighted:opacity-[var(--exui-component-menu-item-focus-opacity)]"

const submenuTriggerRecipeClasses =
  "flex cursor-default items-center gap-[var(--exui-component-menu-submenu-trigger-gap)] rounded-[var(--exui-component-menu-submenu-trigger-radius)] border [border-color:var(--exui-component-menu-submenu-trigger-default-border)] [background:var(--exui-component-menu-submenu-trigger-default-background)] px-[var(--exui-component-menu-submenu-trigger-padding-inline)] py-[var(--exui-component-menu-submenu-trigger-padding-block)] text-[length:var(--exui-component-menu-submenu-trigger-font-size)] font-[number:var(--exui-component-menu-submenu-trigger-font-weight)] [color:var(--exui-component-menu-submenu-trigger-default-foreground)] [box-shadow:var(--exui-component-menu-submenu-trigger-default-shadow)] opacity-[var(--exui-component-menu-submenu-trigger-default-opacity)] outline-hidden select-none hover:[background:var(--exui-component-menu-submenu-trigger-hover-background)] hover:[color:var(--exui-component-menu-submenu-trigger-hover-foreground)] hover:[border-color:var(--exui-component-menu-submenu-trigger-hover-border)] hover:[box-shadow:var(--exui-component-menu-submenu-trigger-hover-shadow)] hover:opacity-[var(--exui-component-menu-submenu-trigger-hover-opacity)] active:[background:var(--exui-component-menu-submenu-trigger-active-background)] active:[color:var(--exui-component-menu-submenu-trigger-active-foreground)] active:[border-color:var(--exui-component-menu-submenu-trigger-active-border)] active:[box-shadow:var(--exui-component-menu-submenu-trigger-active-shadow)] active:opacity-[var(--exui-component-menu-submenu-trigger-active-opacity)] focus:[background:var(--exui-component-menu-submenu-trigger-focus-background)] focus:[color:var(--exui-component-menu-submenu-trigger-focus-foreground)] focus:[border-color:var(--exui-component-menu-submenu-trigger-focus-border)] focus:[box-shadow:var(--exui-component-menu-submenu-trigger-focus-shadow)] focus:opacity-[var(--exui-component-menu-submenu-trigger-focus-opacity)] data-open:[background:var(--exui-component-menu-submenu-trigger-active-background)] data-open:[color:var(--exui-component-menu-submenu-trigger-active-foreground)] data-open:[border-color:var(--exui-component-menu-submenu-trigger-active-border)] data-open:[box-shadow:var(--exui-component-menu-submenu-trigger-active-shadow)] data-open:opacity-[var(--exui-component-menu-submenu-trigger-active-opacity)] data-disabled:pointer-events-none data-disabled:[background:var(--exui-component-menu-submenu-trigger-disabled-background)] data-disabled:[color:var(--exui-component-menu-submenu-trigger-disabled-foreground)] data-disabled:[border-color:var(--exui-component-menu-submenu-trigger-disabled-border)] data-disabled:[box-shadow:var(--exui-component-menu-submenu-trigger-disabled-shadow)] data-disabled:opacity-[var(--exui-component-menu-submenu-trigger-disabled-opacity)] data-inset:pl-9.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const submenuKeyboardFocusRecipeClasses =
  "focus:data-highlighted:[background:var(--exui-component-menu-submenu-trigger-focus-background)] focus:data-highlighted:[color:var(--exui-component-menu-submenu-trigger-focus-foreground)] focus:data-highlighted:[border-color:var(--exui-component-menu-submenu-trigger-focus-border)] focus:data-highlighted:[box-shadow:var(--exui-component-menu-submenu-trigger-focus-shadow)] focus:data-highlighted:opacity-[var(--exui-component-menu-submenu-trigger-focus-opacity)]"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn("relative z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-48 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--exui-component-menu-surface-radius)] border [border-color:var(--exui-component-menu-surface-border)] [background:var(--exui-component-menu-surface-background)] p-[var(--exui-component-menu-surface-padding)] [color:var(--exui-component-menu-surface-foreground)] [box-shadow:var(--exui-component-menu-surface-shadow)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150", className )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        menuItemRecipeClasses,
        menuKeyboardFocusRecipeClasses,
        "group/dropdown-menu-item data-[variant=destructive]:[background:var(--exui-component-menu-item-destructive-background)] data-[variant=destructive]:[color:var(--exui-component-menu-item-destructive-foreground)] data-[variant=destructive]:[border-color:var(--exui-component-menu-item-destructive-border)] data-[variant=destructive]:[box-shadow:var(--exui-component-menu-item-destructive-shadow)] data-[variant=destructive]:opacity-[var(--exui-component-menu-item-destructive-opacity)]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        menuItemRecipeClasses,
        menuKeyboardFocusRecipeClasses,
        "pr-8 data-checked:[background:var(--exui-component-menu-checked-item-background)] data-checked:[color:var(--exui-component-menu-checked-item-foreground)]",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center [color:var(--exui-component-menu-checked-item-indicator)]"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        menuItemRecipeClasses,
        menuKeyboardFocusRecipeClasses,
        "pr-8 data-checked:[background:var(--exui-component-menu-checked-item-background)] data-checked:[color:var(--exui-component-menu-checked-item-foreground)]",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center [color:var(--exui-component-menu-checked-item-indicator)]"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2.5 text-xs text-muted-foreground data-inset:pl-9.5",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-[var(--exui-component-menu-separator-margin-block)] h-[var(--exui-component-menu-separator-thickness)] [background:var(--exui-component-menu-separator-color)]", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ms-[var(--exui-component-menu-shortcut-margin-inline-start)] text-[length:var(--exui-component-menu-shortcut-font-size)] tracking-[var(--exui-component-menu-shortcut-letter-spacing)] [color:var(--exui-component-menu-shortcut-foreground)] group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        submenuTriggerRecipeClasses,
        submenuKeyboardFocusRecipeClasses,
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn("relative z-50 min-w-36 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-[var(--exui-component-menu-surface-radius)] border [border-color:var(--exui-component-menu-surface-border)] [background:var(--exui-component-menu-surface-background)] p-[var(--exui-component-menu-surface-padding)] [color:var(--exui-component-menu-surface-foreground)] [box-shadow:var(--exui-component-menu-surface-shadow)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150", className )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
