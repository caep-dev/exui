# Automated npm Release Design

## Status

Approved design for protecting `main` and publishing the two public ExUI packages immediately after successful merges that contain releasable Changesets.

The design is implementation-ready but does not authorize repository, GitHub, or npm configuration changes. The first npm publication remains an explicitly manual bootstrap step.

## Context

ExUI is a private pnpm workspace with three packages:

- `packages/tokens` publishes the framework-neutral `@exre/exui-tokens` package.
- `packages/components` publishes the React 19 `@exre/exui` package.
- `packages/showcase` is private and must never be versioned or published.

The repository already uses Changesets with `main` as its base branch, independent package versions, patch updates for internal dependencies, and private-package versioning disabled. Both public package manifests are currently at `0.0.0`. The pending `exui-tokens-commonjs-entry.md` Changeset requests a minor release of `@exre/exui-tokens`; there is no initial Changeset for `@exre/exui` yet.

The existing `ci.yml` runs on pull requests and pushes to `main` using a GitHub-hosted Windows runner. It installs pnpm 11.9.0 and Node.js 24, then runs Token validation, type checking, linting, visual tests, the workspace build, and packed-consumer verification. Its latest runs fail because `packages/tokens/src/style.css` is stale relative to the Token CSS generator. Release automation must not be enabled by weakening or bypassing that check.

`caep-dev/exui` is a private organization repository. Its current GitHub plan does not permit branch protection or repository Rulesets for private repositories. The organization will be upgraded to GitHub Team before the protection design is activated. GitHub Actions currently has read-only default workflow permissions and cannot approve pull requests; those defaults are retained.

Neither `@exre/exui-tokens` nor `@exre/exui` currently exists on the public npm Registry. npm Trusted Publishing can only be configured for an existing package, so the initial `0.1.0` releases require a one-time interactive publication with npm two-factor authentication.

## Goals

1. Protect `main` from direct human pushes, force pushes, deletion, unreviewed changes, and failing CI.
2. Require an explicit Changeset decision for pull requests that modify either public package.
3. After a qualifying pull request is merged, consume all pending Changesets on the verified `main` commit without a separate Version PR.
4. Update only the affected public package manifests, internal dependency versions, and Changelogs according to Changesets.
5. Commit version changes back to protected `main` through a narrowly scoped release identity.
6. Publish missing package versions to the official npm Registry through OIDC without a long-lived npm write token.
7. Serialize releases, safely coalesce adjacent merges, and recover from interrupted or partially successful publication without creating another version bump.
8. Bootstrap both public packages at `0.1.0`, then keep their versions independent.

## Non-goals

- Creating a Changesets Version PR or adding a manual approval gate to normal post-bootstrap releases.
- Keeping the two public packages on the same version after `0.1.0`.
- Versioning or publishing the private root workspace or Showcase.
- Publishing from a self-hosted runner or a developer machine after bootstrap.
- Falling back from npm OIDC to an npm write token.
- Creating GitHub Releases or pushing durable release tags in the first iteration.
- Changing package APIs or component behavior except for regenerating the stale Token CSS artifact required to restore CI.
- Claiming npm provenance for this private repository; npm does not currently generate provenance for public packages published from private repositories.

## Selected Approach

Use a custom immediate-release workflow instead of the official Changesets Version PR flow.

The official flow is operationally safer because version changes receive a second pull-request review, but it does not meet the confirmed requirement that a qualifying merge publish without another merge. A tag-driven or manually dispatched release also fails that requirement. The selected workflow therefore accepts a narrow release-bot bypass and compensates with strict permissions, verified-input checks, compare-before-push behavior, serialized execution, and idempotent recovery.

## Repository Components

### Continuous integration workflow

`.github/workflows/ci.yml` remains the merge-quality authority. It retains the Windows runner and existing verification commands and adds a separate `changeset-policy` job. Its required status checks are uniquely named:

- `CI / verify`
- `CI / changeset-policy`

GitHub displays these as workflow/job pairs. The underlying job check names selected in the Ruleset are `verify` and `changeset-policy`; no other workflow may reuse either job name.

