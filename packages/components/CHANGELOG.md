# @exre/exui

## 0.8.0

### Minor Changes

- 29793d7: Add `Modal`, a titled dialog with one corner close button, four desktop width presets, configurable body padding, and a full-screen layout below 768px.

  `Modal` composes the existing `Dialog`, so it keeps its portal, focus trap, scroll lock, and background isolation. It never swaps component trees at the breakpoint, so a draft, the focus, and a native file choice survive a resize while it is open. `dismissible={false}` blocks every user-initiated close and disables the corner button; `closeOnEscape` and `closeOnOutsideClick` narrow individual channels.

  `DialogContent` also gains two opt-in props for callers who compose it directly: `closeButtonDisabled`, which disables only the corner button, and `overlayClassName`, which reaches the overlay that content renders. Both default to the previous behaviour, and neither reaches the DOM as an attribute.

### Patch Changes

- 2691b98: Escape chart configuration identifiers and reject unsafe color values before rendering chart styles, including on the server.

## 0.7.0

### Minor Changes

- 43200a0: Add the standalone ExItem presentation component with per-item vertical or horizontal layout, responsive wrapping, span support, and accessible direct Input association. FormItem and configured ExForm fields now share its presentation and accept an item-level layout override.
- 6b32cd9: Add an application-wide `ExMessageContext` host and managed `ExMessage` notifications with success, warning, error, info, loading completion, dismissal, duration, and capacity controls. Existing `Toaster` and `toast` exports remain available.
- c0ebc58: Add contentMaxWidth and contentAlign to ExItem, FormItem, and configured fields, with shared defaults on Form and ExForm. Horizontal content can be capped and aligned left or right; vertical and narrow wrapped items keep filling the available width.
- fdcc9a6: Add schema-driven ExForm and composed Form, FormItem, FormList and FormErrorSummary APIs with shared form hooks. Error summaries are added explicitly as children of ExForm or Form. FormItem places descriptions beneath labels and errors beneath controls, while keeping invalid labels at their normal text color. Form controls share the same default input background. Support typed input and parsed output, explicit step validation, async submission, server errors, file controls and responsive form layouts. Schema implementations such as Zod remain consumer-owned; React Hook Form is bundled internally.
- 857c9cc: Render form date fields with the ExUI Calendar and Popover. Support a default date through form values, inclusive minimum and maximum selectable dates, and a localized Today action beside the year selector when today is in range.
- ca46f13: Add optional presentation labels and issue formatting to forms, file controls, dialogs, and sheets so consuming applications can switch language without replacing form state.

### Patch Changes

- 3530a5c: Lighten input backgrounds across themes and retain visible 1px outlines, including hover, focus, and invalid form-control states. Align date, file, and multi-select form surfaces with the shared input border.
- 067fb21: Use filled Lucide status icons and a prominent Lucide loading spinner in Toaster, with theme tokens: primary for info and loading, amber for warning, red for error, and green for success.

## 0.6.0

### Minor Changes

