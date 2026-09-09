/** Stable foundation-token references supported by component recipes. */
export type FoundationTokenReference =
  | "radii.none"
  | "radii.small"
  | "radii.medium"
  | "radii.large"
  | "radii.extraLarge"
  | "radii.full"
  | "typography.fontFamily"
  | "typography.fontWeightRegular"
  | "typography.fontWeightMedium"
  | "typography.fontWeightBold"
  | "typography.bodyFontSize"
  | "typography.bodyLineHeight"
  | "typography.smallFontSize"
  | "typography.smallLineHeight"
  | "shadows.small"
  | "shadows.medium"
  | "shadows.large"
  | "shadows.focus"

/** Theme-aware semantic-token references supported by component recipes. */
export type SemanticTokenReference =
  | "surface.background"
  | "surface.secondary"
  | "surface.tertiary"
  | "surface.accent"
  | "surface.accentForeground"
  | "surface.popover"
  | "surface.popoverForeground"
  | "surface.modal"
  | "surface.menu"
  | "surface.sidebar"
  | "surface.input"
  | "surface.overlay"
  | "text.primary"
  | "text.secondary"
  | "text.placeholder"
  | "text.link"
  | "text.inverse"
  | "control.primary"
  | "control.primaryForeground"
  | "control.hover"
  | "control.active"
  | "control.disabled"
  | "control.neutral"
  | "control.neutralForeground"
  | "control.danger"
  | "control.dangerForeground"
  | "control.invalid"
  | "control.selected"
  | "control.focusRing"
  | "border.default"
  | "border.strong"
  | "border.input"
  | "border.focused"
  | "border.divider"
  | "feedback.danger"
  | "feedback.dangerForeground"
  | "sidebar.background"
  | "sidebar.foreground"
  | "sidebar.primary"
  | "sidebar.primaryForeground"
  | "sidebar.accent"
  | "sidebar.accentForeground"
  | "sidebar.border"
  | "sidebar.ring"
  | "shadow.card"
  | "shadow.modal"
  | "shadow.menu"

/** Foundation paths that resolve to radii. */
export type RadiusFoundationReference = Extract<FoundationTokenReference, `radii.${string}`>

/** Foundation paths that resolve to static shadows. */
export type ShadowFoundationReference = Extract<FoundationTokenReference, `shadows.${string}`>

/** Semantic paths that resolve to theme colors. */
export type ColorSemanticTokenReference = Exclude<SemanticTokenReference, `shadow.${string}`>

/** Semantic paths that resolve to theme shadows. */
export type ShadowSemanticTokenReference = Extract<SemanticTokenReference, `shadow.${string}`>

/** A reference to a stable framework-neutral foundation token. */
export interface FoundationReference<
  TPath extends FoundationTokenReference = FoundationTokenReference,
> {
  readonly kind: "foundation"
  readonly path: TPath
}

/** A reference to a theme-aware semantic color or shadow token. */
export interface SemanticReference<
  TPath extends SemanticTokenReference = SemanticTokenReference,
> {
  readonly kind: "semantic"
  readonly path: TPath
}

/** Direct CSS lengths accepted by recipe geometry fields. */
export type RecipeLength = `${number}px` | "0"

/** Direct CSS durations accepted by recipe motion fields. */
export type RecipeDuration = `${number}ms`

/** Direct CSS tracking values accepted by recipe typography fields. */
export type RecipeLetterSpacing = `${number}em`

/** A typed radius value. */
export type RecipeRadius = RecipeLength | FoundationReference<RadiusFoundationReference>

/** A typed theme color value. */
export type RecipeColor = "transparent" | SemanticReference<ColorSemanticTokenReference>

/** A typed static or theme-aware shadow value. */
export type RecipeShadow =
  | "none"
  | FoundationReference<ShadowFoundationReference>
  | SemanticReference<ShadowSemanticTokenReference>

/** A typed font-family value. */
export type RecipeFontFamily = FoundationReference<"typography.fontFamily">

/** A typed font-size value. */
export type RecipeFontSize = RecipeLength | FoundationReference<
  "typography.bodyFontSize" | "typography.smallFontSize"
>

/** A typed line-height value. */
export type RecipeLineHeight = RecipeLength | FoundationReference<
  "typography.bodyLineHeight" | "typography.smallLineHeight"
>

/** A typed font-weight value. */
export type RecipeFontWeight = 400 | 500 | 600 | FoundationReference<
  | "typography.fontWeightRegular"
  | "typography.fontWeightMedium"
  | "typography.fontWeightBold"
