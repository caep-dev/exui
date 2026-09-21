/**
 * Pure glass-material policy for the canonical token sources.
 *
 * The glass material is the one token group whose generated CSS is not a plain
 * flattening of the source values: `foreground`, the danger base colour and the
 * inset edge are published as references to the Tokens they derive from, and
 * the danger interaction states are published as `color-mix()` over
 * `control.danger`. A literal copy renders identically, so nothing visual would
 * catch a source value and its emitted reference drifting apart — this policy
 * re-derives the expected emission from the contract instead.
 *
 * It also owns the guarantees the general contrast policy cannot reach. That
 * policy pairs `<name>` / `<name>Foreground` keys inside a theme and recipe
 * state tuples, so neither a `glass.foreground` beside a `glass.background` nor
 * the nested `glass.danger` group is judged by it. Here every glass state is
 * composited over the theme page colour and over the black and white extremes,
 * because a glass surface is rendered on whatever happens to be behind it.
 *
 * Keeping the rules in a side-effect-free module lets them be exercised with
 * in-memory clones instead of rewriting real source files.
 */

import { MIN_TEXT_CONTRAST, composite, contrastRatio, parseColor } from "./color-contrast-policy.mjs"
import { REM_LENGTH_PATTERN } from "./token-length-policy.mjs"

/** Glass leaves that are part of the public customisation surface. */
export const GLASS_PUBLIC_LEAVES = [
  "background",
  "foreground",
  "border",
  "shadow",
  "blur",
  "saturation",
]

/** Interaction backgrounds every glass material declares. */
export const GLASS_INTERACTION_LEAVES = [
  "hoverBackground",
  "activeBackground",
  "selectedBackground",
]

/** Interaction backgrounds plus the danger-only leaves. */
export const GLASS_DANGER_LEAVES = [
  "background",
  "foreground",
  "border",
  ...GLASS_INTERACTION_LEAVES,
  "fallbackBackground",
]

/** Opacity of each danger state, matching the RGBA the source declares. */
export const GLASS_DANGER_ALPHA = new Map([
  ["background", 0.9],
  ["hoverBackground", 0.94],
  ["activeBackground", 0.98],
  ["selectedBackground", 0.98],
])

/** The two extremes a glass surface can end up over, besides the page colour. */
const EXTREME_BACKDROPS = ["#000000", "#ffffff"]

const GLASS_VARIABLE_PREFIX = "--exui-glass-"
const SHADOW_SHAPE = /^inset 0 0 0 (\S+) (.+)$/

function requireStringLeaf(failures, label, value) {
  if (typeof value !== "string" || value.length === 0) {
    failures.push(`${label} must be a non-empty string; found ${JSON.stringify(value)}`)
    return false
  }
  return true
}

function requireColorLeaf(failures, label, value) {
  if (!requireStringLeaf(failures, label, value)) {
    return undefined
  }

  const parsed = parseColor(value)
  if (!parsed) {
    failures.push(`${label} is not a supported sRGB hex, rgb(), or rgba() color: ${value}`)
  }
  return parsed
}

/** Judge one foreground against a translucent background over one backdrop. */
function requireContrast(failures, label, foreground, background, backdrop) {
  const resolved = background.alpha === 1 ? background : composite(background, backdrop)
  const ratio = contrastRatio(foreground, resolved)

  if (ratio < MIN_TEXT_CONTRAST) {
    failures.push(
      `${label} contrast is ${ratio.toFixed(2)}:1, below ${MIN_TEXT_CONTRAST}:1 ` +
        `over backdrop (${backdrop.red}, ${backdrop.green}, ${backdrop.blue})`
    )
  }
}

function parseBackdrop(failures, label, value) {
  const parsed = parseColor(value)
  if (!parsed || parsed.alpha !== 1) {
    failures.push(`${label} must be an opaque colour to judge glass contrast: ${value}`)
    return undefined
  }
  return parsed
}