The workflow continues to run for pull requests and pushes to `main`. The current stale Token CSS failure is fixed by regenerating the checked-in CSS through the existing generator; the validation command remains unchanged.

### Release workflow

`.github/workflows/release.yml` is the only automated workflow allowed to version and publish packages after bootstrap. It runs on:

- successful completion of `CI` for a push to `main`; and
- `workflow_dispatch` for explicit recovery.

It uses a GitHub-hosted `windows-latest` runner, Node.js 24, and pnpm 11.9.0. A fixed `exui-main-release` concurrency group uses `cancel-in-progress: false`, so release jobs queue rather than cancel each other.

For a `workflow_run` event, the workflow accepts only the exact `CI` workflow, a successful conclusion, the `main` branch, the `caep-dev/exui` repository, and a head SHA that is still the remote `main` head before version preparation. A manually dispatched run first executes the same full repository validation against the current `main` head before it may plan or publish a release.

The workflow receives only `contents: read` and `id-token: write` through `GITHUB_TOKEN`. It obtains a short-lived installation token from the dedicated ExUI Release GitHub App for the one operation that requires `contents: write`.

### Changeset policy checker

`scripts/changeset-policy.mjs` evaluates the pull-request diff and added `.changeset/*.md` files. It has one responsibility: require an explicit release decision when a public package changes.

A pull request that changes any path under `packages/tokens` or `packages/components` must add at least one Changeset. A releasable change names one or both public packages with a valid `patch`, `minor`, or `major` bump. A documentation, test, build-only, or otherwise non-release change adds an empty Changeset. Changes to only the root orchestration layer, `.github`, `notes`, `skills`, or `packages/showcase` do not require a Changeset.

The checker rejects:

- missing Changesets for public-package changes;
- malformed frontmatter;
- unknown package names;
- selection of the private root or Showcase;
- invalid bump types; and
- a claimed empty Changeset that actually names a package.

### Release planner

`scripts/release/plan.mjs` wraps the Changesets status output and creates an in-memory plan containing the triggering SHA, pending Changeset filenames, affected packages, current versions, requested bumps, and dependency order. It does not edit manifests itself. `changeset version` remains the sole version and Changelog writer.

The planner distinguishes four modes:

- `version-and-publish`: pending non-empty Changesets exist;
- `consume-only`: pending Changesets exist but all are empty;
- `recovery-publish`: no pending release Changesets exist, but at least one current public version is explicitly absent from npm; and
- `no-op`: no pending release Changesets exist and all current public versions already exist on npm.

`consume-only` runs `changeset version` to delete the empty files, verifies that no package version or Changelog changed, and creates a DCO-signed `chore(release): consume empty changesets` commit. It never invokes npm publication. When empty and non-empty Changesets coexist, `version-and-publish` consumes all of them in the normal release commit.

### Registry status checker

`scripts/release/registry-status.mjs` queries only `https://registry.npmjs.org/` for an exact `package@version`. It classifies results as:

- published;
- explicitly not found through an authoritative npm `E404`; or
- indeterminate because of authentication, authorization, transport, timeout, rate-limit, server, or response-format failure.

Only an authoritative `E404` permits a publish attempt. An indeterminate result fails the workflow. This prevents a transient Registry problem from being interpreted as permission to republish.

### Package metadata

Both public package manifests add:

- an exact `repository.url` for `https://github.com/caep-dev/exui.git`; and
- `publishConfig.registry` set to `https://registry.npmjs.org/` while retaining public access.

These values satisfy npm Trusted Publishing repository matching and prevent a developer or runner-level mirror configuration from redirecting publication. The root and Showcase manifests remain private and are not added to the release set.

### Test documentation

Because the repository does not currently define dedicated release-automation tests, `TESTING.md` documents their location, naming convention, and commands. Deterministic Node tests cover the policy checker, planner, Registry classification, head-superseded behavior, and recovery decisions without contacting npm or mutating GitHub.

## Branch Protection and Ownership

After upgrading `caep-dev` to GitHub Team, configure a repository Ruleset targeting `main` with all of the following requirements:

1. Changes enter through a pull request.
2. At least one approving review is required.
3. Required checks are `CI / verify` and `CI / changeset-policy`.
4. The branch must be updated with the latest `main` before merge.
5. All review conversations must be resolved.
6. Linear history is required.
7. Force pushes and branch deletion are blocked.
8. Repository administrators are not broadly exempt.

`Xiamolc007` is promoted from read to write so the repository has an independent reviewer in addition to administrator `wojzj57`. `.github/CODEOWNERS` assigns release-critical paths to both `@wojzj57` and `@Xiamolc007`, and the Ruleset requires a Code Owner review for those paths. Release-critical paths include:

- `.github/workflows/ci.yml`;
- `.github/workflows/release.yml`;
- `.github/CODEOWNERS`;
- `.changeset/config.json`;
- the root release scripts and release tests;
- the root `package.json`; and
- both public package manifests.

The only Ruleset bypass actor is the dedicated ExUI Release GitHub App in `always` mode. The App is installed only on `caep-dev/exui` and receives only repository `Contents: write`. It receives no organization administration, pull-request approval, secret, workflow administration, issue, or package-registry permissions.

The release commit uses the Conventional Commit subject `chore(release): publish packages` and includes:

```text
Signed-off-by: exui-release[bot] <exui-release[bot]@users.noreply.github.com>
```

The App installation token is short-lived and is never written to logs or persisted beyond the job.

The App identifier is stored as the `EXUI_RELEASE_APP_ID` repository variable. Its private key is stored as the `EXUI_RELEASE_APP_PRIVATE_KEY` secret in the `npm-release` Environment. The workflow passes both only to the token-minting step and masks the resulting installation token.

## npm Authentication

Normal automated publication uses npm Trusted Publishing bound to all of the following claims:

- GitHub organization: `caep-dev`;
- repository: `exui`;
- workflow filename: `release.yml`;
- environment: `npm-release`; and
- allowed operation: direct `npm publish`.

The workflow job requests `id-token: write` and runs only on a GitHub-hosted runner. The `npm-release` GitHub Environment restricts deployments to `main` but has no required reviewer, preserving immediate post-merge publication.

No `NPM_TOKEN`, automation token, classic token, or granular write token is stored as a GitHub secret or accepted as a fallback. Read-only npm credentials are unnecessary because this workspace has no private npm dependencies.

The repository variable `NPM_RELEASE_AUTOMATION_ENABLED` gates only the npm publish operation. It starts unset or `false` during bootstrap. Version planning, validation, and the initial release commit may run while disabled, but the workflow must report that publication was intentionally skipped. The variable becomes `true` only after both Trusted Publisher relationships are configured.

## Normal Release Data Flow

