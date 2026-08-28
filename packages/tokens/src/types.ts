export interface ExuiTokenContract {
  readonly themes: ThemeCollection
  readonly density: DensityCollection
  readonly typography: TypographyTokens
  readonly radii: RadiusTokens
  readonly shadows: ShadowTokens
}

export interface ThemeCollection {
  readonly light: ThemeTokens
  readonly dark: ThemeTokens
  readonly pitchBlack: ThemeTokens
}

export interface DensityCollection {
  readonly standard: DensityTokens
  readonly compact: DensityTokens
}

export interface ThemeTokens {
  readonly surface: SurfaceTokens
  readonly text: TextTokens
  readonly control: ControlTokens
  readonly border: BorderTokens
  readonly feedback: FeedbackTokens
  readonly editor: EditorTokens
  readonly chart: ChartTokens
  readonly sidebar: SidebarTokens
  readonly shadow: ThemeShadowTokens
}

export interface SurfaceTokens {
  readonly background: string
  readonly secondary: string
  readonly tertiary: string
  readonly accent: string
  readonly accentForeground: string
  readonly card: string
  readonly cardForeground: string
  readonly popover: string
  readonly popoverForeground: string
  readonly modal: string
  readonly menu: string
  readonly sidebar: string
  readonly input: string
  readonly overlay: string
}

export interface TextTokens {
  readonly primary: string
  readonly secondary: string
  readonly tertiary: string
  readonly placeholder: string
  readonly link: string
  readonly inverse: string
}

export interface ControlTokens {
  readonly primary: string
  readonly primaryForeground: string
  readonly hover: string
  readonly active: string
  readonly disabled: string
  readonly neutral: string
  readonly neutralForeground: string
  readonly danger: string
  readonly dangerForeground: string
  readonly invalid: string
  readonly selected: string
  readonly focusRing: string
}

export interface BorderTokens {
  readonly default: string
  readonly strong: string
  readonly input: string
  readonly focused: string
  readonly divider: string
}

export interface FeedbackTokens {
  readonly danger: string
  readonly dangerForeground: string
  readonly warning: string
  readonly warningForeground: string
  readonly success: string
  readonly successForeground: string
  readonly info: string
  readonly infoForeground: string
}

export interface EditorTokens {
  readonly code: string
  readonly codeBackground: string
  readonly codeBorder: string
  readonly quote: string
  readonly highlight: string
  readonly highlightForeground: string
  readonly tableSelection: string
  readonly embedBorder: string
  readonly scrollbarBackground: string
  readonly scrollbarThumb: string
  readonly syntax: EditorSyntaxTokens
}

export interface EditorSyntaxTokens {
  readonly comment: string
  readonly punctuation: string
  readonly number: string
  readonly property: string
  readonly tag: string
  readonly string: string
  readonly className: string
  readonly constant: string
  readonly parameter: string
  readonly selector: string
  readonly attributeName: string
  readonly attributeValue: string
  readonly entity: string
  readonly keyword: string
  readonly function: string
  readonly statement: string
  readonly placeholder: string
  readonly inserted: string
  readonly important: string
  readonly operator: string
}

export interface ChartTokens {
  readonly series1: string
  readonly series2: string
  readonly series3: string
  readonly series4: string
  readonly series5: string
}

export interface SidebarTokens {
  readonly background: string
  readonly foreground: string
  readonly primary: string
  readonly primaryForeground: string
  readonly accent: string
  readonly accentForeground: string
  readonly border: string
  readonly ring: string
}

export interface ThemeShadowTokens {
  readonly card: string
  readonly modal: string
  readonly menu: string
}

export interface DensityTokens {
  readonly controlHeight: string
  readonly controlPaddingInline: string
  readonly controlGap: string
  readonly iconSize: string
  readonly controlRadius: string
}

export interface TypographyTokens {
  readonly fontFamily: string
  readonly fontFamilyMono: string
  readonly fontFamilyEmoji: string
  readonly fontWeightRegular: number
  readonly fontWeightMedium: number
  readonly fontWeightBold: number
  readonly bodyFontSize: string
  readonly bodyLineHeight: string
  readonly smallFontSize: string
  readonly smallLineHeight: string
}

export interface RadiusTokens {
  readonly none: string
  readonly small: string
  readonly medium: string
  readonly large: string
  readonly extraLarge: string
  readonly full: string
}

export interface ShadowTokens {
  readonly small: string
  readonly medium: string
  readonly large: string
  readonly focus: string
}
