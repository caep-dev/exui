# Direction

## Import

```tsx
import { DirectionProvider, useDirection } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `DirectionProvider`
- `useDirection`

## Usage

`DirectionProvider` sets the text direction that direction-aware components use for positioning, keyboard navigation, and mirroring — for example [Sidebar](Sidebar.md) and [Tooltip](Tooltip.md) read it.

```tsx
import { DirectionProvider } from "@exre/exui"
import "@exre/exui/style.css"

export function App() {
  return (
    <DirectionProvider dir="rtl">
      {/* direction-aware components mirror themselves in this subtree */}
    </DirectionProvider>
  )
}
```

`dir` accepts `"ltr"` or `"rtl"`. `useDirection()` returns the current direction for components that need to adapt manually. If your app already sets `dir` on `<html>` and you do not need a direction change per subtree, you can skip the provider — the components fall back to the ambient document direction.

For advanced props, use the TypeScript types exposed by the package-root import.
