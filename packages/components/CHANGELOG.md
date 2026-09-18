# @exre/exui

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
