import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[var(--exui-component-form-control-base-height)] w-full min-w-0 rounded-[var(--exui-component-form-control-base-radius)] border [border-color:var(--exui-component-form-control-base-border)] [background:var(--exui-component-form-control-base-background)] px-[var(--exui-component-form-control-base-padding-inline)] py-[var(--exui-component-form-control-base-padding-block)] [color:var(--exui-component-form-control-base-foreground)] [box-shadow:var(--exui-component-form-control-base-shadow)] [font-family:var(--exui-component-form-control-base-font-family)] text-[length:var(--exui-component-form-control-base-font-size)] leading-[var(--exui-component-form-control-base-line-height)] font-[number:var(--exui-component-form-control-base-font-weight)] transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:[color:var(--exui-component-form-control-base-placeholder)] hover:[background:var(--exui-component-form-control-hover-background)] hover:[color:var(--exui-component-form-control-hover-foreground)] hover:[border-color:var(--exui-component-form-control-hover-border)] hover:[box-shadow:var(--exui-component-form-control-hover-shadow)] hover:opacity-[var(--exui-component-form-control-hover-opacity)] focus-visible:[background:var(--exui-component-form-control-focus-background)] focus-visible:[color:var(--exui-component-form-control-focus-foreground)] focus-visible:[border-color:var(--exui-component-form-control-focus-border)] focus-visible:[box-shadow:var(--exui-component-form-control-focus-shadow)] focus-visible:opacity-[var(--exui-component-form-control-focus-opacity)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:[background:var(--exui-component-form-control-disabled-background)] disabled:[color:var(--exui-component-form-control-disabled-foreground)] disabled:[border-color:var(--exui-component-form-control-disabled-border)] disabled:[box-shadow:var(--exui-component-form-control-disabled-shadow)] disabled:opacity-[var(--exui-component-form-control-disabled-opacity)] aria-invalid:[background:var(--exui-component-form-control-invalid-background)] aria-invalid:[color:var(--exui-component-form-control-invalid-foreground)] aria-invalid:[border-color:var(--exui-component-form-control-invalid-border)] aria-invalid:[box-shadow:var(--exui-component-form-control-invalid-shadow)] aria-invalid:opacity-[var(--exui-component-form-control-invalid-opacity)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
