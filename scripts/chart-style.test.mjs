import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"

const requireFromComponents = createRequire(new URL("../packages/components/package.json", import.meta.url))
const requireFromShowcase = createRequire(new URL("../packages/showcase/package.json", import.meta.url))
const React = requireFromComponents("react")
const { renderToStaticMarkup } = requireFromComponents("react-dom/server")
const { ChartContainer } = await import("../packages/components/dist/exui.js")
const { chromium } = requireFromShowcase("playwright")

function renderChart(config, id = "review-chart") {
  return renderToStaticMarkup(
    React.createElement(
      ChartContainer,
      { id, config },
      React.createElement("span", { style: { color: "var(--color-normal)" } }, "chart")
    )
  )
}

test("public ChartContainer keeps external configuration inside its chart style", async () => {
  const html = renderChart(
    {
      normal: {
        theme: {
          light: "var(--brand)",
          dark: "color-mix(in srgb, #fff 30%, rgb(1 2 3 / 50%))",
        },
      },
      "series.item": { color: "#123456" },
      closing: { color: "</style><script>window.__chartAttack = true</script><style>" },
      rule: { color: "red; } .outside { --chart-attack: yes; } /*" },
      "bad; } .outside { --chart-attack: yes; } /*": { color: "blue" },
    },
    'special"] .outside { --chart-attack: yes; } /*</style><script>window.__chartIdAttack = true</script>'
  )

  assert.doesNotMatch(html, /<script\b/i, "SSR must not emit a script element")

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(`<style>:root { --brand: #abcdef; }</style><div class="outside">outside</div>${html}`)
    const result = await page.evaluate(() => {
      const chart = document.querySelector("[data-slot=chart]")
      const outside = document.querySelector(".outside")
      const normal = getComputedStyle(chart).getPropertyValue("--color-normal").trim()
      const lightTextColor = getComputedStyle(chart.querySelector("span")).color
      const specialKey = getComputedStyle(chart).getPropertyValue("--color-series.item").trim()
      const outsideValue = getComputedStyle(outside).getPropertyValue("--chart-attack").trim()
      document.documentElement.classList.add("dark")
      const dark = getComputedStyle(chart).getPropertyValue("--color-normal").trim()
      const darkTextColor = getComputedStyle(chart.querySelector("span")).color
      return {
        scriptRan: window.__chartAttack === true || window.__chartIdAttack === true,
        scriptCount: document.scripts.length,
        normal,
        dark,
        lightTextColor,
        darkTextColor,
        specialKey,
        outsideValue,
      }
    })

    assert.equal(result.scriptRan, false)
    assert.equal(result.scriptCount, 0)
    assert.equal(result.outsideValue, "", "external config must not add CSS rules")
    assert.equal(result.normal, "#abcdef", "var() colors must remain usable")
    assert.equal(result.lightTextColor, "rgb(171, 205, 239)")
    assert.notEqual(result.dark, "", "color-mix() theme colors must remain usable")
    assert.notEqual(result.dark, result.normal, "dark theme must select its own color")
    assert.notEqual(result.darkTextColor, result.lightTextColor)
    assert.equal(result.specialKey, "#123456", "escaped keys must map to their own variable")
  } finally {
    await browser.close()
  }
})
