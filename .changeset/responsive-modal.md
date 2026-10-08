---
"@exre/exui": minor
---

Add `Modal`, a titled dialog with one corner close button, four desktop width presets, configurable body padding, and a full-screen layout below 768px.

`Modal` composes the existing `Dialog`, so it keeps its portal, focus trap, scroll lock, and background isolation. It never swaps component trees at the breakpoint, so a draft, the focus, and a native file choice survive a resize while it is open. `dismissible={false}` blocks every user-initiated close and disables the corner button; `closeOnEscape` and `closeOnOutsideClick` narrow individual channels.

`DialogContent` also gains two opt-in props for callers who compose it directly: `closeButtonDisabled`, which disables only the corner button, and `overlayClassName`, which reaches the overlay that content renders. Both default to the previous behaviour, and neither reaches the DOM as an attribute.
