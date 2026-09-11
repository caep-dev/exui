# Testing

Run validation from the repository root with pnpm 11.9.0 and Node.js 24.

## Release automation

Release automation tests use Node's built-in test runner and live under `scripts/release-bootstrap/*.test.mjs`. Test files use the `*.test.mjs` suffix. They use temporary local Git repositories and inject the npm Registry boundary; they must not publish packages, write GitHub state, or depend on live npm responses.

```bash
pnpm test:release
```

The suite covers no-op planning, scoped tags, release diff validation, annotated tag recovery and conflicts, npm Registry failures and idempotency, private-workspace exclusion, legacy tokens-tag rejection, and packed-manifest contracts. It never exercises a real npm publication.

Run `pnpm release:verify` to check the release declaration, Changesets configuration, quality scripts, and required provider workflows. Release setup and external activation are recorded in `notes/release-bootstrap-setup.md`.

## Packed-consumer gates

`pnpm verify:pack` packs the public `@exre/exui` tarball and installs it into throwaway fixtures outside the workspace, using default npm and pnpm peer behavior without `--legacy-peer-deps`, `--omit=peer`, or workspace overrides. The gates assert:

- tokens-only installs contain no React, React DOM, their type packages, or component implementation libraries anywhere in the dependency tree, and the font dependency installs;
- the tokens ESM and CommonJS entries agree, stay deeply frozen, and the component root fails with a missing-React error when React is absent;
- token-only TypeScript consumers compile under Bundler and NodeNext resolution with `skipLibCheck` disabled and no React types, covering both `.mts` and `.cts` consumers; the `.cts` fixture uses a typed `import = require`, asserts invalid properties and assignments are rejected, and checks that the CommonJS declaration entry was loaded;
- the tokens stylesheets build standalone with resolvable font assets and no component Tailwind styles;
- a React consumer type-checks public component imports with `skipLibCheck` disabled, produces a production build, renders Button, form, and Chart components on the server, and shares exactly one React instance with the package;
- the production build runs in Chromium: chart primitives imported through the root `Recharts` namespace render both data points, ExUI legend content, and tooltip values that change on hover; Dialog opens through its portal, the form submits, and Escape restores focus to the trigger.

The browser assertions live in `scripts/verify-react-browser.mjs` and run as part
of `pnpm verify:pack`. The controller reuses the Showcase's pinned Playwright
dependency, while the browser serves only the isolated consumer's built files.
Install Chromium before running the packed-consumer or visual gates:

```bash
pnpm --filter @exre/exui-showcase exec playwright install chromium
```

CI runs these gates on Node.js 24; local runs on older Node versions are informative but do not replace the CI gate.

## Skill example gates

The exui-usage skill ships complete, compilable examples under `skills/exui-usage/examples/`. Two scripts keep them honest:

```bash
node skills/exui-usage/scripts/update.mjs --self-test
node skills/exui-usage/scripts/update.mjs --check
node skills/exui-usage/scripts/verify-examples.mjs
```

`verify-examples.mjs` packs the public `@exre/exui` tarball, installs an isolated consumer outside the workspace (the tarball plus `react`, `react-dom`, and `lucide-react` only), and asserts:

- discovery: `examples/**/*.tsx` is collected recursively with no manual manifest; the directory contains only `.tsx` files and is never empty;
- import allowlist: examples may import only `react`, the public `@exre/exui` entries (`@exre/exui`, `@exre/exui/style.css`, and the `tokens` subpaths), and `lucide-react` (the documented consumer-side icon dependency). Private package paths and implementation libraries are rejected by a static scan and would also fail module resolution because the fixture installs only the allowlisted dependencies;
- documentation links: every example is linked from at least one skill document, and no document links to a missing example file;
- compilation: all examples compile in a single strict TypeScript pass (`skipLibCheck` disabled, Bundler resolution, `react-jsx`) against the packed tarball.

`verify-examples.mjs --self-test` proves the gate rejects bad input on temporary copies: a forbidden import, an orphan example that no document links, a type-broken example (rejected by the real compiler with the diagnostic pointing at the broken file), and a dangling document link. The gate never writes inside the workspace. The updater `--check` verifies the generated inventories and every human document — including `references/react-setup.md` and `references/theme-usage.md` — without rewriting them; `--write` is the only mode that updates generated files.

CI runs all three commands after the workspace build. The toast API surface in examples is the nine-method list (`success`, `error`, `warning`, `info`, `message`, `loading`, `promise`, `custom`, `dismiss`); `toast.custom` accepts an `(id) => ReactElement` render function.

## Visual tests

The Showcase visual suite uses Vitest Browser Mode with Playwright Chromium. Baselines are platform-specific and CI runs them on Windows.

Build the workspaces before running visual tests: Showcase consumes the public component package's generated JavaScript and CSS entries.

```bash
pnpm build
pnpm test:visual
```

## Full validation

```bash
pnpm install --frozen-lockfile
pnpm test:release
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
node skills/exui-usage/scripts/update.mjs --self-test
node skills/exui-usage/scripts/update.mjs --check
node skills/exui-usage/scripts/verify-examples.mjs
pnpm test:visual
pnpm verify:pack
git diff --check
```
