---
"@exre/exui": minor
---

Export the bundled `Recharts` namespace from `@exre/exui` so chart primitives share state with ExUI's `ChartTooltip` and `ChartLegend`. Migrate primitive imports from a separate `recharts` package to `const { BarChart, Bar } = Recharts`; mixing independently installed charts with ExUI's bundled tooltip or legend can leave their content missing. No additional component dependency is required, and framework-neutral tokens remain available without React.
