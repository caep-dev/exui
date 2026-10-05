# RFC: 独立 ExItem 与表单布局覆盖

状态：草案，待审阅
日期：2026-09-29
来源：[已批准的 ExItem 布局设计](../specs/2026-09-29-ex-item-layout-design.md)

## 决策摘要

在唯一公开包 `@exre/exui` 中增加仅负责展示的 `ExItem`。`FormItem` 组合它，保留原有表单绑定和错误行为。`Form` / `ExForm` 继续以 `vertical | horizontal | inline` 决定整体排列；Item 以可选 `vertical | horizontal` 覆盖内部排列。横向 Item 按自身可用宽度自动转为纵向。单个直接子节点 ExUI `Input` 可省略 ID，由 `ExItem` 自动建立标题和说明关联。

这是公开 React API 与 CSS 行为变更，不涉及数据持久化或服务端迁移。实现和验证集中于组件包、Showcase、独立打包消费者与公开用法文档。

## 背景与约束

当前 `FormShell` 将 `layout` 放入 `FormContext` 并标记在 `.ex-form-grid`；`FormItem` 绑定字段后渲染 `Field`、标题、描述、控件与错误。`FormItem` 必须位于同一表单实例的上下文内，因而不能直接用于非表单场景。`FormFieldBase` 已有 `label`、`description`、`colSpan`、`noStyle`，表单整体已有三种布局。当前横向字段在整个表单容器达到 `30rem` 后转成两列；多列中的单个字段仍可能过窄。证据：`packages/components/src/components/patterns/{form,form-item,ex-form}.tsx`、`src/lib/forms/types.ts`、`src/form.css`。

`Input` 是将收到的 DOM 属性转发给原生 `<input>` 的公开组件，因此为单个直接子节点补入 `id` 与 `aria-describedby` 可由组件自身完成。现有 `FormItem` 的 ID、错误 ID、字段 ref 和表单协调器仍为表单行为的权威来源。`FormList.layout` 目前控制列表内部行容器；本 RFC 不改变其含义。

目标是让表单外的 Item 与表单内普通字段共享展示结构、让显式单项布局覆盖表单默认值，并在窄列和 Dialog 内按 Item 宽度换行。非目标包括 Ant Design 属性兼容、任意 children 的自动字段绑定、表单实例或校验层改造，以及让 `ExItem` 创建父网格。

## 公开契约

从根入口导出 `ExItem`、`ExItemProps`、`ExItemLayout`、`ExItemSpan`。类型位于组件包的公开类型边界；不新增子路径。

```ts
export type ExItemLayout = "vertical" | "horizontal"
export type ExItemSpan = 1 | 2 | 3 | 4 | "full"

export interface ExItemProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  title?: React.ReactNode
  desc?: React.ReactNode
  layout?: ExItemLayout
  span?: ExItemSpan
  controlId?: string
  children: React.ReactNode
}
```

`FormFieldBase` 增加 `layout?: ExItemLayout`，因此组合式 `FormItem` 和配置式普通 `ExForm.fields` 都可单独覆盖布局；不扩大 `FormList.layout`。原有 `label`、`description`、`colSpan` 及相关类型继续有效，并在 `FormItem` 展示时分别映射到 `ExItem.title`、`desc`、`span`。`FormItem` 不接受 `children`，`control`/`render` 分支仍互斥。`noStyle` 仅返回绑定后的控件，不生成 Item 外壳、跨度、标题或错误 DOM，维持现状。

布局解析规则：

| 外层 `Form` / `ExForm.layout` | Item 未指定 `layout` | Item 显式 `layout` |
| --- | --- | --- |
| `vertical` | `vertical` | 覆盖为所给 `vertical` 或 `horizontal` |
| `horizontal` | `horizontal` | 同上 |
| `inline` | `horizontal` | 同上；外层仍以 inline 排列多个 Item |
| 无表单祖先 | `vertical` | 同上 |

`ExItem.layout` 不接受 `inline`。`span` 默认 `1`；在现有表单网格中保留 `colSpan` 的列数截断，在 inline 表单中保留宽度权重和自动换行。在独立 CSS Grid 中，根元素可声明 `grid-column: span n` 或 `1 / -1`；非 Grid 父级不因 `span` 获得布局能力。`FormItem.noStyle` 没有 Item 根元素，故无跨度效果。

