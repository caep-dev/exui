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

The packed browser gate also compares Button geometry at 16px and 32px root font sizes, checks its fixed border and capsule radius, and checks portal Dialog padding at the larger root size.

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

`verify-examples.mjs --self-test` proves the gate rejects bad input on temporary copies: a forbidden import, an orphan example that no document links, a type-broken example (rejected by the real compiler with the diagnostic pointing at the broken file), and a dangling document link. The gate never writes inside the workspace. The updater `--check` validates directory coverage, relative links, and generated inventories across the skill documents without rewriting them; `--write` updates generated inventories only. These checks do not establish the factual accuracy of prose or compile Markdown code blocks. Review those against the public source and declarations separately.

CI runs all three commands after the workspace build. The toast API surface in examples is the nine-method list (`success`, `error`, `warning`, `info`, `message`, `loading`, `promise`, `custom`, `dismiss`); `toast.custom` accepts an `(id) => ReactElement` render function.

## Visual tests

The Showcase visual suite uses Vitest Browser Mode with Playwright Chromium. Baselines are platform-specific and CI runs them on Windows.

Build the workspaces before running visual tests: Showcase consumes the public component package's generated JavaScript and CSS entries.

```bash
pnpm build
pnpm test:visual
```

## Token checks

`pnpm tokens:check` builds the token entries, verifies ESM/CommonJS parity, regenerates and compares the stylesheet, and runs the token validation script. It finishes with the token behaviour tests:

```bash
pnpm tokens:check
```

- Token behaviour tests use Node's built-in test runner and live under `packages/tokens/scripts/` with the `*.test.mjs` suffix. `node --test "scripts/**/*.test.mjs"` runs them as the last step of `tokens:check`, so no separate command is needed.
- `packages/tokens/scripts/token-length-policy.mjs` holds the pure length policy: the public `RecipeLength` contract accepts rem, px, and `0`, while every built-in scalable length must be `rem` or `0`. Fixed-pixel exceptions (`radii.none`, `radii.full`, the menu separator thickness) are listed explicitly and must keep their exact values.
- Policy tests mutate in-memory clones of the built token tree; they never rewrite the real source files.

The Showcase scaling suite `packages/showcase/src/showcase/RemSizing.vrt.test.tsx` reuses the same Vitest Browser / Chromium setup as `ComponentRecipeContract.vrt.test.tsx`. It drives the root font size through 16px, 21.328px, and 32px, asserts computed geometry within 0.1 CSS px of the 16px baseline times the scale, and restores the root font size, theme, and injected styles after every case. It records no screenshots, so it adds no platform baselines.

## Full validation

```bash
pnpm install --frozen-lockfile
pnpm --filter @exre/exui-showcase exec playwright install chromium
pnpm release:verify
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
