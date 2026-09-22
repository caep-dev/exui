# RFC：ExUI 基础组件的主题化投影预设

日期：2026-09-20
状态：依据已确认设计编写，待实现
设计依据：[基础组件投影属性设计](../specs/2026-09-20-component-shadow-design.md)

## 1. 决策摘要

为符合可见表面规则的非浮层 ExUI 基础组件提供 `shadow?: "sm" | "md" | "lg"`。它映射到稳定 CSS 变量 `--exui-shadow-small`、`--exui-shadow-medium`、`--exui-shadow-large`，并由主题层覆盖这些变量的取值。未传属性时不改变任何现有外观。

浮层体系继续由 Dialog、Menu 等 Recipe 的 `shadow.modal` / `shadow.menu` 语义 Token 控制，不能接收 generic `shadow` 属性。

## 2. 实施契约

### 2.1 Props 与优先级

对每个入选表面组件，在既有 DOM / Radix Props、variant 和 `asChild` 约定之上增加可选联合属性。属性必须仅消费，不得透传为 DOM attribute。

| 输入 | 最终效果 |
| --- | --- |
| 未传 `shadow` | 完全沿用组件当前 `box-shadow` / ring 行为。 |
| `shadow="sm"` | 使用 small Token 的静态装饰投影。 |
| `shadow="md"` | 使用 medium Token 的静态装饰投影。 |
| `shadow="lg"` | 使用 large Token 的静态装饰投影。 |
| `className` 给出冲突阴影 | 消费者 `className` 的最终阴影优先。 |
| 焦点可见 | 焦点指示仍可辨识，不能被 preset 覆盖。 |

对支持 `asChild` 的入选组件，投影类按既有 `asChild` 契约落到子元素；若底层子元素不接受 `className`，维持当前组件的失败语义，不另建 wrapper。

### 2.2 表面选择

实现者必须先建立“候选公开表面 → 实际 DOM 节点 → 是否纳入 → 依据”的覆盖清单，并将其作为测试输入。入选条件与排除列表以设计文档的“范围”章节为准。

特别处理复合组件：公开导出名不是属性落点的依据。投影只加给实际绘制自身背景/边框/形状的单个根表面；不得给 Group、Header、Footer、Addon、Trigger、Portal、Overlay 等结构节点添加同名属性。现有浮层家族无条件排除，即使其 Content 拥有 `className`。

### 2.3 Focus 与交互

投影没有 hover、active、selected 或 disabled 的自动层级变化。它在这些状态下保持调用方指定的层级；组件原有的颜色、opacity、位移、disabled 与状态语义保持。

Button 的 Recipe focus shadow、表单控件的 focus/invalid shadow、以及 Tailwind ring 机制不能直接互相覆盖。实现可使用局部 CSS custom property、合并后的 `box-shadow` 声明，或当前 Tailwind 版本支持的等价组合方式，但须同时满足：

1. 未传属性时现有计算样式不变；
2. 传入 preset 且 keyboard focus 时，焦点指示和 preset 都存在；
3. `aria-invalid` 的既有无障碍错误指示不被静态投影掩盖；
4. 最后的 `className` 仍可覆盖装饰投影。

不要用移除 focus ring 或把 `outline: none` 当作解决方案。

## 3. Token 落地

### 3.1 类型与源数据

修改 `packages/tokens/src/types.ts` 的 `ThemeShadowTokens`，增加 `small`、`medium`、`large`。`packages/tokens/src/tokens.ts` 的三套主题都提供这些字段：

- light 的值必须等于现有 `exuiTokens.shadows.small` / `medium` / `large`；
- dark 和 pitch-black 的值必须在实现前完成视觉确认，且三档有清晰的轻、中、重关系；
- 现有 `card`、`modal`、`menu` 字段和值保持其语义职责和现有兼容性。

顶层 `ShadowTokens` 不删除、不改名、不迁移。这保留 `exuiTokens.shadows.*` 和现有 `--exui-shadow-*` 覆盖面的兼容性。

### 3.2 生成器和校验

`packages/tokens/scripts/generate-css.mjs` 已把 `theme.shadow` 的字段写成 `--exui-shadow-${name}`，并在非 light 主题输出差异变量。新增三字段后，须：

- 扩展 semantic reference map，使主题小/中/大阴影可按需作为语义引用；
- 确保基础变量仍只从顶层 `shadows` 在 `:root` 生成，主题块再以相同变量名覆盖；
- 保留 foundation reference policy 对顶层 `shadows.*` 的精确覆盖检查；
- 为三主题、小中大字段的完整性、生成 CSS 覆盖和 JS ESM/CJS 深等价补充/更新测试；
- 通过生成器更新 `packages/tokens/src/style.css`，不手工编辑生成物。

