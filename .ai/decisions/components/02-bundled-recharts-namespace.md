# 图表原语经内置 Recharts 命名空间导出

最后更新：2026-09-18

状态：已接受
模块：components
日期：2026-09-09
来源：`packages/components/src/components/ui/chart.tsx`、`packages/components/README.md`

背景：Recharts 被编译进组件产物后，图表原语存在两份可能来源：产物内置的那份，以及消费者自行从 npm 安装的 `recharts`。两者不是同一个模块实例，`ChartContainer` 提供的 context 在另一份里读不到。消费者的图表会照常渲染，但 `ChartTooltip` 与 `ChartLegend` 的内容静默消失——没有异常，只有缺失的内容，排查成本很高。

决策：从公共根入口额外导出内置 Recharts 的公开 API，作为命名空间 `Recharts`；消费者统一以 `const { BarChart, Bar, XAxis } = Recharts` 取得图表原语，不再单独安装 `recharts`。`ChartTooltip`、`ChartLegend` 及其内容组件继续从根入口导出，`ChartConfig` 等类型同样可用。

理由：命名空间导出让图表原语、`ChartContainer` 与 tooltip / legend 必定来自同一份内置代码与同一套 context，从结构上消除静默失效的路径；消费者也因此不需要再多装一份 Recharts，并直接获得与内置版本一致的类型。迁移规则简单可机械化：把 `from "recharts"` 的导入换成命名空间解构。

影响：产物体积增加整个 Recharts 公开 API。已有图表需要按迁移说明改写导入方式；漏改不会有编译错误，只会丢失 tooltip 与 legend 内容，因此该行为由浏览器门禁断言兜底。Tokens 仍然隔离在 `@exre/exui/tokens` 之后，不受影响。

重新审视条件：Recharts 或其后继者提供跨实例共享 context 的机制时；或引入按需子路径导出使命名空间不再是唯一可行做法时。

证据：`packages/components/src/index.ts` 对 `components/ui/chart` 的转发与根入口导出的 `Recharts`；`packages/components/src/components/ui/chart.tsx` 的 context 提供方；`packages/components/README.md` 的 Charts and migration 段及其"独立安装的 Recharts 副本会静默丢失内容"的说明；`scripts/verify-packages.mjs` 的 React 消费者 fixture 以 `Recharts` 解构图表原语并搭配 `ChartTooltipContent` / `ChartLegendContent`；`scripts/verify-react-browser.mjs` 对图例内容与 hover 后 tooltip 取值的浏览器断言；`scripts/verify-packages.mjs` 把 `recharts` 列入禁止进入 tokens-only 依赖树的包集合。
