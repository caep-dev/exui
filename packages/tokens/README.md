# @exre/exui-tokens

Framework-neutral visual tokens shared by Exre user interfaces.

```ts
import { exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/font.css"
import "@exre/exui-tokens/style.css"
```

The JavaScript entry has no React, DOM, storage, network, or global CSS side effects. CSS and font assets are available only through their explicit subpath exports.

## Accessibility baseline

Default text and primary or danger control text must maintain at least a 4.5:1 contrast ratio. Focus indicators must maintain at least 3:1 against the page background.

The initial migration intentionally replaces the previous light-on-blue primary text with a dark foreground, selects a contrast-safe foreground for each danger color, and replaces translucent focus rings with solid two-pixel rings. Other Light and Dark values continue to target the pre-migration computed-style baseline.
