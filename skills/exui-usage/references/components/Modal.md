# Modal

## Import

```tsx
import { Modal, DialogClose } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Modal`
- `ModalProps`, `ModalSize`, `ModalStateProps` (types)

## Usage

```tsx
<Modal
  title="Edit project profile"
  description="Sizes, padding, and the phone layout come from one component."
  trigger={<Button>Open</Button>}
  size="lg"
  footer={
    <>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit" form="project-profile">Save</Button>
    </>
  }
>
  <form id="project-profile" onSubmit={handleSubmit}>…</form>
</Modal>
```

[完整示例：响应式弹窗](../../examples/modal-usage.tsx) shows a controlled modal with a footer, a busy state, and zero body padding.

## Composition notes

- `title` is required and always visible; blank values are rejected. It supplies the dialog's accessible name, so `DialogTitle` is not rendered by the consumer.
- The modal is either controlled (`open` plus `onOpenChange`) or uncontrolled (`defaultOpen`, optionally `trigger`). Passing both `open` and `defaultOpen` is an error.
- Use `Modal` when you want one titled dialog that adapts to the viewport. Use `Dialog` directly when you need the portal, overlay, and body composed by hand, or when the dialog should not carry a visible title.
- `size` picks a desktop preferred width: `sm` 24rem, `md` 32rem (default), `lg` 48rem, `xl` 64rem. `width` overrides it; `height` sets a preferred height. Both stay inside the viewport, and neither applies while the modal fills a phone screen.
- `padding` sets the body container's padding; numbers are pixels. Pass `0` for edge-to-edge content. It never changes the header or footer spacing.
- Below 768px the modal fills the screen by default, honouring safe-area insets. `mobileFullscreen={false}` keeps the centred desktop layout instead. The switch is pure CSS on one component tree, so a draft, the focus, and a native file choice survive a resize.
- `dismissible={false}` blocks every user-initiated close and disables the corner button. `closeOnEscape` and `closeOnOutsideClick` narrow single channels without disabling the corner button. A parent always closes the modal by setting `open={false}`.
- The footer is a region the modal owns: pass the actions, not a `DialogFooter`. Buttons that submit a body form reach it with the native `form` attribute.
- Opening focuses the header, which is scrollable so a long title stays readable. Press Tab once more to reach the body. Use `onOpenAutoFocus` to move focus yourself.
