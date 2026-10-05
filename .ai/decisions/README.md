# 决策索引

最后更新：2026-09-29

本目录记录已接受的技术决策。已落地的决策由代码、配置、CI 或变更记录印证；已批准但尚未实施的决策明确标为“待实现”，不能据此推断当前公开包行为。每条记录说明背景、被否的备选方案、理由、代价与重新审视条件；已落地的结构本身写在 `../architectures/` 下，这里不重复。

编号在模块内从 `01` 开始，不复用。引用格式为 `[[<模块>/<NN>-<kebab-title>]]`。

## tokens

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[tokens/01-rem-scalable-lengths]] | 内建可缩放长度统一使用 rem，固定效果保持像素 | 已接受 | 2026-09-16 |
| [[tokens/02-commonjs-compatibility-entry]] | Token 提供 CommonJS 兼容入口 | 已接受 | 2026-08-28 |
| [[tokens/03-foundation-references-in-emitted-css]] | 产物样式表把 foundation 引用生成为 CSS 变量引用 | 已接受 | 2026-09-18 |

## components

表单模块沿用本模块既有打包边界；已落地的结构与状态所有权见 [表单结构](../architectures/components/forms.md)，生命周期约束见 [表单任务](../knowledge/components/forms-lifecycle.md)。ExItem 的决策已实施；其详细 RFC 保留在 `.notes/ex-form/rfcs/`。

| 编号 | 决策 | 状态 | 日期 |
| --- | --- | --- | --- |
| [[components/01-bundle-implementation-dependencies]] | 组件实现依赖编译进产物，React 保持可选 peer | 已接受 | 2026-09-09 |
| [[components/02-bundled-recharts-namespace]] | 图表原语经内置 Recharts 命名空间导出 | 已接受 | 2026-09-09 |
| [[components/03-docs-theme-subpath]] | Fumadocs UI 只提供主题子路径，不做组件包装 | 已接受 | 2026-09-18 |
| [[components/04-glass-capability-gating]] | 增强资格用运行时语法检查，不维护浏览器能力表 | 已接受 | 2026-09-21 |
| [[components/05-glass-edge-from-inset-shadow]] | 材质边缘由 inset shadow 提供，不接管 `border-color` | 已接受 | 2026-09-21 |
| [[components/06-single-ex-message-host]] | 全局消息复用单个 Sonner 宿主 | 已接受 | 2026-09-28 |
| [[components/07-ex-item-presentation-boundary]] | ExItem 展示容器与表单字段状态分离 | 已接受，已实现 | 2026-09-29 |

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
