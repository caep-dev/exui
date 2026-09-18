/**
 * Pure contrast policy for the canonical token sources.
 *
 * The public recipe contract lets consumers pass their own semantic colours, so
 * it stays permissive. The built-in values are held to a guarantee instead:
 * every foreground this workspace can render keeps WCAG AA contrast (4.5:1)
 * against the background it is rendered on, in every theme.
 *
 * Two families are checked because they fail independently:
 *
 * - `<name>` / `<name>Foreground` pairs inside a theme, which also cover palette
 *   entries that no recipe happens to reference yet.
 * - Recipe state tuples (`background` + `foreground`), which cover what a
 *   component actually renders, including variant-specific overrides that never
 *   appear in the theme scales.
 *
 * Judging a translucent colour needs a backdrop, so the policy fixes one:
 * `transparent` and any `rgba()` background are composited over the theme's
 * `surface.background`. A translucent *foreground* is rejected outright, because
 * its contrast would depend on whatever ends up behind it rather than on the
 * token itself.
 *
 * Disabled states are exempt: WCAG 1.4.3 and 1.4.11 both exclude inactive
 * controls, which is what lets a disabled control look intentionally muted.
 *
 * Keeping the rules in a side-effect-free module lets the policy be exercised
 * with in-memory clones instead of rewriting real source files.
 */

/** Minimum contrast ratio for text, per WCAG 2.1 AA (1.4.3). */
export const MIN_TEXT_CONTRAST = 4.5

/** Recipe states that are allowed to fall below the text threshold. */
export const EXEMPT_STATE_NAMES = new Set(["disabled"])

const HEX_PATTERN = /^#([0-9a-f]{6})$/i
const FUNCTIONAL_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i
const TRANSPARENT = "transparent"

function isReference(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    (value.kind === "foundation" || value.kind === "semantic")
  )
}

function readPath(source, path) {
  let current = source
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      return undefined
    }
    current = current[segment]
  }
  return current
}

function parseColor(value) {
  if (typeof value !== "string") {
    return undefined
  }

  const hex = HEX_PATTERN.exec(value)
  if (hex) {
    return {
      red: Number.parseInt(hex[1].slice(0, 2), 16),
      green: Number.parseInt(hex[1].slice(2, 4), 16),
      blue: Number.parseInt(hex[1].slice(4, 6), 16),
      alpha: 1,
    }
  }

  const functional = FUNCTIONAL_PATTERN.exec(value)
  if (!functional) {
    return undefined
  }

  return {
    red: Number(functional[1]),
    green: Number(functional[2]),
    blue: Number(functional[3]),
    alpha: functional[4] === undefined ? 1 : Number(functional[4]),
  }
}

function composite(over, under) {
  const mix = (channel) => over[channel] * over.alpha + under[channel] * (1 - over.alpha)
  return {
    red: mix("red"),
    green: mix("green"),
    blue: mix("blue"),
    alpha: 1,
  }
}

function relativeLuminance(color) {
  const linear = (channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return (
    0.2126 * linear(color.red) + 0.7152 * linear(color.green) + 0.0722 * linear(color.blue)
  )
}

/** Contrast ratio between two opaque colours; always >= 1. */
export function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Resolve a theme colour entry to an opaque colour, recording whether the
 * source value was translucent so callers can reject that separately.
 *
 * `transparent` and translucent backgrounds resolve against `backdrop`.
 */
function resolveBackground(theme, value, backdrop) {
  if (value === TRANSPARENT) {
    return { color: backdrop }
  }

  const raw = isReference(value) ? readPath(theme, value.path) : value
  const parsed = parseColor(raw)
  if (!parsed) {
    return undefined
  }
  return { color: parsed.alpha === 1 ? parsed : composite(parsed, backdrop) }
}

function describe(value) {
  if (value === TRANSPARENT) {
    return TRANSPARENT
  }
  if (isReference(value)) {
    return value.path
  }
  return JSON.stringify(value)
}

/**
 * Collect every built-in foreground that fails to reach {@link MIN_TEXT_CONTRAST}
 * against the background it is rendered on.
 *
 * @returns {string[]} Human-readable violations; empty when the policy holds.
 */
export function collectColorContrastViolations({ contract, recipes }) {
  const failures = []

  for (const [themeName, theme] of Object.entries(contract.themes)) {
    const surfaceBackground = parseColor(theme.surface?.background)
    if (!surfaceBackground) {
      // A theme without an opaque page colour cannot be judged; the structural
      // contract checks own that failure.
      continue
    }

    const check = (label, foregroundValue, backgroundValue) => {
      const foreground = parseColor(
        isReference(foregroundValue) ? readPath(theme, foregroundValue.path) : foregroundValue
      )
      if (!foreground) {
        return
      }
      if (foreground.alpha !== 1) {
        failures.push(
          `${label} must use an opaque foreground; found ${describe(foregroundValue)}`
        )
        return
      }

      const background = resolveBackground(theme, backgroundValue, surfaceBackground)
      if (!background) {
        return
      }

      const ratio = contrastRatio(foreground, background.color)
      if (ratio < MIN_TEXT_CONTRAST) {
        failures.push(
          `${label} contrast is ${ratio.toFixed(2)}:1, below ${MIN_TEXT_CONTRAST}:1 ` +
            `(${describe(foregroundValue)} on ${describe(backgroundValue)})`
        )
      }
    }

    // 1. `<name>` / `<name>Foreground` pairs declared by the theme itself.
    for (const [scaleName, scale] of Object.entries(theme)) {
      if (scale === null || typeof scale !== "object") {
        continue
      }
      for (const [key, foregroundValue] of Object.entries(scale)) {
        if (!key.endsWith("Foreground") || typeof foregroundValue !== "string") {
          continue
        }
        const baseKey = key.slice(0, -"Foreground".length)
        const backgroundValue = scale[baseKey]
        if (typeof backgroundValue !== "string") {
          continue
        }
        check(`${themeName}.${scaleName}.${baseKey}`, foregroundValue, backgroundValue)
      }
    }

    // 2. Recipe states, which are what components actually render.
    const visitStates = (node, path) => {
      if (node === null || typeof node !== "object" || isReference(node)) {
        return
      }

      if ("background" in node && "foreground" in node) {
        const stateName = path.slice(path.lastIndexOf(".") + 1)
        if (!EXEMPT_STATE_NAMES.has(stateName)) {
          check(`${themeName}.${path}`, node.foreground, node.background)
        }
      }

      for (const [key, child] of Object.entries(node)) {
        visitStates(child, `${path}.${key}`)
      }
    }

    visitStates(recipes, "componentRecipes")
  }

  return failures
}
