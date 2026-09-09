# @exre/exui

Exre brand React component library built with Vite, Tailwind CSS v4, shadcn/ui, and Radix UI.

## Usage

Install the package in a consuming app and import the built stylesheet once:

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

After release automation is enabled, successful CI on `main` versions pending Changesets and creates annotated package tags. The `tag-npm.yml` workflow publishes each tagged package using npm OIDC.

There is no local `pnpm release` command. Maintainers must configure the Release App, protected refs, and npm Trusted Publishers before enabling automation.

## shadcn/ui

This package keeps shadcn/ui components as source under `packages/components/src/components/ui`.

The project was initialized with:

```bash
npx shadcn@latest init --template vite --base radix --preset b5Kc86Jl4 --force -y
npx shadcn@latest add --all -y
```

Run shadcn from `packages/components` so generated files use `components.json` and the local `@/*` alias.
