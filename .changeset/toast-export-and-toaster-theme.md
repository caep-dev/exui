---
"@exre/exui": minor
---

- Export `toast` from the `@exre/exui` package root. The exported `toast` is the exact Sonner instance bundled into `<Toaster />`, so notifications triggered from anywhere in the application render in the mounted toaster, and the bundled Sonner API travels with it: the direct `toast(message, data)` call plus `toast.success`, `toast.error`, `toast.warning`, `toast.info`, `toast.message`, `toast.loading`, `toast.promise`, `toast.custom`, and `toast.dismiss`, with types served from the bundled Sonner declarations. Consumers should not install `sonner` themselves: an independently installed copy keeps its own toast state, and toasts triggered through it never reach the bundled `<Toaster />` — they fail silently, with no error and nothing rendered. Import notifications from the package root instead, the same way chart consumers use the bundled `Recharts` namespace:

  ```tsx
  import { toast, Toaster } from "@exre/exui"
  ```

- `<Toaster />` now resolves its theme with an explicit priority: a `theme` prop passed to `<Toaster />` always wins; without one, the toaster follows the surrounding ExUI `ThemeProvider` (`light` / `dark` / `system`) and updates live when the provider theme or the system color scheme changes, without remounting; with no provider at all, it falls back to `system` and mounts without throwing. The toaster no longer reads `next-themes`; that dependency has been removed from the package. The public `useTheme` hook is unchanged: it still throws when called outside a `ThemeProvider`.
