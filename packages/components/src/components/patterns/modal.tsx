"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** Desktop preferred-width preset; the viewport always wins over it. */
export type ModalSize = "sm" | "md" | "lg" | "xl"

const MODAL_SIZE_WIDTH: Record<ModalSize, string> = {
  sm: "24rem",
  md: "32rem",
  lg: "48rem",
  xl: "64rem",
}

/**
 * A modal is either controlled or uncontrolled for its whole life.
 *
 * The two shapes are a union rather than two optional props so `open` and
 * `defaultOpen` cannot be passed together, and so a controlled modal cannot
 * forget its change handler.
 */
export type ModalStateProps =
  | {
      open: boolean
      onOpenChange: (open: boolean) => void
      defaultOpen?: never
    }
  | {
      open?: never
      defaultOpen?: boolean
      onOpenChange?: (open: boolean) => void
    }

export type ModalProps = ModalStateProps & {
  /** Visible title. Blank values are rejected, so the dialog always has a name. */
  title: string
  /** Optional short line under the title. Blank values render nothing. */
  description?: string
  children: React.ReactNode
  /**
   * Footer actions. The modal owns the footer region and its layout, and
   * renders nothing at all for a falsy value.
   */
  footer?: React.ReactNode
  /** Single element the modal wires to the trigger slot, if any. */
  trigger?: React.ReactElement
  size?: ModalSize
  /** Overrides the desktop preferred width; numbers are CSS pixels. */
  width?: React.CSSProperties["width"]
  /** Preferred desktop height; numbers are CSS pixels. Content-sized by default. */
  height?: React.CSSProperties["height"]
  /** Padding of the inner body container; numbers are CSS pixels. */
  padding?: React.CSSProperties["padding"]
  /** Whether a viewport narrower than 768px fills the screen. */
  mobileFullscreen?: boolean
  /** When false, no user-initiated close through the dialog is allowed. */
  dismissible?: boolean
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  closeLabel?: string
  glass?: boolean
  /** Class list for the content surface. */
  className?: string
  /** Class list for the inner body typography container, not for its spacing. */
  bodyClassName?: string
  id?: string
  ref?: React.Ref<HTMLDivElement>
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}

function assertNonBlank(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`ExUI Modal: ${name} must be a non-blank string.`)
  }
}

function toCssLength(value: string | number | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value
}

function assertLength(value: string | number | undefined, name: string): void {
  if (typeof value !== "number") return
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`ExUI Modal: ${name} must be a finite, positive number of pixels.`)
  }
}

function assertPadding(value: string | number | undefined): void {
  if (typeof value !== "number") return
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("ExUI Modal: padding must be a finite, non-negative number of pixels.")
  }
}

// `size in MODAL_SIZE_WIDTH` would walk the prototype chain, so "toString",
// "constructor" and friends would pass and then resolve to a function instead
// of a width. Untyped JavaScript callers can reach that path.
function isModalSize(size: string): size is ModalSize {
  return Object.hasOwn(MODAL_SIZE_WIDTH, size)
}

/**
 * A dialog with a visible title, one corner close button, configurable size and
 * body padding, and a full-screen layout below 768px.
 *
 * The modal owns layout and the close policy; the underlying dialog keeps
 * portal, focus, scroll lock, and background isolation. Nothing here switches
 * component trees across the breakpoint, so drafts, focus, and native file
 * pickers survive a resize while the modal is open.
 */
export function Modal({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  size = "md",
  width,
  height,
  padding,
  mobileFullscreen = true,
  dismissible = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  closeLabel = "Close",
  glass,
  className,
  bodyClassName,
  id,
  ref,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: ModalProps) {
  assertNonBlank(title, "title")
  assertNonBlank(closeLabel, "closeLabel")
  if (!isModalSize(size)) {
    throw new Error(`ExUI Modal: unknown size '${size}'.`)
  }
  if (open !== undefined && defaultOpen !== undefined) {
    throw new Error("ExUI Modal: pass either open or defaultOpen, never both.")
  }
  assertLength(width, "width")
  assertLength(height, "height")
  assertPadding(padding)

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false)
  const controlled = open !== undefined
  const currentOpen = controlled ? open : uncontrolledOpen

  // Every close decision reads the live policy through a ref. Radix keeps the
  // handlers it was given until it re-renders, so a busy flag that flips
  // mid-session must not be answered from a stale closure.
  const policy = React.useRef({ dismissible, closeOnEscape, closeOnOutsideClick })
  policy.current = { dismissible, closeOnEscape, closeOnOutsideClick }

  const handleOpenChange = (next: boolean) => {
    if (!next && !policy.current.dismissible) return
    if (!controlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const hasDescription = typeof description === "string" && description.trim().length > 0
  const generatedId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const baseId = id ?? `exui-modal-${generatedId}`
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`

  // Geometry reaches CSS through variables, never as inline width or height:
  // the narrow-viewport rule has to be able to override all of it.
  const frameStyle = {
    "--_exui-modal-width": toCssLength(width) ?? MODAL_SIZE_WIDTH[size],
    "--_exui-modal-height": toCssLength(height) ?? "auto",
    ...(height === undefined ? {} : { "--_exui-modal-request-limit": toCssLength(height) }),
  } as React.CSSProperties

  const bodyStyle = {
    padding: toCssLength(padding) ?? "var(--exui-component-dialog-surface-padding)",
  } as React.CSSProperties

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        id={id}
        ref={ref}
        className={cn("ex-modal", className)}
        data-mobile-fullscreen={mobileFullscreen}
        overlayClassName="ex-modal-overlay"
        closeButtonDisabled={!dismissible}
        closeLabel={closeLabel}
        glass={glass}
        style={frameStyle}
        aria-labelledby={titleId}
        aria-describedby={hasDescription ? descriptionId : undefined}
        onEscapeKeyDown={(event) => {
          if (!policy.current.closeOnEscape || !policy.current.dismissible) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (!policy.current.closeOnOutsideClick || !policy.current.dismissible) {
            event.preventDefault()
          }
        }}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {/* Focusable so a long title can be scrolled and read from the keyboard. */}
        <DialogHeader
          className="ex-modal-header"
          role="group"
          aria-labelledby={titleId}
          tabIndex={0}
        >
          <DialogTitle id={titleId}>{title}</DialogTitle>
          {hasDescription ? (
            <DialogDescription id={descriptionId}>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="ex-modal-body">
          <div className={bodyClassName} style={bodyStyle}>
            {children}
          </div>
        </div>
        {/* Any falsy footer renders nothing: the region carries a separator, so
            `false`, `0` or `""` would otherwise leave a stray line behind. */}
        {footer ? (
          <div className="ex-modal-footer-scroll">
            <DialogFooter className="ex-modal-footer">{footer}</DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
