import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const outputPath = path.join(packageRoot, "src", "style.css")

function addThemeVariables(variables, theme) {
  Object.assign(variables, {
    "--accent": theme.surface.accent,
    "--accent-foreground": theme.surface.accentForeground,
    "--background": theme.surface.background,
    "--border": theme.border.default,
    "--card": theme.surface.card,
    "--card-foreground": theme.surface.cardForeground,
    "--chart-1": theme.chart.series1,
    "--chart-2": theme.chart.series2,
    "--chart-3": theme.chart.series3,
    "--chart-4": theme.chart.series4,
    "--chart-5": theme.chart.series5,
    "--destructive": theme.control.danger,
    "--destructive-foreground": theme.control.dangerForeground,
    "--foreground": theme.text.primary,
    "--input": theme.border.input,
    "--muted": theme.surface.tertiary,
    "--muted-foreground": theme.text.secondary,
    "--popover": theme.surface.popover,
    "--popover-foreground": theme.surface.popoverForeground,
    "--primary": theme.control.primary,
    "--primary-foreground": theme.control.primaryForeground,
    "--ring": theme.control.focusRing,
    "--secondary": theme.surface.secondary,
    "--secondary-foreground": theme.control.neutralForeground,
    "--sidebar": theme.sidebar.background,
    "--sidebar-accent": theme.sidebar.accent,
    "--sidebar-accent-foreground": theme.sidebar.accentForeground,
    "--sidebar-border": theme.sidebar.border,
    "--sidebar-foreground": theme.sidebar.foreground,
    "--sidebar-primary": theme.sidebar.primary,
    "--sidebar-primary-foreground": theme.sidebar.primaryForeground,
    "--sidebar-ring": theme.sidebar.ring,
  })

  for (const [groupName, group] of Object.entries(theme)) {
    if (groupName === "shadow") {
      continue
    }

    flattenVariables(variables, `--exui-${toKebabCase(groupName)}`, group)
  }

  for (const [name, value] of Object.entries(theme.shadow)) {
    variables[`--exui-shadow-${toKebabCase(name)}`] = value
  }
}

function flattenVariables(variables, prefix, value) {
  for (const [name, child] of Object.entries(value)) {
    const variableName = `${prefix}-${toKebabCase(name)}`

    if (child !== null && typeof child === "object") {
      flattenVariables(variables, variableName, child)
    } else {
      variables[variableName] = String(child)
    }
  }
}

const semanticVariableByReference = {
  "surface.background": "--exui-surface-background",
  "surface.secondary": "--exui-surface-secondary",
  "surface.tertiary": "--exui-surface-tertiary",
  "surface.accent": "--exui-surface-accent",
  "surface.accentForeground": "--exui-surface-accent-foreground",
  "surface.popover": "--exui-surface-popover",
  "surface.popoverForeground": "--exui-surface-popover-foreground",
  "surface.modal": "--exui-surface-modal",
  "surface.menu": "--exui-surface-menu",
  "surface.sidebar": "--exui-surface-sidebar",
  "surface.input": "--exui-surface-input",
  "surface.overlay": "--exui-surface-overlay",
  "text.primary": "--exui-text-primary",
  "text.secondary": "--exui-text-secondary",
  "text.placeholder": "--exui-text-placeholder",
  "text.link": "--exui-text-link",
  "text.inverse": "--exui-text-inverse",
  "control.primary": "--exui-control-primary",
  "control.primaryForeground": "--exui-control-primary-foreground",
  "control.hover": "--exui-control-hover",
  "control.active": "--exui-control-active",
  "control.linkHover": "--exui-control-link-hover",
  "control.linkActive": "--exui-control-link-active",
  "control.disabled": "--exui-control-disabled",
  "control.neutral": "--exui-control-neutral",
  "control.neutralForeground": "--exui-control-neutral-foreground",
  "control.danger": "--exui-control-danger",
  "control.dangerForeground": "--exui-control-danger-foreground",
  "control.invalid": "--exui-control-invalid",
  "control.selected": "--exui-control-selected",
  "control.focusRing": "--exui-control-focus-ring",
  "border.default": "--exui-border-default",
  "border.strong": "--exui-border-strong",
  "border.input": "--exui-border-input",
  "border.focused": "--exui-border-focused",
  "border.divider": "--exui-border-divider",
  "feedback.danger": "--exui-feedback-danger",
  "feedback.dangerForeground": "--exui-feedback-danger-foreground",
  "sidebar.background": "--exui-sidebar-background",
  "sidebar.foreground": "--exui-sidebar-foreground",
  "sidebar.primary": "--exui-sidebar-primary",
  "sidebar.primaryForeground": "--exui-sidebar-primary-foreground",
  "sidebar.accent": "--exui-sidebar-accent",
  "sidebar.accentForeground": "--exui-sidebar-accent-foreground",
  "sidebar.border": "--exui-sidebar-border",
  "sidebar.ring": "--exui-sidebar-ring",
  "shadow.card": "--exui-shadow-card",
  "shadow.modal": "--exui-shadow-modal",
  "shadow.menu": "--exui-shadow-menu",
}

/**
 * Every foundation contract path and the CSS variable it is published as.
 *
 * Foundation Tokens are referenced by the recipe tree just like semantic ones,
 * so the stylesheet resolves both to `var(--exui-…)`. A literal copy would
 * leave a consumer override of the Token visible in `:root` while component
 * styling kept the frozen value. The map covers the contract exactly, which
 * `foundation-reference-policy.mjs` asserts.
 */
