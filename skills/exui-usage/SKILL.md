---
name: exui-usage
description: Guide external projects in choosing and using ExUI Tokens, component recipes, React components, and Lucide icons from the public @exre/exui package and its tokens subpath.
---

# ExUI Usage

Guide consuming projects through ExUI's public package entries. Do not use this skill for changes to ExUI's own package source.

## Choose the public contract

- For React UI, read the [generated component export inventory](references/generated/component-exports.md). When a linked component reference exists and concrete usage guidance is needed, read only that file under `references/components/`. Import components from `@exre/exui` and load `@exre/exui/style.css` once.
- For CSS Tokens, JavaScript Tokens, or component recipes, read [Token usage](references/token-usage.md). Tokens are framework-neutral and ship from `@exre/exui/tokens`; React is not required to use them. Read the [generated Token path inventory](references/generated/token-paths.md) only when exact paths or CSS custom-property names are needed.
- For icons in React consumers, read [Icon usage](references/icon-usage.md).

## Defaults

- Prefer theme semantic Tokens before component recipes or foundation Tokens.
- Prefer an existing `@exre/exui` React component over rebuilding it from `componentRecipes`.
- Prefer `lucide-react` for general-purpose React icons, subject to the documented narrow exceptions.
- Import only from the package root, its declared CSS subpaths, or the `@exre/exui/tokens` subpath. Never use package `src/`, `dist/`, or `types/` paths as consumer APIs.
- Do not import Token CSS or font CSS again when `@exre/exui/style.css` is already loaded; the component stylesheet includes both.
- Token consumers do not need React. Component consumers install React, React DOM, and their type packages themselves.
