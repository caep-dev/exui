// The published import order of `dist/docs/theme.css` is part of the public
// contract: the ExUI token sheet has to be present for Fumadocs' `--color-fd-*`
// mapping to resolve, and Fumadocs' colour sheet has to precede its preset.
// The placement step and the artifact check both read this single list so the
// contract cannot drift between them.
export const DOCS_THEME_IMPORTS = Object.freeze([
  "../tokens/style.css",
  "fumadocs-ui/css/shadcn.css",
  "fumadocs-ui/css/preset.css",
])

// Matches the `@import` specifiers of a stylesheet in source order.
export function extractCssImports(text) {
  return [...text.matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1])
}
