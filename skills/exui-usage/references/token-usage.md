# ExUI Token Usage

Use `@exre/exui-tokens` when a consuming project needs ExUI's visual contract without the React component package. Use `@exre/exui` for React components instead of recreating those components from Tokens.

## Install and import

For framework-neutral Token use:

```bash
pnpm add @exre/exui-tokens
```

```ts
import { componentRecipes, exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/style.css"
```

Import `@exre/exui-tokens/font.css` separately only when the consumer wants the ExUI font assets. The JavaScript root also supports CommonJS through the package's declared root export.

For React components:

```tsx
import "@exre/exui/style.css"
import { Button } from "@exre/exui"
```

`@exre/exui/style.css` already includes the Token stylesheet and font stylesheet. Do not import either Token CSS file again in the same React application path.

## Choose the right layer

Use the most semantic public expression that fits:

1. Prefer theme semantic Tokens for product UI: `surface`, `text`, `control`, `border`, `feedback`, `editor`, `chart`, `sidebar`, and theme `shadow`.
2. Use `componentRecipes` only when a non-React consumer needs to reproduce the visual contract for `button`, `formControl`, `sidebarItem`, `menu`, `dialog`, or `tabs`.
3. Use `density`, `typography`, `radii`, and foundation `shadows` directly only when the semantic and recipe layers cannot express the requirement.

Do not copy resolved colors, lengths, shadows, or typography values into application code when a public Token path or CSS custom property expresses the intent.

## JavaScript Tokens and CSS variables

- Use `exuiTokens` when code needs typed, framework-neutral Token paths or must adapt ExUI into another theme system.
- Use `componentRecipes` for non-React component geometry, typography, states, motion, and variants. Recipe references point back to public semantic or foundation Tokens; do not treat them as a second React component API.
- Use `@exre/exui-tokens/style.css` when styling can consume CSS custom properties directly. The stylesheet exposes Light under `:root`, Dark under `.dark`, and Pitch Black under `.pitch-black`.

Consult the [generated Token path inventory](generated/token-paths.md) for exact `exuiTokens` paths, `componentRecipes` paths, and CSS custom-property names. That inventory intentionally lists no concrete values.

## Public entrypoints

Supported consumer entries are:

- `@exre/exui-tokens`
- `@exre/exui-tokens/style.css`
- `@exre/exui-tokens/font.css`
- `@exre/exui`
- `@exre/exui/style.css`

Do not import from package `src/`, `dist/`, or `types/` paths.
