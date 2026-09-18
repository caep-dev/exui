import assert from "node:assert/strict"
import { test } from "node:test"

import { componentRecipes, exuiTokens } from "../dist/index.js"
import { createCssVariables, foundationVariableByReference, renderCss } from "./generate-css.mjs"
import {
  collectFoundationReferenceViolations,
  collectFoundationTokenPaths,
} from "./foundation-reference-policy.mjs"

function cloneSources() {
  return {
    contract: structuredClone(exuiTokens),
    recipes: structuredClone(componentRecipes),
    variables: createCssVariables(exuiTokens, componentRecipes).light,
    variableByReference: { ...foundationVariableByReference },
  }
}

function violationsAfter(mutate) {
  const sources = cloneSources()
  mutate(sources)
  return collectFoundationReferenceViolations(sources)
}

function requireViolation(violations, fragment) {
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `expected a violation mentioning ${fragment}; received:\n${violations.join("\n")}`
  )
}

test("canonical sources satisfy the foundation reference policy", () => {
  assert.deepEqual(violationsAfter(() => {}), [])
})

test("the variable map covers every foundation Token and nothing else", () => {
  assert.deepEqual(
    collectFoundationTokenPaths(exuiTokens),
    Object.keys(foundationVariableByReference).sort()
  )
})

test("recipe foundation references are emitted as references, not literals", () => {
  const css = renderCss(exuiTokens, componentRecipes)

  assert.match(css, /--exui-component-button-default-font-family: var\(--exui-font-family\);/)
  assert.match(css, /--exui-component-form-control-focus-shadow: var\(--exui-shadow-focus\);/)
  assert.match(css, /--exui-component-menu-surface-shadow: var\(--exui-shadow-menu\);/)
  assert.match(css, /--radius: var\(--exui-radius-large\);/)
})

test("a contract Token without a published variable is rejected", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.radii.jumbo = "1.5rem"
  })

  requireViolation(violations, "radii.jumbo has no published CSS variable")
})

test("a mapping without a contract Token is rejected", () => {
  const violations = violationsAfter(({ variableByReference }) => {
    variableByReference["radii.jumbo"] = "--exui-radius-small"
  })

  requireViolation(violations, "radii.jumbo is mapped to --exui-radius-small but is not a foundation Token")
})

test("a mapped variable that the stylesheet never declares is rejected", () => {
  const violations = violationsAfter(({ variables }) => {
    delete variables["--exui-radius-full"]
  })

  requireViolation(
    violations,
    "radii.full is published as --exui-radius-full, which the generated :root does not declare"
  )
})

test("a published variable that drifted from the contract is rejected", () => {
  const violations = violationsAfter(({ variables }) => {
    variables["--exui-shadow-focus"] = "0 0 0 2px red"
  })

  requireViolation(violations, '--exui-shadow-focus must declare "0 0 0 3px rgba(0, 112, 243, 0.25)"')
})

test("a recipe variable that inlines a foundation value is rejected", () => {
  const violations = violationsAfter(({ variables }) => {
    for (const [name, value] of Object.entries(variables)) {
      variables[name] = String(value).replaceAll("var(--exui-font-size-body)", "0.875rem")
    }
  })

  requireViolation(
    violations,
    "--exui-font-size-body is emitted 0 time(s) but 10 recipe leaf/leaves reference typography.bodyFontSize"
  )
})

test("a recipe variable that references an undeclared variable is rejected", () => {
  const violations = violationsAfter(({ variables }) => {
    variables["--exui-component-button-default-font-size"] = "var(--exui-font-size-missing)"
  })

  requireViolation(
    violations,
    "--exui-component-button-default-font-size references --exui-font-size-missing, which the generated :root does not declare"
  )
})
