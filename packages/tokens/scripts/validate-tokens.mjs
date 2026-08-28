import { access, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { createCssVariables, renderCss } from "./generate-css.mjs"
import { exuiTokens } from "../dist/tokens.js"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const failures = []

function collectLeafPaths(value, prefix = "") {
  const paths = []

  for (const [name, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${name}` : name
    if (child !== null && typeof child === "object") {
      paths.push(...collectLeafPaths(child, childPath))
    } else {
      paths.push(childPath)
    }
  }

  return paths.sort()
}

function requireEqualShape(label, entries) {
  const [baselineName, baselineValue] = entries[0]
  const baseline = collectLeafPaths(baselineValue)

  for (const [name, value] of entries.slice(1)) {
    const candidate = collectLeafPaths(value)
    if (JSON.stringify(candidate) !== JSON.stringify(baseline)) {
      const missing = baseline.filter((pathName) => !candidate.includes(pathName))
      const extra = candidate.filter((pathName) => !baseline.includes(pathName))
      failures.push(`${label}.${name} differs from ${baselineName}; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`)
    }
  }
}

function validateDensity() {
  const bannedName = /(color|background|foreground|shadow|ring|focus|hover|active|selected|disabled|invalid|danger)/i

  for (const [profileName, profile] of Object.entries(exuiTokens.density)) {
    for (const fieldName of collectLeafPaths(profile)) {
      if (bannedName.test(fieldName)) {
        failures.push(`density.${profileName}.${fieldName} contains a forbidden visual-state field`)
      }
    }
  }
}

function validateFrozen(value, prefix = "exuiTokens") {
  if (!Object.isFrozen(value)) {
    failures.push(`${prefix} is mutable at runtime`)
  }

  for (const [name, child] of Object.entries(value)) {
    if (child !== null && typeof child === "object") {
      validateFrozen(child, `${prefix}.${name}`)
    }
  }
}

function parseColor(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    return {
      red: Number.parseInt(hex[1].slice(0, 2), 16),
      green: Number.parseInt(hex[1].slice(2, 4), 16),
      blue: Number.parseInt(hex[1].slice(4, 6), 16),
      alpha: 1,
    }
  }

  const functional = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.exec(value)
  if (!functional) {
    return undefined
  }

  const color = {
    red: Number(functional[1]),
    green: Number(functional[2]),
    blue: Number(functional[3]),
    alpha: functional[4] === undefined ? 1 : Number(functional[4]),
  }

  if ([color.red, color.green, color.blue].some((channel) => channel > 255) || color.alpha > 1) {
    return undefined
  }

  return color
}

function validateColors(value, prefix = "themes") {
  for (const [name, child] of Object.entries(value)) {
    const childPath = `${prefix}.${name}`
    if (child !== null && typeof child === "object") {
      validateColors(child, childPath)
    } else if (!childPath.includes(".shadow.") && parseColor(String(child)) === undefined) {
      failures.push(`${childPath} is not a supported sRGB hex, rgb(), or rgba() color: ${child}`)
    }
  }
}

function composite(foreground, background) {
  return {
    red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
    green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
    blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
    alpha: 1,
  }
}

function luminance(color) {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foregroundValue, backgroundValue) {
  const foreground = parseColor(foregroundValue)
  const background = parseColor(backgroundValue)
  if (!foreground || !background) {
    return 0
  }

  const resolvedForeground = foreground.alpha < 1 ? composite(foreground, background) : foreground
  const foregroundLuminance = luminance(resolvedForeground)
  const backgroundLuminance = luminance(background)

  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

function requireContrast(themeName, label, foreground, background, minimum) {
  const ratio = contrastRatio(foreground, background)
  if (ratio < minimum) {
    failures.push(`${themeName}.${label} contrast is ${ratio.toFixed(2)}:1; expected at least ${minimum}:1 (${foreground} on ${background})`)
  }
}

function validateContrast() {
  for (const [themeName, theme] of Object.entries(exuiTokens.themes)) {
    requireContrast(themeName, "defaultText", theme.text.primary, theme.surface.background, 4.5)
    requireContrast(themeName, "primaryControl", theme.control.primaryForeground, theme.control.primary, 4.5)
    requireContrast(themeName, "dangerControl", theme.control.dangerForeground, theme.control.danger, 4.5)
    requireContrast(themeName, "focusRing", theme.control.focusRing, theme.surface.background, 3)
  }
}

async function validateGeneratedCss() {
  const sourcePath = path.join(packageRoot, "src", "style.css")
  const current = await readFile(sourcePath, "utf8").catch(() => "")
  const expected = renderCss(exuiTokens)
  if (current !== expected) {
    failures.push("src/style.css differs from the canonical token source")
  }

  const allVariables = createCssVariables(exuiTokens)
  for (const [selector, variables] of Object.entries(allVariables)) {
    const names = Object.keys(variables)
    if (new Set(names).size !== names.length) {
      failures.push(`${selector} contains duplicate CSS variable names`)
    }
  }
}

async function validatePackage() {
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"))
  const dependencyNames = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  })
  const forbidden = dependencyNames.filter((name) => /react|tailwind|radix|styled-components|shadcn/i.test(name))
  if (forbidden.length > 0) {
    failures.push(`package dependencies contain UI runtime entries: ${forbidden.join(", ")}`)
  }

  const exportTargets = [
    packageJson.exports["."].types,
    packageJson.exports["."].import,
    packageJson.exports["./style.css"],
    packageJson.exports["./font.css"],
  ]
  for (const target of exportTargets) {
    await access(path.join(packageRoot, target)).catch(() => {
      failures.push(`package export target does not exist: ${target}`)
    })
  }
}

requireEqualShape("themes", Object.entries(exuiTokens.themes))
requireEqualShape("density", Object.entries(exuiTokens.density))
validateDensity()
validateFrozen(exuiTokens)
validateColors(exuiTokens.themes)
validateContrast()
await validateGeneratedCss()
await validatePackage()

if (failures.length > 0) {
  throw new Error(`Token validation failed:\n- ${failures.join("\n- ")}`)
}

console.log("Token validation passed")