export const foundationVariableByReference = {
  "radii.extraLarge": "--exui-radius-extra-large",
  "radii.full": "--exui-radius-full",
  "radii.large": "--exui-radius-large",
  "radii.medium": "--exui-radius-medium",
  "radii.none": "--exui-radius-none",
  "radii.small": "--exui-radius-small",
  "shadows.focus": "--exui-shadow-focus",
  "shadows.invalid": "--exui-shadow-invalid",
  "shadows.large": "--exui-shadow-large",
  "shadows.medium": "--exui-shadow-medium",
  "shadows.small": "--exui-shadow-small",
  "typography.bodyFontSize": "--exui-font-size-body",
  "typography.bodyLineHeight": "--exui-line-height-body",
  "typography.fontFamily": "--exui-font-family",
  "typography.fontFamilyEmoji": "--exui-font-family-emoji",
  "typography.fontFamilyMono": "--exui-font-family-mono",
  "typography.fontWeightBold": "--exui-font-weight-bold",
  "typography.fontWeightMedium": "--exui-font-weight-medium",
  "typography.fontWeightRegular": "--exui-font-weight-regular",
  "typography.smallFontSize": "--exui-font-size-small",
  "typography.smallLineHeight": "--exui-line-height-small",
}

function readFoundationValue(contract, path) {
  let current = contract

  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      throw new Error(`Unsupported foundation token path: ${path}`)
    }

    current = current[segment]
  }

  return String(current)
}

function addFoundationVariables(variables, contract) {
  for (const [path, variableName] of Object.entries(foundationVariableByReference)) {
    variables[variableName] = readFoundationValue(contract, path)
  }
}

function resolveRecipeValue(value) {
  if (value !== null && typeof value === "object") {
    if (value.kind === "foundation") {
      const variableName = foundationVariableByReference[value.path]
      if (variableName === undefined) {
        throw new Error(`Unsupported foundation recipe reference: ${value.path}`)
      }
      return `var(${variableName})`
    }

    if (value.kind === "semantic") {
      const variableName = semanticVariableByReference[value.path]
      if (variableName === undefined) {
        throw new Error(`Unsupported semantic recipe reference: ${value.path}`)
      }
      return `var(${variableName})`
    }
  }

  return String(value)
}

function flattenRecipeVariables(variables, prefix, value) {
  for (const [name, child] of Object.entries(value)) {
    if (name === "defaultVariant" || name === "defaultSize") {
      continue
    }

    const variableName = `${prefix}-${toKebabCase(name)}`
    const isReference = child !== null &&
      typeof child === "object" &&
      (child.kind === "foundation" || child.kind === "semantic")

    if (child !== null && typeof child === "object" && !isReference) {
      flattenRecipeVariables(variables, variableName, child)
    } else {
      variables[variableName] = resolveRecipeValue(child)
    }
  }
}

function addComponentVariables(variables, recipes) {
  flattenRecipeVariables(variables, "--exui-component", recipes)
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function renderBlock(selector, variables) {
  const declarations = Object.entries(variables)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")

  return `${selector} {\n${declarations}\n}`
}

function changedVariables(current, baseline) {
  return Object.fromEntries(
    Object.entries(current).filter(([name, value]) => baseline[name] !== value)
  )
}

export function createCssVariables(contract, recipes) {
  const light = {}
  const dark = {}
  const pitchBlack = {}
  addThemeVariables(light, contract.themes.light)
  addThemeVariables(dark, contract.themes.dark)
  addThemeVariables(pitchBlack, contract.themes.pitchBlack)

  Object.assign(light, {
    "--density-control-gap": contract.density.standard.controlGap,
    "--density-control-height": contract.density.standard.controlHeight,
    "--density-control-padding-inline": contract.density.standard.controlPaddingInline,
    "--density-control-radius": contract.density.standard.controlRadius,
    "--density-icon-size": contract.density.standard.iconSize,
    "--radius": `var(${foundationVariableByReference["radii.large"]})`,
  })
  addFoundationVariables(light, contract)
  addComponentVariables(light, recipes)

  const compact = {
    "--density-control-gap": contract.density.compact.controlGap,
    "--density-control-height": contract.density.compact.controlHeight,
    "--density-control-padding-inline": contract.density.compact.controlPaddingInline,
    "--density-control-radius": contract.density.compact.controlRadius,
    "--density-icon-size": contract.density.compact.iconSize,
  }

  return {
    light,
    dark: changedVariables(dark, light),
    pitchBlack: changedVariables(pitchBlack, light),
    compact,
  }
}

export function renderCss(contract, recipes) {
  const variables = createCssVariables(contract, recipes)

  return [
    "/* Generated by scripts/generate-css.mjs. Do not edit by hand. */",
    renderBlock(":root", variables.light),
    renderBlock(".dark", variables.dark),
    renderBlock(".pitch-black", variables.pitchBlack),
    renderBlock(".density-compact", variables.compact),
  ].join("\n\n") + "\n"
}

async function run() {
  const { componentRecipes, exuiTokens } = await import("../dist/index.js")
  const generated = renderCss(exuiTokens, componentRecipes)

  if (process.argv.includes("--check")) {
    const current = await readFile(outputPath, "utf8").catch(() => "")
    if (current !== generated) {
      throw new Error("src/style.css is stale. Run pnpm --filter @exre/exui-tokens build.")
    }
    return
  }

  await writeFile(outputPath, generated, "utf8")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run()
}