- 77ca3a2: A shared glass material, opt-in per surface.

  `GlassSeed` is a new root export, and 42 component exports gained an optional boolean `glass` prop.

  - `<GlassSeed />` declares one shared SVG refraction filter. Mount one per document. It renders no children, is not a provider, occupies no layout box, and is not focusable or pointer-interactive. Its markup is static, so it is safe to server-render: the enhancement is applied in a ref callback once the browser has confirmed it accepts the filter chain, and withdrawn when the seed unmounts. Without a seed the material is unchanged and its chain contains no filter URL, so nothing can be left pointing at a filter that is not there. A seed only ever writes the document-root variable, so overlapping seeds and a Fast Refresh remount cannot strand a stale value.
  - `glass` defaults to `false` and is never forwarded to the DOM. The same material is available to any element — including a plain `div` that uses no ExUI component — through the `ex-glass` class, which is matched as a whole token (`ex-glass-foo` does not enable it). `glass={false}` does not remove a class you wrote yourself.
  - The `glass` prop was added to `Button`, `ActionButton`, `Toggle`, `ToggleGroupItem`, `Badge`, `Card`, `Alert`, `Item`, `Attachment`, `Bubble`, `BubbleContent`, `BubbleReactions`, `Input`, `Textarea`, `InputGroup`, `NativeSelect`, `SelectTrigger`, `ComboboxInput`, `ComboboxChips`, `ComboboxChip`, `DialogContent`, `AlertDialogContent`, `SheetContent`, `DrawerContent`, `PopoverContent`, `HoverCardContent`, `TooltipContent`, `SelectContent`, `ComboboxContent`, `DropdownMenuContent`, `DropdownMenuSubContent`, `ContextMenuContent`, `ContextMenuSubContent`, `MenubarContent`, `MenubarSubContent`, `Command`, `CommandDialog`, `Sidebar`, `SidebarInset`, `TabsList`, `TabsTrigger`, and `Menubar`. Components that already forwarded `React.ComponentProps` to a base component inherit the capability; the wrapper `Select` forwards `glass` to its trigger, the same destination as `className`.
  - The material sets paint properties only. No `display`, `position`, `z-index`, size, padding, gap, radius, `overflow`, or pointer-events change, no wrapper element is added, and no element grows a border width — the visible edge is an inset shadow. Existing outer shadows and focus rings are composed with that edge rather than replaced, and hover, active, focus-visible, invalid, disabled, and selected/pressed/expanded keep their own feedback. Only surfaces that already reacted to the pointer switch material; a static `div` does not become hoverable by being glass.
  - Danger surfaces keep the danger material: the components publish an explicit `data-exui-glass-tone="danger"` marker derived from their own variant, present whether or not the material is enabled, so adding `ex-glass` later still produces the danger look. `Alert` now also publishes its resolved `data-variant`, which it previously expressed only through classes.
  - Composition surfaces map the material to the slot that actually paints: `Bubble` delegates it to its own direct `BubbleContent`, `NativeSelect` moves it to the inner `select` while your layout classes stay on the wrapper, `ComboboxInput` enables it on the surrounding `InputGroup`, `Sidebar` applies it to whichever of its three branches the viewport renders, `CommandDialog` puts it on the dialog surface and clears the palette's own opaque background, and popup surfaces that ship a `::before` backdrop layer switch that layer off while the material is on.
  - Restyle with `--exui-glass-background`, `--exui-glass-foreground`, `--exui-glass-border`, `--exui-glass-shadow`, `--exui-glass-blur`, and `--exui-glass-saturation`, declared on the surface or any ancestor. `--exui-glass-border` is an edge colour only and never a border width; `--exui-glass-shadow` is the material's inset edge only.
  - Where `backdrop-filter` is unsupported the surface falls back to an opaque themed background so it stays readable. A non-`none` `backdrop-filter` also makes the element a containing block for absolutely and fixed positioned descendants, which is an inherent browser behaviour and not something the material works around.
  - The built-in `--exui-glass-blur` value is a fixed `4px`. Consumers may still override the CSS custom property with any valid CSS length.
  - The built-in material now adds a subtle top-edge specular highlight. It is a CSS inset shadow, so it adds no DOM, observer, or filter resource.

  **Token migration.** `exuiTokens.themes.<theme>` gained a required `glass` group, so a consumer that hand-writes a complete `ThemeTokens` object has to supply it; start from the built-in theme's `glass` values. Reading individual Tokens, spreading a built-in theme, and the CSS custom properties are unaffected. The public material variables are `--exui-glass-*`, with the danger values under `--exui-glass-danger-*`; like the rest of the stylesheet they are unlayered `:root` declarations, with `.dark` and `.pitch-black` carrying only the values that differ. Only `@exre/exui/style.css` carries the `.ex-glass` behavior — the token stylesheet publishes the variables alone and still needs no React.

  **Gating.** The enhancement is enabled from a runtime acceptance check of the `backdrop-filter` chain, covering both the standard and the `-webkit-` prefixed property, rather than a browser or version allowlist. That keeps the base material working on unknown engines without a table to maintain. It is a syntax acceptance test and not a rendering test, so it cannot establish that an engine paints the chain it accepts: an engine that accepts a URL chain and then fails to paint it loses the blur as well, because the reference shares one declaration with the blur and CSS offers no way to keep the two apart. The material is therefore verified for the engine the project tests against (Chromium) and the enhancement is not claimed to be equivalent across engines. `pnpm tokens:check` gained `glass-policy.mjs`, which checks the material's shape, its rem lengths and positive saturation, that each theme's `foreground`, danger base, and edge are derived from the semantic Tokens they are supposed to follow, that the emitted stylesheet keeps those derivations as `var()` and `color-mix()` references instead of inlining them, and that every material state keeps WCAG AA contrast over the theme page colour and over the black and white extremes.

