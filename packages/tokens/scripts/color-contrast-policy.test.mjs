import assert from "node:assert/strict"
import { test } from "node:test"

import { componentRecipes, exuiTokens } from "../dist/index.js"
import { collectColorContrastViolations, contrastRatio } from "./color-contrast-policy.mjs"

function cloneSources() {
  return {
    contract: structuredClone(exuiTokens),
    recipes: structuredClone(componentRecipes),
  }
}

function violationsAfter(mutate) {
  const sources = cloneSources()
  mutate(sources)
  return collectColorContrastViolations(sources)
}

function requireViolation(violations, fragment) {
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `expected a violation mentioning ${fragment}; received:\n${violations.join("\n")}`
  )
}

test("canonical sources satisfy the built-in contrast policy", () => {
  assert.deepEqual(collectColorContrastViolations(cloneSources()), [])
})

test("contrast ratio matches the WCAG reference extremes", () => {
  const black = { red: 0, green: 0, blue: 0, alpha: 1 }
  const white = { red: 255, green: 255, blue: 255, alpha: 1 }
  assert.equal(contrastRatio(black, white), 21)
  assert.equal(contrastRatio(white, white), 1)
})

test("a theme foreground pair below the text threshold is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.light.control.primary = "#c8c8c8"
  })
  requireViolation(violations, "light.control.primary")
})

test("a translucent foreground is rejected rather than judged", () => {
  const violations = violationsAfter(({ contract, recipes }) => {
    contract.themes.light.control.linkHover = "rgba(0, 112, 243, 0.8)"
    recipes.button.link.hover.foreground = { kind: "semantic", path: "control.linkHover" }
  })
  requireViolation(violations, "light.componentRecipes.button.link.hover must use an opaque foreground")
})

test("disabled states are exempt from the text threshold", () => {
  const violations = violationsAfter(({ recipes }) => {
    recipes.button.primary.disabled.foreground = { kind: "semantic", path: "control.neutral" }
  })
  assert.deepEqual(violations, [])
})

test("transparent backgrounds are judged against the theme page colour", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.light.text.link = "#a0c8ff"
  })
  requireViolation(violations, "light.componentRecipes.button.link.default")
})

test("translucent backgrounds are composited over the theme page colour", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.light.control.hover = "rgba(255, 255, 255, 0.5)"
  })
  requireViolation(violations, "light.componentRecipes.button.primary.hover")
})

test("every theme is judged, including pitchBlack", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.pitchBlack.control.primaryForeground = "#101010"
  })
  requireViolation(violations, "pitchBlack.control.primary")
  requireViolation(violations, "pitchBlack.componentRecipes.button.primary.default")
})
