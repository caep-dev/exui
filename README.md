# ExUI workspace

This repository contains the Exre visual foundation as three pnpm workspaces:

- `packages/tokens`: private, framework-neutral token sources. The generated artifacts ship through the public package's `@exre/exui/tokens` subpath.
- `packages/components`: publishable React 19 component library `@exre/exui`. The single public package owns the component root, `@exre/exui/style.css`, and the framework-neutral tokens subpath.
- `packages/showcase`: private Vite application that consumes only the public `@exre/exui` exports.

The repository root is a private orchestration layer and is never published.

## Development

Use Node.js 24 and pnpm 11.9.0 (the version declared in `package.json`). Run commands from the repository root:

```bash
pnpm install
pnpm dev
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @exre/exui-showcase exec playwright install chromium
pnpm test:visual
pnpm verify:pack
```

Run shadcn from `packages/components` so generated source uses that package's `components.json` and `@/*` alias.

`pnpm dev` builds tokens and components before starting the Showcase. Those library builds are not watched by this command; rebuild the affected package after editing library source. The Showcase consumes built public package entries.

See [Testing](TESTING.md) for the full CI checks, visual-test prerequisites, and skill example validation. See [Contributing](CONTRIBUTING.md) for Changesets and DCO requirements.

## Package usage

React consumers should follow [`packages/components/README.md`](packages/components/README.md). Framework-neutral consumers can import `@exre/exui/tokens`, `@exre/exui/tokens/style.css`, and `@exre/exui/tokens/font.css` without installing React. The internal `@exre/exui-tokens` workspace is never published.

Changesets version the single public package. The private Showcase and the private tokens workspace must never be selected for a release.

## Documentation

- [React package usage](packages/components/README.md): installation, styles, sizing, and bundled chart APIs.
- [Internal token workspace](packages/tokens/README.md): token builds, formats, and length policy.
- [ExUI usage skill](skills/exui-usage/SKILL.md): component references, theme guidance, and consumer examples.

`.docset.json` records the committed source snapshot reviewed for these documents and the additional contribution/testing guides. It advances only after the complete tracked scope has been reviewed and its documentation checks pass.

## Building content that scales with ExUI

ExUI's scalable dimensions use `rem` against a 16px root font size. When the application changes that root size, custom React content should scale alongside the library: prefer Tokens and rem-based typography, spacing, icons, and ordinary radii. Keep intentional fixed effects such as `1px` borders in pixels. Reusable components should preserve the application's root-font setting.

For example, React `style={{ padding: "1.5rem", borderWidth: "1px" }}` scales the padding while keeping the border width fixed; `padding: 24` would remain 24px.

Copy [EXUI_SCALING_RULES.md](skills/exui-usage/EXUI_SCALING_RULES.md) into a third-party project's AI instructions or attach it to an AI request. It is a standalone English rule document with React examples, allowed pixel exceptions, and browser verification steps for root-font scaling.
