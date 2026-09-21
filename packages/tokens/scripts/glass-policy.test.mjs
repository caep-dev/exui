import assert from "node:assert/strict"
import { test } from "node:test"

import { componentRecipes, exuiTokens } from "../dist/index.js"
import { createCssVariables, renderCss } from "./generate-css.mjs"
import { collectGlassViolations } from "./glass-policy.mjs"

function cloneSources() {
  return {
    contract: structuredClone(exuiTokens),
    variables: createCssVariables(exuiTokens, componentRecipes).light,
  }
}

function violationsAfter(mutate) {
  const sources = cloneSources()
  mutate(sources)
  return collectGlassViolations(sources)
}

function requireViolation(violations, fragment) {
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `expected a violation mentioning ${fragment}; received:\n${violations.join("\n")}`
  )
}

test("canonical sources satisfy the glass material policy", () => {
  assert.deepEqual(violationsAfter(() => {}), [])
})

test("the stylesheet publishes the public material variables", () => {
  const css = renderCss(exuiTokens, componentRecipes)

  assert.match(css, /--exui-glass-background: rgba\(255, 255, 255, 0\.72\);/)
  assert.match(css, /--exui-glass-foreground: var\(--exui-text-primary\);/)
  assert.match(css, /--exui-glass-border: rgba\(0, 0, 0, 0\.12\);/)
  assert.match(css, /--exui-glass-shadow: inset 0 0 0 0\.0625rem var\(--exui-glass-border\);/)
  assert.match(css, /--exui-glass-blur: 0\.5rem;/)
  assert.match(css, /--exui-glass-saturation: 1\.2;/)
})

test("the danger material stays a reference to the semantic danger colour", () => {
  const css = renderCss(exuiTokens, componentRecipes)

  assert.match(css, /--exui-glass-danger-background: color-mix\(in srgb, var\(--exui-control-danger\) 90%, transparent\);/)
  assert.match(css, /--exui-glass-danger-hover-background: color-mix\(in srgb, var\(--exui-control-danger\) 94%, transparent\);/)
  assert.match(css, /--exui-glass-danger-active-background: color-mix\(in srgb, var\(--exui-control-danger\) 98%, transparent\);/)
  assert.match(css, /--exui-glass-danger-foreground: var\(--exui-control-danger-foreground\);/)
  assert.match(css, /--exui-glass-danger-border: var\(--exui-control-danger\);/)
  assert.match(css, /--exui-glass-danger-fallback-background: var\(--exui-control-danger\);/)
})

test("a material that is missing an interaction state is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    delete contract.themes.dark.glass.hoverBackground
  })

  requireViolation(violations, "dark.glass is missing hoverBackground")
})

test("a non-positive or non-finite saturation is reported", () => {
  const zero = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.saturation = 0
  })
  requireViolation(zero, "dark.glass.saturation must be a positive finite number")

  const infinite = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.saturation = Number.POSITIVE_INFINITY
  })
  requireViolation(infinite, "dark.glass.saturation must be a positive finite number")
})

test("a blur that is not a rem length is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.blur = "8px"
  })

  requireViolation(violations, "dark.glass.blur must be a rem length")
})

test("a non-colour material leaf is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.border = "1px solid black"
  })

  requireViolation(violations, "dark.glass.border is not a supported sRGB hex, rgb(), or rgba() color")
})

test("a shadow that is not an inset edge is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.shadow = "0 4px 16px rgba(0, 0, 0, 0.3)"
  })

  requireViolation(
    violations,
    "dark.glass.shadow must be an inset edge of the material's border colour"
  )
})

test("a shadow thickness that is not a rem length is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.shadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.16)"
  })

  requireViolation(violations, "dark.glass.shadow thickness must be a rem length")
})

test("a shadow that stopped reusing the material border is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.shadow = "inset 0 0 0 0.0625rem rgba(1, 2, 3, 0.1)"
  })

  requireViolation(violations, "dark.glass.shadow must reuse")
})

