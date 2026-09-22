# 材质边缘由 inset shadow 提供，不接管 border-color

最后更新：2026-09-21

状态：已接受
模块：components
日期：2026-09-21
来源：`packages/components/src/glass.css`、`packages/components/src/components/ui/*.tsx`、`packages/tokens/src/recipes.ts`、`packages/tokens/src/style.css`

背景：源设计（`.notes/glass-effects/`）对边缘的处理分两半：基础材质包含"不改变盒尺寸的边缘高光或内阴影"，且"普通元素新增的视觉边缘来自 inset shadow，不给没有 border 的 div 增加实体边框宽度"；同时 RFC 7.3 还要求材质也接管边框——按状态把 recipe 的 `border-color` 记为私有 `--_exui-glass-host-border`，常态显示材质边缘，只有 focus / invalid 分支回落到宿主边框。

第二半在实现时被否决，原因来自真实组件代码：各组件的边框颜色是**逐状态**的工具类，而材质规则为了压过它们必须是无 layer 的（见 [玻璃材质的层叠与运行约束](../../knowledge/components/glass-material-constraints.md)）。一旦无条件写 `border-color` 就会盖掉这些状态工具类：Button 的六个变体各有 default / hover / active / focus-visible / disabled 五组边框色，表单控件有 base → hover / focus / invalid → disabled 的边框切换，`outline` 变体还会在 hover / active 换更深的边框。要把它们全部恢复，需要在每一处状态声明旁再补一个伴随变量——仅 Button 就是六个变体乘五个状态。

决策：材质**只**写 `background-color`、`color`、`backdrop-filter` 与 `box-shadow`，从不写 `border-color`。可见边缘由 `--exui-glass-shadow`（`inset 0 0 0 0.0625rem var(--exui-glass-border)`）提供，并以 `var(--_exui-glass-host-shadow, …)` 组合宿主外阴影与 Tailwind ring，而不是替换它们。RFC 7.3 的 `--_exui-glass-host-border` 因此不实现。

理由：复核了所有可开启材质的表面后确认，没有任何必需的**状态信号或无障碍信号**因此丢失——按钮的 hover / active / focus / disabled / invalid 边框色、表单控件 base→hover/focus/invalid→disabled 的边框切换、NativeSelect / Toggle / Badge / Item 的 focus 边框、Attachment 的 error 边框以及 `aria-invalid` 边框全部照旧生效；焦点环与错误环要么由 Tailwind 的 `--tw-ring-shadow` 组合保留，要么由显式的 `--_exui-glass-host-shadow` 伴随变量补回。被牺牲的只是"材质边缘变量统一控制边框颜色"这一便利，换来的是零状态回归与不需要给几十处状态声明加伴随变量。

代价与边界：

- 有边框的表面会同时显示自己的边框和材质的内细线，两条边缘叠加而不是互相替换；`--exui-glass-border`（以及危险色调对它的覆盖）在无边框元素上是唯一的边缘，在有边框元素上是内侧那条细线。
- 自带 `border-transparent` 的表面（Badge、Toggle 默认态、InputGroup、NativeSelect、TabsTrigger、Item、Bubble 等）会新增一条原本没有的可见内边。这是"inset shadow 提供边缘"的本意，不是回归，但属于外观变化，已写进 `packages/components/README.md` 与 `skills/exui-usage/references/glass.md`。
- 危险材质的外层边框仍来自 recipe（危险按钮的 `control.danger`），因此危险语义的可见边缘不依赖材质变量。

重新审视条件：要求"材质边缘颜色必须能统一覆盖所有组件边框"时；或某个表面新增了以边框颜色为主要状态信号的交互（例如把选中态从背景改为边框）时——那时需要按状态补伴随变量，而不是恢复无条件覆盖。

证据：`packages/components/src/glass.css` 中基础材质规则的声明集合（无 `border-color`）与其 `box-shadow` 组合；`packages/tokens/src/recipes.ts` 的 `button` 六个变体与 `formControl` 五状态；`packages/tokens/src/style.css` 中 `--exui-glass-shadow: inset 0 0 0 0.0625rem var(--exui-glass-border)`；`packages/components/README.md` 与 `skills/exui-usage/references/glass.md` 对边缘与边框叠加关系的表述。
