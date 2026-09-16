# ExUI Usage Skill Design

## Status

Approved design for a single external-consumer skill named `exui-usage`.

## Context

The repository currently has one `exui-components` skill that documents the React component package. It does not expose the public Token contract, its component references sometimes point consumers toward repository source paths, and it does not state a shared icon policy.

ExUI has two public consumer packages:

- `@exre/exui-tokens`: framework-neutral Token data, component recipes, types, CSS variables, and font CSS.
- `@exre/exui`: React 19 components and a stylesheet that already includes the Token and font CSS.

`@exre/exui-showcase` is private. It may supply examples during skill maintenance but is not a consumer API and must not be selected as skill content.

## Goal

Replace `exui-components` with one `exui-usage` skill that guides external projects in consuming the selected public packages. The skill must make the Token contract discoverable, preserve useful component guidance, and establish `lucide-react` as the preferred icon source.

## Non-goals

- Changing package source, public exports, Token values, component behavior, or the Showcase.
- Guiding contributors who modify ExUI internals.
- Publishing concrete Token values as a documentation snapshot.
- Adding another icon package or an ExUI-owned icon abstraction.
- Creating more than one skill.

## Selected Approach

Use a hybrid structure: human-authored decision guidance plus generated public-API inventories. Purely handwritten inventories are too prone to drift, while fully generated documentation cannot express selection rules, accessibility requirements, or meaningful component composition guidance.

The final skill layout is:

```text
skills/exui-usage/
├── SKILL.md
├── agents/openai.yaml
├── package-selection.json
├── scripts/update.mjs
└── references/
    ├── token-usage.md
    ├── icon-usage.md
    ├── generated/
    │   ├── token-paths.md
    │   └── component-exports.md
    └── components/
        ├── Button.md
        ├── Dialog.md
        └── ...
```

This remains one skill even though its instructions are split into routed reference files.

## Responsibilities

### Skill entrypoint

`SKILL.md` is concise and task-oriented. It must:

1. Determine whether the consumer needs a React component, CSS Token, JavaScript Token, or component recipe.
2. Route to only the relevant reference file.
3. Require imports from documented package entries rather than `src/`, `dist/`, or `types/` paths.
4. State the semantic-Token-first and Lucide-first defaults.
5. Link the component catalog without embedding every component detail in the entrypoint.

`agents/openai.yaml` uses `exui-usage` consistently in its display metadata and default invocation prompt.

### Package selection

`package-selection.json` records the two selected packages by workspace directory and public package name:

- `packages/tokens` / `@exre/exui-tokens`
- `packages/components` / `@exre/exui`

The updater must reject missing packages, mismatched names, packages marked `private`, and selection of `packages/showcase`. Selection is explicit so a future maintainer can see which packages define this skill without inferring it from generated Markdown.

### Human-authored references

`references/token-usage.md` explains installation, public entrypoints, selection order, theming, and when to use CSS variables, `exuiTokens`, or `componentRecipes`. It lists Token categories and links to the generated path inventory but does not copy current values.

`references/icon-usage.md` establishes the external React icon policy and accessible examples.

`references/components/` contains the existing component references after migration. Useful usage, composition, variant, size, and accessibility guidance is retained. Repository-relative source declarations such as `Source: src/...` are removed because they are not stable external consumer contracts.

### Generated references

`references/generated/token-paths.md` contains the complete public key paths exposed by `exuiTokens` and `componentRecipes`, plus the CSS custom-property names exposed by `@exre/exui-tokens/style.css`, grouped by their public hierarchy. It contains names and paths only, never resolved colors, lengths, shadows, font values, or other concrete Token values.

`references/generated/component-exports.md` contains the exports reachable from the `@exre/exui` package root, grouped into usable component families where applicable. It is an inventory, not a replacement for the curated component references.

Generated files carry a notice that they must be updated through `scripts/update.mjs`.

## Consumer Decision Flow

### React components

Consumers using an ExUI React component import from the package root and import the package stylesheet once:

```tsx
import "@exre/exui/style.css"
import { Button } from "@exre/exui"
```

The component stylesheet already includes `@exre/exui-tokens/style.css` and `@exre/exui-tokens/font.css`; the skill must not instruct React component consumers to import those files a second time.

### Framework-neutral Token use

Consumers that do not need the React package may use the Token package independently:

```ts
import { componentRecipes, exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/style.css"
```

`font.css` is imported separately only when the consumer wants the ExUI font assets.

The skill applies this selection order:

