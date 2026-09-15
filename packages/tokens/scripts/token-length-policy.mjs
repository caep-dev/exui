/**
 * Pure length policy for the canonical token sources.
 *
 * Two separate guarantees live here, deliberately kept apart:
 *
 * - The public recipe contract stays permissive. `RecipeLength` accepts finite
 *   rem and px values plus `0`, so consumers can keep passing custom px values.
 * - The built-in values shipped by this workspace are strict. Every scalable
 *   length must be rem or `0` at the 16px base, and the fixed-pixel exceptions
 *   are listed explicitly instead of being waved through by a broad px permit.
 *
 * Keeping the rules in a side-effect-free module lets the built-in policy be
 * exercised with in-memory clones instead of rewriting real source files.
 */

const FINITE_DECIMAL = String.raw`-?(?:\d+(?:\.\d+)?|\.\d+)`

/** Finite decimal rem length, for example `0.75rem` or `-0.3125rem`. */
export const REM_LENGTH_PATTERN = new RegExp(`^${FINITE_DECIMAL}rem$`)

/** CSS lengths accepted by the public recipe contract: rem, px, or `0`. */
export const CONTRACT_LENGTH_PATTERN = new RegExp(`^(?:${FINITE_DECIMAL}(?:px|rem)|0)$`)

/** The unitless zero length shared by both policies. */
export const ZERO_LENGTH = "0"

/** Recipe fields typed as `RecipeLength` in the public contract. */
export const RECIPE_LENGTH_FIELDS = new Set([
  "height",
  "minHeight",
  "padding",
  "paddingInline",
  "paddingBlock",
  "gap",
  "iconSize",
  "thickness",
  "marginBlock",
  "marginInlineStart",
  "backdropBlur",
  "top",
  "right",
  "offset",
  "radius",
  "fontSize",
  "lineHeight",
])

/** Foundation length fields that must scale with the root font size. */
export const SCALABLE_TYPOGRAPHY_FIELDS = [
  "bodyFontSize",
  "bodyLineHeight",
  "smallFontSize",
  "smallLineHeight",
]

/** Radii that intentionally keep a fixed value. */
export const FIXED_RADII = new Map([
  ["none", ZERO_LENGTH],
  ["full", "9999px"],
])

/**
 * Built-in recipe lengths that intentionally stay in fixed pixels, keyed by
 * their exact leaf path. Anything not listed here must have been converted.
 */
export const FIXED_RECIPE_LENGTHS = new Map([
  ["componentRecipes.menu.separator.thickness", "1px"],
])

/** A usable CSS length for the public contract, including unitless zero. */
export function isContractLength(value) {
  return typeof value === "string" && CONTRACT_LENGTH_PATTERN.test(value)
}

/** A length that scales with the root font size: rem or unitless zero. */
export function isScalableLength(value) {
  return typeof value === "string" && (value === ZERO_LENGTH || REM_LENGTH_PATTERN.test(value))
}

function isReference(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    (value.kind === "foundation" || value.kind === "semantic")
  )
}

function resolveFoundationValue(contract, path) {
  let current = contract
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      return undefined
    }
    current = current[segment]
  }
  return typeof current === "string" ? current : undefined
}

function requireScalable(failures, label, value) {
  if (isScalableLength(value)) {
    return
  }

  failures.push(
    `${label} must be a rem length or 0 at the 16px base; found ${JSON.stringify(value)}`
  )
}

function visitRecipeLeaves(value, prefix, visitor) {
  for (const [name, child] of Object.entries(value)) {
    const childPath = `${prefix}.${name}`

    if (child !== null && typeof child === "object" && !isReference(child)) {
      visitRecipeLeaves(child, childPath, visitor)
    } else {
      visitor(child, childPath)
    }
  }
}

/**
 * Check that every scalable built-in length is rem or `0`, that foundation
 * references resolve to scalable values, and that the fixed-pixel exceptions
 * still hold their exact documented values.
 *
 * @returns {string[]} Human-readable violations; empty when the policy holds.
 */
export function collectLengthPolicyViolations({ contract, recipes }) {
  const failures = []

  for (const [profileName, profile] of Object.entries(contract.density)) {
    for (const [fieldName, value] of Object.entries(profile)) {
      requireScalable(failures, `density.${profileName}.${fieldName}`, value)
    }
  }

  for (const fieldName of SCALABLE_TYPOGRAPHY_FIELDS) {
    requireScalable(failures, `typography.${fieldName}`, contract.typography[fieldName])
  }

  for (const [fieldName, value] of Object.entries(contract.radii)) {
    const fixedValue = FIXED_RADII.get(fieldName)
    if (fixedValue !== undefined) {
      if (value !== fixedValue) {
        failures.push(
          `radii.${fieldName} must stay ${fixedValue} as a fixed-length exception; found ${JSON.stringify(value)}`
        )
      }
      continue
    }

    requireScalable(failures, `radii.${fieldName}`, value)
  }

  visitRecipeLeaves(recipes, "componentRecipes", (value, valuePath) => {
    const fieldName = valuePath.slice(valuePath.lastIndexOf(".") + 1)
    if (!RECIPE_LENGTH_FIELDS.has(fieldName)) {
      return
    }

    if (isReference(value)) {
      if (value.kind === "foundation" && value.path === "radii.full") {
        return
      }

      const resolved = resolveFoundationValue(contract, value.path)
      if (resolved === undefined) {
        // Unsupported or non-length references are reported by the structural
        // contract checks; this policy only judges the resolved length.
        return
      }

      requireScalable(failures, `${valuePath} via ${value.path}`, resolved)
      return
    }

    if (fieldName === "marginInlineStart" && value === "auto") {
      return
    }

    const fixedValue = FIXED_RECIPE_LENGTHS.get(valuePath)
    if (fixedValue !== undefined) {
      if (value !== fixedValue) {
        failures.push(
          `${valuePath} must stay ${fixedValue} as a fixed-length exception; found ${JSON.stringify(value)}`
        )
      }
      return
    }

    requireScalable(failures, valuePath, value)
  })

  return failures
}
