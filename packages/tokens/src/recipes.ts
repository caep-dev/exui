import type {
  ComponentRecipes,
  FoundationReference,
  FoundationTokenReference,
  InteractiveStateRecipe,
  SemanticReference,
  SemanticTokenReference,
} from "./recipeTypes.js"

function foundation<TPath extends FoundationTokenReference>(
  path: TPath
): FoundationReference<TPath> {
  return { kind: "foundation", path }
}

function semantic<TPath extends SemanticTokenReference>(
  path: TPath
): SemanticReference<TPath> {
  return { kind: "semantic", path }
}

function state(
  background: InteractiveStateRecipe["background"],
  foreground: InteractiveStateRecipe["foreground"],
  border: InteractiveStateRecipe["border"] = "transparent",
  shadow: InteractiveStateRecipe["shadow"] = "none",
  opacity: InteractiveStateRecipe["opacity"] = 1
): InteractiveStateRecipe {
  return { background, foreground, border, shadow, opacity }
}

const transparent = "transparent"
const noShadow = "none"

/** Canonical, framework-neutral visual recipes for the first EXUI component roles. */
export const componentRecipes: ComponentRecipes = {
  button: {
    defaultVariant: "primary",
    defaultSize: "default",
    primary: {
      default: state(semantic("control.primary"), semantic("control.primaryForeground"), semantic("control.primary")),
      hover: state(semantic("control.hover"), semantic("control.primaryForeground"), semantic("control.hover")),
      active: state(semantic("control.active"), semantic("control.primaryForeground"), semantic("control.active")),
      focus: state(semantic("control.primary"), semantic("control.primaryForeground"), transparent, foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    secondary: {
      default: state(semantic("surface.secondary"), semantic("control.neutralForeground"), semantic("surface.secondary")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary"), semantic("surface.tertiary")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("surface.accent")),
      focus: state(semantic("surface.secondary"), semantic("control.neutralForeground"), transparent, foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    outline: {
      default: state(semantic("surface.background"), semantic("text.primary"), semantic("border.default")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary"), semantic("border.strong")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("border.strong")),
      focus: state(semantic("surface.background"), semantic("text.primary"), transparent, foundation("shadows.focus")),
      disabled: state(semantic("surface.background"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    ghost: {
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      focus: state(transparent, semantic("text.primary"), transparent, foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    danger: {
      default: state(semantic("control.danger"), semantic("control.dangerForeground"), semantic("control.danger")),
      hover: state(semantic("feedback.danger"), semantic("feedback.dangerForeground"), semantic("feedback.danger")),
      active: state(semantic("control.invalid"), semantic("control.dangerForeground"), semantic("control.invalid")),
      focus: state(semantic("control.danger"), semantic("control.dangerForeground"), transparent, foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    link: {
      default: state(transparent, semantic("text.link")),
      hover: state(transparent, semantic("control.linkHover")),
      active: state(transparent, semantic("control.linkActive")),
      focus: state(transparent, semantic("text.link"), transparent, foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    default: {
      height: "2.25rem", paddingInline: "0.75rem", gap: "0.375rem", radius: foundation("radii.full"), iconSize: "1rem",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
    small: {
      height: "2rem", paddingInline: "0.75rem", gap: "0.25rem", radius: foundation("radii.full"), iconSize: "1rem",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.smallFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.smallLineHeight"),
    },
    large: {
      height: "2.5rem", paddingInline: "1rem", gap: "0.375rem", radius: foundation("radii.full"), iconSize: "1rem",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
    icon: {
      height: "2.25rem", paddingInline: "0", gap: "0", radius: foundation("radii.full"), iconSize: "1rem",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
    action: { radius: "0.75rem" },
  },
  formControl: {
    base: {
      height: "2.25rem", paddingInline: "0.75rem", paddingBlock: "0.25rem", gap: "0.375rem", radius: foundation("radii.extraLarge"),
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightRegular"), lineHeight: foundation("typography.bodyLineHeight"),
      background: semantic("surface.input"), foreground: semantic("text.primary"), border: semantic("border.input"),
      placeholder: semantic("text.placeholder"), shadow: noShadow,
    },
    hover: state(semantic("surface.input"), semantic("text.primary")),
    focus: state(semantic("surface.input"), semantic("text.primary"), transparent, foundation("shadows.focus")),
    disabled: state(semantic("surface.input"), semantic("text.secondary"), semantic("border.input"), noShadow, 0.5),
    invalid: state(semantic("surface.input"), semantic("text.primary"), transparent, foundation("shadows.invalid")),
  },
  sidebarItem: {
    default: {
      minHeight: "2rem", paddingInline: "0.75rem", paddingBlock: "0.25rem", gap: "0.5rem", radius: foundation("radii.extraLarge"),
      iconSize: "1rem", fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
      ...state(transparent, semantic("sidebar.foreground")),
    },
    hover: state(semantic("sidebar.accent"), semantic("sidebar.accentForeground")),
    active: state(semantic("surface.background"), semantic("text.link")),
    focus: state(transparent, semantic("sidebar.foreground"), transparent, foundation("shadows.focus")),
    disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    nested: {
      minHeight: "2rem", paddingInline: "0.75rem", paddingBlock: "0.25rem", gap: "0.5rem", radius: foundation("radii.extraLarge"),
      iconSize: "1rem", fontSize: foundation("typography.smallFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
    },
    iconOnly: {
      minHeight: "2rem", paddingInline: "0.5rem", paddingBlock: "0.5rem", gap: "0", radius: foundation("radii.extraLarge"),
      iconSize: "1rem", fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
    },
  },
  menu: {
    surface: {
      padding: "0.375rem", radius: "1.375rem", background: semantic("surface.menu"), foreground: semantic("text.primary"),
      border: semantic("border.default"), shadow: semantic("shadow.menu"),
    },
    item: {
      paddingInline: "0.75rem", paddingBlock: "0.5rem", gap: "0.625rem", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      focus: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
      destructive: state(transparent, semantic("control.danger"), transparent),
    },
    checkedItem: {
      background: semantic("surface.accent"), foreground: semantic("surface.accentForeground"), indicator: semantic("control.selected"),
    },
    submenuTrigger: {
      paddingInline: "0.75rem", paddingBlock: "0.5rem", gap: "0.625rem", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      focus: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    separator: { thickness: "1px", marginBlock: "0.375rem", color: semantic("border.divider") },
    shortcut: {
      marginInlineStart: "auto", fontSize: foundation("typography.smallFontSize"), letterSpacing: "0.1em", foreground: semantic("text.secondary"),
    },
  },
  dialog: {
    overlay: { background: semantic("surface.overlay"), backdropBlur: "0.25rem", duration: "100ms" },
    surface: {
      padding: "1.5rem", gap: "1.5rem", radius: "1.625rem", background: semantic("surface.modal"),
      foreground: semantic("text.primary"), border: semantic("border.default"), shadow: semantic("shadow.modal"),
    },
    title: {
      fontFamily: foundation("typography.fontFamily"), fontSize: "1rem", fontWeight: foundation("typography.fontWeightMedium"),
      lineHeight: "1.25rem", foreground: semantic("text.primary"),
    },
    description: {
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightRegular"), lineHeight: foundation("typography.bodyLineHeight"), foreground: semantic("text.secondary"),
    },
    body: { gap: "0.375rem" },
    footer: { gap: "0.5rem" },
    closeButtonPlacement: { top: "1rem", right: "1rem" },
  },
  tabs: {
    defaultVariant: "default",
    list: {
      height: "2.25rem", padding: "0.25rem", gap: "0.25rem", radius: foundation("radii.extraLarge"),
      foreground: semantic("text.secondary"),
    },
    trigger: {
      paddingInline: "0.75rem", paddingBlock: "0.25rem", gap: "0.5rem", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.secondary")),
      hover: state(transparent, semantic("text.primary")),
      selected: state(semantic("surface.background"), semantic("text.link")),
      focus: state(transparent, semantic("text.primary"), transparent, foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    indicator: { thickness: "0.125rem", offset: "-0.3125rem", background: semantic("text.primary") },
    default: { listBackground: semantic("surface.tertiary"), indicatorOpacity: 0 },
    line: { listBackground: transparent, triggerSelectedBackground: transparent, indicatorOpacity: 1 },
    primary: {
      listBackground: semantic("surface.tertiary"), indicatorOpacity: 0,
      selected: state(semantic("control.primary"), semantic("control.primaryForeground")),
    },
  },
}

function deepFreeze(value: object): void {
  Object.freeze(value)
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child)
    }
  }
}

deepFreeze(componentRecipes)
