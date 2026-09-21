/**
 * Internal helpers for the shared glass material.
 *
 * One marker class enables the material everywhere, so a plain `div` with
 * `className="ex-glass"` behaves identically to a component that exposes the
 * `glass` prop. The prop is therefore a boolean that only decides whether the
 * marker is added; it is never forwarded to the DOM.
 *
 * The module stays free of browser globals so it can be imported from a server
 * render and from the package root without touching `window`.
 */

/** Class that turns any element into a glass surface. */
export const GLASS_CLASS_NAME = "ex-glass"

/** Marks a surface that already has its own interaction states. */
export const GLASS_INTERACTIVE_ATTRIBUTE = "data-exui-glass-interactive"

/** Marks the surface as carrying danger semantics. */
export const GLASS_TONE_ATTRIBUTE = "data-exui-glass-tone"

/** Marks a surface whose material is drawn by one of its own children. */
export const GLASS_DELEGATE_ATTRIBUTE = "data-exui-glass-delegate"

/**
 * Private variable the seed sets on the document root once the shared
 * refraction filter is usable. Consumers never write it.
 */
export const GLASS_REFERENCE_VARIABLE = "--_exui-glass-reference"

/** Danger semantics for a glass surface. */
export type GlassTone = "danger"

/**
 * Props every glass-capable surface merges into its own props.
 *
 * Glass is opt-in and boolean rather than a variant: components keep their
 * existing variants, sizes, and states, and the material only decides how the
 * surface behind them is painted.
 */
export type GlassSurfaceProps = {
  glass?: boolean
}

/** The marker to add for `glass`, or `undefined` when the prop is off. */
export function glassClassName(glass: boolean | undefined): string | undefined {
  return glass ? GLASS_CLASS_NAME : undefined
}

/**
 * Whether a class list carries the marker as a whole token.
 *
 * `ex-glass-foo` is a different class and must not enable the material, so the
 * list is split rather than substring-searched.
 */
export function hasGlassClassName(className: string | undefined): boolean {
  return className !== undefined && splitClassList(className).includes(GLASS_CLASS_NAME)
}

/** The class list without the marker; every other token is preserved. */
export function stripGlassClassName(className: string | undefined): string | undefined {
  if (className === undefined || !hasGlassClassName(className)) {
    return className
  }

  const remaining = splitClassList(className).filter((token) => token !== GLASS_CLASS_NAME)
  return remaining.length > 0 ? remaining.join(" ") : undefined
}

/**
 * Whether the caller asked for the material, through the prop or the class.
 *
 * Both entry points have to behave the same on a surface that has to switch
 * something else off when the material is on, so the two are decided in one
 * place instead of at each call site.
 */
export function requestsGlass(
  glass: boolean | undefined,
  className: string | undefined
): boolean {
  return glass === true || hasGlassClassName(className)
}

/**
 * Move the marker from a class list to the slot that actually paints.
 *
 * Surfaces such as the native select keep the caller's `className` on their
 * wrapper for layout, so the marker has to be pulled out and applied to the
 * element that owns the background instead of being added twice.
 */
export function migrateGlass(
  glass: boolean | undefined,
  className: string | undefined
): { className: string | undefined; glassClassName: string | undefined } {
  return {
    className: stripGlassClassName(className),
    glassClassName: requestsGlass(glass, className) ? GLASS_CLASS_NAME : undefined,
  }
}

function splitClassList(className: string): string[] {
  return className.split(/\s+/).filter((token) => token.length > 0)
}
