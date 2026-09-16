# @exre/exui-tokens (internal workspace)

Framework-neutral visual tokens for Exre user interfaces. This workspace is private: it is the build location for token sources and validation, and its generated artifacts ship through the public `@exre/exui/tokens` subpath. It is not published to npm.

Inside this repository, the generated entries resolve through the workspace exports:

```ts
import { exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/font.css"
import "@exre/exui-tokens/style.css"
```

Consuming projects must use the public entries instead: `@exre/exui/tokens`, `@exre/exui/tokens/style.css`, and `@exre/exui/tokens/font.css`.

The JavaScript entry has no React, DOM, storage, network, or global CSS side effects. CSS and font assets are available only through their explicit subpath exports.

## Module formats

Both an ESM and a CommonJS build are generated from the same source. `import` and bundlers resolve the ESM entry; `require()` resolves the CommonJS entry under `dist/cjs`. Either way the exported token tree is identical and deeply frozen.

The CommonJS entry exists for runtimes that cannot load ESM, such as server builds compiled to CommonJS. It is a compatibility entry: it carries the same contract as the ESM entry and is covered by the package release gates, but it is re-evaluated for removal at the next major version once no supported consumer needs it.

The public copy of these artifacts is verified in the packed-consumer gates with a NodeNext CommonJS consumer.

## Length units

Scalable lengths are authored in `rem` against a 16px base: density geometry, the four body/small font-size and line-height Tokens, ordinary radii, and the length fields of every component recipe. Setting the application root font size rescales all of them together, and a 16px root font size reproduces the original pixel design exactly. Nothing in this workspace sets a root font size, and no scale variable or runtime listener is involved.

Fixed-pixel exceptions are intentional and machine-checked: `radii.none` is `0`, `radii.full` is `9999px`, `componentRecipes.menu.separator.thickness` is `1px`, and every shadow Token stays pixel-based. Recipe durations stay `ms`, `componentRecipes.menu.shortcut.letterSpacing` stays `em`, and `componentRecipes.menu.shortcut.marginInlineStart` stays `auto`.

`RecipeLength` accepts `${number}rem`, `${number}px`, and `"0"`, so consumer-authored recipes may keep passing pixel values even though the built-in values use `rem`.

## Accessibility baseline

Default text and primary or danger control text must maintain at least a 4.5:1 contrast ratio. Focus indicators must maintain at least 3:1 against the page background.

The initial migration intentionally replaces the previous light-on-blue primary text with a dark foreground, selects a contrast-safe foreground for each danger color, and replaces translucent focus rings with solid two-pixel rings. Other Light and Dark values continue to target the pre-migration computed-style baseline.
