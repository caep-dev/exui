# Contributing

Thank you for contributing

Read this file before creating a commit or a Pull Request. Repository-specific rules in `AGENTS.md`, module documentation, and CI configuration take precedence over this file.

## Changes

- Keep changes focused; do not mix in unrelated refactors, formatting, or generated files.
- Add or update the tests and documentation that a behavior change requires.
- Before committing, run the verification that matches the scope of the change, and report any check you did not run or that was blocked.

## Code of Conduct

Please be respectful and constructive in all interactions with the community.

## Development Setup

Use Node.js 24 and pnpm 11.9.0. Install from the repository root and use the aggregate checks:

```bash
pnpm install
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @exre/exui-showcase exec playwright install chromium
pnpm verify:pack
```

Run shadcn commands from `packages/components`. The repository root, `packages/showcase`, and the internal `packages/tokens` workspace are private; only `@exre/exui` participates in Changesets and publication.

Follow [TESTING.md](TESTING.md) for the complete checks, including visual tests and consumer examples. Keep Showcase imports on the public `@exre/exui` entries.

## Documentation and pull requests

Update affected READMEs and [consumer guidance](skills/exui-usage/SKILL.md) when public behavior changes. Maintain engineering documentation under `docs/` when present; place working notes, review reports, and plans under `.notes/`. Generate token CSS and skill inventories with their existing generators rather than editing generated output.

Pull requests should describe the user-facing change, link related issues, and list validation results. Call out breaking changes, migration steps, known limitations, or follow-up work. Include screenshots or recordings for visual component changes. Documentation-only changes do not need a Changeset unless they accompany release-worthy package behavior.

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

The commit message should state the purpose of the change. Never commit credentials, private configuration, or unrelated artifacts.

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

Include the installed ExUI version, React version, environment, reproduction steps, and expected versus actual behavior. For visual issues, include a screenshot and the application's root font size and theme. Open an issue for questions as well.