### Patch Changes

- 67658a7: The dark theme page background is now `#0a0a0a` (`rgb(10, 10, 10)`).
- ced39b5: The dark and pitch-black overlay surfaces are neutral gray instead of blue.

  - `surface.modal` and `surface.menu` in the dark theme change from `#181c25` to `#1b1b1b`, the value `surface.popover` already used. `#181c25` was the only blue-tinted neutral in the dark surface ladder (`background #0b0b0b`, `popover #1b1b1b`, `card #1d1d1d`, `sidebar #1f1f1f`), so a `Dialog` and a menu surface read visibly cooler than the `Sheet`, `Popover`, and `Card` beside them. The light theme is unchanged, and `pitch-black` picks up the new value because it inherits `modal` and `menu` from the dark theme.
  - Both Tokens are referenced once in the stylesheet, by `--exui-component-dialog-surface-background` and `--exui-component-menu-surface-background`, so the change reaches the components through those two recipe variables: `Dialog` (and the surfaces composed from it) and `Dropdown Menu` and `Select`. No API, export, class name, markup, or geometry changes.
  - Luminance is preserved within a single 8-bit step — the equivalent gray of `#181c25` is `#1c1c1c` — so surface elevation stays where it was and readability improves by a hair rather than regressing: the pair of the new value with `#fafafa` measures 16.50:1 against 16.34:1 before, and no other text pairing is touched. `pnpm tokens:check` reports no contrast or reference-policy change.

- e1fd03e: The primary blue is `#0088ff`, and the accessibility baseline now records one exception for it.

  - `control.primary` moves `#0070f3` → `#0088ff` in the light and dark themes, and `pitch-black` follows because it inherits the dark theme. `sidebar.primary` carries the same value, so the fill and the sidebar accent stay one colour. The label stays white: `control.primaryForeground` and `sidebar.primaryForeground` are unchanged, and so are `control.hover` `#0062d6` and `control.active` `#0059c4`, which keep deepening the fill. Only the resting and focused fills move.
  - **The recorded exception.** White on `#0088ff` measures 3.52:1, below the 4.5:1 that `color-contrast-policy.mjs` requires of every other built-in foreground, and no foreground reaches 4.5:1 on that fill except a near-black label — a different design rather than a darker version of this one. `control.primary` and `sidebar.primary` are therefore judged at the 3:1 non-text floor (WCAG 1.4.11) instead of the text threshold. This is a deviation and not an exemption: the pairing keeps being checked, a fill that drops below 3:1 is still reported, the floor and the fill paths that use it are named in one place, and `validate-tokens.mjs` reads the same constant so the two checks cannot drift apart.
  - **What that costs.** Every primary-filled control now ships its label at 3.52:1 against its own fill. That misses WCAG 2.1 AA for normal-size text (1.4.3); the large-text allowance does not apply, because the recipes set the button label at 14px. The fill itself is still clear of the floor in both directions — 3.52:1 against the light page and 5.59:1 against the dark one — so the control remains distinguishable from its surroundings. A consumer who needs AA on the label can re-declare `--exui-control-primary` and `--primary` with a darker blue; the floor is the documented target to stay above.
  - Light `text.link` stays `#0070f3`. Link text renders on the page rather than on the fill, so it is still held to 4.5:1, and `#0088ff` reaches only 3.52:1 there. The link keeps its own value and its own deepening hover and active steps, which is why the fill brightens the family while the link does not.
  - `shadows.focus` moves to `0 0 0 3px rgba(0, 136, 255, 0.25)`, following the new fill. It stays a fixed 3px. The rest of the focus family is unchanged: `control.focusRing`, `border.focused`, and the light `sidebar.ring` are already `#006dcc` and the dark ones `#62b0ff`, which sit on the same hue as `#0088ff`.
  - The shadcn/ui aliases `--primary`, `--primary-foreground`, `--sidebar-primary`, and `--sidebar-primary-foreground` are generated from these Tokens, so they move together. `control.selected` was already `#0088ff`, so a selection indicator and a primary fill now coincide instead of being two neighbouring blues. No API, export, class name, markup, or geometry changes.
  - This partly reverses 0.3.0, which darkened the fill to `#0070f3` so that white text could reach AA. The fill is restored; the AA requirement on its label is not, and that trade is now written down in the policy and in the tokens README rather than implied by a value.

