# ExUI 基础组件投影属性设计

日期：2026-09-20
模块：`component-shadow`
状态：用户已确认，待实现
后续 RFC：[component-shadow-rfc.md](../rfcs/component-shadow-rfc.md)

## 决策摘要

ExUI 为符合“单一可见表面”定义的非浮层基础组件增加可选属性 `shadow`。它只接受 `"sm" | "md" | "lg"` 三档预设；未传时维持现有外观。预设由 CSS Token 提供，随 light、dark、pitch-black 主题变化；使用者仍可用 `className` 或样式表覆盖最终的 `box-shadow`。

已有浮层层级语义的组件不提供该属性，继续使用现有 Dialog 或 Menu Recipe 与语义 Token。这个边界避免公共的装饰性投影改写模态、菜单和弹出层的层级含义。

## 当前事实

- `packages/tokens/src/tokens.ts` 已定义基础 `shadows.small`、`medium`、`large`、`focus`、`invalid`，并已发布为 `--exui-shadow-*` 变量。
- 三套主题已有 `shadow.card`、`shadow.modal`、`shadow.menu`；生成器会在 `.dark` 和 `.pitch-black` 中覆盖这些语义阴影。
- 目前基础的 small/medium/large 是全局值，尚不会随主题覆盖；因此不能仅给组件追加 Tailwind 阴影类来满足本设计。
- Button 通过 Component Recipe 使用 `box-shadow`，其 `focus-visible` 状态会写入焦点阴影。其它基础组件则混用 Tailwind `ring`、`shadow` 或无阴影样式。实现必须逐组件验证，而不能假定一个类在全部状态下均正确叠加。
- `cn()` 使用 `tailwind-merge`，所以由 `className` 给出的同类阴影应保留覆盖能力。

## 已确认目标

1. 使用者可在 JSX 中写 `shadow="sm"`、`shadow="md"` 或 `shadow="lg"`，得到对应的装饰性投影。
2. `shadow` 缺省时，所有组件的计算样式与交互行为保持不变。
3. 焦点可见性不因装饰投影而消失：焦点环仍可辨识，并与选中的投影共同存在。
4. `shadow` 不在 hover、active 或 disabled 状态自动升降级；它表达调用方指定的静态层级。
5. 使用者的 `className` 阴影覆盖优先于预设；任意 CSS 阴影字符串不作为 `shadow` 属性的合法值。
6. Token 预设在三套主题中可分别取值，而公开 CSS 变量名保持 `--exui-shadow-small`、`--exui-shadow-medium`、`--exui-shadow-large`。

## 范围

### 纳入规则

为每个同时满足下列条件的公开基础组件表面增加属性：

- 渲染一个可由消费者直接摆放的、有自身背景、边框或形状的单一可见表面；
- 该表面拥有最终 `className`，且把投影加在这里不会改变布局结构或事件语义；
- 它不是已有浮层层级体系的一部分，也不是仅为组合而暴露的内部结构节点。

当前已确认覆盖的类别包括 Button / ActionButton、Badge（即本项目的 Tag）、Alert、Avatar、Card、Attachment、Bubble、Message，以及 Input、Textarea、NativeSelect、Checkbox、Radio、Switch、Toggle 等输入和选择控件。复合组件按“实际承载表面”的公开部件处理：例如只有 `Content` 才承载可见气泡时，属性属于该 `Content`；Card 的 Header、Footer 等不承载 Card 外表面时不新增属性。

### 明确排除

不为已有浮层或浮层面板家族新增 `shadow`：Dialog、AlertDialog、Drawer、Sheet、Popover、HoverCard、Tooltip、DropdownMenu、ContextMenu、Select、Menubar，以及同类 Portal/Content 浮层。

也不添加到纯布局、分组、Provider、Trigger、Portal、Overlay、文本/图标、分隔符、选项、标签或内部组合节点。是否纳入的唯一判定不是文件名或是否导出，而是本节的“单一可见表面”规则。

### 非目标

- 不新增任意 `box-shadow` 字符串 API、运行时 Theme Provider、缩放/动画策略或 elevation 状态机。
- 不改变未传 `shadow` 时的 Recipe、Token、浮层层级或视觉基线。
- 不让基础组件覆写浏览器 `overflow`、z-index、定位或 Portal 行为以避免投影裁切；容器裁切由使用者布局负责。
- 不重写第三方依赖或 Sonner、Chart 等第三方内部视觉。

