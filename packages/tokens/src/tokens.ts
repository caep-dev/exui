import type { ExuiTokenContract, GlassDangerTokens, ThemeTokens } from "./types.js"

/** Edge thickness of the glass material's inset highlight. */
const glassEdgeWidth = "0.0625rem"

/**
 * Build the inset edge a glass surface draws on itself.
 *
 * Derived from the material's `border` so the edge colour and the border colour
 * cannot drift apart. `scripts/glass-policy.mjs` re-derives the same string.
 */
function glassShadow(border: string): string {
  return `inset 0 0 0 ${glassEdgeWidth} ${border}`
}

/**
 * Compose a translucent colour from the theme's opaque danger colour.
 *
 * Glass danger states differ only by opacity, so the RGB channels must follow
 * `control.danger` in every theme. Throwing on an unparseable base keeps a
 * mistyped palette entry from silently shipping as a non-colour.
 */
function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color)
  if (!hex) {
    throw new Error(`Unsupported glass danger base colour: ${color}`)
  }

  const [red, green, blue] = hex.slice(1).map((channel) => Number.parseInt(channel, 16))
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/** Danger glass states: base colour plus the four interaction opacities. */
function glassDanger(base: string, foreground: string): GlassDangerTokens {
  return {
    background: withAlpha(base, 0.9),
    foreground,
    border: base,
    hoverBackground: withAlpha(base, 0.94),
    activeBackground: withAlpha(base, 0.98),
    selectedBackground: withAlpha(base, 0.98),
    fallbackBackground: base,
  }
}

const lightSyntax = {
  comment: "#008000",
  punctuation: "#393a34",
  number: "#0550ae",
  property: "#ff0000",
  tag: "#800000",
  string: "#a31515",
  className: "#00578a",
  constant: "#0550ae",
  parameter: "#2f3336",
  selector: "#800000",
  attributeName: "#ff0000",
  attributeValue: "#2f3336",
  entity: "#ff0000",
  keyword: "#00009f",
  function: "#393a34",
  statement: "#ff0000",
  placeholder: "#3d8fd1",
  inserted: "#0550ae",
  important: "#e90e90",
  operator: "#393a34",
} as const

const darkSyntax = {
  comment: "#6a9955",
  punctuation: "#b3b3b3",
  number: "#b5cea8",
  property: "#b5cea8",
  tag: "#b5cea8",
  string: "#ce9178",
  className: "#4ec9b0",
  constant: "#9cdcfe",
  parameter: "#9cdcfe",
  selector: "#ce9178",
  attributeName: "#9cdcfe",
  attributeValue: "#ce9178",
  entity: "#d4d4d4",
  keyword: "#569cd6",
  function: "#dcdcaa",
  statement: "#d16969",
  placeholder: "#3d8fd1",
  inserted: "#b5cea8",
  important: "#569cd6",
  operator: "#d4d4d4",
} as const