1. A pull request changes a public package and adds a releasable or empty Changeset.
2. `CI / changeset-policy` validates the explicit release decision. `CI / verify` runs the existing repository gates.
3. The protected-branch requirements permit the reviewed pull request to merge.
4. The push to `main` runs CI again.
5. Successful CI completion triggers `release.yml` with the verified head SHA.
6. The release workflow acquires the global release concurrency group and fetches full `main` history.
7. It compares the remote `main` head with the triggering SHA. If they differ, it records `superseded` and exits without modifying or publishing anything.
8. The planner reads all pending Changesets on that SHA. Adjacent merges are intentionally allowed to coalesce into one release plan.
9. For `version-and-publish`, `changeset version` updates affected public manifests, internal dependency versions, package Changelogs, and removes consumed Changesets. For `consume-only`, it removes empty Changesets and asserts that package manifests and Changelogs are unchanged.
10. The versioned tree runs `pnpm tokens:check`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm verify:pack`. The visual suite was already required on the triggering Windows CI run and is not repeated after metadata-only versioning.
11. Immediately before push, the workflow fetches remote `main` again. If it moved, the generated changes are discarded with the ephemeral runner and the job records `superseded`; it does not rebase onto code that has not been verified by this event.
12. The GitHub App creates the release commit and pushes it as a fast-forward update to `main`.
13. Only after that push succeeds does the workflow query exact package versions and execute `changeset publish` through the official Registry for versions that are explicitly missing.
14. The workflow emits a structured summary containing the verified SHA, Changesets, version plan, release commit, already-published versions, newly published versions, skipped versions, and recovery guidance.

A push made with the GitHub App token triggers CI for the release commit. That run normally leads to a no-op release check. If the original publication failed after committing, the release commit's successful CI instead activates recovery mode.

## Concurrency and Merge Coalescing

The design does not promise one npm version per pull-request merge. It promises that every releasable Changeset reaching a green `main` is included exactly once in a later version commit.

If another pull request merges before the current release pushes its version commit, the compare-before-push check prevents an update based on stale `main`. The later commit's successful CI consumes all still-pending Changesets together. If another pull request merges after the release commit has been pushed, the current job may finish publishing its already committed versions while the later merge waits for its own serialized release.

No workflow performs force push, history rewrite, or automated rebase of a release commit.

## Failure Handling and Recovery

The release system is forward-only and idempotent:

- If planning or validation fails before a release commit, nothing is committed or published. A normal pull request fixes the problem.
- If `main` moves before the release commit, the run exits as superseded. A later green `main` run takes ownership of all pending Changesets.
- If the release commit succeeds but npm authentication or publication fails, the committed versions remain authoritative. They are not reverted or bumped again.
- On the release commit's next successful CI, recovery mode queries every public package's exact current version. It skips published versions and publishes only versions with an authoritative npm `E404`.
- If publication partially succeeds, dependency order ensures `@exre/exui-tokens` is attempted before a dependent `@exre/exui`. A retry does not attempt to overwrite the successful version.
- If Registry state is indeterminate, the workflow fails closed and does not publish.
- If OIDC fails, the workflow fails without token fallback.
- If a published artifact is defective, remediation requires a new Changeset and a higher version. npm versions are never overwritten or rolled back.

`workflow_dispatch` runs the full repository verification before invoking the same recovery planner, so it cannot bypass the green-code requirement.

## Initial `0.1.0` Bootstrap

The initial rollout is deliberately different because npm will not accept a Trusted Publisher configuration for a package that does not yet exist.

1. Upgrade `caep-dev` to GitHub Team.
2. Promote `Xiamolc007` to repository write access.
3. Create and install the dedicated ExUI Release GitHub App with only `Contents: write`.
4. Merge the implementation through a protected pull request while `NPM_RELEASE_AUTOMATION_ENABLED` is false.
5. Include a new minor Changeset for the initial `@exre/exui` release. Together with the existing Token minor Changeset, the release plan produces `@exre/exui-tokens@0.1.0` and `@exre/exui@0.1.0`.
6. Let the release workflow create the validated `0.1.0` version commit and intentionally skip npm publication.
7. Pause additional release-bearing merges until bootstrap is complete, preventing another version commit from overtaking unpublished `0.1.0` packages.
8. From the exact release commit, a maintainer with npm `@exre` publication rights and account-level 2FA runs the existing release command against `https://registry.npmjs.org/` and publishes both public packages.
9. Verify both exact `0.1.0` versions from the public Registry.
10. Configure a Trusted Publisher for each package using `caep-dev/exui`, `release.yml`, `npm-release`, and direct-publish permission.
11. Set `NPM_RELEASE_AUTOMATION_ENABLED=true` and resume merges.

The manual step is limited to the first `0.1.0` publication. Subsequent versions must use OIDC automation.

## Testing Strategy

### Deterministic tests

Node tests use fixtures and injected command results rather than live GitHub or npm calls. They cover:

- public-package path changes with missing, ordinary, multiple, malformed, and empty Changesets;
- private Showcase and root-only changes;
- independent package bumps and internal dependency propagation;
- no-op, consume-only, version-and-publish, and recovery-publish plans;
- consume-only invariants that prevent package version, Changelog, or publication changes;
- authoritative npm `E404` versus permission, timeout, rate-limit, server, and malformed-response failures;
- Token-before-Components ordering;
- remote-head equality and superseded runs; and
- repeated recovery planning after zero, one, or both packages already exist.

### Repository validation

The implementation must pass:

