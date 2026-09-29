"use client"

import * as React from "react"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ExItemLayout = "vertical" | "horizontal"
export type ExItemSpan = 1 | 2 | 3 | 4 | "full"

export interface ExItemProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  title?: React.ReactNode
  desc?: React.ReactNode
  layout?: ExItemLayout
  /** Maximum content width in horizontal rows; numbers are CSS pixels. */
  contentMaxWidth?: React.CSSProperties["maxWidth"]
  contentAlign?: "left" | "right"
  span?: ExItemSpan
  controlId?: string
  children: React.ReactNode
}

// FormShell supplies only presentation layout, never form state or field binding.
type ItemPresentation = Pick<ExItemProps, "layout" | "contentMaxWidth" | "contentAlign">
const ExItemLayoutContext = React.createContext<ItemPresentation>({})

export function ExItemLayoutProvider({ layout, contentMaxWidth, contentAlign, children }: ItemPresentation & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ layout, contentMaxWidth, contentAlign }), [layout, contentMaxWidth, contentAlign])
  return <ExItemLayoutContext.Provider value={value}>{children}</ExItemLayoutContext.Provider>
}

function hasContent(value: React.ReactNode): boolean {
  return value !== null && value !== undefined && value !== false && value !== ""
}

function appendDescriptionId(existing: string | undefined, id: string): string {
  const ids = [...new Set(existing?.trim().split(/\s+/).filter(Boolean) ?? [])]
  if (!ids.includes(id)) ids.push(id)
  return ids.join(" ")
}

export function ExItem({ title, desc, layout, contentMaxWidth, contentAlign, span = 1, controlId, children, className, style, ref, ...rootProps }: ExItemProps) {
  const inherited = React.useContext(ExItemLayoutContext)
  const effectiveLayout = layout ?? inherited.layout ?? "vertical"
  const maxWidth = contentMaxWidth ?? inherited.contentMaxWidth
  const contentStyle = { "--ex-item-content-max-width": typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth ?? "100%" } as React.CSSProperties
  const generatedId = React.useId()
  const directInput = React.isValidElement(children) && children.type === Input
    ? children as React.ReactElement<React.ComponentProps<typeof Input>>
    : undefined
  const inputId = directInput?.props.id
  if (controlId !== undefined && inputId !== undefined && controlId !== inputId) {
    throw new Error("ExUI ExItem: controlId must match the direct Input id.")
  }
  const effectiveId = controlId ?? inputId ?? (directInput ? generatedId : undefined)
  const descriptionId = effectiveId && hasContent(desc) ? `${effectiveId}-description` : undefined
  const describedBy = directInput && descriptionId
    ? appendDescriptionId(directInput.props["aria-describedby"], descriptionId)
    : undefined
  const content = directInput && (inputId === undefined || describedBy !== undefined)
    ? React.cloneElement(directInput, {
      ...(inputId === undefined ? { id: effectiveId } : {}),
      ...(describedBy !== undefined ? { "aria-describedby": describedBy } : {}),
    })
    : children
  const hasTitle = hasContent(title)
  const hasDescription = hasContent(desc)

  return <Field {...rootProps} ref={ref} className={cn("ex-item", className)} style={style}
    data-span={span} data-item-layout={effectiveLayout} orientation="vertical">
    {(hasTitle || hasDescription) && <div className="ex-item-heading">
      {hasTitle && (effectiveId
        ? <FieldLabel id={`${effectiveId}-label`} htmlFor={effectiveId} className="ex-item-title">{title}</FieldLabel>
        : <FieldTitle className="ex-item-title">{title}</FieldTitle>)}
      {hasDescription && <FieldDescription id={descriptionId} className="ex-item-description">{desc}</FieldDescription>}
    </div>}
    <FieldContent className="ex-item-content" data-item-layout={effectiveLayout} data-content-align={contentAlign ?? inherited.contentAlign ?? "left"}>
      <div className="ex-item-body" style={contentStyle}>{content}</div>
    </FieldContent>
  </Field>
}