const light: ThemeTokens = {
  surface: {
    background: "#ffffff",
    secondary: "#f4f4f4",
    tertiary: "#f2f2f2",
    accent: "#f2f2f2",
    accentForeground: "#1a1a1a",
    card: "#ffffff",
    cardForeground: "#0b0b0b",
    popover: "#ffffff",
    popoverForeground: "#0b0b0b",
    modal: "#ffffff",
    menu: "#ffffff",
    sidebar: "#fafafa",
    input: "#e6e6e6",
    overlay: "rgba(0, 0, 0, 0.3)",
  },
  text: {
    primary: "#0b0b0b",
    secondary: "#737373",
    tertiary: "#66778f",
    placeholder: "#a2b2c3",
    link: "#0070f3",
    inverse: "#ffffff",
  },
  control: {
    primary: "#0088ff",
    primaryForeground: "#ffffff",
    hover: "#0062d6",
    active: "#0059c4",
    linkHover: "#0059c4",
    linkActive: "#004aa8",
    disabled: "rgba(120, 120, 120, 0.5)",
    neutral: "#f4f4f4",
    neutralForeground: "#1a1a1a",
    danger: "#e7000b",
    dangerForeground: "#ffffff",
    invalid: "#e7000b",
    selected: "#0088ff",
    focusRing: "#006dcc",
  },
  border: {
    default: "#e6e6e6",
    strong: "#a9a9a9",
    input: "#e6e6e6",
    focused: "#006dcc",
    divider: "#dae1e9",
  },
  feedback: {
    danger: "#e7000b",
    dangerForeground: "#ffffff",
    warning: "#f08a24",
    warningForeground: "#0b0b0b",
    success: "#3ad984",
    successForeground: "#0b0b0b",
    info: "#a0d3e8",
    infoForeground: "#0b0b0b",
  },
  editor: {
    code: "#2f3336",
    codeBackground: "#f4f7fa",
    codeBorder: "#e8ebed",
    quote: "#dae1e9",
    highlight: "#fdea9b",
    highlightForeground: "#111319",
    tableSelection: "rgba(0, 136, 255, 0.1)",
    embedBorder: "#dae1e9",
    scrollbarBackground: "#f4f7fa",
    scrollbarThumb: "#bfc6cc",
    syntax: lightSyntax,
  },
  chart: {
    series1: "#74d4ff",
    series2: "#00a6f4",
    series3: "#0084d1",
    series4: "#0069a8",
    series5: "#00598a",
  },
  sidebar: {
    background: "#fafafa",
    foreground: "#0b0b0b",
    primary: "#0088ff",
    primaryForeground: "#ffffff",
    accent: "#f2f2f2",
    accentForeground: "#1a1a1a",
    border: "#e6e6e6",
    ring: "#006dcc",
  },
  shadow: {
    card: "0 1px 2px rgba(0, 0, 0, 0.05)",
    modal: "0 4px 8px rgba(0, 0, 0, 0.08), 0 30px 40px rgba(0, 0, 0, 0.08)",
    menu: "0 4px 8px rgba(0, 0, 0, 0.08), 0 30px 40px rgba(0, 0, 0, 0.08)",
  },
  glass: {
    background: "rgba(255, 255, 255, 0.72)",
    foreground: "#0b0b0b",
    border: "rgba(0, 0, 0, 0.12)",
    shadow: glassShadow("rgba(0, 0, 0, 0.12)"),
    hoverBackground: "rgba(255, 255, 255, 0.82)",
    activeBackground: "rgba(235, 235, 235, 0.9)",
    selectedBackground: "rgba(235, 235, 235, 0.9)",
    fallbackBackground: "#ffffff",
    blur: "4px",
    saturation: 1.2,
    danger: glassDanger("#e7000b", "#ffffff"),
  },
}

const dark: ThemeTokens = {
  surface: {
    background: "#0b0b0b",
    secondary: "#292929",
    tertiary: "#2e2e2e",
    accent: "#343434",
    accentForeground: "#fafafa",
    card: "#1d1d1d",
    cardForeground: "#fafafa",
    popover: "#1b1b1b",
    popoverForeground: "#fafafa",
    modal: "#1b1b1b",
    menu: "#1b1b1b",
    sidebar: "#1f1f1f",
    input: "rgba(255, 255, 255, 0.15)",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    primary: "#fafafa",
    secondary: "#ababab",
    tertiary: "#66778f",
    placeholder: "#4b5563",
    link: "#62b0ff",
    inverse: "#0b0b0b",
  },
  control: {
    primary: "#0088ff",
    primaryForeground: "#ffffff",
    hover: "#0062d6",
    active: "#0059c4",
    linkHover: "#8ecbff",
    linkActive: "#a5d6ff",
    disabled: "rgba(171, 171, 171, 0.5)",
    neutral: "#292929",
    neutralForeground: "#fafafa",
    danger: "#ff6467",
    dangerForeground: "#0b0b0b",
    invalid: "#ff6467",
    selected: "#0090ff",
    focusRing: "#62b0ff",
  },
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    strong: "#7e7e7e",
    input: "rgba(255, 255, 255, 0.15)",
    focused: "#62b0ff",
    divider: "#2f3336",
  },
  feedback: {
    danger: "#ff6467",
    dangerForeground: "#0b0b0b",
    warning: "#f5be31",
    warningForeground: "#0b0b0b",
    success: "#3ad984",
    successForeground: "#0b0b0b",
    info: "#a0d3e8",
    infoForeground: "#0b0b0b",
  },
  editor: {
    code: "#e6e6e6",
    codeBackground: "#1d202a",
    codeBorder: "rgba(255, 255, 255, 0.1)",
    quote: "#e6e6e6",
    highlight: "#fdea9b",
    highlightForeground: "#111319",
    tableSelection: "rgba(0, 144, 255, 0.1)",
    embedBorder: "rgba(0, 0, 0, 0.5)",
    scrollbarBackground: "#000000",
    scrollbarThumb: "#2f3336",
    syntax: darkSyntax,
  },
  chart: {
    series1: "#74d4ff",
    series2: "#00a6f4",
    series3: "#0084d1",
    series4: "#0069a8",
    series5: "#00598a",
  },
  sidebar: {
    background: "#1f1f1f",
    foreground: "#fafafa",
    primary: "#0088ff",
    primaryForeground: "#ffffff",
    accent: "#2e2e2e",
    accentForeground: "#fafafa",
    border: "rgba(255, 255, 255, 0.1)",
    ring: "#62b0ff",
  },
  shadow: {
    card: "0 1px 2px rgba(0, 0, 0, 0.3)",
    modal: "0 0 0 1px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.3)",
    menu: "0 0 0 1px rgb(34, 40, 52), 0 8px 16px rgba(0, 0, 0, 0.3)",
  },
  glass: {
    background: "rgba(24, 24, 24, 0.72)",
    foreground: "#fafafa",
    border: "rgba(255, 255, 255, 0.16)",
    shadow: glassShadow("rgba(255, 255, 255, 0.16)"),
    hoverBackground: "rgba(38, 38, 38, 0.82)",
    activeBackground: "rgba(50, 50, 50, 0.9)",
    selectedBackground: "rgba(50, 50, 50, 0.9)",
    fallbackBackground: "#181818",
    blur: "4px",
    saturation: 1.2,
    danger: glassDanger("#ff6467", "#0b0b0b"),
  },
}

