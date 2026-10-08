# 图表样式与外部配置边界

最后更新：2026-10-05

图表配置会生成内联样式，SSR 输出随后由 HTML 解析器读取。因此仅验证客户端 CSS 是否有效不能证明 SSR 安全：颜色字符串中的 HTML 样式终止序列可能先被 HTML 解析器处理。

- 图表 id 和系列 key 必须经过 CSS 转义才能进入选择器及自定义属性名；包含标点的合法 key 仍对应原有自定义属性名。
- 颜色支持命名色、颜色函数、`var()` 和 `color-mix()`，但具有 HTML/CSS 结构分隔符、注释、转义、引号或不平衡括号的值会被忽略。调用方不应依赖这些值生成声明。
- 安全回归必须经过公开 `ChartContainer` 的 SSR 输出，再由真实浏览器解析，同时验证脚本未执行、外部元素未获得注入的规则、正常主题配色仍生效。只断言字符串不包含脚本，无法覆盖 CSS 越界和合法配置兼容性。

证据：`packages/components/src/components/ui/chart.tsx`、`scripts/chart-style.test.mjs`。公开消费用法继续由组件 README 与 `skills/exui-usage/references/components/Chart.md` 维护。
