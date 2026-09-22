/**
 * Environment check for the shared refraction filter.
 *
 * A URL reference inside a `backdrop-filter` chain is the one part of the
 * material that a browser can parse and then still drop, so the seed only
 * advertises the enhancement when the engine accepts the chain. The check is
 * deliberately a syntax acceptance test rather than a browser or version
 * allowlist: it reads no globals at import time and needs no maintenance when a
 * browser ships a new major version.
 *
 * It is not a security boundary and not a pixel test. An engine can accept the
 * chain and still fail to paint it, and because the reference shares a single
 * declaration with the blur there is no CSS available to fall back to in that
 * case. Only measured rendering establishes the enhancement; this check decides
 * whether to try, and the base material is what keeps an unenhanced surface
 * readable.
 */

/**
 * Simplest chain a browser must accept for the material's base layer.
 *
 * The terms mirror the shipped declaration with the `var()`s replaced by
 * literals, because a capability query cannot see through a custom property:
 * probing a shape the material never declares would prove nothing.
 */
const BASIC_CHAIN = "blur(1px) saturate(1.2) brightness(1)"

/**
 * The same chain plus an SVG reference, in the order the material declares them.
 *
 * The reference does not have to resolve for the check: this only asks whether
 * the engine keeps a URL function in a backdrop-filter chain.
 */
function referenceChain(reference: string): string {
  return `blur(1px) saturate(1.2) ${reference}`
}

/**
 * The slice of the CSS object model this check needs.
 *
 * Declared structurally rather than as `CSS`, because the package's TypeScript
 * configuration does not pull in the full DOM namespace and a server render has
 * no `CSS` at all.
 */
type CssSupports = {
  supports(property: string, value: string): boolean
}

/**
 * Whether the given document can render the SVG refraction filter.
 *
 * Both the standard and the prefixed property are tried, because an engine may
 * accept the chain on one and not the other. A missing `CSS.supports`, a
 * detached window, or a server render all report `false`, which leaves the
 * material with its CSS-only blur.
 */
export function supportsGlassRefraction(
  view: Window | undefined,
  reference: string
): boolean {
  const css = (view as { CSS?: CssSupports } | undefined)?.CSS
  if (css === undefined || typeof css.supports !== "function") {
    return false
  }

  const chain = referenceChain(reference)
  return (
    (css.supports("backdrop-filter", BASIC_CHAIN) && css.supports("backdrop-filter", chain)) ||
    (css.supports("-webkit-backdrop-filter", BASIC_CHAIN) &&
      css.supports("-webkit-backdrop-filter", chain))
  )
}