const pitchBlack: ThemeTokens = {
  ...dark,
  surface: {
    ...dark.surface,
    background: "#000000",
  },
  editor: {
    ...dark.editor,
    codeBackground: "#111319",
  },
  glass: {
    background: "rgba(0, 0, 0, 0.78)",
    foreground: "#fafafa",
    border: "rgba(255, 255, 255, 0.18)",
    shadow: glassShadow("rgba(255, 255, 255, 0.18)"),
    hoverBackground: "rgba(20, 20, 20, 0.86)",
    activeBackground: "rgba(32, 32, 32, 0.92)",
    selectedBackground: "rgba(32, 32, 32, 0.92)",
    fallbackBackground: "#000000",
    blur: "4px",
    saturation: 1.2,
    danger: glassDanger("#ff6467", "#0b0b0b"),
  },
}

export const exuiTokens: ExuiTokenContract = {
  themes: {
    light,
    dark,
    pitchBlack,
  },
  density: {
    standard: {
      controlHeight: "2.25rem",
      controlPaddingInline: "0.75rem",
      controlGap: "0.375rem",
      iconSize: "1rem",
      controlRadius: "0.625rem",
    },
    compact: {
      controlHeight: "2rem",
      controlPaddingInline: "0.5rem",
      controlGap: "0.25rem",
      iconSize: "1rem",
      controlRadius: "0.5rem",
    },
  },
  typography: {
    fontFamily: "'Outfit Variable', -apple-system, BlinkMacSystemFont, Inter, 'Segoe UI', Roboto, Oxygen, sans-serif",
    fontFamilyMono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
    fontFamilyEmoji: "Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Segoe UI, Twemoji Mozilla, Noto Color Emoji, Android Emoji",
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    bodyFontSize: "0.875rem",
    bodyLineHeight: "1.25rem",
    smallFontSize: "0.75rem",
    smallLineHeight: "1rem",
  },
  radii: {
    none: "0",
    small: "0.375rem",
    medium: "0.5rem",
    large: "0.625rem",
    extraLarge: "0.875rem",
    full: "9999px",
  },
  shadows: {
    small: "0 1px 2px rgba(0, 0, 0, 0.05)",
    medium: "0 4px 8px rgba(0, 0, 0, 0.08)",
    large: "0 16px 40px rgba(0, 0, 0, 0.12)",
    focus: "0 0 0 3px rgba(0, 136, 255, 0.25)",
    invalid: "0 0 0 3px rgba(231, 0, 11, 0.25)",
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

deepFreeze(exuiTokens)