示例：

```tsx
<ExItem title="昵称" desc="其他人可看到" layout="horizontal" span={2}>
  <Input />
</ExItem>

<ExForm layout="inline" fields={[
  { name: "name", label: "姓名", control: "text" },
  { name: "note", label: "说明", control: "textarea", layout: "vertical" },
]} /* 其余既有必需属性略 */ />
```

后一例仅说明布局优先级，不是可直接复制的完整表单。

## 组件边界与渲染流程

1. 在 `components/patterns/ex-item.tsx` 实现 `ExItem` 和一个**仅含展示布局值**的内部 React Context。`FormShell` 在现有表单 Context 之外提供该展示 Context；`ExItem` 只读取后者，不导入表单实例、RHF、协调器或表单校验状态。直接放在 `Form` / `ExForm` 子节点中的 `ExItem` 因此继承默认布局，但不注册字段。
2. `ExItem` 渲染单个根 `Field`，其中标题区含 `title`/`desc`，控件区为 `FieldContent` 包裹 `children`。有可关联控件 ID 时使用带 `htmlFor` 的 `FieldLabel`；否则使用普通 `FieldTitle`。没有 `title`/`desc` 时省略标题区。根保留消费者的 `className`、`style`、DOM 属性和 ref，并标记已解析的 Item 布局与跨度供 CSS 使用。
3. `FormItem` 继续执行当前的实例校验、`useController`、可见性、scope、字段元数据、错误视图与控件适配。仅把已有展示 DOM 交给 `ExItem`：传入现有控件 ID、包含 required 标记的标签、描述、字段容器 ref、无效/禁用数据属性和跨度；控件与 `FieldError` 一起成为控件区 children。当前 `aria-describedby` 仍由 `FormItem` 组合描述 ID 与出现时的错误 ID。`noStyle` 保留提前返回。
4. `ExForm` 的配置转换继续走 `ConfiguredField` / `RelativeItem` / `FormItem`，把新增字段 `layout` 透传。步骤、动态列表、Review、footer 的顺序与生命周期不变。`FormList` 的列表标题、说明和内部 `layout` 暂不接入 `ExItem`；CSS 必须限定选择器，避免改变现有列表行布局。

展示 Context 可与 `FormContext` 同层嵌套，但不能以 `FormContext` 作为独立 Item 的依赖。`ExItem` 的导出文件不能反向导入 `form.tsx` 或 `form-item.tsx`，避免循环依赖。

## ID 与可访问性契约

`ExItem` 每次渲染无条件调用 `useId`。仅当 `children` 本身是**一个直接的 React 元素且 `type === Input`** 时，视作自动关联候选；Fragment、数组、包装组件、自定义输入、多控件均不自动探测或穿透。候选控件的有效 ID 取 `controlId ?? child.props.id ?? useId`。若 `controlId` 与 Input 已有 `id` 不同，抛出带组件名的使用错误，避免静默渲染失效标签。否则只补缺失的 `id`，并在有 `desc` 时将 `${effectiveId}-description` 加入已有 `aria-describedby` 的空格分隔 ID 列表，去重且保留原有顺序；不覆盖 `value`、事件、`ref`、`aria-invalid` 等属性。`title` 的标签指向有效 ID。

非自动路径使用 `controlId` 仅建立 `title` 的 `htmlFor` 和可预测的描述 ID；消费者负责给实际控件设置相同 `id`，并在有 `desc` 时把 `${controlId}-description` 加入其 `aria-describedby`。未提供 `controlId` 时，标题区仍显示，但不声称为任意后代控件提供可访问名称。标题无文本时不渲染空标签。服务端和客户端依赖 React `useId`，不得改用全局自增 ID 或仅在 effect 中补 DOM 属性。

`FormItem` 始终显式传入自身已生成的控件 ID，并保持 `${id}-label`、`${id}-description`、`${id}-error` 的现有关联。`ExItem` 对其控件区不执行自动 Input 补值，因为该区包含绑定控件与错误节点，避免触碰绑定逻辑。描述仍位于标题区，错误仍位于控件区下方；无效标题保留普通文字颜色。

## CSS 与兼容性

