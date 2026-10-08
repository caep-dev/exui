# Dialog

## Import

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Dialog`
- `DialogClose`
- `DialogContent`
- `DialogDescription`
- `DialogFooter`
- `DialogHeader`
- `DialogOverlay`
- `DialogPortal`
- `DialogTitle`
- `DialogTrigger`

## Usage

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="danger">Delete account</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete account</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

[完整示例：对话框](../../examples/dialog-usage.tsx) shows the full combination with both footer actions in one runnable file.

## Composition notes

- Open state can stay uncontrolled via `DialogTrigger`, or be controlled with `open` and `onOpenChange` on `Dialog`.
- `DialogTrigger` and `DialogClose` render buttons by default; pass `asChild` to use your own button or link.
- `DialogContent` includes the portal, the overlay, and a close button in the top-right corner. Pass `closeLabel` to localize that button's accessible name, or `showCloseButton={false}` to hide it. There is no need to add `DialogPortal` or `DialogOverlay` yourself.
- `DialogContent` also accepts two opt-in props. `overlayClassName` reaches the overlay that content renders, so the dialog surface and its backdrop can be styled from one element. `closeButtonDisabled` disables the corner button **only** — Escape, an outside pointer, a footer `DialogClose`, and the parent's own state change are all unaffected, so it is never a way to keep a dialog open by itself. Neither prop reaches the DOM as an attribute.
- When you want both the overlay and the surface styled, prefer `overlayClassName` over composing `DialogOverlay` by hand: `DialogContent` renders its own overlay, and adding a second one paints another full-viewport backdrop on top of it.
- `DialogTitle` and `DialogDescription` are required for accessibility; screen readers announce the dialog through them. For purely visual dialogs, render them with `sr-only` text rather than omitting them.
- `DialogFooter` lays out actions and can render a standard close button with `showCloseButton`.
- Escape closes the dialog and focus returns to the trigger, handled by the underlying primitive.
- For a titled dialog that sizes itself and fills a phone screen, use [Modal](Modal.md) instead of assembling `DialogContent` by hand. Reach for `Dialog` when you need the parts composed yourself, or when the dialog carries no visible title.