/** Validate the material's own shape, numbers, derivations, and lengths. */
function validateGlassShape(failures, themeName, theme, glass) {
  const label = `${themeName}.glass`

  if (glass === null || typeof glass !== "object") {
    failures.push(`${label} must be an object`)
    return
  }

  for (const leaf of [...GLASS_PUBLIC_LEAVES, ...GLASS_INTERACTION_LEAVES]) {
    if (!(leaf in glass)) {
      failures.push(`${label} is missing ${leaf}`)
    }
  }

  for (const leaf of ["background", "foreground", "border", "fallbackBackground", ...GLASS_INTERACTION_LEAVES]) {
    if (leaf in glass) {
      requireColorLeaf(failures, `${label}.${leaf}`, glass[leaf])
    }
  }

  if ("foreground" in glass && glass.foreground !== theme.text?.primary) {
    failures.push(
      `${label}.foreground must reuse text.primary (${theme.text?.primary}); found ${JSON.stringify(glass.foreground)}`
    )
  }

  if ("fallbackBackground" in glass) {
    const parsed = parseColor(glass.fallbackBackground)
    if (parsed && parsed.alpha !== 1) {
      failures.push(`${label}.fallbackBackground must be opaque; found ${glass.fallbackBackground}`)
    }
  }

  if (typeof glass.saturation !== "number" || !Number.isFinite(glass.saturation) || glass.saturation <= 0) {
    failures.push(`${label}.saturation must be a positive finite number; found ${JSON.stringify(glass.saturation)}`)
  }

  if (typeof glass.blur !== "string" || !REM_LENGTH_PATTERN.test(glass.blur)) {
    failures.push(`${label}.blur must be a rem length; found ${JSON.stringify(glass.blur)}`)
  }

  if (typeof glass.shadow !== "string") {
    failures.push(`${label}.shadow must be a string; found ${JSON.stringify(glass.shadow)}`)
  } else {
    const shape = SHADOW_SHAPE.exec(glass.shadow)
    if (!shape) {
      failures.push(`${label}.shadow must be an inset edge of the material's border colour; found ${JSON.stringify(glass.shadow)}`)
    } else {
      if (!REM_LENGTH_PATTERN.test(shape[1])) {
        failures.push(`${label}.shadow thickness must be a rem length; found ${shape[1]}`)
      }
      if (shape[2] !== glass.border) {
        failures.push(`${label}.shadow must reuse ${JSON.stringify(glass.border)}; found ${JSON.stringify(shape[2])}`)
      }
    }
  }
}

/** Validate the danger group's shape, base colour, and per-state opacities. */
function validateGlassDanger(failures, themeName, theme, glass) {
  const label = `${themeName}.glass.danger`
  const danger = glass.danger

  if (danger === null || typeof danger !== "object") {
    failures.push(`${label} must be an object`)
    return
  }

  for (const leaf of GLASS_DANGER_LEAVES) {
    if (!(leaf in danger)) {
      failures.push(`${label} is missing ${leaf}`)
    }
  }

  for (const leaf of GLASS_DANGER_LEAVES) {
    if (leaf in danger) {
      requireColorLeaf(failures, `${label}.${leaf}`, danger[leaf])
    }
  }

  const base = parseColor(theme.control?.danger)
  if (!base) {
    failures.push(`${themeName}.control.danger must be an opaque colour for the danger material`)
    return
  }

  // The danger states are published as `color-mix()` over this colour, so a
  // translucent base would silently reintroduce the transparency the states
  // already declare.
  if (base.alpha !== 1) {
    failures.push(`${themeName}.control.danger must be opaque for the danger material; found ${theme.control.danger}`)
  }

  if (danger.border !== theme.control.danger) {
    failures.push(`${label}.border must reuse control.danger (${theme.control.danger}); found ${JSON.stringify(danger.border)}`)
  }
  if (danger.fallbackBackground !== theme.control.danger) {
    failures.push(`${label}.fallbackBackground must reuse control.danger (${theme.control.danger}); found ${JSON.stringify(danger.fallbackBackground)}`)
  }
  if (danger.foreground !== theme.control.dangerForeground) {
    failures.push(`${label}.foreground must reuse control.dangerForeground (${theme.control.dangerForeground}); found ${JSON.stringify(danger.foreground)}`)
  }

  for (const [leaf, alpha] of GLASS_DANGER_ALPHA) {
    const state = parseColor(danger[leaf])
    if (!state) {
      continue
    }

    if (state.red !== base.red || state.green !== base.green || state.blue !== base.blue) {
      failures.push(
        `${label}.${leaf} must use the RGB of control.danger (${base.red}, ${base.green}, ${base.blue}); found (${state.red}, ${state.green}, ${state.blue})`
      )
    }
    if (Math.abs(state.alpha - alpha) > 1e-9) {
      failures.push(`${label}.${leaf} must use alpha ${alpha}; found ${state.alpha}`)
    }
  }
}

/**
 * Validate that the generated stylesheet publishes the glass material's public
 * variables and that every derived value stayed a reference.
 */