1. Prefer theme semantic Tokens for product UI: `surface`, `text`, `control`, `border`, `feedback`, `editor`, `chart`, `sidebar`, and theme `shadow`.
2. Use `componentRecipes` when a non-React consumer must reproduce an ExUI component's visual contract: `button`, `formControl`, `sidebarItem`, `menu`, `dialog`, or `tabs`.
3. Use `density`, `typography`, `radii`, and foundation `shadows` directly only when the semantic or recipe layers cannot express the requirement.
4. Do not copy concrete values into application code when a public Token path or CSS variable expresses the intent.

Consumers using an existing `@exre/exui` React component should configure or compose that public component rather than reconstructing it from `componentRecipes`.

## Icon Policy

External React consumers should use `lucide-react` by default. If Lucide provides an equivalent icon, the skill must not recommend another icon library or a hand-authored SVG.

Exceptions are allowed for brand logos, product-specific artwork, or concepts that Lucide does not represent. An exception does not add a second general-purpose icon system.

Examples and component guidance must enforce:

- Import named icons directly from `lucide-react`.
- Give icon-only interactive controls an accessible name, normally `aria-label`.
- Mark purely decorative icons with `aria-hidden="true"`.
- Avoid using an icon alone when its meaning is ambiguous without visible text.

## Update Data Flow

1. Load and validate `package-selection.json` against workspace package manifests.
2. Resolve only the selected packages' public root and CSS exports.
3. Enumerate the public Token and recipe key paths and the public CSS custom-property names without serializing their values.
4. Enumerate component-package root exports without treating private source subpaths as consumer entrypoints.
5. Build both generated Markdown documents in memory with deterministic sorting and formatting.
6. Validate generated inventories and all human-authored references.
7. Replace generated files only after every validation succeeds.

The updater must not rewrite `SKILL.md`, `token-usage.md`, `icon-usage.md`, or curated component references. A failed update exits nonzero and leaves the previous files intact.

## Migration

- Create `skills/exui-usage/` with the approved structure.
- Move and adapt useful component references from `skills/exui-components/refs/` into `references/components/`.
- Fix incomplete icon examples, including adding the `lucide-react` import when an icon is used.
- Remove repository-source guidance from external consumer references.
- Remove `skills/exui-components/` after the replacement is complete.
- Remove stale `exui-components` names and invocation prompts elsewhere in the repository.

No package implementation or public API changes are included.

## Validation and Acceptance Criteria

The work is accepted when all of the following are true:

1. `skills/` contains one ExUI skill, named `exui-usage`; `exui-components` no longer exists or appears in active guidance.
2. Package selection contains `tokens` and `components`, rejects the private Showcase, and agrees with both package manifests.
3. The generated Token inventory exactly covers the public `exuiTokens` and `componentRecipes` paths and the CSS custom-property names in `@exre/exui-tokens/style.css`, and contains no concrete Token values.
4. The generated component inventory agrees with the `@exre/exui` root export surface.
5. Every routed reference exists, and curated component documentation does not recommend private import paths.
6. Token guidance documents semantic-first selection, recipe boundaries, React stylesheet behavior, and framework-neutral entrypoints.
7. Icon guidance documents the Lucide-first rule, its narrow exceptions, and accessible icon-only and decorative examples.
8. Running the updater twice produces no second-run diff.
9. A simulated validation failure does not partially replace generated files.
10. Repository validation passes:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Because the work changes internal skill guidance rather than published package behavior, it does not require a Changeset. The design and later implementation remain uncommitted unless the user separately requests a commit.

## Risks and Mitigations

- **Public API drift:** generated inventories and deterministic update checks expose omissions instead of relying on manual review.
- **Generated content overwhelming the entrypoint:** detailed inventories remain in routed references; `SKILL.md` stays focused on decisions.
- **Consumers treating recipes as a second component API:** the decision flow limits recipes to non-React visual-contract reuse and prefers public React components when available.
- **Duplicate CSS imports:** the React path explicitly states that `@exre/exui/style.css` already includes Token and font CSS.
- **Icon policy becoming absolute:** narrow exceptions preserve brand and product-specific needs without introducing another default icon system.

## Confirmed Decisions

- Replace `exui-components` rather than keep two overlapping skills.
- Name the single replacement skill `exui-usage`.
- Select only the two public packages: Tokens and React components.
- Target external consuming projects, not ExUI internal contributors.
- Publish complete Token categories and paths without concrete values.
- Use a hybrid of curated guidance and generated inventories.
- Prefer Lucide icons with narrow brand, product-specific, or missing-icon exceptions.
- Do not modify package code or add a Changeset in this scope.
