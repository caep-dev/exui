import assert from "node:assert/strict"
import { test } from "node:test"

import { componentRecipes, exuiTokens } from "../dist/index.js"
import { collectColorContrastViolations, contrastRatio, parseColor } from "./color-contrast-policy.mjs"

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

test("out-of-range channels are rejected rather than judged", () => {
  // A browser does not render these as written, so a policy that treated them
  // as parseable would judge a colour the Token contract already rejects. The
  // alpha cases are refused by the literal's own shape; the channel case is the
  // one the parser has to check.
  assert.equal(parseColor("rgba(999, 0, 0, 1)"), undefined)
  assert.equal(parseColor("rgba(0, 0, 0, 2)"), undefined)
  assert.equal(parseColor("rgba(0, 0, 0, -1)"), undefined)
  assert.deepEqual(parseColor("rgba(0, 112, 243, 0.25)"), {
    red: 0,
    green: 112,
    blue: 243,
    alpha: 0.25,
  })
})

test("a theme foreground pair below the text threshold is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    // An accent surface, so the pair is judged at the text threshold rather than
    // at the non-text floor the brand fill is held to.
    contract.themes.light.surface.accent = "#7a7a7a"
  })
  requireViolation(violations, "light.surface.accent")
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
    // A washed-out label on the brand fill, below the non-text floor, so the
    // darkest theme is not skipped for being the one with the least headroom.
    contract.themes.pitchBlack.control.primaryForeground = "#c8c8c8"
  })
  requireViolation(violations, "pitchBlack.control.primary")
  requireViolation(violations, "pitchBlack.componentRecipes.button.primary.default")
})

test("the brand fill is held to a lower floor rather than exempted", () => {
  // White on the built-in brand blue measures 3.52:1, under the text threshold,
  // which is why the pairing is judged at BRAND_FILL_CONTRAST. A fill that drops
  // under that floor still has to be reported, or the exception would have
  // become an exemption.
  const violations = violationsAfter(({ contract }) => {
    contract.themes.light.control.primary = "#55aaff"
  })
  requireViolation(violations, "light.control.primary")
  requireViolation(violations, "light.componentRecipes.button.primary.default")
})

test("the brand floor covers the brand fill and nothing else", () => {
  // The brand fill's own ratio, moved onto a state that is not the brand fill,
  // is judged at the text threshold and therefore reported.
  const violations = violationsAfter(({ contract }) => {
    contract.themes.light.control.hover = "#0088ff"
  })
  requireViolation(violations, "light.componentRecipes.button.primary.hover")
})
