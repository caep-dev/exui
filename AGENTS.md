# Repository Guidelines

## Project Structure & Module Organization

This repository is a private pnpm workspace for the ExUI visual foundation. `packages/tokens` is the private workspace where framework-neutral token sources are generated and validated; its artifacts ship through the public package's `@exre/exui/tokens` subpath and the workspace itself is never published. `packages/components` publishes the React 19 `@exre/exui` component library as the single public package, with public exports in `packages/components/src/index.ts`, shared styling in `packages/components/src/index.css`, and shadcn/ui primitives under `packages/components/src/components/ui`. `packages/showcase` is a private Vite application and may consume components only through the public `@exre/exui` package entries. Build output under package `dist/` and `types/` directories is generated and must not be edited by hand.

## Documentation Locations

Use `/docs/` for maintained engineering documentation that is intended to be part of the project record. Use `/notes/` for development notes and agent-authored working material. All AI-generated reports, ADRs, RFCs, implementation plans, audits, and similar planning artifacts must be created under `/notes/`, not in `/docs/`, unless a maintainer explicitly promotes them.

## Build, Test, and Development Commands

Use pnpm 11.9.0, as declared in `package.json`.

- `pnpm install`: install dependencies.
- `pnpm dev`: start the Vite development server.
- `pnpm tokens:check`: type-check and validate generated Token data, CSS, semantics, and exports.
- `pnpm typecheck`: run TypeScript checks across all three workspaces.
- `pnpm lint`: run Oxlint with React and TypeScript rules.
- `pnpm build`: build Tokens, components, declarations, and the private Showcase in dependency order.
- `pnpm verify:pack`: pack the public tarball and run the isolated packed-consumer gates (npm and pnpm tokens-only installs, token type and stylesheet checks, and a React consumer with strict type-checking, a production build, and a server-render smoke test).
- `pnpm changeset`: create a release note for user-facing package changes.
- `pnpm version-packages`: apply pending Changesets to versions and changelogs.

## Coding Style & Naming Conventions

Write TypeScript and TSX using the existing component style. Prefer named exports for public components and keep component exports explicit through `packages/components/src/index.ts`. Use the component package's configured `@/*` aliases, for example `@/components/ui/button` and `@/lib/utils`. Keep shadcn/ui source under `packages/components/src/components/ui` and avoid unrelated rewrites of generated component structure. Token JavaScript must stay framework-neutral and side-effect free; generated `packages/tokens/src/style.css` must be updated through its generator. Oxlint enforces hook correctness and warns when files mix component exports with non-component exports.

## Testing Guidelines

Follow the engineering testing policy in `TESTING.md`. If that file is not present yet, keep changes conservative and run at least `pnpm typecheck`, `pnpm lint`, and `pnpm build`. There is currently no dedicated `pnpm test` script. When adding test infrastructure, document naming conventions, placement, and commands in `TESTING.md`.

## Commit & Pull Request Guidelines

Follow contribution and commit requirements in `CONTRIBUTING.md`. The current convention is Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:`. Include a DCO sign-off in commits. Pull requests should summarize the user-facing change, list validation commands run, link related issues, and include screenshots or recordings for visual component changes. Add a Changeset for release-worthy package behavior or API changes.