`vertical` 将标题区和控件区排为一列。`horizontal` 用 Item 自身的 flex wrap 排版：标题区基础宽度 `9rem`，控件区目标最小宽度 `12rem`，间距 `.75rem`；不足以同排时自动上下换行，控件区在小于 `12rem` 时仍可缩至容器宽度。无标题区时控件区占满宽度。长标题、说明、错误和控件内容继续允许换行与 `min-width: 0`。

将当前基于整个 `.ex-form-container` `30rem` 门槛的横向 Item 切换为上述逐 Item 排版；表单网格的列数容器查询与 inline 外层 flex wrap 保留。`ExItem` 的样式须在表单外可用，因此不能只依赖 `.ex-form` 祖先选择器。原有 `.ex-form-item` 相关无效状态、控件外观与 `FormList` 样式需分别检查，避免通用选择器改变列表项。根 `data-span` 与现有表单选择器兼容；独立 CSS Grid 的跨度规则单独覆盖。

这是一项有意的视觉行为变化：同样宽的表单里，较窄的单个网格列可比过去更早转为上下布局。不会改变提交值、错误记录或 DOM 表单提交入口。新公开接口需要 Changeset，并更新 `packages/components/README.md`、`skills/exui-usage/references/components/Form.md`、相关示例及 Showcase。Showcase 继续只从公开包入口消费，先构建组件产物再运行浏览器用例。

## 备选方案与取舍

| 方案 | 好处 | 代价与结论 |
| --- | --- | --- |
| 独立展示 `ExItem`，`FormItem` 组合它 | 可在非表单场景复用；表单状态边界不变；一套展示 DOM | 需要一层展示 Context 和受限的单 Input 属性补全；采用 |
| `ExItem` 同时可选绑定表单字段 | 一个组件名覆盖两类用法 | `form`、`name`、`control` 与 children 形成分支式 API，容易混淆状态所有权；不采用 |
| 保留 `FormItem` 并复制一个外观相似的独立组件 | 对现有绑定改动少 | 标题、描述、响应式与可访问性逻辑会漂移；不采用 |

## 风险与验证

| 风险 | 处理与检测 |
| --- | --- |
| 自动补 ID 覆盖消费方属性或导致水合差异 | 仅识别一个直接 `Input`；保留显式属性，描述 ID 去重；做 SSR/水合及现有属性的浏览器断言 |
| 标题指向错误控件 | `controlId` 与 Input 自带 `id` 不一致时明确抛错；自定义/多控件路径检查标签点击与描述关联 |
| Item 在多列或 Dialog 中溢出 | 用 Item 宽度驱动 flex wrap，验证 `320/375/390px`、宽视口窄 Dialog、长内容和不同 `colSpan` |
| 共享样式改变 `FormList` 或表单错误呈现 | CSS 选择器按 Item 与列表范围限定；回归列表操作、错误、焦点定位、`noStyle` 和提交 |
| 公开类型变宽或打包入口遗漏 | 严格消费者编译、非法 `layout="inline"` 的类型反例、根导出与 `verify:pack` |

依据 `TESTING.md`，验证顺序为 `pnpm typecheck`、`pnpm lint`、`pnpm build`、Showcase 的 `pnpm test:visual`、`pnpm verify:pack`，并检查公开示例。针对本 RFC 补充独立 Item、单 Input 自动关联、显式 ID 冲突、布局覆盖与宽度行为的浏览器/类型断言。构建须先于 Showcase 测试，因为 Showcase 消费打包产物。设计阶段没有执行这些命令；实施报告必须逐项给出实际结果。

## 落地顺序与回退

先增加展示组件、类型与根导出，再让 `FormItem` 组合它并接入展示布局 Context，随后更新 CSS、Showcase、消费者检查、文档与 Changeset。每一步保持既有 `FormItem` 公开属性可编译；不进行字段数据迁移，也不要求下游立即改用 `ExItem`。发布前以上述验证和视觉审阅作为门槛。

若新布局或自动关联存在回归，可撤回本次新增组件、展示 Context、类型、样式和文档变更，恢复原有 `FormItem` 渲染与横向容器断点；表单草稿和服务器数据无需恢复。具体回退以同一变更集为边界，不删除独立的在途工作。

## 待决事项

无。实施时如发现单个直接 `Input` 的识别、React 属性转发或现有表单 DOM 结构与本契约冲突，应返回设计审阅，不静默扩大自动探测范围。
