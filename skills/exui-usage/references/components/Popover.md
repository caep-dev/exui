# Popover

## Import

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Popover`
- `PopoverAnchor`
- `PopoverContent`
- `PopoverDescription`
- `PopoverHeader`
- `PopoverTitle`
- `PopoverTrigger`

## Usage

```tsx
import * as React from "react"
import { Button, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "@exre/exui"
import "@exre/exui/style.css"

export function SharePopover() {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">Share</Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Share link</PopoverTitle>
          <PopoverDescription>Anyone with the link can view.</PopoverDescription>
        </PopoverHeader>
        <input
          readOnly
          value="https://example.com/doc/42"
          className="w-full rounded-lg border px-2 py-1 text-sm"
        />
      </PopoverContent>
    </Popover>
  )
}
```

`PopoverContent` portals to the body and accepts the placement props `side`, `align`, `sideOffset`, and `alignOffset`. Use `PopoverAnchor` instead of a trigger to attach the popover to an existing element without toggling it. `PopoverHeader`, `PopoverTitle`, and `PopoverDescription` structure the content for accessibility.

For advanced props, use the TypeScript types exposed by the package-root import.
