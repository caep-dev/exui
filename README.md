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

`pnpm dev` builds tokens and components before starting the Showcase. In a second terminal, run `pnpm watch` while editing library source. It performs an initial library build, watches the token and component source and script directories, and rebuilds components after token changes. It does not start the Showcase or watch package manifests and build configuration; restart or rebuild manually after those changes. The Showcase consumes built public package entries.

The Showcase is a component catalog with name/use-case search, category navigation, and URL hash links. Use `Quality recipes` for the dedicated recipe previews; use the component categories for interactive examples.

See [Testing](TESTING.md) for the full CI checks, visual-test prerequisites, and skill example validation. See [Contributing](CONTRIBUTING.md) for Changesets and DCO requirements.

## Package usage

React consumers should follow [`packages/components/README.md`](packages/components/README.md). Framework-neutral consumers can import `@exre/exui/tokens`, `@exre/exui/tokens/style.css`, and `@exre/exui/tokens/font.css` without installing React. The internal `@exre/exui-tokens` workspace is never published.

Changesets version the single public package. The private Showcase and the private tokens workspace must never be selected for a release.

## Documentation

- [React package usage](packages/components/README.md): installation, themes, Glass surfaces, sizing, and bundled chart APIs.
- [Internal token workspace](packages/tokens/README.md): token builds, formats, and length policy.
- [ExUI usage skill](skills/exui-usage/SKILL.md): component references, theme guidance, and consumer examples.
- [Token customization](skills/exui-usage/references/token-customization.md): CSS overrides, theme scope, and foundation references.
- [Fumadocs theme](skills/exui-usage/references/docs-theme.md): the optional `@exre/exui/docs/theme.css` stylesheet and its consumer prerequisites.

`.docset.json` records the committed source snapshot reviewed for these documents and the additional contribution/testing guides. It advances only after the complete tracked scope has been reviewed and its documentation checks pass.

## Building content that scales with ExUI

ExUI's scalable dimensions use `rem` against a 16px root font size. When the application changes that root size, custom React content should scale alongside the library: prefer Tokens and rem-based typography, spacing, icons, and ordinary radii. Keep intentional fixed effects such as `1px` borders in pixels. Reusable components should preserve the application's root-font setting.

For example, React `style={{ padding: "1.5rem", borderWidth: "1px" }}` scales the padding while keeping the border width fixed; `padding: 24` would remain 24px.

Copy [EXUI_SCALING_RULES.md](skills/exui-usage/guides/EXUI_SCALING_RULES.md) into a third-party project's AI instructions or attach it to an AI request. It is a concise standalone English rule document covering scalable lengths, allowed pixel exceptions, and an application-level scale reference based on viewport height.
