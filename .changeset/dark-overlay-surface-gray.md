---
"@exre/exui": patch
---

The dark and pitch-black overlay surfaces are neutral gray instead of blue.

- `surface.modal` and `surface.menu` in the dark theme change from `#181c25` to `#1b1b1b`, the value `surface.popover` already used. `#181c25` was the only blue-tinted neutral in the dark surface ladder (`background #0b0b0b`, `popover #1b1b1b`, `card #1d1d1d`, `sidebar #1f1f1f`), so a `Dialog` and a menu surface read visibly cooler than the `Sheet`, `Popover`, and `Card` beside them. The light theme is unchanged, and `pitch-black` picks up the new value because it inherits `modal` and `menu` from the dark theme.
- Both Tokens are referenced once in the stylesheet, by `--exui-component-dialog-surface-background` and `--exui-component-menu-surface-background`, so the change reaches the components through those two recipe variables: `Dialog` (and the surfaces composed from it) and `Dropdown Menu` and `Select`. No API, export, class name, markup, or geometry changes.
- Luminance is preserved within a single 8-bit step — the equivalent gray of `#181c25` is `#1c1c1c` — so surface elevation stays where it was and readability improves by a hair rather than regressing: the pair of the new value with `#fafafa` measures 16.50:1 against 16.34:1 before, and no other text pairing is touched. `pnpm tokens:check` reports no contrast or reference-policy change.
