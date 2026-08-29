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
      focus: state(semantic("control.primary"), semantic("control.primaryForeground"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    secondary: {
      default: state(semantic("surface.secondary"), semantic("control.neutralForeground"), semantic("surface.secondary")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary"), semantic("surface.tertiary")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("surface.accent")),
      focus: state(semantic("surface.secondary"), semantic("control.neutralForeground"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    outline: {
      default: state(semantic("surface.background"), semantic("text.primary"), semantic("border.default")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary"), semantic("border.strong")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("border.strong")),
      focus: state(semantic("surface.background"), semantic("text.primary"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(semantic("surface.background"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    ghost: {
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.tertiary"), semantic("text.primary")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      focus: state(transparent, semantic("text.primary"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    danger: {
      default: state(semantic("control.danger"), semantic("control.dangerForeground"), semantic("control.danger")),
      hover: state(semantic("feedback.danger"), semantic("feedback.dangerForeground"), semantic("feedback.danger")),
      active: state(semantic("control.invalid"), semantic("control.dangerForeground"), semantic("control.invalid")),
      focus: state(semantic("control.danger"), semantic("control.dangerForeground"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(semantic("control.disabled"), semantic("text.secondary"), semantic("control.disabled"), noShadow, 0.5),
    },
    link: {
      default: state(transparent, semantic("text.link")),
      hover: state(transparent, semantic("control.hover")),
      active: state(transparent, semantic("control.active")),
      focus: state(transparent, semantic("text.link"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    default: {
      height: "36px", paddingInline: "12px", gap: "6px", radius: foundation("radii.full"), iconSize: "16px",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
    small: {
      height: "32px", paddingInline: "12px", gap: "4px", radius: foundation("radii.full"), iconSize: "16px",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.smallFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.smallLineHeight"),
    },
    large: {
      height: "40px", paddingInline: "16px", gap: "6px", radius: foundation("radii.full"), iconSize: "16px",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
    icon: {
      height: "36px", paddingInline: "0px", gap: "0px", radius: foundation("radii.full"), iconSize: "16px",
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightMedium"), lineHeight: foundation("typography.bodyLineHeight"),
    },
  },
  formControl: {
    base: {
      height: "36px", paddingInline: "12px", paddingBlock: "4px", gap: "6px", radius: foundation("radii.extraLarge"),
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightRegular"), lineHeight: foundation("typography.bodyLineHeight"),
      background: semantic("surface.input"), foreground: semantic("text.primary"), border: semantic("border.input"),
      placeholder: semantic("text.placeholder"), shadow: noShadow,
    },
    hover: state(semantic("surface.input"), semantic("text.primary"), semantic("border.strong")),
    focus: state(semantic("surface.input"), semantic("text.primary"), semantic("border.focused"), foundation("shadows.focus")),
    disabled: state(semantic("surface.input"), semantic("text.secondary"), semantic("border.input"), noShadow, 0.5),
    invalid: state(semantic("surface.input"), semantic("text.primary"), semantic("control.invalid"), foundation("shadows.focus")),
  },
  sidebarItem: {
    default: {
      minHeight: "32px", paddingInline: "12px", paddingBlock: "4px", gap: "8px", radius: foundation("radii.extraLarge"),
      iconSize: "16px", fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
      ...state(transparent, semantic("sidebar.foreground")),
    },
    hover: state(semantic("sidebar.accent"), semantic("sidebar.accentForeground")),
    active: state(semantic("sidebar.accent"), semantic("sidebar.accentForeground"), semantic("sidebar.primary")),
    focus: state(transparent, semantic("sidebar.foreground"), semantic("sidebar.ring"), foundation("shadows.focus")),
    disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    nested: {
      minHeight: "32px", paddingInline: "12px", paddingBlock: "4px", gap: "8px", radius: foundation("radii.extraLarge"),
      iconSize: "16px", fontSize: foundation("typography.smallFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
    },
    iconOnly: {
      minHeight: "32px", paddingInline: "8px", paddingBlock: "8px", gap: "0px", radius: foundation("radii.extraLarge"),
      iconSize: "16px", fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightRegular"),
    },
  },
  menu: {
    surface: {
      padding: "6px", radius: "22px", background: semantic("surface.menu"), foreground: semantic("text.primary"),
      border: semantic("border.default"), shadow: semantic("shadow.menu"),
    },
    item: {
      paddingInline: "12px", paddingBlock: "8px", gap: "10px", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("border.strong")),
      focus: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("control.focusRing")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
      destructive: state(transparent, semantic("control.danger"), transparent),
    },
    checkedItem: {
      background: semantic("surface.accent"), foreground: semantic("surface.accentForeground"), indicator: semantic("control.selected"),
    },
    submenuTrigger: {
      paddingInline: "12px", paddingBlock: "8px", gap: "10px", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.primary")),
      hover: state(semantic("surface.accent"), semantic("surface.accentForeground")),
      active: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("border.strong")),
      focus: state(semantic("surface.accent"), semantic("surface.accentForeground"), semantic("control.focusRing")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    separator: { thickness: "1px", marginBlock: "6px", color: semantic("border.divider") },
    shortcut: {
      marginInlineStart: "auto", fontSize: foundation("typography.smallFontSize"), letterSpacing: "0.1em", foreground: semantic("text.secondary"),
    },
  },
  dialog: {
    overlay: { background: semantic("surface.overlay"), backdropBlur: "4px", duration: "100ms" },
    surface: {
      padding: "24px", gap: "24px", radius: "26px", background: semantic("surface.modal"),
      foreground: semantic("text.primary"), border: semantic("border.default"), shadow: semantic("shadow.modal"),
    },
    title: {
      fontFamily: foundation("typography.fontFamily"), fontSize: "16px", fontWeight: foundation("typography.fontWeightMedium"),
      lineHeight: "20px", foreground: semantic("text.primary"),
    },
    description: {
      fontFamily: foundation("typography.fontFamily"), fontSize: foundation("typography.bodyFontSize"),
      fontWeight: foundation("typography.fontWeightRegular"), lineHeight: foundation("typography.bodyLineHeight"), foreground: semantic("text.secondary"),
    },
    body: { gap: "6px" },
    footer: { gap: "8px" },
    closeButtonPlacement: { top: "16px", right: "16px" },
  },
  tabs: {
    defaultVariant: "default",
    list: {
      height: "36px", padding: "4px", gap: "4px", radius: foundation("radii.extraLarge"),
      foreground: semantic("text.secondary"),
    },
    trigger: {
      paddingInline: "12px", paddingBlock: "4px", gap: "8px", radius: foundation("radii.extraLarge"),
      fontSize: foundation("typography.bodyFontSize"), fontWeight: foundation("typography.fontWeightMedium"),
      default: state(transparent, semantic("text.secondary")),
      hover: state(transparent, semantic("text.primary")),
      selected: state(semantic("surface.background"), semantic("text.primary"), semantic("border.default"), foundation("shadows.small")),
      focus: state(transparent, semantic("text.primary"), semantic("control.focusRing"), foundation("shadows.focus")),
      disabled: state(transparent, semantic("text.secondary"), transparent, noShadow, 0.5),
    },
    indicator: { thickness: "2px", offset: "-5px", background: semantic("text.primary") },
    default: { listBackground: semantic("surface.tertiary"), indicatorOpacity: 0 },
    line: { listBackground: transparent, triggerSelectedBackground: transparent, indicatorOpacity: 1 },
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