## 0.5.0

### Minor Changes

- ef0a770: Tokens are now overridable from consumer CSS, foundation Tokens included.

  - Every Token is a CSS custom property on `:root`, and the stylesheet resolves its recipe values through those properties. Typography, radii, and shadows used to be resolved into the recipe variables as literal values at build time, so overriding a foundation Token changed the variable and nothing else: components kept the frozen value, with no error and no visual clue that the override had stopped. Those 61 references are now emitted as `var(--exui-…)`, the same way semantic references already were, and the foundation group is published as its own variables: `--exui-font-size-body`, `--exui-font-size-small`, `--exui-line-height-body`, `--exui-line-height-small`, `--exui-radius-none|small|medium|large|extra-large|full`, and `--exui-shadow-small|medium|large|focus|invalid`. `--exui-font-family`, `--exui-font-family-mono`, `--exui-font-family-emoji`, and `--exui-font-weight-*` already existed and are now the declarations the recipes read.
  - `--radius` resolves to `--exui-radius-large` instead of carrying its own copy, so the Tailwind radius scale (`rounded-sm` … `rounded-4xl`) and the components that use that radius move together.
  - An override is a plain unlayered `:root` rule placed after the stylesheet, plus a `.dark` block when the brand value has a dark counterpart, because `.dark` and `.pitch-black` carry only the values that differ from `:root`. An override written inside `@layer base` or a Tailwind `@theme` block loses to the library value: the Token declarations are emitted outside any layer, and unlayered declarations win.
  - Three recipe radii stay standalone values — the button action radius, and the dialog and menu surface radii — and follow only their own `--exui-component-…-radius`. The shadcn aliases (`--primary`, `--background`, `--ring`, `--chart-1`, `--sidebar-*`) also still hold their own copies of the same colours, so `--exui-control-primary` and `--primary` have to be set together. `--density-*` remains published but unreferenced: no component styling consumes it.

  No computed value changes, so nothing renders differently until an override is added. `pnpm tokens:check` gained a `foundation-reference-policy.mjs` gate that fails when a recipe falls back to a literal foundation value, when the variable map and the contract disagree, or when a recipe variable references a variable the stylesheet never declares.

## 0.4.0

### Minor Changes

- 1280bdb: Adds `@exre/exui/docs/theme.css`, a theme contract for documentation sites built with Fumadocs UI.

  - The stylesheet imports `@exre/exui/tokens/style.css`, then Fumadocs' own `css/shadcn.css` and `css/preset.css`, in that order. Fumadocs maps its own `--color-fd-*` names onto shadcn's short variables without fallbacks, so a site that loads only the Fumadocs sheets computes every docs colour to an unset custom property. Nothing errors; the page just renders unstyled. One import now replaces the three, in the order that works.
  - The package names `fumadocs-ui` in no dependency field, so the sheet adds nothing to any consumer's dependency graph and the tokens-only install stays limited to `@exre/exui` and the font package. Install Fumadocs yourself, which a documentation site needs anyway; the sheet is verified against `^16.15.0`. This is a stylesheet subpath with no JavaScript entry, and ExUI re-exports no Fumadocs components.
  - The sheet ships unprocessed, like Fumadocs' own `css/*` sheets, so the consumer's Tailwind build resolves the three imports. With no `fumadocs-ui` installed they fail loudly rather than producing an unstyled page.
  - What it deliberately does not do. It aligns colour only: Fumadocs keeps its own radii, spacing, and motion, and it keeps its own `Tabs` and `Accordion`, whose APIs differ from ExUI's. It also does not arbitrate theme switching — drive `<html class="dark">` from one provider, because Fumadocs' `RootProvider` and ExUI's `ThemeProvider` both read and write the `theme` localStorage key, and only the former is hydration-safe.