function validateGlassEmission(failures, contract, variables) {
  const lightGlass = contract.themes?.light?.glass
  const lightDanger = lightGlass?.danger

  for (const leaf of GLASS_PUBLIC_LEAVES) {
    const name = `${GLASS_VARIABLE_PREFIX}${leaf}`
    if (!(name in variables)) {
      failures.push(`${name} is not declared by the generated :root block`)
    }
  }

  if (typeof lightGlass?.foreground === "string") {
    const expected = "var(--exui-text-primary)"
    if (variables["--exui-glass-foreground"] !== expected) {
      failures.push(`--exui-glass-foreground must stay ${expected}; found ${JSON.stringify(variables["--exui-glass-foreground"])}`)
    }
  }

  const shape = typeof lightGlass?.shadow === "string" ? SHADOW_SHAPE.exec(lightGlass.shadow) : undefined
  if (shape) {
    const expected = `inset 0 0 0 ${shape[1]} var(--exui-glass-border)`
    if (variables["--exui-glass-shadow"] !== expected) {
      failures.push(`--exui-glass-shadow must stay ${expected}; found ${JSON.stringify(variables["--exui-glass-shadow"])}`)
    }
  }

  if (lightDanger) {
    const references = new Map([
      ["--exui-glass-danger-foreground", "var(--exui-control-danger-foreground)"],
      ["--exui-glass-danger-border", "var(--exui-control-danger)"],
      ["--exui-glass-danger-fallback-background", "var(--exui-control-danger)"],
    ])

    for (const [name, expected] of references) {
      if (variables[name] !== expected) {
        failures.push(`${name} must stay ${expected}; found ${JSON.stringify(variables[name])}`)
      }
    }

    for (const [leaf, alpha] of GLASS_DANGER_ALPHA) {
      const name = `--exui-glass-danger-${leaf.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
      const expected = `color-mix(in srgb, var(--exui-control-danger) ${Math.round(alpha * 100)}%, transparent)`
      if (variables[name] !== expected) {
        failures.push(`${name} must stay ${expected}; found ${JSON.stringify(variables[name])}`)
      }
    }
  }
}

/**
 * Collect every glass-material violation of the contract and of the generated
 * stylesheet.
 *
 * @returns {string[]} Human-readable violations; empty when the policy holds.
 */
export function collectGlassViolations({ contract, variables }) {
  const failures = []

  for (const [themeName, theme] of Object.entries(contract.themes)) {
    const glass = theme.glass
    validateGlassShape(failures, themeName, theme, glass)

    if (glass === null || typeof glass !== "object") {
      continue
    }

    validateGlassDanger(failures, themeName, theme, glass)

    const backdrops = [
      parseBackdrop(failures, `${themeName}.surface.background`, theme.surface?.background),
      ...EXTREME_BACKDROPS.map((value) => parseColor(value)),
    ].filter(Boolean)

    const foreground = parseColor(glass.foreground)
    if (!foreground) {
      continue
    }

    if (foreground.alpha !== 1) {
      failures.push(`${themeName}.glass.foreground must be opaque; found ${glass.foreground}`)
      continue
    }

    const neutralStates = [["background", glass.background], ...GLASS_INTERACTION_LEAVES.map((leaf) => [leaf, glass[leaf]])]
    for (const [stateName, value] of neutralStates) {
      const state = parseColor(value)
      if (!state) {
        continue
      }

      for (const backdrop of backdrops) {
        requireContrast(failures, `${themeName}.glass.${stateName}`, foreground, state, backdrop)
      }
    }

    const dangerForeground = parseColor(glass.danger?.foreground)
    if (dangerForeground) {
      if (dangerForeground.alpha !== 1) {
        failures.push(`${themeName}.glass.danger.foreground must be opaque; found ${glass.danger.foreground}`)
      } else {
        for (const [stateName, value] of neutralStates.map(([leaf]) => [leaf, glass.danger[leaf]])) {
          const state = parseColor(value)
          if (!state) {
            continue
          }

          for (const backdrop of backdrops) {
            requireContrast(failures, `${themeName}.glass.danger.${stateName}`, dangerForeground, state, backdrop)
          }
        }
      }
    }

    // Readable fallbacks: the opaque material used when backdrop blur is unavailable.
    for (const [label, fg, bg] of [
      [`${themeName}.glass.fallbackBackground`, foreground, glass.fallbackBackground],
      [`${themeName}.glass.danger.fallbackBackground`, dangerForeground, glass.danger?.fallbackBackground],
    ]) {
      const backdrop = parseColor(bg)
      if (!fg || !backdrop) {
        continue
      }
      if (backdrop.alpha !== 1) {
        failures.push(`${label} must be opaque`)
        continue
      }

      const ratio = contrastRatio(fg, backdrop)
      if (ratio < MIN_TEXT_CONTRAST) {
        failures.push(`${label} contrast is ${ratio.toFixed(2)}:1, below ${MIN_TEXT_CONTRAST}:1`)
      }
    }
  }

  validateGlassEmission(failures, contract, variables)

  return failures
}
