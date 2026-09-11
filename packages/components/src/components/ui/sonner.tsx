import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
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
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
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