## 0.3.0

### Minor Changes

- c0d3886: Text on coloured backgrounds is now chosen for contrast, the neutral ramps lost their warm tint, selection is shown with the theme colour instead of a border, and `ActionButton` renders as a rounded rectangle.

  - `Button` on a primary background now uses white text in every theme. The primary blue darkened from `#0088ff` (light) and `#0090ff` (dark) to `#0070f3` so white text reaches AA. The previous pairing put near-black text on that blue: it passed at rest (5.56:1) but failed on the active state and on the translucent hover background.
  - `Button` hover and active backgrounds are now opaque, per-variant steps instead of the shared `control.hover`/`control.active`. Those were translucent, which made the text contrast depend on whatever sat behind the button rather than on the token. The `link` variant gained its own hover and active steps for the same reason.
  - Light `text.link` moved `#0088ff` → `#0070f3`; at `#0088ff` it only reached 3.52:1 on the page. The dark link keeps the brighter `#62b0ff`.
  - The light and dark neutral ramps are now a single zero-chroma axis at their existing lightnesses. Warm-tinted borders and inputs moved `#e8e8e3` → `#e6e6e6`, hover and accent surfaces `#f4f4f0` → `#f2f2f2`, the sidebar `#fbfbf9` → `#fafafa`, and near-black text `#0c0c09` → `#0b0b0b`. Cool entries filling the same roles (`#f4f4f5`, `#18181b`, `#27282a`) were folded into the same axis. Brand, feedback, chart and editor hues are unchanged.
  - Light `text.secondary` moved `#787878` → `#737373`; at `#787878` it measured 4.42:1 on the page, below AA.
  - The focus ring is now `0 0 0 3px rgba(0, 112, 243, 0.25)` instead of `0 0 0 2px currentColor`. `currentColor` resolved to the element's text colour, so a focused input drew a near-black ring and a focused primary button drew a white ring that vanished on a light page. It stays a fixed pixel ring.
  - States are no longer marked with a 1px border on top of that ring. Focus states everywhere, and hover/active states on the form control and menu items, now leave the border transparent. The 3px ring or the fill carries the state instead. The `outline` button keeps its border, because there the border is the variant's identity rather than state decoration.
  - An invalid form control gets its own red ring, `shadows.invalid` = `0 0 0 3px rgba(231, 0, 11, 0.25)`, instead of reusing the blue focus ring.
  - `TabsList` gained a `primary` variant: same as `default`, but the selected tab is filled with `control.primary` and its label is `control.primaryForeground`.
  - An active `SidebarMenuButton` and a selected tab trigger now signal selection with the theme colour instead of a border. The sidebar item keeps a page-coloured chip, because the accent blue only reaches 4.55:1 on white — on the sidebar's own `#fafafa` it is 4.36:1, below AA.
  - `ActionButton` now uses a tighter radius instead of the Button capsule: `componentRecipes.button.action.radius` is `0.75rem`. This implements what the usage reference already documented, and the radius scales with the root font size like any other ordinary radius.
  - Fixed two `Tabs` and `Sidebar` bugs that selection styling depended on: `TabsTrigger` tested `data-active`, which Radix never sets (it sets `data-state`), so every selected-tab style was dead; and the sidebar's active declarations lost to its hover declarations in the cascade, so hovering an active item reverted its colour.
  - Fixed `InputGroup` rendering three different backgrounds. Its control tried to clear the form-control recipe background with `bg-transparent`, which sets `background-color`, while `Input` declares the `background` shorthand through an arbitrary property. tailwind-merge treats those as different groups, so both survived and the shorthand won the cascade — the control painted an opaque band inside the group's translucent one. The control now overrides with the same `background` shorthand the `Input` uses, for its base and hover, focus, disabled and invalid states. Dark mode was unaffected, because the class-scoped `dark:bg-transparent` out-specified the shorthand there.
  - Fixed `InputGroup` painting three overlapping edges per state. Its control had picked up the new 3px recipe ring, but the group still added the old 1px `border-ring` plus a 2px `ring-ring`, so a focused search field drew two dark-blue edges and a light-blue one instead of a single soft ring; the invalid state stacked a 1px `border-destructive` and a 3px red ring the same way. The group now carries the state ring itself, using `form-control-focus-shadow` and `-invalid-shadow` on its own border box with the border left transparent, and `InputGroupInput`/`InputGroupTextarea` clear the recipe shadow so it is not painted twice.
  - `pnpm tokens:check` now fails when a built-in foreground misses 4.5:1 against the background it renders on, with disabled states exempt. The new `color-contrast-policy.mjs` judges theme `<name>`/`<name>Foreground` pairs and recipe state tuples, which is how the values above were found.

  One visible trade-off: in dark mode the primary button is dimmer than before, because white text requires a darker blue. Its separation from the page dropped from 6.00:1 to 4.30:1, still above the 3:1 threshold for non-text contrast.