```bash
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm test:visual
pnpm build
pnpm verify:pack
```

Running the release-specific Node tests is added to the documented validation set and CI.

### Workflow contract checks

Static tests or structured inspection verify:

- exact trigger and repository guards;
- `cancel-in-progress: false` and one fixed release concurrency group;
- read-only default workflow permissions;
- `id-token: write` only on the release job;
- absence of an npm token fallback;
- official Registry pinning;
- GitHub App use only for the release commit; and
- no force-push or history-rewrite command.

### External acceptance

Repository implementation acceptance and live release acceptance are separate gates.

The bootstrap gate closes only when both `0.1.0` package versions are visible from the official npm Registry and match the committed package manifests. Trusted Publisher configuration may then be reported as configured, but the normal automated-publication gate remains open until the first real post-bootstrap Changeset is published successfully through OIDC. No empty or meaningless package release is created solely to test OIDC.

## Acceptance Criteria

The repository design is implemented when all of the following are true:

1. Existing CI is green without weakening the Token CSS freshness check.
2. Public-package pull requests cannot merge without an ordinary or explicit empty Changeset.
3. The private root and Showcase cannot appear in a release plan.
4. GitHub Team Ruleset protection matches the approved branch rules.
5. `Xiamolc007` has write access, and release-critical paths require review by `@wojzj57` or `@Xiamolc007`.
6. Only the dedicated GitHub App can bypass the pull-request requirement for the release commit.
7. Release jobs serialize, never cancel an active release, and refuse stale-head pushes.
8. Changesets independently update public manifests, internal dependencies, and Changelogs.
9. Both public manifests identify the exact GitHub repository and official npm Registry.
10. Publication cannot begin before the release commit is present on `main`.
11. Recovery publishes only exact versions proven absent by the official Registry.
12. No npm write token or OIDC fallback exists.
13. The current local validation commands and new release tests pass.
14. Both initial packages are manually published as `0.1.0`, then bound to `release.yml` through npm Trusted Publishing.
15. The first real post-bootstrap automated release supplies the final evidence that the OIDC runtime gate is closed.

## Risks and Mitigations

- **Protected-branch bypass broadens write authority:** only a dedicated repository-scoped GitHub App receives bypass and `Contents: write`; critical workflow paths require Code Owner review.
- **Immediate release removes a Version PR review:** version changes are deterministic Changesets output, validated after generation, committed only from a verified SHA, and visible in a dedicated release commit.
- **A new merge races the release commit:** the workflow compares remote `main` immediately before push and exits as superseded rather than rebasing or forcing.
- **One package publishes before another fails:** exact Registry reconciliation makes retries idempotent and dependency-aware.
- **A mirror redirects publication:** the official Registry is pinned in workflow queries and public package manifests.
- **Bootstrap creates a trust chicken-and-egg problem:** only `0.1.0` is published manually with 2FA; automation is enabled after both Trusted Publishers exist.
- **Required approval blocks a single maintainer:** `Xiamolc007` is promoted to write and shares release-critical ownership with `wojzj57` before the Ruleset is enforced.
- **Private-repository publication lacks npm provenance:** this limitation is documented and is not represented as a completed security property.

## Confirmed Decisions

- Upgrade `caep-dev` to GitHub Team and protect the private `main` branch.
- Publish immediately after a qualifying merge rather than use a Version PR.
- Keep package versions independent after the shared `0.1.0` bootstrap.
- Publish both public packages at `0.1.0` during the one-time manual bootstrap.
- Use npm Trusted Publishing through OIDC for all later releases.
- Allow only a dedicated, least-privilege GitHub App to bypass `main` for release commits.
- Serialize releases and allow adjacent merges to coalesce into one Changesets release.
- Fix the current stale Token CSS failure as a prerequisite.
- Require an ordinary or empty Changeset for every pull request that modifies a public package.
- Promote `Xiamolc007` to write access for independent review.
- Defer durable Git tags and GitHub Releases beyond the first implementation.

## References

- [GitHub: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub: Available rules for Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Changesets: Automating Changesets](https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [npm: Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/)
- [npm: Managing trusted publishing relationships](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
