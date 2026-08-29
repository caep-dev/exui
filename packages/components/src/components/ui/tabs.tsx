"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex h-[var(--exui-component-tabs-list-height)] w-fit items-center justify-center gap-[var(--exui-component-tabs-list-gap)] rounded-[var(--exui-component-tabs-list-radius)] p-[var(--exui-component-tabs-list-padding)] [color:var(--exui-component-tabs-list-foreground)] group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "[background:var(--exui-component-tabs-default-list-background)]",
        line: "[background:var(--exui-component-tabs-line-list-background)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-[var(--exui-component-tabs-trigger-gap)] rounded-[var(--exui-component-tabs-trigger-radius)] border [border-color:var(--exui-component-tabs-trigger-default-border)] [background:var(--exui-component-tabs-trigger-default-background)] px-[var(--exui-component-tabs-trigger-padding-inline)] py-[var(--exui-component-tabs-trigger-padding-block)] text-[length:var(--exui-component-tabs-trigger-font-size)] font-[number:var(--exui-component-tabs-trigger-font-weight)] whitespace-nowrap [color:var(--exui-component-tabs-trigger-default-foreground)] [box-shadow:var(--exui-component-tabs-trigger-default-shadow)] opacity-[var(--exui-component-tabs-trigger-default-opacity)] transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:[background:var(--exui-component-tabs-trigger-hover-background)] hover:[color:var(--exui-component-tabs-trigger-hover-foreground)] hover:[border-color:var(--exui-component-tabs-trigger-hover-border)] hover:[box-shadow:var(--exui-component-tabs-trigger-hover-shadow)] hover:opacity-[var(--exui-component-tabs-trigger-hover-opacity)] focus-visible:[background:var(--exui-component-tabs-trigger-focus-background)] focus-visible:[color:var(--exui-component-tabs-trigger-focus-foreground)] focus-visible:[border-color:var(--exui-component-tabs-trigger-focus-border)] focus-visible:[box-shadow:var(--exui-component-tabs-trigger-focus-shadow)] focus-visible:opacity-[var(--exui-component-tabs-trigger-focus-opacity)] disabled:pointer-events-none disabled:[background:var(--exui-component-tabs-trigger-disabled-background)] disabled:[color:var(--exui-component-tabs-trigger-disabled-foreground)] disabled:[border-color:var(--exui-component-tabs-trigger-disabled-border)] disabled:[box-shadow:var(--exui-component-tabs-trigger-disabled-shadow)] disabled:opacity-[var(--exui-component-tabs-trigger-disabled-opacity)] data-active:[background:var(--exui-component-tabs-trigger-selected-background)] data-active:[color:var(--exui-component-tabs-trigger-selected-foreground)] data-active:[border-color:var(--exui-component-tabs-trigger-selected-border)] data-active:[box-shadow:var(--exui-component-tabs-trigger-selected-shadow)] data-active:opacity-[var(--exui-component-tabs-trigger-selected-opacity)] group-data-[variant=line]/tabs-list:data-active:[background:var(--exui-component-tabs-line-trigger-selected-background)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "after:absolute after:[background:var(--exui-component-tabs-indicator-background)] after:opacity-[var(--exui-component-tabs-default-indicator-opacity)] after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[var(--exui-component-tabs-indicator-offset)] group-data-horizontal/tabs:after:h-[var(--exui-component-tabs-indicator-thickness)] group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:right-[var(--exui-component-tabs-indicator-offset)] group-data-vertical/tabs:after:w-[var(--exui-component-tabs-indicator-thickness)] group-data-[variant=line]/tabs-list:data-active:after:opacity-[var(--exui-component-tabs-line-indicator-opacity)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