test("a fallback background that is not opaque is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.fallbackBackground = "rgba(24, 24, 24, 0.5)"
  })

  requireViolation(violations, "dark.glass.fallbackBackground must be opaque")
})

test("a material foreground that stopped deriving from text.primary is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.foreground = "#f0f0f0"
  })

  requireViolation(violations, "dark.glass.foreground must reuse text.primary")
})

test("a translucent material foreground is rejected rather than judged", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.foreground = "rgba(250, 250, 250, 0.5)"
  })

  requireViolation(violations, "dark.glass.foreground must be opaque")
})

test("a material foreground that fails over the page colour is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.text.primary = "#8a8a8a"
    contract.themes.dark.glass.foreground = "#8a8a8a"
  })

  requireViolation(violations, "dark.glass.background contrast is")
  // The page colour is judged in its own right, not just the two extremes: the
  // dark theme's page is #0b0b0b, which no extreme reproduces.
  requireViolation(violations, "over backdrop (11, 11, 11)")
})

test("a shadow that is not a string is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.shadow = 42
  })

  requireViolation(violations, "dark.glass.shadow must be a string")
})

test("a translucent danger base colour is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.control.danger = "rgba(255, 100, 103, 0.5)"
  })

  requireViolation(violations, "dark.control.danger must be opaque for the danger material")
})

test("a danger state whose RGB left control.danger is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.danger.hoverBackground = "rgba(1, 2, 3, 0.94)"
  })

  requireViolation(violations, "dark.glass.danger.hoverBackground must use the RGB of control.danger")
})

test("a danger state whose opacity drifted is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.danger.activeBackground = "rgba(255, 100, 103, 0.5)"
  })

  requireViolation(violations, "dark.glass.danger.activeBackground must use alpha 0.98")
})

test("a danger material that stopped deriving from the semantic danger colour is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.danger.border = "#ff0000"
  })

  requireViolation(violations, "dark.glass.danger.border must reuse control.danger")

  const foreground = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.danger.foreground = "#eeeeee"
  })
  requireViolation(foreground, "dark.glass.danger.foreground must reuse control.dangerForeground")

  const fallback = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.danger.fallbackBackground = "#ff0000"
  })
  requireViolation(fallback, "dark.glass.danger.fallbackBackground must reuse control.danger")
})

test("a danger foreground that fails over the danger material is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.control.dangerForeground = "#6a6a6a"
    contract.themes.dark.glass.danger.foreground = "#6a6a6a"
  })

  requireViolation(violations, "dark.glass.danger.background contrast is")
})

test("a fallback background below the text threshold is reported", () => {
  const violations = violationsAfter(({ contract }) => {
    contract.themes.dark.glass.fallbackBackground = "#7a7a7a"
  })

  requireViolation(violations, "dark.glass.fallbackBackground contrast is")
})

test("a material variable that inlined its derivation is reported", () => {
  const foreground = violationsAfter(({ variables }) => {
    variables["--exui-glass-foreground"] = "#0b0b0b"
  })
  requireViolation(foreground, "--exui-glass-foreground must stay var(--exui-text-primary)")

  const shadow = violationsAfter(({ variables }) => {
    variables["--exui-glass-shadow"] = "inset 0 0 0 1px #000"
  })
  requireViolation(
    shadow,
    "--exui-glass-shadow must stay inset 0 0 0 0.0625rem var(--exui-glass-border)"
  )

  const danger = violationsAfter(({ variables }) => {
    variables["--exui-glass-danger-background"] = "rgba(231, 0, 11, 0.9)"
  })
  requireViolation(
    danger,
    "--exui-glass-danger-background must stay color-mix(in srgb, var(--exui-control-danger) 90%, transparent)"
  )
})

test("a public material variable the stylesheet never declares is reported", () => {
  const violations = violationsAfter(({ variables }) => {
    delete variables["--exui-glass-blur"]
  })

  requireViolation(violations, "--exui-glass-blur is not declared by the generated :root block")
})
