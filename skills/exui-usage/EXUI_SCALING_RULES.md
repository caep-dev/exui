# ExUI Scaling Rules for React Development

Copy this entire file into an AI conversation or your project's AI instructions when asking for React components and content built with ExUI. It is self-contained and requires no access to the ExUI source repository.

## Goal

Build UI whose typography and geometry scale together when the application changes the root (`html`) font size. ExUI's scalable sizes use `rem`, calibrated against a 16px root. At a 20px root, a `1rem` length is 20 CSS pixels; at a 32px root, it is 32 CSS pixels.

Root-font scaling and viewport-driven layout are separate concerns. Changing the viewport does not automatically change the root font size. Preserve the product's layout requirements while making new components and content follow its existing root-font scale.

## Reuse the ExUI contract

- Check the installed `@exre/exui` version and its public types before choosing APIs. These rules assume a version that ships the rem sizing contract.
- Prefer existing ExUI React components, then semantic Tokens and CSS variables for custom content. Preserve their built-in scalable dimensions instead of overriding them with pixel values.
- Import React components from `@exre/exui` and load `@exre/exui/style.css` once in the application. It already includes Token and font CSS. Framework-neutral Tokens come from `@exre/exui/tokens`; use public entries rather than private `src/` or `dist/` paths.
- React component consumers install React 19 and React DOM 19 explicitly, plus matching React type packages for TypeScript. ExUI bundles its implementation libraries; consumers do not need separate Radix, Base UI, or Recharts installs to use ExUI components.
- Application layout needs the consuming project's own CSS or utility setup. ExUI's stylesheet does not promise arbitrary Tailwind utility classes. If utilities are available, inspect their resolved units, including arbitrary values, before relying on them for scaling.

## Choose units by purpose

| Purpose | Default rule |
| --- | --- |
| Font sizes and text line boxes | Reuse ExUI typography Tokens; otherwise use `rem` font sizes with a unitless line-height or a scalable Token line-height. |
| Padding, gaps, margins, icons, control geometry, ordinary radii | Prefer existing Tokens; use `rem` for new lengths that should follow the application scale. |
| Containers and available space | Use intrinsic sizing, Flex/Grid, `%`, or `fr` as appropriate. Use `rem` when a width or limit should itself scale. |
| Hairline borders and dividers | Keep fixed thicknesses such as `1px`; use semantic colors. |
| Focus rings, shadows, capsule radius | Preserve ExUI's existing fixed-pixel effects and `9999px` capsule radius. Do not mechanically convert them to rem. |
| Unitless properties and other semantics | Keep `0`, opacity, flex factors, aspect ratios, percentages, and `auto` in their intended form. Use `em` when deliberately relative to the local font, such as letter spacing. |
| Upstream pixel APIs and measurements | Honor the actual API contract; document the boundary instead of changing its units silently. |

Use `basePixels / 16` only to convert a measurement from a design calibrated at a 16px root: 24px becomes `1.5rem`, and 12px becomes `0.75rem`. This is an authoring conversion, not a reason to rewrite every pixel value in an existing application.

## React and CSS implementation

- In a React `style` object, numeric length values normally mean pixels: `padding: 16` is fixed. Use `padding: "1rem"` for a scalable length. Properties such as `lineHeight: 1.5`, `flexGrow: 1`, and `opacity: 0.8` are unitless and should remain numbers.
- Give custom icons and adjacent content scalable dimensions. For a standalone icon, use CSS dimensions such as `width: "1rem"` and `height: "1rem"`; preserve an ExUI control's own icon sizing when it already supplies it. General-purpose React icons should come from a directly installed `lucide-react` dependency.
- Let text wrap and containers grow where the product allows it. Use `min-width: 0` on shrinking Flex/Grid children and an intentional overflow policy for long content. Avoid fixed-pixel heights that clip text after scaling; even a rem height can clip multiple lines.
- Leave root-font ownership with the application. Reusable components must not set `html` font size, introduce a `62.5%` reset, or install a second scale multiplier. Keep the existing root-font choice; 16px is the design calibration, not a mandatory override of user preferences.
- Let CSS resolve rem lengths. Avoid implementing this contract with `transform: scale()`, CSS `zoom`, or a per-component resize listener. Those are different mechanisms and can change layout, positioning, or hit areas.

### Example: scalable content beside an ExUI control

This example needs no Tailwind setup. The new content uses rem lengths, the Button keeps ExUI's own styles, and the border stays 1px. The color variables come from the imported stylesheet.

```tsx
import { Button } from "@exre/exui"
import "@exre/exui/style.css"

export function ExportSummary() {
  return (
    <section
      aria-label="Export summary"
      style={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "32rem",
        padding: "1.5rem",
        border: "1px solid var(--exui-border-default)",
        borderRadius: "0.75rem",
        background: "var(--exui-surface-card)",
        color: "var(--exui-text-primary)",
        fontSize: "1rem",
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
        <div style={{ flex: "1 1 12rem", minWidth: 0, overflowWrap: "anywhere" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", lineHeight: 1.4 }}>Export ready</h2>
          <p style={{ margin: "0.5rem 0 0" }}>Your project files are ready to download.</p>
        </div>
        <Button asChild>
          <a href="/exports/latest">Download</a>
        </Button>
      </div>
    </section>
  )
}
```

## Respect fixed-size boundaries

- Numeric positioning props such as `sideOffset` and `alignOffset` retain their upstream pixel meaning. Do not multiply all such props by the root scale. If a custom requirement needs a scalable offset, explicitly convert at that API boundary and account for subsequent root-font changes.
- `getBoundingClientRect()` and computed pixel measurements are already resolved CSS pixels. Do not multiply them by the scale again. For a known rem Token string, pixels equal `Number.parseFloat(token) * rootFontSize`; verify the unit first. This formula does not handle `calc()`, percentages, or arbitrary CSS values.
- Sonner and Recharts internals have their own geometry and are outside ExUI's rem guarantee. ExUI's own chart legend, tooltip, and icon content scales; do not promise that every chart axis or toast dimension does too.
- Browser zoom is separate from changing the root font size. Fixed `1px` means one CSS pixel, not one physical device pixel or an exemption from browser zoom.

## Verify before reporting completion

1. Exercise the new UI at root font sizes of 16px, 20px, and 32px in a browser or isolated preview. Save and restore the application's original root styles after testing.
2. Wait for layout and size transitions to settle before checking computed lengths: a new `1.5rem` padding should be 24, 30, and 48 CSS pixels respectively; a `1px` border should remain 1 CSS pixel. Compare individual lengths rather than assuming the entire content box doubles when it includes fixed borders, wrapping, or available-space constraints.
3. Check long labels, multiple lines, adjacent controls and icons, and any portal content introduced by the task. Look for clipping, overlap, inaccessible actions, and unwanted page overflow at the supported viewport sizes.
4. Verify keyboard focus remains visible and controls remain usable. Retain intentional scrolling where the content needs it.
5. Report which scaling checks ran and any intentional pixel boundaries. If browser verification was unavailable, say so; type-checking alone does not establish visual scaling.
