# ExItem 与 ExForm 布局设计

日期：2026-09-29
状态：待书面审阅
模块目录：`.notes/ex-form/`

## 目标与范围

公开一个可在表单外使用的 `ExItem`，统一输入项的标题、说明、控件排列与跨度。`FormItem` 复用该展示结构，继续负责字段绑定、校验、错误和焦点定位。`ExForm` 与 `Form` 保持现有的 `layout="vertical" | "horizontal" | "inline"`，并让 Item 的显式布局覆盖表单默认值。

本设计不改变字段值所有权、Standard Schema 校验、提交、步骤、动态列表和控件绑定；不追求 Ant Design Form 的逐项 API 兼容，不新增包或公开子入口。参考：[Ant Design Form](https://ant-design.antgroup.com/components/form-cn)。

## 公开接口

`ExItem` 从 `@exre/exui` 根入口导出。展示属性如下：

```ts
type ExItemLayout = "vertical" | "horizontal"
type ExItemSpan = 1 | 2 | 3 | 4 | "full"

interface ExItemProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  title?: React.ReactNode
  desc?: React.ReactNode
  layout?: ExItemLayout
  span?: ExItemSpan
  controlId?: string
  children: React.ReactNode
}
```

`ExItem` 是展示容器。它不要求 `form` 或 `name`，不读写表单草稿，不注入 `value`、`onChange` 或校验规则，也不把任意子元素当作受控字段。无表单祖先时默认 `vertical`。`title` 和 `desc` 构成标题区；`children` 是控件区。传入普通 HTML `div` 属性、`className` 和 `style` 时应用于 Item 根元素。

```tsx
<ExItem title="昵称" desc="其他人可看到">
  <Input />
</ExItem>
```

现有 `FormItem` 的 `label`、`description`、`colSpan` 继续有效，分别映射到 `ExItem.title`、`desc`、`span`。`FormItem` 继续禁止任意 `children`，其 `control` 或 `render` 分支保持现有绑定契约；错误仍位于控件下方，描述仍位于标题下方。`noStyle` 继续跳过整个展示外壳。配置式 `ExForm.fields` 沿用 `label`、`description`、`colSpan`；不因新增 `ExItem` 强制迁移既有字段配置。

`ExForm` 的普通字段通过 `FormItem` 使用同一展示结构。直接作为 `ExForm` 或 `Form` 子节点的 `ExItem` 只参与布局，不会注册字段。显式注册、校验和提交仍由 `FormItem` 或 `ExForm.fields` 决定。

## 布局与优先级

| 外层 `Form` / `ExForm.layout` | 未设置 `ExItem.layout` 时的内部布局 | 外层排列 |
| --- | --- | --- |
| `vertical` | `vertical` | 现有网格 |
| `horizontal` | `horizontal` | 现有网格 |
| `inline` | `horizontal` | 多个 Item 并排并自动换行 |

显式 `ExItem.layout` 只能是 `vertical` 或 `horizontal`，并覆盖表中默认值。`inline` 只属于外层 `Form` / `ExForm.layout`，不作为 Item 布局值。`FormItemProps` 与普通 `ExForm.fields` 配置新增 `layout?: ExItemLayout`，使用同样的单项覆盖规则。单独使用 `ExItem` 时，显式布局不依赖表单。

`vertical` 始终上下排列标题区与控件区。`horizontal` 在宽度允许时使用标题列和控件列；标题列目标宽度沿用现有 `9rem`，两区间距为 `.75rem`，控件区目标最小宽度为 `12rem`。当**该 Item 自身**容不下这两列与间距时，两区自动换成上下排列；在更窄的宽度下控件仍可收缩至容器宽度。不以页面视口或整个表单宽度代替 Item 宽度判断，因此多列表单、Dialog 和独立 Item 有相同行为。只用 CSS 排版，不引入 `ResizeObserver` 或水合后重排。

`span` 接受 `1` 至 `4` 或 `"full"`，默认 `1`。在表单网格中使用现有列数与截断规则；在 `inline` 表单中使用现有宽度权重和换行规则。单独使用时，Item 不创建父网格，`span` 仅向父级布局声明自身跨度；非网格父级可忽略它。现有字段的 `colSpan` 映射到相同跨度。`noStyle` 没有 Item 外壳，因此也没有跨度效果。

实现边界采用独立的展示布局上下文传递外层默认布局，不把 `FormInstance`、RHF 或校验状态带入 `ExItem`。`FormItem` 仍使用现有表单上下文处理状态，并把解析后的布局、标题和描述交给 `ExItem`。

## 控件关联与可访问性

当 `ExItem` 只有一个**直接子节点**，且该节点是公开的 ExUI `Input` 时，可以省略控件 `id`。`ExItem` 使用 `useId` 生成稳定 ID，并只向这个 Input 补入缺少的 `id` 和说明关联；不修改其值、事件或 ref。Input 已有 `id` 时保持原值。已有 `aria-describedby` 时追加说明 ID，不覆盖原有引用。该路径须在服务端渲染与客户端水合后保持一致。

对于自定义控件、被其他组件包裹的 Input 或多个控件，调用方传 `controlId`，并把同一 ID 用在实际可聚焦控件上。`ExItem` 以此将 `title` 渲染为关联控件的标签；`desc` 的 ID 由控件 ID 稳定派生，调用方将其加入控件的 `aria-describedby`。没有可关联控件时，`title` 是普通标题文字，展示本身不承诺为任意后代控件建立输入标签。显式 `controlId` 与单个直接 Input 自带的 `id` 同时存在时必须一致，避免产生指向错误元素的标签。

`FormItem` 已有的控件 ID、描述 ID、错误 ID、`aria-invalid`、`aria-required`、焦点 ref 和错误导航保持原有契约。它向 `ExItem` 提供控件 ID 和描述内容；字段错误留在控件区，由表单绑定层负责。输入无效时，标题区保持正常文字颜色，控件和错误各自显示无效状态。

## 实现与验证边界

预计改动集中于 `packages/components/src/components/patterns/`、`src/lib/forms/types.ts`、`src/form.css`、`src/index.ts`，以及公开用法文档与 Showcase 表单示例。`ExItem` 应独立于 `form-item.tsx` 的绑定逻辑，`FormItem` 组合它；不复制一套不同的标题、描述与错误 DOM。作为公开组件和布局行为变更，实施时增加 Changeset。

依据仓库 `TESTING.md`，实施后的验证覆盖：

- 类型检查：`ExItem.layout` 排除 `inline`；Item 显式布局覆盖表单默认；既有 `FormItem`/`ExForm.fields` 配置继续编译。
- 浏览器行为：独立 Item、表单字段和混合布局在窄容器、Dialog、多个列宽及 `inline` 换行时无水平溢出；按 Item 实际宽度从横向转纵向。
- 可访问性：直接单个 Input 的自动 ID、显式 ID 保留、标题点击聚焦、描述关联、已有 `aria-describedby` 合并，以及服务端渲染与水合一致；多控件和自定义控件的显式关联路径。
- 回归：字段校验、错误显示与定位、`noStyle`、字段跨度和现有表单提交行为不变。
- 交付检查：先 `pnpm build` 再运行 Showcase 浏览器测试；按 `TESTING.md` 执行 `pnpm typecheck`、`pnpm lint`、`pnpm test:visual` 和 `pnpm verify:pack`，并验证公开包消费者与示例。
