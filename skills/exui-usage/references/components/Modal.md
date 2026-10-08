# Modal

## Import

```tsx
import { Button, DialogClose, Modal, type ModalSize } from "@exre/exui"
import "@exre/exui/style.css"
```

## Exports

- `Modal`
- `ModalProps`, `ModalSize`, `ModalStateProps` (types)

## Availability

`Modal` was added after `@exre/exui` `0.7.0` and ships with the next minor release. If `Modal` is missing from the installed package's public types, the installed version predates it — upgrade `@exre/exui` rather than reaching for a deep import.

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

[完整示例：响应式弹窗](../../examples/modal-usage.tsx) shows a controlled modal with a footer, a busy state, zero body padding, and an uncontrolled `trigger` variant.

## Choosing between Modal and Dialog

Use `Modal` when you want one titled dialog that adapts to the viewport: it owns the width, the height, the body padding, the footer region, and the phone layout, and it keeps a single React tree across the breakpoint. Compose [Dialog](Dialog.md) directly when you need the portal, the overlay, and the body laid out by hand, when the dialog should not carry a visible title, or when you need a part `Modal` does not expose, such as `DialogOverlay` or `DialogPortal`. `Modal` is built on `Dialog`, so it keeps the portal, the focus trap, the scroll lock, and the background isolation.

## Composition notes

### Title and description

- `title` is required and must be non-blank; a blank value throws during render instead of leaving an unnamed dialog on screen. It supplies the accessible name, so do not render `DialogTitle` yourself.
- `description` is optional. A missing or blank value renders no `DialogDescription` and sets no `aria-describedby`, so nothing points at a target that does not exist.
- `id` seeds the generated title and description ids. Pass it when your tests or analytics need a stable prefix.

### Open state

- `Modal` is either controlled (`open` plus `onOpenChange`) or uncontrolled (`defaultOpen`, with or without `trigger`). `ModalStateProps` is a union, so `open` and `defaultOpen` are mutually exclusive at the type level, and a controlled modal cannot forget its change handler. Passing both still throws at run time, which is what protects untyped JavaScript callers.
- `trigger` takes a single element and wires it to the trigger slot. It works in both modes; in controlled mode the trigger only requests a change and the parent decides.

### Size, width, and height

- `size` picks the desktop preferred width: `sm` 24rem, `md` 32rem (default), `lg` 48rem, `xl` 64rem.
- `width` overrides `size`. Both are preferred widths only: the frame is still clipped by the viewport, and neither applies while the modal fills a phone screen.
- `width` and `height` take a CSS length string or a number of pixels. A number must be finite and positive, and `padding` must be finite and non-negative; a value that fails the check throws during render. A string is passed through to CSS unchanged, so `"70rem"` and `"min(90vw, 40rem)"` both work and neither is validated.
- An unknown `size` throws during render, including a name inherited from `Object.prototype` such as `"toString"`, which would otherwise resolve to a function instead of a width. Validate any `size` that arrives from untyped JavaScript or from a URL parameter.
- `height` is a preferred height, not a fixed one. When the request is too small, the header and footer keep their minimum chrome and the close button stays inside the frame. `height` also caps them: each is limited to one third of the effective height, so a long footer scrolls instead of squeezing the body out.

### Body, padding, and footer

- `padding` sets the padding of the inner body container; numbers are pixels and `0` gives edge-to-edge content. It never changes the header or footer spacing. Use `bodyClassName` for the body's typography, not for its spacing.
- The footer is a region the modal owns: pass the actions, not a `DialogFooter`. A **falsy `footer` renders no region at all** — no empty row and no separator line, so `false`, `0`, and `""` are all safe to pass from a conditional.
- Buttons that submit a form in the body reach it with the native `form` attribute.
- Below 768px the footer stacks full width in `column-reverse`, so **the first action you pass sits at the bottom**. Order the actions for the phone layout you want.

| Prop       | Scope                                     | Falsy or invalid value                       |
| ---------- | ----------------------------------------- | -------------------------------------------- |
| `title`    | Header text and the accessible name       | Blank throws                                 |
| `footer`   | The whole footer region, separator included | Falsy renders nothing                      |
| `padding`  | Inner body container only                 | Negative throws; `0` is allowed              |
| `width`    | Desktop preferred width, overrides `size` | Non-positive or non-finite number throws     |
| `height`   | Preferred height and the chrome cap       | Non-positive or non-finite number throws     |

### Phone layout

- Below 768px the modal fills the screen by default. `mobileFullscreen={false}` keeps the centred desktop layout at every width.
- The switch is one CSS media query on one component tree, so a draft, the focus, and a native file choice survive a resize, and the breakpoint change never requests a close.
- Safe-area insets are honoured on the full-screen layout, but `env(safe-area-inset-*)` is only non-zero when the page opts in with `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Without `viewport-fit=cover` the insets stay zero, so the modal gives no extra room for a notch or a home indicator.

### Closing

- `dismissible={false}` blocks **every** user-initiated close — the corner button, Escape, an outside pointer, and a footer `DialogClose` — and disables the corner button so the block is visible rather than silent.
- `closeOnEscape={false}` and `closeOnOutsideClick={false}` narrow one channel each and leave the corner button enabled.
- A parent always closes the modal by setting `open={false}`. `dismissible` intercepts user intent, never programmatic state, so it is the right switch for a request in flight — set it back in every outcome, or the modal can never exit.
- The policy is read from a ref on every close attempt, so flipping `dismissible` while the modal is open takes effect immediately.
- `closeButtonDisabled` on `DialogContent` is a different, narrower switch: it disables the corner button only and does not stop Escape, an outside click, or a footer close. `Modal` sets it from `dismissible` for you; do not pass it expecting a close block.

### Labels and focus

- `closeLabel` names the corner button for screen readers. It defaults to the English `Close` and a blank value throws, so pass a translated string in any non-English UI.
- Opening focuses the header, which is a `role="group"` region labelled by the title. It is scrollable, so a long title wraps and stays readable instead of truncating. That costs one extra Tab before the body. Pass `onOpenAutoFocus` to move focus yourself, and `onCloseAutoFocus` to change where focus returns.
- Closing returns focus to whatever opened the dialog, handled by the underlying primitive.

### Scrolling and long content

- The body scrolls on its own when the content is taller than the frame; the header and footer do not scroll with it.
- The header and footer are each capped at one third of the effective height. The footer scrolls in the normal block direction, so both the first and the last action stay reachable from either end.

### Surfaces and rendering

- Pass `glass` for the [Glass material](../glass.md) on the content surface. In the full-screen phone layout the frame's shadow is dropped, so no floating frame appears over the full screen.
- A server render keeps the portal empty until a document exists, so the markup ships no body content and no `aria-describedby` before hydration.

### Browser support

The responsive layout uses `dvh` dynamic viewport units, `env(safe-area-inset-*)`, and `:has()`. Dynamic viewport units have an explicit `100vh` fallback for engines that lack them; `:has()` has none, so an engine without it loses the footer-aware rules and the modal behaves like the no-footer case.

## Verification status

- **Covered by the library's own gates:** the geometry, breakpoint, focus, scroll, motion, and close-policy behaviour above, checked in Chromium at desktop and emulated narrow viewports, plus a server render and the public types in an isolated packed consumer.
- **Not covered:** real iOS and Android devices. The software keyboard, safe-area values, and mobile browser toolbars are unverified, so check the full-screen layout on your own target devices before shipping it.

For advanced props, use the TypeScript types exposed by the package-root import.
