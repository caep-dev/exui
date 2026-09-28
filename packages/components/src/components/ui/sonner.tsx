import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { Ban, CircleAlert, CircleCheck, Info, LoaderCircle } from "lucide-react"
import { useOptionalTheme } from "../theme-provider"

// Theme resolution: an explicit `theme` prop wins, then the surrounding
// ExUI ThemeProvider (read via the optional helper so this component
// stays mountable without a provider), then a `system` fallback. The
// public `useTheme` hook still throws outside <ThemeProvider /> — this
// component deliberately does not.
const Toaster = ({ theme: explicitTheme, ...props }: ToasterProps) => {
  const providerTheme = useOptionalTheme()
  const resolvedTheme = explicitTheme ?? providerTheme ?? "system"

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheck
            aria-hidden="true"
            className="size-4 fill-current [&>circle]:stroke-none"
            style={{ color: "var(--exui-feedback-success)", stroke: "var(--exui-feedback-success-foreground)" }}
          />
        ),
        info: (
          <Info
            aria-hidden="true"
            className="size-4 fill-current [&>circle]:stroke-none"
            style={{ color: "var(--primary)", stroke: "var(--primary-foreground)" }}
          />
        ),
        warning: (
          <CircleAlert
            aria-hidden="true"
            className="size-4 fill-current [&>circle]:stroke-none"
            style={{ color: "var(--exui-feedback-warning)", stroke: "var(--exui-feedback-warning-foreground)" }}
          />
        ),
        error: (
          <Ban
            aria-hidden="true"
            className="size-4 fill-current [&>circle]:stroke-none"
            style={{ color: "var(--exui-feedback-danger)", stroke: "var(--exui-feedback-danger-foreground)" }}
          />
        ),
        loading: (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin"
            strokeWidth={4}
            style={{ color: "var(--primary)" }}
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

// Re-export `toast` next to the Toaster so the package root exposes the
// exact Sonner instance bundled into this file: Vite collapses both uses of
// the "sonner" specifier into a single bundled module, so the Toaster and
// the re-exported `toast` see one queue. Keep this re-export inside the
// component file: the declaration then lands in
// types/components/ui/sonner.d.ts, which the exui-usage updater classifies
// into the Sonner family (same pattern as chart.tsx re-exporting Recharts).
export { Toaster, toast }
