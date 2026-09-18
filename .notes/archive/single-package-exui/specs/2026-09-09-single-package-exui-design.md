# Single-package ExUI distribution

Status: written design for review. Public entrypoints were approved in conversation;
the dependency-packaging strategy below requires review before RFC drafting.

## Goal and confirmed scope

Publish only `@exre/exui`. Components remain at the package root. Framework-neutral
tokens move to `@exre/exui/tokens`. A fresh consumer must be able to install the
package and use tokens without installing React, React DOM, or their type packages.
Do not publish or enable automated publication during this migration.

## Repository evidence

- Neither public package has been published; both manifests currently say 0.0.0.
- `packages/components/package.json` has mandatory React component dependencies,
  including radix-ui, recharts and @base-ui/react. Their installed manifests have
  non-optional React peers. Making only ExUI's peers optional is insufficient.
- `packages/components/vite.config.ts` currently externalizes those libraries.
- Component declarations currently retain third-party module references.
- `packages/tokens` produces independent ESM, CommonJS, declarations and CSS.
- `scripts/package-contract.mjs`, release hooks, packed-consumer verification,
  pending Changesets and `skills/exui-usage` currently assume two public packages.

## Public contract

| Entry | Contract |
| --- | --- |
| `@exre/exui` | Existing React 19 component exports; ESM and component declarations |
| `@exre/exui/style.css` | Existing complete component styles, including tokens and fonts |
| `@exre/exui/tokens` | Existing token values, recipes and types; ESM and CommonJS |
| `@exre/exui/tokens/style.css` | Token CSS only, without component styles or React |
| `@exre/exui/tokens/font.css` | Opt-in font CSS and resolvable font assets |

Keep token object shape, deep freezing, themes, recipe variables and component
behavior unchanged. Token declarations must never reference the component root,
React, React DOM, or component implementation dependencies. Do not add public root
CommonJS component support as part of this migration.

## Alternatives and decision

1. Keep mandatory component dependencies and make only React optional: rejected.
   Transitive peers can still install React and violate the installation contract.
2. Move every component library to optional peers: technically isolates tokens,
   but requires component consumers to install and coordinate many implementation
   libraries. This weakens the simple component installation experience.
3. Bundle component implementation dependencies into the component artifacts and
   remove their runtime dependency edges from the published manifest: recommended.
   Keep React and React DOM external as optional peers; component consumers install
   those two host runtimes explicitly. This preserves a simple component install.

Bundling means compiled library code, not npm bundledDependencies: shipping nested
node_modules and their manifests does not establish the same dependency boundary.
Retain only independently verified framework-neutral mandatory dependencies (for
example font assets, if not copied into the artifact). Keep build dependencies in
development manifests. Audit transitive externals, including React subpaths and
React host/runtime helpers; do not accidentally bundle React itself.

## Build and declarations

Keep `packages/tokens` as a private internal workspace to preserve its generator
and independent validation. Copy its generated artifacts into the public package
as part of the ordered build. No public dependency on @exre/exui-tokens may remain.
Generated outputs are never edited by hand. Component builds must retain existing
CSS behavior and sourceless consumer compatibility.

Bundle or otherwise internalize component declarations together with third-party
types so consumers do not need unpublished/internal workspaces or implementation
libraries merely to type-check components. React type packages remain development
requirements for TypeScript component consumers, not token consumers. Preserve
public prop types; do not substitute any or enable skipLibCheck to hide failures.

Preserve third-party licenses and required notices in the tarball. Verify module
boundaries and tree shaking; consumers who already use the same component libraries
may download duplicate implementation code and may not share their contexts with
the bundled copies. Direct composition with external primitive providers is not
assumed compatible without tests and must be documented if unsupported.

## Release and migration

- Make tokens private and restrict public package contracts to @exre/exui.
- Retarget pending token Changesets to @exre/exui, preserving release-note content.
  Keep the first public version at 0.1.0; do not apply versioning in this change.
- Retain workspace-style annotated tags: @exre/exui@<version>.
- Remove token tag publication and token-before-components registry waiting.
- Preserve release commit validation, main ancestry, tag conflict handling,
  idempotent publication and OIDC. Only one npm Trusted Publisher is needed.
- Update maintained package docs, AGENTS.md, TESTING.md, Showcase imports and the
  external exui-usage skill plus generated inventories. Preserve historical notes
  and unrelated untracked material. Edit the pending initial Changeset only as
  required by the approved migration; do not silently publish or commit it.

## Acceptance gates

1. Build and inspect the actual public tarball; only @exre/exui is publishable.
2. In isolated directories outside the workspace, install that tarball with npm
   and pnpm default peer behavior. No workspace links, overrides, --legacy-peer-deps,
   --omit=peer or auto-install disabling may mask dependencies.
3. Before importing tokens, assert React, React DOM, React type packages and
   component-only libraries are not installed. Verify token ESM/CJS parity,
   deep freezing and all existing token invariants.
4. Compile token-only consumers using TypeScript Bundler and NodeNext resolution,
   without React types and with skipLibCheck disabled. Build token/font CSS with
   assets resolved and no component CSS introduced.
5. Separately install the same tarball with React 19, React DOM and their types.
   Type-check public component imports and build/render representative components,
   including dialog/portal, form and chart behavior. Verify React stays external.
6. Pass tokens:check, typecheck, lint, build, Windows visual tests, packed-consumer
   checks, release:verify, release tests and exui-usage self-tests.
7. Confirm single-package planning, private-token exclusion, tag validation and
   publication retry behavior through tests. Verify clean CI on the final revision.

## Risks and implementation boundary

This is a package distribution migration, not a rename-only patch. Bundled types,
third-party notices, duplicate contexts and package size require implementation
validation. No bundle-size number or npm runtime acceptance is claimed yet.
If bundling cannot preserve the documented component API, return the concrete
incompatibility for review rather than silently weaken the token isolation goal.

After written-design approval, draft the implementation RFC under `notes/rfcs/`.
Commit, push, first npm publication and enabling release automation are separate
delivery actions; none is part of this design work.
