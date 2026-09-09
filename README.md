# ExUI workspace

This repository contains the Exre visual foundation as three pnpm workspaces:

- `packages/tokens`: private, framework-neutral token sources. The generated artifacts ship through the public package's `@exre/exui/tokens` subpath.
- `packages/components`: publishable React 19 component library `@exre/exui`. The single public package owns the component root, `@exre/exui/style.css`, and the framework-neutral tokens subpath.
- `packages/showcase`: private Vite application that consumes only the public `@exre/exui` exports.

The repository root is a private orchestration layer and is never published.

## Development

```bash
pnpm install
pnpm dev
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm verify:pack
```

Run shadcn from `packages/components` so generated source uses that package's `components.json` and `@/*` alias.

## Package usage

React consumers should follow [`packages/components/README.md`](packages/components/README.md). Framework-neutral consumers can import `@exre/exui/tokens`, `@exre/exui/tokens/style.css`, and `@exre/exui/tokens/font.css` without installing React. The internal `@exre/exui-tokens` workspace is never published.

Changesets version the single public package. The private Showcase and the private tokens workspace must never be selected for a release.