>

/** The visual chrome for one interactive state. */
export interface InteractiveStateRecipe {
  readonly background: RecipeColor
  readonly foreground: RecipeColor
  readonly border: RecipeColor
  readonly shadow: RecipeShadow
  readonly opacity: number
}

/** Supported public Button visual variants. */
export type ButtonVariantName =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link"

/** Supported public Button recipe sizes. */
export type ButtonSizeName = "default" | "small" | "large" | "icon"

/** State contract for a Button visual variant. */
export interface ButtonVariantRecipe {
  readonly default: InteractiveStateRecipe
  readonly hover: InteractiveStateRecipe
  readonly active: InteractiveStateRecipe
  readonly focus: InteractiveStateRecipe
  readonly disabled: InteractiveStateRecipe
}

/** Geometry and typography for a Button size. */
export interface ButtonSizeRecipe {
  readonly height: RecipeLength
  readonly paddingInline: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly iconSize: RecipeLength
  readonly fontFamily: RecipeFontFamily
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
  readonly lineHeight: RecipeLineHeight
}

/** Complete public Button recipe. */
export interface ButtonRecipe {
  readonly defaultVariant: ButtonVariantName
  readonly defaultSize: ButtonSizeName
  readonly primary: ButtonVariantRecipe
  readonly secondary: ButtonVariantRecipe
  readonly outline: ButtonVariantRecipe
  readonly ghost: ButtonVariantRecipe
  readonly danger: ButtonVariantRecipe
  readonly link: ButtonVariantRecipe
  readonly default: ButtonSizeRecipe
  readonly small: ButtonSizeRecipe
  readonly large: ButtonSizeRecipe
  readonly icon: ButtonSizeRecipe
}

/** Base geometry, typography, and chrome shared by form controls. */
export interface FormControlBaseRecipe {
  readonly height: RecipeLength
  readonly paddingInline: RecipeLength
  readonly paddingBlock: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly fontFamily: RecipeFontFamily
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
  readonly lineHeight: RecipeLineHeight
  readonly background: RecipeColor
  readonly foreground: RecipeColor
  readonly border: RecipeColor
  readonly placeholder: RecipeColor
  readonly shadow: RecipeShadow
}

/** Complete public Input, Textarea, and Select Trigger recipe. */
export interface FormControlRecipe {
  readonly base: FormControlBaseRecipe
  readonly hover: InteractiveStateRecipe
  readonly focus: InteractiveStateRecipe
  readonly disabled: InteractiveStateRecipe
  readonly invalid: InteractiveStateRecipe
}

/** Geometry and typography for one sidebar item role. */
export interface SidebarItemGeometryRecipe {
  readonly minHeight: RecipeLength
  readonly paddingInline: RecipeLength
  readonly paddingBlock: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly iconSize: RecipeLength
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
}

/** Complete public Sidebar Item recipe. */
export interface SidebarItemRecipe {
  readonly default: SidebarItemGeometryRecipe & InteractiveStateRecipe
  readonly hover: InteractiveStateRecipe
  readonly active: InteractiveStateRecipe
  readonly focus: InteractiveStateRecipe
  readonly disabled: InteractiveStateRecipe
  readonly nested: SidebarItemGeometryRecipe
  readonly iconOnly: SidebarItemGeometryRecipe
}

/** Menu surface geometry and chrome. */
export interface MenuSurfaceRecipe {
  readonly padding: RecipeLength
  readonly radius: RecipeRadius
  readonly background: RecipeColor
  readonly foreground: RecipeColor
  readonly border: RecipeColor
  readonly shadow: RecipeShadow
}

/** Menu item geometry, typography, and state chrome. */
export interface MenuItemRecipe {
  readonly paddingInline: RecipeLength
  readonly paddingBlock: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
  readonly default: InteractiveStateRecipe
  readonly hover: InteractiveStateRecipe
  readonly active: InteractiveStateRecipe
  readonly focus: InteractiveStateRecipe
  readonly disabled: InteractiveStateRecipe
  readonly destructive: InteractiveStateRecipe
}

/** Menu-item fields that apply to submenu triggers. */
export type MenuSubmenuTriggerRecipe = Omit<MenuItemRecipe, "destructive">

/** Visual overrides for a checked menu item. */
export interface MenuCheckedItemRecipe {
  readonly background: RecipeColor
  readonly foreground: RecipeColor
  readonly indicator: RecipeColor
}

