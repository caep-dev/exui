# @exre/exui-tokens

Framework-neutral visual tokens shared by Exre user interfaces.

```ts
import { exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/font.css"
import "@exre/exui-tokens/style.css"
```

The JavaScript entry has no React, DOM, storage, network, or global CSS side effects. CSS and font assets are available only through their explicit subpath exports.

## Module formats

Both an ESM and a CommonJS build are published from the same source. `import` and bundlers resolve the ESM entry; `require()` resolves the CommonJS entry under `dist/cjs`. Either way the exported token tree is identical and deeply frozen.

```js
const { exuiTokens } = require("@exre/exui-tokens")
```

The CommonJS entry exists for runtimes that cannot load ESM, such as server builds compiled to CommonJS. It is a compatibility entry: it carries the same contract as the ESM entry and is covered by the package release gates, but it is re-evaluated for removal at the next major version once no supported consumer needs it.

Consumers that cannot rely on a bundler should gate their release on the CommonJS entry actually loading:

```bash
node -e "const { exuiTokens } = require('@exre/exui-tokens'); if (!exuiTokens) process.exit(1)"
```

## Accessibility baseline

Default text and primary or danger control text must maintain at least a 4.5:1 contrast ratio. Focus indicators must maintain at least 3:1 against the page background.

The initial migration intentionally replaces the previous light-on-blue primary text with a dark foreground, selects a contrast-safe foreground for each danger color, and replaces translucent focus rings with solid two-pixel rings. Other Light and Dark values continue to target the pre-migration computed-style baseline.
