// T6 independent packed-consumer scenario app (test-engineer fixture).
// Mounted per `?case=` query parameter. Scenario pages are independent
// assertions written by the test engineer; `?case=example/<name>` mounts the
// real skill examples byte-for-byte (copied from skills/exui-usage/examples).
import * as React from "react"
import { createRoot } from "react-dom/client"
import { Button, ThemeProvider, Toaster, toast, useTheme } from "@exre/exui"
import { exuiTokens, componentRecipes } from "@exre/exui/tokens"
import "@exre/exui/style.css"

import SidebarLayout from "./examples/sidebar-layout"
import DialogUsage from "./examples/dialog-usage"
import ComboboxSingle from "./examples/combobox-single"
import ComboboxMultiple from "./examples/combobox-multiple"
import CalendarSingle from "./examples/calendar-single"
import CalendarRange from "./examples/calendar-range"
import TabsControlled from "./examples/tabs-controlled"
import TooltipToolbar from "./examples/tooltip-toolbar"
import MessageScrollerUsage from "./examples/message-scroller-usage"
import SonnerNotifications from "./examples/sonner-notifications"
import ThemeProviderUsage from "./examples/theme-provider-usage"
import SelectUsage from "./examples/select-usage"

const EXAMPLES: Record<string, React.ComponentType> = {
  "sidebar-layout": SidebarLayout,
  "dialog-usage": DialogUsage,
  "combobox-single": ComboboxSingle,
  "combobox-multiple": ComboboxMultiple,
  "calendar-single": CalendarSingle,
  "calendar-range": CalendarRange,
  "tabs-controlled": TabsControlled,
  "tooltip-toolbar": TooltipToolbar,
  "message-scroller-usage": MessageScrollerUsage,
  "sonner-notifications": SonnerNotifications,
  "theme-provider-usage": ThemeProviderUsage,
  "select-usage": SelectUsage,
}

// ---------------------------------------------------------------------------
// case=api — notification public API from the package root
// ---------------------------------------------------------------------------
let trackedId: string | number | undefined

function ApiCase() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="t6-api">
      <main style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Notification public API</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={() => toast.success("Saved successfully")}>Show success</Button>
          <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
            Show error
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const id = toast.loading("Uploading…")
              setTimeout(() => {
                toast.success("Upload complete", { id })
              }, 2000)
            }}
          >
            Show updating
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              trackedId = toast("Trackable message")
            }}
          >
            Show tracked
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (trackedId !== undefined) {
                toast.dismiss(trackedId)
              }
            }}
          >
            Dismiss tracked
          </Button>
        </div>
      </main>
      <Toaster position="bottom-right" duration={60000} />
    </ThemeProvider>
  )
}

// ---------------------------------------------------------------------------
// case=inherit — provider theme flows into the Toaster, system follows OS
// ---------------------------------------------------------------------------
function ThemeButtons() {
  const { theme, setTheme } = useTheme()
  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" onClick={() => setTheme("light")}>Set light</Button>
        <Button size="sm" onClick={() => setTheme("dark")}>Set dark</Button>
        <Button size="sm" onClick={() => setTheme("system")}>Set system</Button>
        <Button size="sm" variant="secondary" onClick={() => toast.info("Theme probe")}>
          Show toast
        </Button>
      </div>
      <p data-testid="provider-theme">provider: {theme}</p>
    </main>
  )
}

function InheritCase() {
  // Sonner v2 only mounts its themed <ol data-sonner-toaster> once at least
  // one toast is active. Fire a persistent probe on mount so the theme-
  // assertion scenarios have a stable anchor for data-sonner-theme.
  React.useEffect(() => {
    toast.info("Theme probe", { duration: Infinity })
  }, [])
  return (
    <ThemeProvider defaultTheme="system" storageKey="t6-inherit">
      <ThemeButtons />
      <Toaster />
    </ThemeProvider>
  )
}

// ---------------------------------------------------------------------------
// case=explicit — an explicit Toaster theme beats the provider
// ---------------------------------------------------------------------------
function ExplicitCase() {
  React.useEffect(() => {
    toast.info("Explicit probe", { duration: Infinity })
  }, [])
  return (
    <ThemeProvider defaultTheme="dark" storageKey="t6-explicit">
      <ThemeButtons />
      <Toaster theme="light" />
    </ThemeProvider>
  )
}

// ---------------------------------------------------------------------------
// case=noprovider — a lone Toaster falls back to system
// ---------------------------------------------------------------------------
function NoProviderCase() {
  React.useEffect(() => {
    toast.info("Standalone toast", { duration: Infinity })
  }, [])
  return (
    <>
      <main style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Toaster without provider</h1>
        <div>
          <Button onClick={() => toast.info("Manual toast")}>Show toast</Button>
        </div>
      </main>
      <Toaster position="bottom-right" />
    </>
  )
}

// ---------------------------------------------------------------------------
// case=usethrow — public useTheme keeps throwing outside a provider
// ---------------------------------------------------------------------------
class RethrowBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error !== null) {
      return <p data-testid="usethrow-error">{String(this.state.error)}</p>
    }
    return this.props.children
  }
}

function ThrowingComponent() {
  useTheme()
  return null
}

function UseThrowCase() {
  return (
    <RethrowBoundary>
      <ThrowingComponent />
    </RethrowBoundary>
  )
}

// ---------------------------------------------------------------------------
// case=tokens — the tokens subpath works inside a browser bundle
// ---------------------------------------------------------------------------
function TokensCase() {
  return (
    <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
      <h1 style={{ fontSize: 16, fontWeight: 600 }}>Token subpath</h1>
      <p data-testid="token-top-keys">{Object.keys(exuiTokens).join(",")}</p>
      <p data-testid="recipe-keys">{Object.keys(componentRecipes).join(",")}</p>
      <p data-testid="token-themes">{Object.keys(exuiTokens.themes).join(",")}</p>
    </main>
  )
}

// ---------------------------------------------------------------------------
// app switcher
// ---------------------------------------------------------------------------
function App() {
  const params = new URLSearchParams(window.location.search)
  const testcase = params.get("case") ?? ""
  if (testcase === "api") return <ApiCase />
  if (testcase === "inherit") return <InheritCase />
  if (testcase === "explicit") return <ExplicitCase />
  if (testcase === "noprovider") return <NoProviderCase />
  if (testcase === "usethrow") return <UseThrowCase />
  if (testcase === "tokens") return <TokensCase />
  if (testcase.startsWith("example/")) {
    const Example = EXAMPLES[testcase.slice("example/".length)]
    if (Example !== undefined) return <Example />
  }
  return <p data-testid="unknown-case">Unknown case: {testcase}</p>
}

createRoot(document.getElementById("root")!).render(<App />)