/** Menu separator recipe. */
export interface MenuSeparatorRecipe {
  readonly thickness: RecipeLength
  readonly marginBlock: RecipeLength
  readonly color: RecipeColor
}

/** Menu shortcut typography recipe. */
export interface MenuShortcutRecipe {
  readonly marginInlineStart: RecipeLength | "auto"
  readonly fontSize: RecipeFontSize
  readonly letterSpacing: RecipeLetterSpacing
  readonly foreground: RecipeColor
}

/** Complete public Menu recipe. */
export interface MenuRecipe {
  readonly surface: MenuSurfaceRecipe
  readonly item: MenuItemRecipe
  readonly checkedItem: MenuCheckedItemRecipe
  readonly submenuTrigger: MenuSubmenuTriggerRecipe
  readonly separator: MenuSeparatorRecipe
  readonly shortcut: MenuShortcutRecipe
}

/** Dialog overlay recipe. */
export interface DialogOverlayRecipe {
  readonly background: RecipeColor
  readonly backdropBlur: RecipeLength
  readonly duration: RecipeDuration
}

/** Dialog surface geometry and chrome. */
export interface DialogSurfaceRecipe {
  readonly padding: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly background: RecipeColor
  readonly foreground: RecipeColor
  readonly border: RecipeColor
  readonly shadow: RecipeShadow
}

/** Dialog text role recipe. */
export interface DialogTextRecipe {
  readonly fontFamily: RecipeFontFamily
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
  readonly lineHeight: RecipeLineHeight
  readonly foreground: RecipeColor
}

/** Dialog content-spacing recipe. */
export interface DialogContentSpacingRecipe {
  readonly gap: RecipeLength
}

/** Dialog close-button position recipe. */
export interface DialogCloseButtonPlacementRecipe {
  readonly top: RecipeLength
  readonly right: RecipeLength
}

/** Complete public Dialog recipe. */
export interface DialogRecipe {
  readonly overlay: DialogOverlayRecipe
  readonly surface: DialogSurfaceRecipe
  readonly title: DialogTextRecipe
  readonly description: DialogTextRecipe
  readonly body: DialogContentSpacingRecipe
  readonly footer: DialogContentSpacingRecipe
  readonly closeButtonPlacement: DialogCloseButtonPlacementRecipe
}

/** Supported public Tabs visual variants. */
export type TabsVariantName = "default" | "line"

/** Tabs list geometry and chrome. */
export interface TabsListRecipe {
  readonly height: RecipeLength
  readonly padding: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly foreground: RecipeColor
}

/** Tabs trigger geometry, typography, and state chrome. */
export interface TabsTriggerRecipe {
  readonly paddingInline: RecipeLength
  readonly paddingBlock: RecipeLength
  readonly gap: RecipeLength
  readonly radius: RecipeRadius
  readonly fontSize: RecipeFontSize
  readonly fontWeight: RecipeFontWeight
  readonly default: InteractiveStateRecipe
  readonly hover: InteractiveStateRecipe
  readonly selected: InteractiveStateRecipe
  readonly focus: InteractiveStateRecipe
  readonly disabled: InteractiveStateRecipe
}

/** Tabs selection-indicator recipe. */
export interface TabsIndicatorRecipe {
  readonly thickness: RecipeLength
  readonly offset: RecipeLength
  readonly background: RecipeColor
}

/** Visual overrides for one Tabs variant. */
export interface TabsVariantRecipe {
  readonly listBackground: RecipeColor
  readonly indicatorOpacity: number
}

/** Line Tabs additionally override the selected trigger background. */
export interface TabsLineVariantRecipe extends TabsVariantRecipe {
  readonly triggerSelectedBackground: RecipeColor
}

/** Complete public Tabs recipe. */
export interface TabsRecipe {
  readonly defaultVariant: TabsVariantName
  readonly list: TabsListRecipe
  readonly trigger: TabsTriggerRecipe
  readonly indicator: TabsIndicatorRecipe
  readonly default: TabsVariantRecipe
  readonly line: TabsLineVariantRecipe
}

/** Public component-recipe collection released through `@exre/exui/tokens`. */
export interface ComponentRecipes {
  readonly button: ButtonRecipe
  readonly formControl: FormControlRecipe
  readonly sidebarItem: SidebarItemRecipe
  readonly menu: MenuRecipe
  readonly dialog: DialogRecipe
  readonly tabs: TabsRecipe
}
