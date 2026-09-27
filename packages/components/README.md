# @exre/exui

Exre brand React component library built with Vite, Tailwind CSS v4, shadcn/ui, and Radix UI.

## Usage

Install the package together with the React host runtime it expects:

```bash
npm add @exre/exui react@19 react-dom@19
npm add -D @types/react@19 @types/react-dom@19
```

React and React DOM are optional peers: the component entry needs them at runtime and their type packages for TypeScript, but the package never installs them for you. Then import the built stylesheet once:

```tsx
import "@exre/exui/style.css"
import { Button } from "@exre/exui"

export function App() {
  return (
    <Button>Continue</Button>
  )
}
```

`@exre/exui/style.css` is the complete component stylesheet, including token variables and fonts.

The React root is ESM-only and supports React 19 (`>=19.0.0 <20`). General-purpose layout utilities are not part of the stylesheet contract; use your own CSS or utility setup for application layout.

### Themes

In a browser application, wrap the app with the root `ThemeProvider` and use `useTheme()` to switch between `"light"`, `"dark"`, and `"system"`. The default is `"system"`, and choices are stored under the `"theme"` localStorage key. Mount `Toaster` and call `toast` from the same `@exre/exui` root for notifications that follow the provider.

`ThemeProvider` reads localStorage during rendering and cannot render on a server. Mount it only in the browser after hydration when using an SSR framework; `"use client"` alone does not prevent prerendering. The `.pitch-black` token class is managed separately and is not a provider theme value.

### Glass material

Glass is a shared translucent surface — a tinted backdrop blur with an inset edge — that any element can adopt, plus an optional SVG refraction enhancement driven by one seed per document.

```tsx
import "@exre/exui/style.css"
import { Button, Card, GlassSeed } from "@exre/exui"

export function App() {
  return (
    <>
      <GlassSeed />
      <Card glass>
        <div className="ex-glass" style={{ borderRadius: "0.75rem", padding: "1rem" }}>
          Any element, no component needed
        </div>
        <Button glass variant="danger">Delete</Button>
      </Card>
    </>
  )
}
```

- Mount one `GlassSeed` per document. It renders no children, is not a provider, and adds no layout box; the material works without it and simply loses the refraction. It is safe to server-render: the enhancement is applied after hydration once the browser has confirmed it accepts the shared filter, and withdrawn when the seed unmounts.
- The `glass` prop and the `ex-glass` class produce the same material. `glass` defaults to `false` and is never forwarded to the DOM; `glass={false}` does not remove a class you wrote yourself. `ex-glass-foo` is a different class and does not enable the material.
- The material never changes layout: no `display`, `position`, `z-index`, size, padding, gap, radius, or `overflow` change, no wrapper element, and no new border width. The visible edge is an inset shadow, never a border: it paints an inner hairline on every glass surface while the surface's own border colour — including its hover, focus, invalid, disabled, error, and checked transitions — is left completely untouched. A bordered surface shows both its border and the material's hairline, and a surface that shipped `border-transparent` gains a visible inner edge. Existing outer shadows and focus rings are composed with the material rather than replaced.
- Every surface opts in on its own; the marker does not spread to descendants. The [Glass reference](../../skills/exui-usage/references/glass.md) lists supported surfaces and composition rules. For example, `Select glass` affects its trigger; a glass popup requires the composed `SelectField` and `SelectContent glass` path. `DrawerContent` paints its rounded panel through `::before`, and a glass tooltip retints its arrow without adding a second refraction filter.
- Restyle it with `--exui-glass-background`, `--exui-glass-foreground`, `--exui-glass-border`, `--exui-glass-shadow`, `--exui-glass-blur`, and `--exui-glass-saturation`, declared on the surface or any ancestor.
- Where `backdrop-filter` is unavailable the surface falls back to an opaque themed background. A non-`none` `backdrop-filter` also makes the element a containing block for absolutely and fixed positioned descendants, so keep viewport-anchored content in a portal rather than inside a glass surface.

The built-in blur stays `4px` at every root font size; the inset edge uses `0.0625rem` and scales. The stylesheet also adds a fixed-pixel white inset highlight. `CSS.supports` checks syntax acceptance only: the automated checks cover computed styles and lifecycle, not the rendered refraction effect.

### Customizing tokens

Every Token is a CSS custom property declared on `:root`, and the component stylesheet resolves its recipe values through those properties rather than copying them. Re-declare the ones you need after the stylesheet:

```css
@import "@exre/exui/style.css";

:root {
  --exui-control-primary: #0f62fe;
  --exui-control-primary-foreground: #ffffff;
  --primary: #0f62fe;                    /* the shadcn alias holds its own copy */
  --exui-font-family: "Inter", sans-serif;
  --exui-radius-extra-large: 0.75rem;
}

.dark {
  --exui-control-primary: #6ea8ff;
  --primary: #6ea8ff;
}
```

