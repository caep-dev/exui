# ExItem 展示容器与表单字段状态分离

最后更新：2026-09-29

状态：已接受，已实现
模块：components
日期：2026-09-29
来源：[ExItem 布局设计](../../../.notes/ex-form/specs/2026-09-29-ex-item-layout-design.md)、[实现 RFC](../../../.notes/ex-form/rfcs/ex-item-layout-rfc.md)

背景：实施前的 `FormItem` 依赖同一 `Form` 实例的上下文，并通过表单绑定层管理控件值和错误；它的标题、说明与布局外壳因此不能直接用于非表单输入项。`Form` / `ExForm` 已支持整体 `vertical`、`horizontal`、`inline` 布局，但当时横向字段的切换依据整个表单容器宽度，多列中的单个字段仍可能过窄。

决策：新增不持有字段状态的公开 `ExItem`，由 `FormItem` 组合它。`ExItem` 只负责标题、说明、控件容器、跨度和 `vertical` / `horizontal` 排列；单项显式布局覆盖表单默认布局，`inline` 只用于外层表单排列。横向 Item 根据自身宽度转为上下排列。单个直接子节点 ExUI `Input` 可以省略 ID，由 `ExItem` 建立标题和说明关联；自定义或多控件场景保持显式关联。表单值、校验、错误与焦点导航继续由 `FormItem` 和现有表单实例负责。完整接口与实施边界见来源 RFC。

理由：展示复用不应要求消费者创建表单实例，也不应让独立 Item 引入第二套字段状态。让 `FormItem` 复用同一展示结构，可避免标题、说明与响应式规则在表单内外漂移。逐 Item 宽度判断适用于多列表单、窄 Dialog 与独立使用场景。

考虑过让 `ExItem` 可选地绑定表单字段，或复制一个与 `FormItem` 相似的独立展示组件。前者把 `form`、`name`、控件配置与自由 children 混成分支式接口；后者需要长期同步两套展示及可访问性行为，因此均未采用。

代价与边界：需要展示专用布局上下文和仅针对单个直接 `Input` 的属性补全。包装控件、自定义控件和多个控件不会被自动探测。更窄的单个网格列可能比旧样式更早换成上下布局，这是预期视觉变化。

重新审视条件：独立 Item 需要管理自身校验状态，或真实消费场景证明单直接 `Input` 的受限自动关联不足以提供可访问用法时，应重新评估展示与绑定边界。

证据：公开入口与展示边界见 `packages/components/src/index.ts`、`packages/components/src/components/patterns/ex-item.tsx`、`form-item.tsx`、`form.tsx` 和 `packages/components/src/form.css`；布局、关联与服务端渲染行为见 `packages/showcase/src/showcase/ExItem.vrt.test.tsx`，打包消费者边界见 `scripts/form-consumer-fixture.mjs`。目标行为与取舍见上述设计和 RFC。
