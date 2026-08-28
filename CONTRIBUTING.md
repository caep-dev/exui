# Contributing

Thank you for contributing

## Code of Conduct

Please be respectful and constructive in all interactions with the community.

## Development Setup

Install from the repository root and use the aggregate checks:

```bash
pnpm install
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm verify:pack
```

Run shadcn commands from `packages/components`. The repository root and `packages/showcase` are private; only `@exre/exui-tokens` and `@exre/exui` participate in Changesets and publication.

## Commit Messages

Follow Conventional Commits:

- `feat: add new feature`
- `fix: fix bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: refactor code`
- `chore: update dependencies`

All commits should include DCO sign-off:

```text
Signed-off-by: Your Name <your.email@example.com>
```

## Version Management

Use Changesets for any user-facing change that should appear in a package release:

```bash
pnpm changeset
```

Select the affected package, choose `patch`, `minor`, or `major`, and write a concise release note from the user's point of view.

When preparing a release, consume pending changesets with:

```bash
pnpm version-packages
```

Review generated `package.json` and `CHANGELOG.md` changes before publishing. Do not publish from local work unless the release owner has approved it.

## Reporting Issues

## Questions?

Open an issue for discussion.
