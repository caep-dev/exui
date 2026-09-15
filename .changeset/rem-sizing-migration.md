---
"@exre/exui": minor
---

- Component sizing is now published in `rem` against a 16px root font size instead of fixed pixels. Everything ExUI owns that describes scalable geometry — the density tokens, the body/small font sizes and line heights, the ordinary radii, and the six component recipes (`button`, `formControl`, `sidebarItem`, `menu`, `dialog`, `tabs`) — scales as a whole, so setting the application root font size resizes type, controls, spacing, icons, and radii together. ExUI does not set a root font size, does not declare a scale variable, and adds no runtime:  ```css
  html {
    font-size: 20px; /* every ExUI size grows by 20 / 16 */
  }
  ```

- The following remain fixed pixels on purpose and do not scale: hairline borders, dividers such as the menu separator (`1px`), focus rings, shadows (including the shadow tokens), and the `9999px` capsule radius. Third-party geometry that ExUI does not own is not covered either — Sonner internals and Recharts internals keep their own fixed sizes, and ExUI only guarantees its own legend, tooltip, and icon content. Numeric positioning props (`sideOffset`, `alignOffset`) keep their upstream pixel contract and are never multiplied by the root font size.

- This is an observable change for existing consumers on the default entry points. Token string values changed, for example `exuiTokens.density.standard.controlHeight` is now `"2.25rem"` instead of `"36px"`. Do not read those values with `parseFloat(token)` and treat the result as pixels: keep the unit and hand the string to CSS, or convert explicitly in the application with the current root font size. Applications whose root font size is not 16px will see a different component size after upgrading; set `html { font-size: 16px }` to keep the previous rendering.