An override is a declaration that wins the cascade, so two rules matter more than the list of names:

- **Keep it unlayered.** ExUI emits its Token declarations outside any `@layer`, and unlayered declarations beat layered ones. An override written inside `@layer base` or a Tailwind `@theme` block resolves back to the library value and fails with no error; a plain `:root` rule placed after the stylesheet import is enough, and its position in the cascade is what makes it win.
- **`.dark` and `.pitch-black` carry only the values that differ from `:root`.** An unlayered `:root` override placed after the stylesheet therefore applies to all three themes. Add a `.dark` block when the brand value has a dark counterpart; the foundation Tokens and `--density-*` are declared once and are theme-independent.

What the layers cover:

- **Semantic Tokens** — `--exui-control-*`, `--exui-surface-*`, `--exui-text-*`, `--exui-border-*`, `--exui-feedback-*`, `--exui-sidebar-*`, `--exui-chart-*`, `--exui-editor-*`. Recolouring an application is normally these alone.
- **Foundation Tokens** — `--exui-font-family`, `--exui-font-family-mono`, `--exui-font-family-emoji`, `--exui-font-weight-*`, `--exui-font-size-*`, `--exui-line-height-*`, `--exui-radius-*` and `--exui-shadow-*`. They are theme-independent, and every recipe field that references one resolves through its variable, so changing `--exui-font-family` or `--exui-radius-extra-large` moves the components as well. Three recipe radii are deliberately standalone values — the button action radius, and the dialog and menu surface radii — and follow only their own `--exui-component-…-radius`.
- **`--radius`** is derived: it resolves to `--exui-radius-large`, so the Tailwind radius scale (`rounded-sm` … `rounded-4xl`) and the components that use that radius move together.
- **The shadcn aliases** — `--background`, `--primary`, `--ring`, `--chart-1`, `--sidebar-*` and the rest — are separate declarations carrying their own copies of the same colours for shadcn-styled markup. Overriding `--exui-control-primary` does not move `--primary`; set both when both are in use.
- **`--density-*`** (with the `.density-compact` block) is published but unused: no component styling references it today, so overriding it changes nothing. Treat it as data for Token consumers, not as a density switch.
- **Recipe variables** (`--exui-component-…`) are the component-internal layer. Overriding one is supported and precise — a few hundred of them cover the default, hover, focus, active and disabled state of every variant — but they are not the theming surface.

These examples assume the theme class is on the document root. A subtree's own declarations override inherited values, and inherited recipe variables may already have resolved their references at the root. For local overrides and portal theming, follow the [Token customization guide](../../skills/exui-usage/references/token-customization.md).

The library keeps no override layer of its own, so nothing has to be re-applied after an upgrade; an override that stops matching a Token name simply stops applying.

### Framework-neutral tokens

Projects that do not use React can consume the visual contract alone; no React, React DOM, or React type packages are required:

```ts
import { componentRecipes, exuiTokens } from "@exre/exui/tokens"
import "@exre/exui/tokens/style.css"
```

`@exre/exui/tokens` publishes ESM and CommonJS entries. `@exre/exui/tokens/style.css` carries only token variables for the three themes, and `@exre/exui/tokens/font.css` loads the optional font assets.

The current source requires a `glass` group (`--exui-glass-*`) in each `ThemeTokens` object. When upgrading from a package without that group, copy a built-in theme's `glass` values as the starting point for a hand-written complete theme. Reading individual Tokens and spreading a built-in theme need no such change. The glass material itself lives in the component stylesheet, so a token-only consumer gets the variables and none of the `.ex-glass` behaviour. Check the installed package's types for availability; repository source can include changes awaiting release.

### Theming Fumadocs UI

A documentation site built with [Fumadocs UI](https://www.fumadocs.dev/docs/ui) renders in ExUI colours by importing one stylesheet:

```tsx
import "@exre/exui/docs/theme.css"
```

It imports `@exre/exui/tokens/style.css`, then Fumadocs' `css/shadcn.css` and `css/preset.css`, in that order. Fumadocs maps its own `--color-fd-*` names onto shadcn's short variables without fallbacks, so the token sheet has to be present: without it every docs colour computes to an unset custom property, and the page renders unstyled without reporting an error.

ExUI declares no dependency on `fumadocs-ui` in any field — a stylesheet is not worth adding the Fumadocs tree and its React implementation libraries to every consumer's dependency graph. Install it yourself, since a Fumadocs site needs it anyway. The sheet is verified against `^16.15.0`:

```bash
npm add fumadocs-ui
```

The sheet ships unprocessed, exactly like Fumadocs' own `css/*` sheets, so your Tailwind build resolves the three imports. Without `fumadocs-ui` installed they fail loudly instead of producing an unstyled page.

Boundaries worth knowing before relying on it:

- **Colour only.** Fumadocs keeps its own radii, spacing, and animations; they do not follow ExUI's `--radius` or its density classes.
- **No component wrapping.** Fumadocs ships its own `Tabs` and `Accordion` with APIs that differ from ExUI's (`<Tabs items={[...]}><Tab value="...">` against ExUI's `<TabsList>` composition). Import those from `fumadocs-ui` directly; ExUI does not re-export them.
- **One theme driver per page.** Fumadocs' `RootProvider` uses next-themes and ExUI's `ThemeProvider` keeps its own state, but both read and write the same `theme` localStorage key. In an SSR framework use Fumadocs' provider — it is hydration-safe, while `ThemeProvider` is not.
- **Stylesheet subpath only.** There is no `@exre/exui/docs` JavaScript entry.