新主题字段是 Token 对象的加性结构变化。tokens-only 使用者不会因原字段被删除而失效；实现者仍须让打包消费者门禁验证导出类型。

## 4. 组件落地策略

可选择共享的内部 class/type helper，或在各组件的 CVA 变体中实现；该 helper 的文件位置不属于公共契约。无论采用何种结构，必须避免在每个组件复制独立 Token 字面量，并只能引用下列变量：

```css
--exui-shadow-small
--exui-shadow-medium
--exui-shadow-large
```

处理顺序：

1. 以表面规则审计 `packages/components/src/components/ui/`，建立并评审候选清单；先确认 Props 的实际 DOM 落点。
2. 建立带 `sm`、`md`、`lg` 的共享类型/映射，使非法字面量被 TypeScript 拒绝。
3. 按组件原有的 `cn(..., className)` 顺序接入，保证 `className` 覆盖位于 preset 之后。
4. 对各类已有焦点实现分别组合投影和无障碍指示，避免全局 CSS 选择器或 broad reset。
5. 在 Showcase 添加 API 用例与三主题可视/行为覆盖；只有全部组件通过其对应状态验证后才扩大到下一组。

不得把 generic prop 加到以下文件/家族的浮层 Content：`alert-dialog`、`dialog`、`drawer`、`sheet`、`popover`、`hover-card`、`tooltip`、`dropdown-menu`、`context-menu`、`select`、`menubar`，或任何新增的等价浮层组件。

## 5. 验证

开始测试前阅读 `TESTING.md`。至少执行以下层次；任何未执行项在交付报告中标为 `NOT_EXECUTED`。

### Token 与类型

- `pnpm tokens:check`：三主题 Token 结构、ESM/CJS 一致性、深冻结、生成 CSS 及新增 policy tests。
- `pnpm typecheck`：每个入选组件接受三个字面量、拒绝非法值，并与原 Props / `asChild` 兼容。
- 检查生成 CSS：`:root` 含三档基础变量；`.dark` 和 `.pitch-black` 在主题值不同处覆盖三档变量；既有 card/modal/menu 变量不回归。

### 浏览器与视觉

- 每个入选组件至少验证一个 `sm` / `md` / `lg` 用例；完整套件还须覆盖三个主题。
- Button、一个文本输入、一个选择控件分别以键盘聚焦，验证 focus-visible 或 ring 与 preset 共存；再验证 invalid 输入不失去错误指示。
- 传 `className` 阴影覆盖后读取 computed `box-shadow`，证明它优先于 preset。
- 对至少一个 `asChild` 组件验证类落在子元素且不生成 wrapper。
- 对排除的浮层运行现有 Dialog/Menu/Popover 打开、Escape 与焦点恢复测试，确认其无新 prop、阴影仍来自原 Recipe。
- `pnpm build` 后运行 `pnpm test:visual`；视觉基线变更必须逐项审阅，不得批量接受截图。

### 发布契约

- `pnpm lint`
- `pnpm build`
- `pnpm verify:pack`：独立 tokens-only 和 React 消费者都能使用更新后的公开包。
- 添加 public `@exre/exui` 的 Changeset，说明新增 `shadow` Props、三档预设、主题化 Token 行为，以及浮层未纳入范围。
- `git diff --check`

## 6. 兼容性、发布与回退

这是加性 Props 与 Token 字段变化；未使用 `shadow` 的消费者不应看到视觉或类型破坏。用户显式使用新属性的页面会依赖新增的组件与 CSS 制品，不能只升级 JS 而遗漏 `@exre/exui/style.css`。

将 Token、组件、类型、Showcase 覆盖与 Changeset 作为同一发布单元。若发现视觉回归，在发布前删除新 Props 的接线与新增主题字段并重新生成 CSS；没有数据迁移、持久化状态或运行时开关需要恢复。

## 7. 未决项

| 项目 | 状态与决策点 |
| --- | --- |
| dark / pitch-black 的 `shadow.small`、`medium`、`large` 数值 | 实现前需经视觉审阅确定；不得伪造主题差异或无验证地复制 light 值。 |
| 具体组件/公开部件覆盖清单 | 实现第一步根据“单一可见表面”规则从当前源码生成并审查；浮层排除列表固定。 |
| `ShadowPreset` 是否额外从 `@exre/exui` 根入口命名导出 | 非本次用户要求；实施者若需要导出，须作为新的公开 API 决策单独确认。 |

本 RFC 不授权生产代码修改、提交、推送、发布或 `.ai/` 知识库更新。
