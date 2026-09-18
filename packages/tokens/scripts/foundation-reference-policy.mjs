/**
 * Pure foundation-reference policy for the generated token stylesheet.
 *
 * Foundation Tokens are published twice in the stylesheet: once as their own
 * `--exui-…` variable, and once through every recipe field that references them.
 * A recipe that carries a literal copy of the value renders identically, so the
 * mistake survives screenshot comparison and every computed-style assertion —
 * the override simply stops at `:root` while component styling keeps the frozen
 * value. The policy therefore judges the generated variable map directly.
 *
 * It re-derives what it checks from the contract and the recipe tree rather than
 * reusing the generator's resolution step, so a wrong variable name or a stale
 * value is reported instead of being reproduced. Keeping the rules in a
 * side-effect-free module lets them be exercised with in-memory clones instead
 * of rewriting real source files.
 */

/** Contract groups whose leaves are addressed by `{ kind: "foundation" }`. */
const FOUNDATION_GROUPS = ["radii", "typography", "shadows"]

/** Variable name prefix of every recipe-derived variable. */
const RECIPE_VARIABLE_PREFIX = "--exui-component-"

/** Any custom-property reference, for example `var(--exui-radius-large)`. */
const VARIABLE_REFERENCE_PATTERN = /var\((--[a-z0-9-]+)\)/g

function collectLeafPaths(value, prefix) {
  const paths = []

  for (const [name, child] of Object.entries(value)) {
    const childPath = `${prefix}.${name}`

    if (child !== null && typeof child === "object") {
      paths.push(...collectLeafPaths(child, childPath))
    } else {
      paths.push(childPath)
    }
  }

  return paths
}

/** Every foundation leaf path in the contract, sorted. */
export function collectFoundationTokenPaths(contract) {
  return FOUNDATION_GROUPS
    .flatMap((group) => collectLeafPaths(contract[group], group))
    .sort()
}

function readContractValue(contract, path) {
  let current = contract

  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      return undefined
    }

    current = current[segment]
  }

  return String(current)
}

/** How many recipe leaves reference each foundation path. */
function countFoundationReferences(recipes) {
  const counts = new Map()

  const visit = (value) => {
    for (const child of Object.values(value)) {
      if (child === null || typeof child !== "object") {
        continue
      }

      if (child.kind === "foundation") {
        counts.set(child.path, (counts.get(child.path) ?? 0) + 1)
      } else if (child.kind !== "semantic") {
        visit(child)
      }
    }
  }

  visit(recipes)
  return counts
}

/**
 * Check that the foundation variable map covers the contract exactly, that each
 * named variable is declared with the contract value, that recipe variables
 * reference nothing undeclared, and that every foundation reference in the
 * recipe tree was emitted as a reference rather than inlined.
 *
 * @returns {string[]} Human-readable violations; empty when the policy holds.
 */
export function collectFoundationReferenceViolations({
  contract,
  recipes,
  variables,
  variableByReference,
}) {
  const failures = []

  const contractPaths = collectFoundationTokenPaths(contract)

  for (const path of contractPaths) {
    if (!(path in variableByReference)) {
      failures.push(`${path} has no published CSS variable`)
    }
  }

  for (const path of Object.keys(variableByReference).sort()) {
    if (!contractPaths.includes(path)) {
      failures.push(
        `${path} is mapped to ${variableByReference[path]} but is not a foundation Token`
      )
    }
  }

  for (const [path, name] of Object.entries(variableByReference)) {
    if (!(name in variables)) {
      failures.push(`${path} is published as ${name}, which the generated :root does not declare`)
      continue
    }

    const expected = readContractValue(contract, path)
    if (expected !== undefined && variables[name] !== expected) {
      failures.push(
        `${name} must declare ${JSON.stringify(expected)} for ${path}; found ${JSON.stringify(variables[name])}`
      )
    }
  }

  const emittedCounts = new Map()

  for (const [name, value] of Object.entries(variables)) {
    if (!name.startsWith(RECIPE_VARIABLE_PREFIX)) {
      continue
    }

    for (const [, referencedName] of String(value).matchAll(VARIABLE_REFERENCE_PATTERN)) {
      emittedCounts.set(referencedName, (emittedCounts.get(referencedName) ?? 0) + 1)

      if (!(referencedName in variables)) {
        failures.push(`${name} references ${referencedName}, which the generated :root does not declare`)
      }
    }
  }

  const referenceCounts = countFoundationReferences(recipes)

  for (const [path, name] of Object.entries(variableByReference)) {
    const referencedLeaves = referenceCounts.get(path) ?? 0
    const emitted = emittedCounts.get(name) ?? 0

    if (referencedLeaves !== emitted) {
      failures.push(
        `${name} is emitted ${emitted} time(s) but ${referencedLeaves} recipe leaf/leaves reference ${path}`
      )
    }
  }

  return failures
}
