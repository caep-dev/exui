import { access, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { createCssVariables, renderCss } from "./generate-css.mjs"
import { componentRecipes, exuiTokens } from "../dist/index.js"

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

function requireKeys(label, value, requiredKeys) {
  const missing = requiredKeys.filter((name) => !(name in value))
  if (missing.length > 0) {
    failures.push(`${label} is missing required keys: ${missing.join(", ")}`)
  }
}

function visitRecipeValues(value, prefix, visitor) {
  for (const [name, child] of Object.entries(value)) {
    const childPath = `${prefix}.${name}`
    const isReference = child !== null &&
      typeof child === "object" &&
      (child.kind === "foundation" || child.kind === "semantic")

    if (child !== null && typeof child === "object" && !isReference) {
      visitRecipeValues(child, childPath, visitor)
    } else {
      visitor(child, childPath)
    }
  }
}

function validateRecipeContract() {
  requireKeys("componentRecipes", componentRecipes, [
    "button",
    "formControl",
    "sidebarItem",
    "menu",
    "dialog",
    "tabs",
  ])
  requireKeys("componentRecipes.button", componentRecipes.button, [
    "primary", "secondary", "outline", "ghost", "danger", "link",
    "default", "small", "large", "icon", "defaultVariant", "defaultSize",
  ])
  for (const variantName of ["primary", "secondary", "outline", "ghost", "danger", "link"]) {
    requireKeys(`componentRecipes.button.${variantName}`, componentRecipes.button[variantName], [
      "default", "hover", "active", "focus", "disabled",
    ])
  }
  requireKeys("componentRecipes.formControl", componentRecipes.formControl, [
    "base", "hover", "focus", "disabled", "invalid",
  ])
  requireKeys("componentRecipes.sidebarItem", componentRecipes.sidebarItem, [
    "default", "hover", "active", "focus", "disabled", "nested", "iconOnly",
  ])
  requireKeys("componentRecipes.menu", componentRecipes.menu, [
    "surface", "item", "checkedItem", "submenuTrigger", "separator", "shortcut",
  ])
  requireKeys("componentRecipes.dialog", componentRecipes.dialog, [
    "overlay", "surface", "title", "description", "body", "footer", "closeButtonPlacement",
  ])
  requireKeys("componentRecipes.tabs", componentRecipes.tabs, [
    "list", "trigger", "indicator", "default", "line", "defaultVariant",
  ])
  requireKeys("componentRecipes.tabs.trigger", componentRecipes.tabs.trigger, [
    "default", "hover", "selected", "focus", "disabled",
  ])

  if (!(componentRecipes.button.defaultVariant in componentRecipes.button)) {
    failures.push(`button default variant does not resolve: ${componentRecipes.button.defaultVariant}`)
  }
  if (!(componentRecipes.button.defaultSize in componentRecipes.button)) {
    failures.push(`button default size does not resolve: ${componentRecipes.button.defaultSize}`)
  }
  if (!(componentRecipes.tabs.defaultVariant in componentRecipes.tabs)) {
    failures.push(`tabs default variant does not resolve: ${componentRecipes.tabs.defaultVariant}`)
  }

  const foundationReferences = new Set([
    "radii.none", "radii.small", "radii.medium", "radii.large", "radii.extraLarge", "radii.full",
    "typography.fontFamily", "typography.fontWeightRegular", "typography.fontWeightMedium",
    "typography.fontWeightBold", "typography.bodyFontSize", "typography.bodyLineHeight",
    "typography.smallFontSize", "typography.smallLineHeight", "shadows.small", "shadows.medium",
    "shadows.large", "shadows.focus",
  ])
  const semanticReferences = new Set([
    "surface.background", "surface.secondary", "surface.tertiary", "surface.accent",
    "surface.accentForeground", "surface.popover", "surface.popoverForeground", "surface.modal",
    "surface.menu", "surface.sidebar", "surface.input", "surface.overlay", "text.primary",
    "text.secondary", "text.placeholder", "text.link", "text.inverse", "control.primary",
    "control.primaryForeground", "control.hover", "control.active", "control.disabled",
    "control.neutral", "control.neutralForeground", "control.danger", "control.dangerForeground",
    "control.invalid", "control.selected", "control.focusRing", "border.default", "border.strong",
    "border.input", "border.focused", "border.divider", "feedback.danger",
    "feedback.dangerForeground", "sidebar.background", "sidebar.foreground", "sidebar.primary",
    "sidebar.primaryForeground", "sidebar.accent", "sidebar.accentForeground", "sidebar.border",
    "sidebar.ring", "shadow.card", "shadow.modal", "shadow.menu",
  ])

  visitRecipeValues(componentRecipes, "componentRecipes", (value, valuePath) => {
    const fieldName = valuePath.slice(valuePath.lastIndexOf(".") + 1)
    const colorFields = new Set([
      "background", "foreground", "border", "placeholder", "indicator",
      "color", "listBackground", "triggerSelectedBackground",
    ])
    const lengthFields = new Set([
      "height", "minHeight", "padding", "paddingInline", "paddingBlock", "gap",
      "iconSize", "thickness", "marginBlock", "marginInlineStart", "backdropBlur",
      "top", "right", "offset", "radius", "fontSize", "lineHeight",
    ])
    const fontSizeReferences = new Set(["typography.bodyFontSize", "typography.smallFontSize"])
    const lineHeightReferences = new Set(["typography.bodyLineHeight", "typography.smallLineHeight"])
    const fontWeightReferences = new Set([
      "typography.fontWeightRegular", "typography.fontWeightMedium", "typography.fontWeightBold",
    ])

    if (value !== null && typeof value === "object") {
      if (value.kind === "foundation" && !foundationReferences.has(value.path)) {
        failures.push(`${valuePath} has an unsupported foundation reference: ${value.path}`)
      }
      if (value.kind === "semantic" && !semanticReferences.has(value.path)) {
        failures.push(`${valuePath} has an unsupported semantic reference: ${value.path}`)
      }
      if (colorFields.has(fieldName) &&
        (value.kind !== "semantic" || value.path.startsWith("shadow."))) {
        failures.push(`${valuePath} must use a semantic color reference`)
      }
      if (fieldName === "shadow" && !(
        (value.kind === "semantic" && value.path.startsWith("shadow.")) ||
        (value.kind === "foundation" && value.path.startsWith("shadows."))
      )) {
        failures.push(`${valuePath} must use a shadow reference`)
      }
      if (fieldName === "radius" &&
        (value.kind !== "foundation" || !value.path.startsWith("radii."))) {
        failures.push(`${valuePath} must use a radius foundation reference or px length`)
      }
      if (fieldName === "fontFamily" &&
        (value.kind !== "foundation" || value.path !== "typography.fontFamily")) {
        failures.push(`${valuePath} must use the foundation font-family reference`)
      }
      if (fieldName === "fontSize" &&
        (value.kind !== "foundation" || !fontSizeReferences.has(value.path))) {
        failures.push(`${valuePath} must use a font-size foundation reference or px length`)
      }
      if (fieldName === "lineHeight" &&
        (value.kind !== "foundation" || !lineHeightReferences.has(value.path))) {
        failures.push(`${valuePath} must use a line-height foundation reference or px length`)
      }
      if (fieldName === "fontWeight" &&
        (value.kind !== "foundation" || !fontWeightReferences.has(value.path))) {
        failures.push(`${valuePath} must use a font-weight foundation reference or supported number`)
      }
    } else if (colorFields.has(fieldName) && value !== "transparent") {
      failures.push(`${valuePath} must use a semantic reference or transparent`)
    } else if (fieldName === "shadow" && value !== "none") {
      failures.push(`${valuePath} must use a shadow reference or none`)
    } else if ((fieldName === "opacity" || fieldName === "indicatorOpacity") &&
      (typeof value !== "number" || value < 0 || value > 1)) {
      failures.push(`${valuePath} must be a number between 0 and 1`)
    } else if (fieldName === "marginInlineStart" && value === "auto") {
      // `auto` is the sole non-length layout keyword in the public recipe contract.
    } else if (lengthFields.has(fieldName) &&
      (typeof value !== "string" || !/^-?(?:\d+\.?\d*|\.\d+)px$|^0$/.test(value))) {
      failures.push(`${valuePath} must be a px length`)
    } else if (fieldName === "duration" &&
      (typeof value !== "string" || !/^(?:\d+\.?\d*|\.\d+)ms$/.test(value))) {
      failures.push(`${valuePath} must be a millisecond duration`)
    } else if (fieldName === "letterSpacing" &&
      (typeof value !== "string" || !/^-?(?:\d+\.?\d*|\.\d+)em$/.test(value))) {
      failures.push(`${valuePath} must be an em tracking value`)
    } else if (fieldName === "fontFamily") {
      failures.push(`${valuePath} must use the foundation font-family reference`)
    } else if (fieldName === "fontWeight" && ![400, 500, 600].includes(value)) {
      failures.push(`${valuePath} must be a supported numeric font weight`)
    }

    const isFullRadius = value === exuiTokens.radii.full ||
      (value !== null && typeof value === "object" && value.kind === "foundation" && value.path === "radii.full")
    if (valuePath.endsWith(".radius") && isFullRadius && !valuePath.startsWith("componentRecipes.button.")) {
      failures.push(`${valuePath} uses the Button-only full radius`)
    }
  })
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
  const expected = renderCss(exuiTokens, componentRecipes)
  if (current !== expected) {
    failures.push("src/style.css differs from the canonical token source")
  }

  const allVariables = createCssVariables(exuiTokens, componentRecipes)
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
validateFrozen(componentRecipes, "componentRecipes")
validateRecipeContract()
validateColors(exuiTokens.themes)
validateContrast()
await validateGeneratedCss()
await validatePackage()

if (failures.length > 0) {
  throw new Error(`Token validation failed:\n- ${failures.join("\n- ")}`)
}

console.log("Token validation passed")
