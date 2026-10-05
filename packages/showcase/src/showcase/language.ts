import * as React from "react"

export type ShowcaseLanguage = "en" | "zh-CN"

export const storageKey = "exui-showcase-language"

export const LanguageContext = React.createContext<{
  language: ShowcaseLanguage
  setLanguage: (language: ShowcaseLanguage) => void
}>({ language: "en", setLanguage: () => {} })

export function initialLanguage(): ShowcaseLanguage {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === "en" || stored === "zh-CN") return stored
  } catch {
    // Storage can be unavailable in embedded or restricted browsers.
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
}

export function useShowcaseLanguage() {
  return React.useContext(LanguageContext)
}