## 公共契约

```ts
type ShadowPreset = "sm" | "md" | "lg"

// 对纳入范围的每一个表面组件：
type ComponentProps = ExistingProps & {
  shadow?: ShadowPreset
}
```

映射是固定的：`sm → --exui-shadow-small`，`md → --exui-shadow-medium`，`lg → --exui-shadow-large`。`shadow={undefined}` 与省略属性等价；其它字符串在 TypeScript 中必须拒绝。

`ShadowPreset` 是否作为根入口的独立命名类型导出不是本次用户要求的契约；实现可复用内部类型或在各组件属性中内联该联合类型。无论选择哪种内部结构，组件 Props 的可推断联合类型和三个字面量不可改变。

焦点状态的最终 `box-shadow` 必须包含焦点指示与选中的预设，或者用等价的可访问机制得到同等可见结果。预设不得替换 `focus-visible` 指示。若某组件本来以 Tailwind ring 表达焦点，必须验证投影不会覆盖 ring 的最终 CSS 声明。

## Token 与主题设计

保留现有基础 `exuiTokens.shadows.small/medium/large` 及其 CSS 变量，确保 tokens-only 使用者和既有覆盖选择器不失效。为主题阴影模型增加对应的 `shadow.small`、`shadow.medium`、`shadow.large` 项，生成器在主题块中写入相同的 CSS 变量名。light 的主题值与现有基础值一致；dark 与 pitch-black 可覆盖它们。

这样 `shadow="md"` 的组件只依赖稳定的 `--exui-shadow-medium`，而 `.dark` / `.pitch-black` 的变量覆盖负责主题适配。现有 `shadow.card`、`shadow.modal`、`shadow.menu` 保持语义职责，不能改为 generic preset 的别名。

dark / pitch-black 的三个最终视觉数值尚未由用户给出。实现前必须完成视觉审阅，形成一张值表：三档必须保持由轻到重的可辨识层级，并在三个主题中满足现有视觉测试。不能把现有 light 值机械复制到暗色主题后宣称已实现主题适配。

## 方案比较

| 方案 | 结论 | 原因 |
| --- | --- | --- |
| `shadow?: boolean` | 不采用 | 无法表达需要的三档层级，后续扩展会破坏契约。 |
| `shadow?: string` | 不采用 | 绕开 Token、类型与主题约束；消费者已有 `className` / CSS 覆盖渠道。 |
| 只用现有基础 Token | 不采用 | small/medium/large 当前不会随主题变化，不能满足已确认的主题适配。 |
| 在所有导出节点盲目加属性 | 不采用 | 会把布局、Portal 与复合内部结构误当作视觉表面。 |
| generic preset 覆盖浮层 Recipe | 不采用 | 会破坏 Modal/Menu 的语义层级与已有主题策略。 |

## 风险与约束

| 风险 | 缓解与检测 |
| --- | --- |
| `box-shadow` 与 focus ring 互相覆盖 | 对每一种焦点实现做浏览器 computed-style / 键盘焦点测试。 |
| 同一复合组件错误地向多个子节点暴露属性 | 按表面规则建立覆盖清单；审查 props 实际落点。 |
| dark 值与 light 值相同，造成“主题适配”名不副实 | 在 Token 与视觉测试中分别断言主题覆盖和值表。 |
| `className` 覆盖被 CVA 或合并顺序吞掉 | 类型和浏览器用例同时传 `shadow` 与覆盖阴影，断言最终值为覆盖值。 |
| 投影被宿主容器裁切 | 文档说明这是布局约束；组件不修改 overflow 或定位。 |

## 交接与验收方向

实现必须以 [RFC](../rfcs/component-shadow-rfc.md) 为准，并在开始前读取 `TESTING.md`。这是公开组件属性与 Token 结构的扩展，需添加 public package 的 Changeset；私有 `@exre/exui-tokens` 不单独发布。

本设计只记录已确认决策与实施边界；未修改源码、生成物、测试、Changeset、提交或发布。
