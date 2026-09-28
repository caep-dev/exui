# Exre UI

最后更新：2026-09-27

Exre UI 是 Exre 品牌界面的共享 React 组件库，由本仓库发布。它存在的意义是让其他 UI 应用依赖一个品牌自有的组件包，而不是各自复制组件代码。

## Language

**输入草稿（Input Draft）**:
用户正在编辑的 schema 输入值。控件与实例读写使用这个类型；成功解析后的输出只用于提交。
_Avoid_: parsed form state、提交数据副本

**校验范围（Validation Scope）**:
按原输入路径声明的字段和额外依赖所形成的独立校验边界。局部通过不表示完整表单通过。
_Avoid_: 自动 pick、部分整表校验

**表单实例（Form Instance）**:
由 ExUI 创建并供配置式、组合式及 hooks 共用的草稿操作入口。
_Avoid_: 外部 RHF 实例、另一份字段 store

**Exre UI（Exre UI）**:
从本仓库发布的、品牌自有的组件库。
_Avoid_: exui app、Vite app、demo app

**消费型 UI 应用（Consuming UI App）**:
一个独立的前端项目，依赖 Exre UI 获取共享组件与样式。
_Avoid_: downstream project、external app

**源组件（Source Component）**:
以可编辑源码形式保存在本仓库中的组件，尤其是 `packages/components/src/components/ui` 下的文件。
_Avoid_: vendored widget、generated blob

**UI 组件（UI Component）**:
位于 `packages/components/src/components/ui` 下的单个基础控件或 shadcn/ui 源组件。
_Avoid_: 复杂组件、业务组件

**控件组件（Control Component）**:
位于 `packages/components/src/components/controls` 下的组合式输入控件，例如日期选择器、区间选择器、可搜索下拉、颜色选择器或文件上传。
_Avoid_: UI 组件、复杂组件

**模式组件（Pattern Component）**:
位于 `packages/components/src/components/patterns` 下的、可复用且与业务无关的交互模式，例如命令对话框、确认对话框、数据工具栏或空状态模式。
_Avoid_: 页面组件、业务流程

**布局组件（Layout Component）**:
位于 `packages/components/src/components/layouts` 下的页面或应用结构组件，例如应用外壳、页面头部或分栏面板。
_Avoid_: UI 组件、模式组件

**品牌主题（Brand Theme）**:
通过组件库样式表与 shadcn/ui 的 CSS 变量应用的一套共享视觉 Token。
_Avoid_: skin、仅指 preset

**包入口（Package Entry）**:
包根与其声明的子路径所暴露的公开导入面，例如 `@exre/exui`、`@exre/exui/style.css` 与 `@exre/exui/tokens`。
_Avoid_: barrel file、index file

**组件配方（Component Recipe）**:
一组框架中立的组件几何与状态取值（高度、内边距、间距、图标、圆角等），以数据形式随 Token 一起发布，供非 React 消费者直接读取或在 React 组件中经由 CSS 变量落地。见 [[tokens/01-rem-scalable-lengths]]。
_Avoid_: 组件样式表、主题配置

**密度（Density）**:
同一套组件在标准与紧凑两档下切换控件几何的机制，通过 `density` Token 集合与 `.density-compact` 变量块实现，与主题正交。
_Avoid_: 尺寸模式、紧凑主题

**玻璃材质（Glass Material）**:
由 `glass` 布尔属性或 `ex-glass` 类开启的共享半透明表面：半透明底色、背景模糊、饱和调整与不改变盒尺寸的 inset 边缘，可选叠加 SVG 折射。
_Avoid_: 毛玻璃特效、glassmorphism 组件、液体玻璃

**基础材质与增强（Base Material / Enhancement）**:
同一种材质的两个层次。基础材质是完全由 CSS 提供的半透明与模糊，任何时候都可用；增强是依赖 SVG 滤镜与每个 document 的种子的折射，只有资格检查通过时才生效。
_Avoid_: 回退材质、高级模式、降级层

**材质标记（Material Marker）**:
开启材质的那个标记本身：普通表面是 `ex-glass` 类，委托型表面（如 `Bubble`）是 `data-exui-glass-delegate` 属性。它以空白分词整体匹配，不从 class 字符串里推测。
_Avoid_: glass 类名、样式钩子、玻璃开关

**滤镜种子（Filter Seed）**:
`GlassSeed` 渲染的静态 SVG 滤镜定义。每个 document 一个；它不是 provider，不渲染 children，不占布局，也不提供调参入口。
_Avoid_: Provider、滤镜容器、玻璃根节点
