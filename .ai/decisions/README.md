# 决策索引

最后更新：2026-09-18

本目录记录已被仓库证据（代码、配置、CI 或变更记录）印证为**已落地**的技术决策。每条记录说明背景、被否的备选方案、理由、代价与重新审视条件；产生的结构本身写在 `../architectures/` 下，这里不重复。

编号在模块内从 `01` 开始，不复用。引用格式为 `[[<模块>/<NN>-<kebab-title>]]`。

## tokens

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[tokens/01-rem-scalable-lengths]] | 内建可缩放长度统一使用 rem，固定效果保持像素 | 已接受 | 2026-09-16 |
| [[tokens/02-commonjs-compatibility-entry]] | Token 提供 CommonJS 兼容入口 | 已接受 | 2026-08-28 |
| [[tokens/03-foundation-references-in-emitted-css]] | 产物样式表把 foundation 引用生成为 CSS 变量引用 | 已接受 | 2026-09-18 |

## components

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[components/01-bundle-implementation-dependencies]] | 组件实现依赖编译进产物，React 保持可选 peer | 已接受 | 2026-09-09 |
| [[components/02-bundled-recharts-namespace]] | 图表原语经内置 Recharts 命名空间导出 | 已接受 | 2026-09-09 |
| [[components/03-docs-theme-subpath]] | Fumadocs UI 只提供主题子路径，不做组件包装 | 已接受 | 2026-09-18 |

## showcase

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[showcase/01-consume-public-entries-only]] | Showcase 只通过公开入口消费组件库 | 已接受 | 2026-09-09 |
| [[showcase/02-windows-pinned-visual-baselines]] | 视觉基线与 Windows 运行平台绑定并提交进仓库 | 已接受 | 2026-09-18 |

## release

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[release/01-single-public-package]] | 只发布 `@exre/exui` 一个公共包 | 已接受 | 2026-09-09 |
| [[release/02-tag-driven-oidc-release]] | 合并即发布：标签驱动的 OIDC 发布流水线 | 已接受 | 2026-09-09 |
| [[release/03-packed-consumer-gates]] | 发布前以 workspace 外的打包消费者门禁验收 | 已接受 | 2026-09-09 |
