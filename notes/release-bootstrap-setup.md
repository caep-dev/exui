# Release bootstrap setup

Local initialization for `caep-dev/exui`, 2026-09-09. Remote settings and real npm publication have not been applied or accepted.

## Repository behavior

`CI` retains Windows token, type, lint, visual, build, packed-consumer, and release checks. Its `ci-gate` job fails unless the quality job succeeds.

After successful push CI on the current `main` SHA, `Release` consumes pending Changesets, verifies the version diff, commits with DCO and subject `chore(release): version packages`, and pushes annotated package tags one at a time. An ordinary merge without release changes succeeds without requesting an App token. Empty Changesets alone are a no-op; when versioning other Changesets, Changesets also consumes empty files. Private workspace entries with bump type `none` are excluded from the release plan.

`tag-npm.yml` independently validates the annotated tag, release commit diff, main ancestry, package and version. It builds and packs the tagged package, checks the packed manifest, and publishes with npm OIDC. Existing exact versions succeed without another publish. Registry errors fail closed. The component job waits up to 115 seconds for the matching tokens version; if it remains absent, rerun the component job after the tokens job succeeds.

The former `scripts/release/` implementation and `scripts/changeset-policy.mjs` were removed with maintainer approval. `scripts/package-contract.mjs` remains shared with packed-consumer verification. There is no local `pnpm release` shortcut. Runtime files are under `scripts/release-bootstrap/` and do not require the local Codex Skill.

## External activation

Live read-only inspection confirmed the repository is public and its Rulesets API is accessible with an empty ruleset list. Repository secrets, variables, and environments were empty. The local credential file passed its permission check, but contained no GitHub profile or project mapping. Secret values were not printed or copied.

Before enabling release automation:

1. Install a dedicated GitHub Release App on this repository with Contents read/write. Set repository variable `EXUI_RELEASE_APP_ID` and secret `EXUI_RELEASE_APP_PRIVATE_KEY`. Only the release job requests its short-lived installation token, restricted to this repository. Do not substitute `GITHUB_TOKEN`.
2. Apply and verify the separately reviewed rulesets below, including App-only bypass and immutable tags.
3. Create GitHub environment `npm-release`. For each public npm package configure its Trusted Publisher with owner `caep-dev`, repository `exui`, workflow filename `tag-npm.yml`, and environment `npm-release`, allowing direct `npm publish`. The workflow uses GitHub-hosted Ubuntu, Node 24, npm 11.9.0, and `id-token: write`. This follows the [npm trusted-publisher contract](https://docs.npmjs.com/trusted-publishers/).
4. Resolve first-publication setup with the npm package owner. Public Registry reads currently return 404 for both package names; package ownership and trusted-publisher configuration are not established by adding this workflow. Any first publication using interactive npm authentication requires a separate release action. Never introduce a fallback npm token into these workflows.
5. Only after those external prerequisites are ready, set repository variable `RELEASE_AUTOMATION_ENABLED=true`. Until then, CI runs but the release job stays disabled.

The initialization workspace's Changesets plan, including the separately pending `initial-exui-components-release.md`, would release both public packages at `0.1.0`. That initial-release Changeset is not part of the release-tooling commit; review it separately when preparing the first release. Initialization does not consume Changesets or change package versions.

## Remote desired state (NOT_EXECUTED)

Use four active rulesets so the Release App cannot bypass force-push or tag immutability restrictions:

| Ruleset | Target | Rules | Bypass |
| --- | --- | --- | --- |
| `main-merge` | `refs/heads/main` | Pull request required, zero approvals, required `ci-gate` status | Dedicated Release App only, always |
| `main-integrity` | `refs/heads/main` | Block deletion and non-fast-forward updates | None |
| `release-tag-creation` | Tag patterns below | Restrict creation | Dedicated Release App only, always |
| `release-tag-immutability` | Tag patterns below | Restrict update and deletion | None |

Tag ref patterns: `refs/tags/v*`, `refs/tags/*@*`, and `refs/tags/@*/*@*`. They cover `v1.2.3`, `pkg@1.2.3`, and `@scope/pkg@1.2.3`, respectively. A single `*` does not cross `/` under [GitHub's fnmatch semantics](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository). The two ExUI scoped tag namespaces are included in the third pattern. Live matching and negative actor acceptance remain part of remote activation.

The App integration ID is still an external input. Before application, re-read current rulesets and compare against the observed empty list; stop on drift. After each write, read back enforcement, target patterns, bypass actors, required checks, and update/delete restrictions. Do not add administrator or writer-role bypass.

## Recovery and maintenance

- A main race fails with `MAIN_ADVANCED`. Let CI for the new main revision drive the next release; never rebase a generated version commit.
- If a version commit reached main but tag pushes failed, rerun CI for that release commit while it remains current main. Release recognizes that commit, validates its diff, and creates only missing tags. Existing tags must be annotated and resolve to the same SHA.
- If main has already advanced past that release commit, recovery requires a separately reviewed operation at the original release SHA; the automated workflow intentionally rejects stale main runs.
- If npm failed after tag creation, rerun the failed `Release Hook - npm` run. Do not move tags, revert a published version, or generate another version just to retry.
- Release files are maintained directly in Git; the managed SHA-256 manifest and hash checks have been removed. Run `pnpm release:verify` to validate the declaration, Changesets configuration, quality scripts, and required provider workflows, then run the release tests. The historical initialization results below describe the original bootstrap acceptance.

## Validation

Local checks ran with pnpm 11.9.0 and Node 22.22.1 on Windows; workflows specify Node 24. They do not establish hosted-runner or npm OIDC acceptance.

| Check | Result |
| --- | --- |
| Release regression tests | PASS, 14 tests |
| `pnpm tokens:check`, `pnpm typecheck`, `pnpm lint` | PASS; existing React refresh warnings remain |
| `pnpm test:visual` | PASS, 12 tests |
| `pnpm build`, `pnpm verify:pack` | PASS; existing Showcase chunk-size warning remains |
| Runtime verifier and Skill `verify-generated.mjs` | PASS, 14 managed files |
| Workflow YAML and actionlint 1.7.12 | PASS; shellcheck/pyflakes integrations not executed |
| Real isolated workspace versioning and lockfile-only update | PASS, both public packages reach 0.1.0; allowed diff verified |
| Second initialization reconciliation | PASS, zero changed files |
| Managed-file drift rejection | PASS, tampered candidate rejected with CI_CONFLICT |
| Independent code review | APPROVED, no actionable findings |
| GitHub public visibility and Rulesets capability | PASS, read-only inspection |
| GitHub live protection and npm publication | NOT_EXECUTED |
| GitLab live acceptance | NOT_EXECUTED, not this repository's provider |

Initialization status: `localChanged=true`, `remoteChanged=false`, `retrySafe=true`. External activation is required. No commit, push, tag creation on GitHub, package publication, or repository-settings write was performed.