### Patch Changes

- c0d3886: Interactive elements point again. Tailwind v4 dropped the `cursor: pointer` that v3's preflight put on buttons, so every button, tab, select, checkbox, radio, switch, and menu item fell back to the browser's arrow cursor and stopped reading as clickable next to the links beside them. The rule now lives in one `@layer base` block covering `button`, `select`, and the `option`, `menuitem`, `menuitemcheckbox`, and `menuitemradio` roles that Radix, Base UI, and cmdk render as non-buttons; the menu-family items that explicitly asked for `cursor-default` no longer do, so they follow the same rule. Deliberate cursors are untouched: `not-allowed` on a disabled form control, `text` over an input group's addon, and the resize cursors on the sidebar rail and a resizable handle. A disabled option is excluded through `aria-disabled` rather than `data-disabled`, because Radix writes `""` there while cmdk writes `"true"` and `"false"`, and no selector can tell cmdk's enabled `"false"` apart from a disabled item.
- c0d3886: Restore publication of tagged releases to npm. The release hook aborted before publishing because it required the registry to describe a missing package or version with an `error` field, while the registry answers a 404 with a bare message string. Every not-yet-published version was therefore rejected as inconsistent metadata, so a release could never publish its package.

  - Treat a 404 carrying a non-empty message as an unpublished version, whether the message arrives as a string or as an `error` field
  - Keep failing closed when a 404 arrives with an empty or unrecognised body

## 0.2.0

### Minor Changes

