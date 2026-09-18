---
"@exre/exui": minor
---

Adds `@exre/exui/docs/theme.css`, a theme contract for documentation sites built with Fumadocs UI.

- The stylesheet imports `@exre/exui/tokens/style.css`, then Fumadocs' own `css/shadcn.css` and `css/preset.css`, in that order. Fumadocs maps its own `--color-fd-*` names onto shadcn's short variables without fallbacks, so a site that loads only the Fumadocs sheets computes every docs colour to an unset custom property. Nothing errors; the page just renders unstyled. One import now replaces the three, in the order that works.
- The package names `fumadocs-ui` in no dependency field, so the sheet adds nothing to any consumer's dependency graph and the tokens-only install stays limited to `@exre/exui` and the font package. Install Fumadocs yourself, which a documentation site needs anyway; the sheet is verified against `^16.15.0`. This is a stylesheet subpath with no JavaScript entry, and ExUI re-exports no Fumadocs components.
- The sheet ships unprocessed, like Fumadocs' own `css/*` sheets, so the consumer's Tailwind build resolves the three imports. With no `fumadocs-ui` installed they fail loudly rather than producing an unstyled page.
- What it deliberately does not do. It aligns colour only: Fumadocs keeps its own radii, spacing, and motion, and it keeps its own `Tabs` and `Accordion`, whose APIs differ from ExUI's. It also does not arbitrate theme switching — drive `<html class="dark">` from one provider, because Fumadocs' `RootProvider` and ExUI's `ThemeProvider` both read and write the `theme` localStorage key, and only the former is hydration-safe.
