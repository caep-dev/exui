# 第 1 轮全工程审查

结论：CHANGES_REQUIRED。审查候选：`5743c17080be1e1e71892402b8eb4b28ae0d6054`，分支 `chore/review-optimize-20261005`，审查期间源码工作树干净。

## R1-01 — P1：图表配置可通过 SSR 输出执行脚本

位置：`packages/components/src/components/ui/chart.tsx:95-105`，`ChartContainer` 第 73 行调用 `ChartStyle`。

`ChartStyle` 将配置的 color/theme、key 和 id 拼成 CSS，经 `<style dangerouslySetInnerHTML>` 输出。当消费者将未经处理的外部配置传入公开 `ChartContainer` 或 `ChartStyle`，颜色值中的 HTML 样式终止序列可以打断样式节点。审查 Agent 用当前公开构建产物的 `renderToStaticMarkup` 复现原样脚本输出，并在 Chromium `page.setContent` 后观察到脚本执行。

修复方向：消除未经转义的 style innerHTML，处理 HTML 样式终止序列以及 CSS 标识符和值的边界。增加公开 ChartContainer 的恶意配置 SSR/浏览器反例，并验证正常主题色。

## R1-02 — P2：watch 监听生成 CSS 导致循环构建

位置：`scripts/watch.mjs:82-90`；生成器 `packages/tokens/scripts/generate-css.mjs:390`。

Windows `fs.watch` 回调提供相对监听目录的 `filename`，但代码将其传入 `path.relative(absoluteDirectory, filename)`，导致 `style.css` 忽略条件无法匹配。隔离 Windows 临时目录复现返回 `filename: "style.css"` 且 `ignored: false`。Token build 每次写回生成 CSS，监听器再次排队 Token 和组件构建，形成循环。

修复方向：正确处理回调相对路径；回归测试证明生成 CSS 不触发重建、一次源修改只触发一轮 Token 与组件构建。

## 覆盖与限制

已检查公开包入口与 manifest、forms 状态/异步校验/步骤/控件、Chart/Glass/ExMessage/Theme、Token 生成校验、Showcase 测试、构建和 pack 契约、watch、CI/发布脚本及消费文档。静态分析脚本未覆盖 TSX/mjs，人工补查关键路径；其两处 RegExp.exec 为误报。未发现其他足够确证的 P0–P3。

为保持候选冻结，审查阶段未运行写共享产物的项目门禁；未查询远端 CI。现有 Chart 固定安全配置测试未覆盖 SSR 恶意输入，watch 缺少回归测试。下一阶段由优化 Agent 独立核实修复，再执行第 2 轮复查。
