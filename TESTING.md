# Testing

Run validation from the repository root with pnpm 11.9.0 and Node.js 24.

## Release automation

Release automation tests use Node's built-in test runner and live under `scripts/release-bootstrap/*.test.mjs`. Test files use the `*.test.mjs` suffix. They use temporary local Git repositories and inject the npm Registry boundary; they must not publish packages, write GitHub state, or depend on live npm responses.

```bash
pnpm test:release
```

The suite covers no-op planning, scoped tags, release diff validation, annotated tag recovery and conflicts, npm Registry failures and idempotency, private-workspace exclusion, legacy tokens-tag rejection, and packed-manifest contracts. It never exercises a real npm publication.

Run `pnpm release:verify` to check the release declaration, Changesets configuration, quality scripts, and required provider workflows. Release setup and the external activation requirements are recorded in the archived release-automation design under `.notes/archive/automated-npm-release/`.

## Packed-consumer gates

`pnpm verify:pack` packs the public `@exre/exui` tarball and installs it into throwaway fixtures outside the workspace, using default npm and pnpm peer behavior without `--legacy-peer-deps`, `--omit=peer`, or workspace overrides. The gates assert:

- tokens-only installs contain no React, React DOM, their type packages, or component implementation libraries anywhere in the dependency tree, and the font dependency installs;
- the tokens ESM and CommonJS entries agree, stay deeply frozen, and the component root fails with a missing-React error when React is absent;
- token-only TypeScript consumers compile under Bundler and NodeNext resolution with `skipLibCheck` disabled and no React types, covering both `.mts` and `.cts` consumers; the `.cts` fixture uses a typed `import = require`, asserts invalid properties and assignments are rejected, and checks that the CommonJS declaration entry was loaded;
- the tokens stylesheets build standalone with resolvable font assets and no component Tailwind styles;
- a React consumer type-checks public component imports with `skipLibCheck` disabled, produces a production build, renders `GlassSeed`, the form, and Chart components on the server, and shares exactly one React instance with the package. Its `glass-types.tsx` fixture pins the glass prop's shape with `@ts-expect-error` cases — a non-boolean `glass`, `glass` on a DOM element, and children on `GlassSeed` — so widening the prop, leaking it onto an intrinsic element, or making the seed accept content turns the gate red instead of passing silently;
- the production build runs in Chromium: chart primitives imported through the root `Recharts` namespace render both data points, ExUI legend content, and tooltip values that change on hover; Dialog opens through its portal, the form submits, and Escape restores focus to the trigger; and the packed stylesheet ships the glass material, checked through computed styles only — the seed declares exactly one filter under the documented id and publishes its reference on the document root, the `ex-glass` class paints a blurring backdrop on an element that is not an ExUI component, the danger surface keeps the danger material, the edge adds no border width, and the `glass` prop leaves no DOM attribute. These read computed styles; they do not judge how the refraction renders.

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
- `packages/tokens/scripts/foundation-reference-policy.mjs` holds the pure foundation-reference policy: the foundation variable map must cover the contract's `radii`, `typography`, and `shadows` leaves exactly, every named variable must be declared in the generated `:root` with the contract value, no recipe variable may reference an undeclared variable, and each foundation reference must appear as `var(--exui-…)` exactly as many times as the recipe tree references it — so a recipe that quietly falls back to a literal value turns `tokens:check` red.
- `packages/tokens/scripts/glass-policy.mjs` holds the pure glass-material policy. The glass group is the one place where the stylesheet is not a plain flattening of the source values: `foreground`, the danger base colour, and the inset edge are published as references to the Tokens they derive from, and the danger states as `color-mix()` over `control.danger`. Nothing visual would catch a source value and its emitted reference drifting apart, so the policy re-derives the expected emission from the contract. It also owns the guarantees the general contrast policy cannot reach, because that policy pairs `<name>`/`<name>Foreground` keys and recipe state tuples and therefore sees neither `glass.foreground` beside `glass.background` nor the nested `glass.danger` group. Every material state is judged over the theme page colour and over the black and white extremes, since a glass surface renders on whatever is behind it.
- Policy tests mutate in-memory clones of the built token tree; they never rewrite the real source files.

The Showcase scaling suite `packages/showcase/src/showcase/RemSizing.vrt.test.tsx` reuses the same Vitest Browser / Chromium setup as `ComponentRecipeContract.vrt.test.tsx`. It drives the root font size through 16px, 21.328px, and 32px, asserts computed geometry within 0.1 CSS px of the 16px baseline times the scale, and restores the root font size, theme, and injected styles after every case. It records no screenshots, so it adds no platform baselines.

`packages/showcase/src/showcase/Glass.vrt.test.tsx` verifies the glass material through computed styles rather than pixels, and also records no screenshots. It checks that the marker lands on the slot that actually paints for each composition surface, that the prop never reaches the DOM, that geometry, clipping, and stacking are untouched, that only surfaces with existing pointer feedback switch material, that danger and focus/invalid states survive, and that a nested surface does not inherit the outer surface's run-time variables. Its lifecycle cases cover the seed's mount, unmount, remount, and Strict Mode behaviour, a host-owned value being restored instead of cleared, and the negative capability path — that case stubs `CSS.supports` and asserts the base blur survives with no filter URL in the chain, so a stub that silently fails is caught by its own guard.

These assertions do not establish how the refraction renders. No suite in this repository compares the enhanced output against the base output pixel by pixel, so the enhancement's rendering is unverified and claims about it must stay out of release notes.

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