### Sizing and root font size

ExUI publishes its scalable sizes in `rem`, calibrated so that a 16px root font size reproduces the original pixel design exactly. Type, control heights, padding, gaps, icons, and ordinary radii therefore resize together when the application sets its own root font size:

```css
html {
  font-size: 20px; /* every scalable ExUI size grows by 20 / 16 */
}
```

ExUI never sets a root font size itself and declares no scale variable, so this stays an application decision. Keep the root at `16px` for the previous rendering; applications that already set a different root font size will see differently sized components after upgrading.

The following stay fixed pixels on purpose and do **not** scale: hairline borders and dividers, focus rings, foundation and theme drop shadows, the glass blur, and the capsule (`9999px`) radius. The glass inset edge is a separate rem-based effect. Third-party geometry is outside this contract too — the internals of Sonner and Recharts keep their own fixed sizes, so do not expect toasts or chart axes to scale in lockstep. ExUI's own legend, tooltip, and icon content does scale.

Numeric positioning props such as `sideOffset` and `alignOffset` keep their upstream pixel contract and are never multiplied by the root font size.

### Bundled implementation dependencies

The compiled component bundle includes its implementation libraries (Radix UI, Base UI, Recharts, and others); they are not dependencies of the installed package. Consequences:

- Component consumers only install `@exre/exui`, `react`, and `react-dom`.
- Consumers that also use those libraries directly may download duplicate implementation code.
- Context and providers from a consumer's own Radix or Base UI copies do not share state with the instances bundled inside ExUI components. Wrap ExUI components with ExUI's own providers.

Shipped declarations include the third-party type definitions they need, so TypeScript consumers require no component implementation packages.

### Charts and migration

Use the root `Recharts` namespace for chart primitives so they share the bundled
state and contexts used by `ChartTooltip` and `ChartLegend`:

```tsx
import {
  Recharts,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@exre/exui"

const { BarChart, Bar, XAxis } = Recharts

export function VisitorsChart() {
  return (
    <ChartContainer config={{ visitors: { label: "Visitors", color: "#6366f1" } }}>
      <BarChart data={[{ month: "January", visitors: 10 }]}>
        <XAxis dataKey="month" />
        <Bar dataKey="visitors" fill="var(--color-visitors)" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
```

When migrating existing charts, replace imports such as
`import { BarChart, Bar } from "recharts"` with the `Recharts` import and
destructuring shown above. An independently installed Recharts copy does not
share the chart context: mixing its charts with ExUI's tooltip or legend can
silently omit their content. Chart primitive props and types are available
through `Recharts`; no separate `recharts` installation is needed.

The namespace exposes the bundled Recharts public API and increases the shipped
component bundle size. Tokens remain isolated behind `@exre/exui/tokens`.

### Source distribution

The tarball also ships the package source under `src/` for reference and for existing tooling that copies source files. Source-copy consumers resolve the third-party source dependencies themselves; only the `exports` entries above are the supported consumption contract.

## Development

Run aggregate development and validation commands from the repository root:

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @exre/exui-showcase exec playwright install chromium
pnpm verify:pack
```

## Versioning

This package uses Changesets for release notes, version bumps, and changelog generation.

Create a changeset for user-facing changes:

```bash
pnpm changeset
```

Apply pending changesets to `package.json` and changelogs:

```bash
pnpm version-packages
```

After release automation is enabled, successful CI on `main` versions pending Changesets and creates annotated package tags. The `tag-npm.yml` workflow publishes the tagged package using npm OIDC.

There is no local `pnpm release` command. Maintainers must configure the Release App, protected refs, and the npm Trusted Publisher before enabling automation.

## shadcn/ui

This package keeps shadcn/ui components as source under `packages/components/src/components/ui`.

The project was initialized with:

```bash
npx shadcn@latest init --template vite --base radix --preset b5Kc86Jl4 --force -y
npx shadcn@latest add --all -y
```

Run shadcn from `packages/components` so generated files use `components.json` and the local `@/*` alias.
