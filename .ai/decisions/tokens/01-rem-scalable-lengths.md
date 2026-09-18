# 内建可缩放长度统一使用 rem

最后更新：2026-09-18

状态：已接受
模块：tokens
日期：2026-09-16
来源：`.notes/rem-sizing/specs/2026-09-15-rem-sizing-design.md`、`.notes/rem-sizing/rfcs/rem-sizing-rfc.md`、`packages/tokens/scripts/token-length-policy.mjs`

背景：可缩放尺寸原本是硬编码像素——density 的控件高度、内边距、间距与图标，字号与行高，普通圆角，以及六类组件配方的全部长度字段。应用无法通过自己的根字号让这些尺寸跟着缩放，也没有统一的缩放开关；若为缩放另建入口或另设缩放因子，就会长期维护两套样式契约。

决策：把全部可缩放长度改写为以 16px 根字号为基准的 rem 字面值（`Npx` 写为 `N / 16 rem`，保留必要精度），`0` 统一为无单位 `0`，负值保留符号。公共类型 `RecipeLength` 扩展为 `${number}rem | ${number}px | "0"`，而每个内建可缩放值只允许是 rem 或 `0`。固定效果保持像素语义：细边框与分隔线、焦点环与阴影及其描边、`radii.full` 胶囊圆角、一像素边缘补偿，以及数字型定位参数 `sideOffset` / `alignOffset`。ExUI 不设置根字号、不声明缩放变量、不添加缩放媒体查询或运行时监听，也不增加 RWD 专用入口。

理由：缩放的控制权属于应用，组件只声明"相对根字号"的关系，避免库与应用争夺同一个全局属性。在已有根字号的应用里，`rem` 是唯一不需要额外 API 就能生效的机制；`--ui-scale` 这类缩放因子会与根字号重复控制同一件事，并引入计算表达式；双入口（`/rwd/*`）则要求两套样式契约长期同步。数字型定位参数保持上游像素语义，可以不改动公开参数类型，也不用为它们增加根字号监听。

影响：16px 根字号下渲染结果与迁移前逐值一致；把根字号设为其他值的应用在升级后组件外观会改变，这是已接受的兼容性变化。第三方内部几何不随之缩放——Sonner 的 toast 与 Recharts 的坐标轴保持各自的固定尺寸，而 ExUI 自有的图例、tooltip 与图标内容会缩放。CI 与打包消费者门禁里出现了对具体 rem 值与像素例外的硬编码断言，改动这些值必须同步更新多处。

重新审视条件：需要支持同一页面内两套缩放基准时；需要把根字号缩放扩展到第三方内部尺寸时；或 rem 的 16px 基准本身需要改变时。

证据：`packages/tokens/scripts/token-length-policy.mjs` 及其 `*.test.mjs` 把"内建可缩放长度必须是 rem 或 0"和固定像素例外清单（`radii.none`、`radii.full`、menu separator 厚度）固化为可执行策略；`packages/tokens/scripts/validate-tokens.mjs`；`packages/tokens/recipeTypes.ts` 的 `RecipeLength`；`scripts/verify-packages.mjs` 中同时断言 `2.25rem` / `0.5rem` / `0.875rem` / `0.625rem` / `0.125rem` 与 `9999px` / `0` / `1px` / 固定焦点环的 tokens-only 运行时检查；`packages/tokens/README.md` 的 Length units 段；根 `README.md` 的缩放说明；`packages/showcase/src/showcase/RemSizing.vrt.test.tsx` 的 16 / 21.328 / 32px 矩阵与 "never sets a root font size of its own" 用例；设计文档中列出的两个被否方案。
