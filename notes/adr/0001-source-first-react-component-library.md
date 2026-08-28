# Source-first React component library

Exre UI is a source-first React component library inside a private pnpm workspace, using Vite, shadcn/ui with the Radix base, and preset `b5Kc86Jl4`. The publishable component package keeps the full shadcn/ui source in `packages/components/src/components/ui` so Exre can own and evolve its brand components while still distributing the stable `@exre/exui` package entry and stylesheet.

Framework-neutral visual values are owned by the sibling `@exre/exui-tokens` package. The private Showcase is a separate workspace and consumes components only through the public package boundary.
