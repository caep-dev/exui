# @exre/exui

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