- 8fe3e7e: - Component sizing is now published in `rem` against a 16px root font size instead of fixed pixels. Everything ExUI owns that describes scalable geometry — the density tokens, the body/small font sizes and line heights, the ordinary radii, and the six component recipes (`button`, `formControl`, `sidebarItem`, `menu`, `dialog`, `tabs`) — scales as a whole, so setting the application root font size resizes type, controls, spacing, icons, and radii together. ExUI does not set a root font size, does not declare a scale variable, and adds no runtime: ```css
  html {
  font-size: 20px; /_ every ExUI size grows by 20 / 16 _/
  }

  ```

  - The following remain fixed pixels on purpose and do not scale: hairline borders, dividers such as the menu separator (`1px`), focus rings, shadows (including the shadow tokens), and the `9999px` capsule radius. Third-party geometry that ExUI does not own is not covered either — Sonner internals and Recharts internals keep their own fixed sizes, and ExUI only guarantees its own legend, tooltip, and icon content. Numeric positioning props (`sideOffset`, `alignOffset`) keep their upstream pixel contract and are never multiplied by the root font size.

  - This is an observable change for existing consumers on the default entry points. Token string values changed, for example `exuiTokens.density.standard.controlHeight` is now `"2.25rem"` instead of `"36px"`. Do not read those values with `parseFloat(token)` and treat the result as pixels: keep the unit and hand the string to CSS, or convert explicitly in the application with the current root font size. Applications whose root font size is not 16px will see a different component size after upgrading; set `html { font-size: 16px }` to keep the previous rendering.
  ```

- 8fe3e7e: - Export `toast` from the `@exre/exui` package root. The exported `toast` is the exact Sonner instance bundled into `<Toaster />`, so notifications triggered from anywhere in the application render in the mounted toaster, and the bundled Sonner API travels with it: the direct `toast(message, data)` call plus `toast.success`, `toast.error`, `toast.warning`, `toast.info`, `toast.message`, `toast.loading`, `toast.promise`, `toast.custom`, and `toast.dismiss`, with types served from the bundled Sonner declarations. Consumers should not install `sonner` themselves: an independently installed copy keeps its own toast state, and toasts triggered through it never reach the bundled `<Toaster />` — they fail silently, with no error and nothing rendered. Import notifications from the package root instead, the same way chart consumers use the bundled `Recharts` namespace:

  ```tsx
  import { toast, Toaster } from "@exre/exui";
  ```

  - `<Toaster />` now resolves its theme with an explicit priority: a `theme` prop passed to `<Toaster />` always wins; without one, the toaster follows the surrounding ExUI `ThemeProvider` (`light` / `dark` / `system`) and updates live when the provider theme or the system color scheme changes, without remounting; with no provider at all, it falls back to `system` and mounts without throwing. The toaster no longer reads `next-themes`; that dependency has been removed from the package. The public `useTheme` hook is unchanged: it still throws when called outside a `ThemeProvider`.

## 0.1.0

### Minor Changes

- a455d70: Add typed, framework-neutral component recipes and generated CSS variables for Button, Form Control, Sidebar Item, Menu, Dialog, and Tabs visual contracts, available from `@exre/exui/tokens` and `@exre/exui/tokens/style.css`.
- ceb1006: Add a CommonJS entry to the tokens subpath `@exre/exui/tokens` for runtimes that cannot load ESM.

  The tokens previously published only an ESM entry, and their `exports` map declared neither a `require` nor a `default` condition. Any CommonJS consumer therefore failed at resolution with `ERR_PACKAGE_PATH_NOT_EXPORTED`, on every Node version. This affected server builds compiled to CommonJS, where theme or token modules are imported at module scope and a resolution failure takes down process startup or request handling rather than degrading gracefully.

  The same source now builds twice: ESM into `dist/tokens/` and CommonJS into `dist/tokens/cjs/`. `import` and bundlers continue to resolve the ESM entry; `require()` resolves the CommonJS entry. Both entries export the same deeply frozen token tree, and each module kind binds to declarations of its own kind.

  Two release gates cover the new entry. `pnpm tokens:check` compares the CommonJS output against the ESM output and asserts deep freeze. `pnpm verify:pack` requires the CommonJS files in a packed consumer, imports the same subpath as ESM, and asserts both trees are identical, plus a NodeNext `.cts` consumer type-check.

  The CommonJS entry is a compatibility entry. It is supported and gated, but it is scheduled for re-evaluation at the next major version once no supported consumer needs it. Downstream release gates that cannot rely on a bundler should verify the entry loads:

  ```bash
  node -e "const { exuiTokens } = require('@exre/exui/tokens'); if (!exuiTokens) process.exit(1)"
  ```

- 8f327e1: Publish the initial public ExUI package. `@exre/exui` ships the React 19 component library with its implementation dependencies bundled, plus framework-neutral tokens available from `@exre/exui/tokens` (with `./tokens/style.css` and `./tokens/font.css`). React and React DOM stay optional peers that component consumers install themselves; tokens consumers need no React at all.
- 131162a: Export the bundled `Recharts` namespace from `@exre/exui` so chart primitives share state with ExUI's `ChartTooltip` and `ChartLegend`. Migrate primitive imports from a separate `recharts` package to `const { BarChart, Bar } = Recharts`; mixing independently installed charts with ExUI's bundled tooltip or legend can leave their content missing. No additional component dependency is required, and framework-neutral tokens remain available without React.

### Patch Changes

- a455d70: Align the first component set with the generated component recipe geometry, typography, theme chrome, and interaction states.
