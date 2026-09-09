# @exre/exui

Exre brand React component library built with Vite, Tailwind CSS v4, shadcn/ui, and Radix UI.

## Usage

Install the package together with the React host runtime it expects:

```bash
npm add @exre/exui react react-dom
npm add -D @types/react @types/react-dom
```

React and React DOM are optional peers: the component entry needs them at runtime and their type packages for TypeScript, but the package never installs them for you. Then import the built stylesheet once:

```tsx
import "@exre/exui/style.css"
import { Button, ThemeProvider } from "@exre/exui"

export function App() {
  return (
    <ThemeProvider>
      <Button>Continue</Button>
    </ThemeProvider>
  )
}
```

`@exre/exui/style.css` is the complete component stylesheet, including token variables and fonts.

### Framework-neutral tokens

Projects that do not use React can consume the visual contract alone; no React, React DOM, or React type packages are required:

```ts
import { componentRecipes, exuiTokens } from "@exre/exui/tokens"
import "@exre/exui/tokens/style.css"
```

`@exre/exui/tokens` publishes ESM and CommonJS entries. `@exre/exui/tokens/style.css` carries only token variables for the three themes, and `@exre/exui/tokens/font.css` loads the optional font assets.

### Bundled implementation dependencies

The compiled component bundle includes its implementation libraries (Radix UI, Base UI, Recharts, and others); they are not dependencies of the installed package. Consequences:

- Component consumers only install `@exre/exui`, `react`, and `react-dom`.
- Consumers that also use those libraries directly may download duplicate implementation code.
- Context and providers from a consumer's own Radix or Base UI copies do not share state with the instances bundled inside ExUI components. Wrap ExUI components with ExUI's own providers.

Shipped declarations include the third-party type definitions they need, so TypeScript consumers require no component implementation packages.

The tarball also ships the package source under `src/` for reference and for existing tooling that copies source files. Source-copy consumers resolve the third-party source dependencies themselves; only the `exports` entries above are the supported consumption contract.

## Development

Run aggregate development and validation commands from the repository root:

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
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
