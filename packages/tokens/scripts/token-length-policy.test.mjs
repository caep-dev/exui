import assert from "node:assert/strict"
import { test } from "node:test"

import { componentRecipes, exuiTokens } from "../dist/index.js"
import {
  CONTRACT_LENGTH_PATTERN,
  RECIPE_LENGTH_FIELDS,
  collectLengthPolicyViolations,
  isContractLength,
  isScalableLength,
} from "./token-length-policy.mjs"

function cloneSources() {
  return {
    contract: structuredClone(exuiTokens),
    recipes: structuredClone(componentRecipes),
  }
}

function violationsAfter(mutate) {
  const sources = cloneSources()
  mutate(sources)
  return collectLengthPolicyViolations(sources)
}

function requireViolation(violations, fragment) {
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `expected a violation mentioning ${fragment}; received:\n${violations.join("\n")}`
  )
}

test("canonical sources satisfy the built-in length policy", () => {
  assert.deepEqual(collectLengthPolicyViolations(cloneSources()), [])
})

test("scalable built-in lengths accept rem and unitless zero only", () => {
  assert.equal(isScalableLength("0.875rem"), true)
  assert.equal(isScalableLength("-0.3125rem"), true)
  assert.equal(isScalableLength(".09375rem"), true)
  assert.equal(isScalableLength("0"), true)
  assert.equal(isScalableLength("14px"), false)
  assert.equal(isScalableLength("14"), false)
  assert.equal(isScalableLength("1.5em"), false)
  // Trailing-dot forms are not valid CSS lengths.
  assert.equal(isScalableLength("1.rem"), false)
})

test("the public recipe contract accepts rem, px, and 0", () => {
  assert.equal(isContractLength("0.75rem"), true)
  assert.equal(isContractLength("-0.3125rem"), true)
  assert.equal(isContractLength("12px"), true)
  assert.equal(isContractLength("0"), true)
  assert.equal(isContractLength("12"), false)
  assert.equal(isContractLength("1.5em"), false)
  assert.equal(isContractLength("auto"), false)
  assert.equal(isContractLength(12), false)
  // A trailing dot or a leading dot without digits is not a finite decimal.
  assert.equal(isContractLength("12.px"), false)
  assert.equal(isContractLength("12.rem"), false)
  assert.equal(isContractLength(".rem"), false)
})

test("the length field set covers every built-in recipe length", () => {
  const lengthFieldNames = new Set()

  const collect = (value) => {
    for (const [name, child] of Object.entries(value)) {
      if (child !== null && typeof child === "object" && !("kind" in child)) {
        collect(child)
        continue
      }
      if (typeof child === "string" && CONTRACT_LENGTH_PATTERN.test(child)) {
        lengthFieldNames.add(name)
      }
    }
  }
  collect(componentRecipes)

  // Length fields that hold a reference rather than a literal string are
  // invisible to the value scan above, so pin the ones that exist today.
  for (const referenceFieldName of ["radius", "fontSize", "lineHeight"]) {
    lengthFieldNames.add(referenceFieldName)
  }

  const uncovered = [...lengthFieldNames].filter((name) => !RECIPE_LENGTH_FIELDS.has(name))
  assert.deepEqual(
    uncovered,
    [],
    `these built-in length fields would escape the px ban: ${uncovered.join(", ")}`
  )
})

test("rejects a built-in font size reverted to pixels", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.typography.bodyFontSize = "14px"
  })

  requireViolation(violations, 'typography.bodyFontSize must be a rem length or 0 at the 16px base; found "14px"')
  requireViolation(violations, "via typography.bodyFontSize")
})

test("rejects built-in density geometry left in pixels", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.density.standard.controlHeight = "36px"
    contract.density.compact.controlPaddingInline = "8px"
  })

  assert.equal(violations.length, 2)
  requireViolation(violations, "density.standard.controlHeight")
  requireViolation(violations, "density.compact.controlPaddingInline")
})

test("rejects recipe geometry that missed the conversion", () => {
  const violations = violationsAfter(({ recipes }) => {
    recipes.button.default.height = "36px"
    recipes.dialog.surface.padding = "24px"
    recipes.tabs.indicator.offset = "-5px"
  })

  assert.equal(violations.length, 3)
  requireViolation(violations, "componentRecipes.button.default.height")
  requireViolation(violations, "componentRecipes.dialog.surface.padding")
  requireViolation(violations, "componentRecipes.tabs.indicator.offset")
})

test("rejects a normal radius left in pixels", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.radii.extraLarge = "14px"
  })

  assert.ok(violations.length > 1)
  requireViolation(violations, "radii.extraLarge")
  requireViolation(violations, "via radii.extraLarge")
})

test("rejects a unitless non-zero built-in length", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.density.standard.controlGap = "6"
  })

  assert.equal(violations.length, 1)
  requireViolation(violations, "density.standard.controlGap")
})

test("keeps the menu separator thickness as a fixed pixel", () => {
  const violations = violationsAfter(({ recipes }) => {
    recipes.menu.separator.thickness = "0.0625rem"
  })

  assert.equal(violations.length, 1)
  requireViolation(violations, "must stay 1px")
})

test("keeps the full and none radii as fixed values", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.radii.full = "624.9375rem"
    contract.radii.none = "0rem"
  })

  assert.equal(violations.length, 2)
  requireViolation(violations, "radii.full must stay 9999px")
  requireViolation(violations, "radii.none must stay 0")
})

test("does not judge shadows, durations, or em tracking as scalable lengths", () => {
  const violations = violationsAfter(({ contract, recipes }) => {
    contract.shadows.focus = "0 0 0 3px currentColor"
    contract.themes.light.shadow.card = "0 2px 4px rgba(0, 0, 0, 0.05)"
    recipes.dialog.overlay.duration = "250ms"
    recipes.menu.shortcut.letterSpacing = "0.2em"
  })

  assert.deepEqual(violations, [])
})
