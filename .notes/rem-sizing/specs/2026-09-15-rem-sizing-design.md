# ExUI rem 尺寸迁移设计

日期：2026-09-15  
模块：`rem-sizing`  
状态：用户已确认迁移方向和根字号兼容性变化；本文待最终审阅  
后续 RFC 目录：`notes/rem-sizing/rfcs/`

## 1. 已确认的目标

将现有 ExUI 的可缩放尺寸迁移为以 16px 根字号为基准的 rem。应用设置 `html` 的字号后，字体、控件、间距、图标和普通圆角随根字号变化。

- 继续使用 `@exre/exui`、`@exre/exui/tokens` 和现有样式入口。
- 不增加 `/rwd/tokens`、`/rwd/components` 或第二套组件实现。
- ExUI 不设置根字号、不声明 `--ui-scale`，也不增加自动缩放媒体查询。
- 用户已接受：原本根字号不是 16px 的应用，在升级后会改变组件外观。
- 这是尺寸单位迁移；现有主题、组件交互、布局断点和密度选择机制保持各自职责。

## 2. 仓库证据

- `packages/tokens/src/tokens.ts`：density、typography 和普通 radii 使用固定 px；主题与基础层还包含像素阴影。
- `packages/tokens/src/recipes.ts`：六类组件 Recipe 含控件高度、padding、gap、图标、文字、圆角和偏移。
- `packages/tokens/src/recipeTypes.ts`：`RecipeLength` 当前为 `${number}px | "0"`。
- `packages/tokens/scripts/generate-css.mjs`：基础引用解析为具体值，再生成 CSS 变量；转换源码后可以继续沿用这条链路。
- `packages/tokens/scripts/validate-tokens.mjs`：长度校验仅接受 px 和 0，需要和类型契约同步调整。
- `packages/components/src/components/ui/`：大部分普通 Tailwind 尺寸已使用其相对长度体系；仍需处理 CSS 中直接写出的固定长度。
- 具体例子包括 Checkbox 的 5px 圆角、Drawer 的 100px 手柄宽度、Switch 的 8px 位移修正，以及 Tooltip 的箭头圆角和偏移。
- Combobox、DropdownMenu、HoverCard、Menubar、Popover 等还向定位组件传入数字型 `sideOffset` / `alignOffset`。
- `packages/components/src/components/ui/sonner.tsx` 与 `chart.tsx` 封装第三方渲染行为；不能据 ExUI 源码转换推断第三方所有尺寸都已支持 rem。
- `packages/showcase/src/showcase/ComponentRecipeContract.vrt.test.tsx` 已有三主题、两视口的像素几何和交互断言。
- `TESTING.md` 要求公共 tarball 的独立消费者检查，包含 tokens-only、类型、SSR 和浏览器浮层交互。

## 3. 方案选择

采用直接迁移现有尺寸源值的方案。每个需转换的 `Npx` 写为 `N / 16 rem`，保留必要精度；0 统一允许无单位 `0`，负值保留符号。

| 含义 | 原值 | 新值 | 根字号 32px 时 |
| --- | --- | --- | --- |
| 默认按钮高度 | 36px | 2.25rem | 72px |
| 正文字号 | 14px | 0.875rem | 28px |
| 水平内边距 | 12px | 0.75rem | 24px |
| 图标尺寸 | 16px | 1rem | 32px |
| 位移修正 | -8px | -0.5rem | -16px |

未选择另设 RWD 入口：它需要维护两套样式契约，而用户已经接受默认入口的单位变化。

未选择在每个 Token 中乘 `--ui-scale`：根字号已经承担缩放控制，无需重复引入缩放因子和计算表达式。

## 4. 转换与例外规则

### 4.1 转换范围

- 基础 Token：density 中的尺寸、字号、行高和普通圆角。
- 组件 Recipe：高度、最小高度、padding、gap、图标大小、字号、行高、普通圆角、位置偏移和间距。
- 可见几何：Tabs 指示条厚度转换为 rem；Dialog 背景模糊半径转换为 rem。
- ExUI 自有组件 CSS：固定宽高、普通圆角、装饰箭头和运动几何等按含义转换，包括上述 Checkbox、Drawer、Switch、Tooltip、Chart 自有图例标记。
- 已使用 rem、em、百分比、视口单位或布局计算的值，保持其原本含义。验证构建后的实际 CSS，避免重复换算。
- Sidebar 等表达式必须区分固定边框补偿与可缩放几何；例如补偿两条 1px 边框的 `2px` 继续保留。

### 4.2 固定效果与算法单位

以下值保持现有语义，并在后续 RFC 的固定长度清单中逐项说明：

- 普通细边框、分隔线、焦点环、阴影及阴影中的描边保持现有像素宽度。
- `radii.full = "9999px"` 保留胶囊圆角语义。
- 一像素边缘补偿、按钮按下反馈、无障碍隐藏样式等明确属于固定像素效果的值保持不变。
- 数字型定位参数，包括默认和调用者传入的 `sideOffset` / `alignOffset`，仍按上游 API 的像素契约解释；不隐式乘根字号，不改变公开参数类型。
- 浏览器测量结果、拖拽坐标、碰撞检测边界、SVG viewBox 和第三方图表数值均不作字符串单位替换。
- 字重、透明度、动画时间、颜色、层级和字距 `em` 不作长度换算。

此方案保证 ExUI 管理的排版和布局尺寸随根字号变化，不承诺包含固定描边和第三方数值参数的整个页面做严格等比放大。

### 4.3 第三方边界

审查打包产物中的第三方样式及公开扩展接口，记录 Toaster、图表等是否含固定尺寸。第三方内部像素几何不在本次源码单位迁移承诺内；不修改依赖源码，也不为数值 API 增加根字号监听器。

ExUI 自己提供的图标、图例、tooltip 内容等仍按可缩放尺寸规则处理。对受第三方默认样式限制的部分，在公共使用说明中明确覆盖方式或限制，不将它们宣称为完整等比缩放组件。

## 5. 类型、生成和导出

- `RecipeLength` 扩展为 `${number}rem | ${number}px | "0"`，继续兼容调用者使用 px 的类型约束。
- 校验器支持合法 rem / px / 0，并保留现有字段、引用、主题结构、冻结和 CSS 一致性校验。
- 对仓库内置 Token 另做转换完整性校验：可缩放字段不得残留 px；固定像素例外按明确字段或文件位置列出，不能通过宽泛的 px 放行掩盖遗漏。
- JS 导出中的值直接变为 rem 字符串；不依赖 `window`、DOM 或当前根字号。
- ESM、CommonJS、类型声明和 CSS 由同一源码生成，继续保持公共入口和深冻结契约。
- `packages/tokens/src/style.css` 必须经生成器更新；`dist/` 和 `types/` 不手改。

## 6. 应用接入与兼容性

应用可自行使用下面的示例；它只进入文档或演示，不进入公共库全局样式：

```css
:root {
  --ui-scale: 1;
}

@media (min-height: 1440px) {
  :root {
    --ui-scale: 1.333;
  }
}

@media (min-height: 2160px) {
  :root {
    --ui-scale: 2;
  }
}

html {
  font-size: calc(16px * var(--ui-scale, 1));
}
```

- 16px 根字号下，转换项的计算尺寸与现有默认外观一致。
- 其他根字号按 `当前根字号 / 16px` 缩放；应用中的其他 rem 样式也受影响。
- CSS 媒体查询使用视口尺寸，示例阈值不是显示器物理分辨率。窗口工具栏、系统缩放和浏览器缩放可能影响匹配。
- 阶梯阈值会产生跳变；预设策略属于应用选择，不是 ExUI 的发布契约。
- `parseFloat(token)` 的结果不再能直接当像素使用；现有 JS 消费者应保留单位交给 CSS，确需像素时由应用结合根字号解析。
- 改变普通容器的字号不会改变 rem 基准。Portal 在同一 document 内参照相同根字号；跨 document/iframe 以各自根字号为准。
- 保留原有默认入口，属于现有使用方可观察的行为变化，必须为公共 `@exre/exui` 添加 Changeset 并明确升级影响；当前 0.1.0 版本建议使用 minor 记录此兼容性变化，不给私有 tokens workspace 单独发版。

## 7. 验收设计

### 基础与包契约

- 类型测试证明 rem 和保留的 px 用法有效，不支持的单位与字段仍被拒绝。
- 校验转换值、固定像素例外以及生成 CSS 的一致性。
- 保持 tokens-only 无 React 依赖、ESM/CJS 等价、SSR 无浏览器全局访问。
- 独立 tarball 消费者使用原有入口即可获得 rem Token 和对应组件样式。

### 浏览器行为

- 根字号分别设置为 16px、21.328px（16 × 1.333）、32px，直接测 computed style；不以操作系统分辨率代替测试条件。
- 六套 Recipe 均覆盖字号与代表性几何；预期值以迁移前像素基准乘比例计算，浏览器小数舍入容差不大于 0.1 CSS px。
- 至少验证 Button、FormControl、Menu、Dialog、SidebarItem、Tabs 的文字、间距和图标；另覆盖 Switch 位移与 Tooltip 箭头，防止混用单位破坏对齐。
- 16px 保持已有三主题、桌面/移动视口视觉基线。不得批量接受基线变化来掩盖默认外观回归。
- 固定像素边框、阴影和胶囊圆角使用单独断言，不套用比例断言。
- 浮层打开后修改根字号，检查大小更新、定位跟随、碰撞处理、键盘关闭和焦点恢复；数字定位偏移保持原值。
- 在现有桌面/移动视口检查放大后交互仍可达。尺寸增大可导致正常换行或滚动；不要求任意业务内容在所有缩放下完全无溢出。
- 测试逐例恢复根字号与注入样式，避免污染既有视觉用例。
- 验证公共库导入不覆盖应用已有的根字号。

实施后执行 `pnpm tokens:check`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm test:visual` 和 `pnpm verify:pack`。按 `TESTING.md` 同步执行涉及公共文档与 skill catalog 的检查，更新相关使用说明；不将此前旧版本的通过结果作为此次验收结果。

## 8. 范围与后续流程

本次范围：基础 Token、六套 Recipe、ExUI 自有组件 CSS 的 rem 迁移，类型/生成/校验、兼容性说明、Changeset 和上述验收。

不包含：新响应式入口、自动缩放运行时、密度接线重构、断点统一、新主题、第三方依赖重写或业务应用迁移。

实施时的公开文档和使用 skill 需反映实际单位契约；本设计文档保留在 `notes/`。

本文审阅通过后，使用 `technical-design-doc-creator` 在 `notes/rem-sizing/rfcs/` 编写一个实现就绪的 RFC，包含固定长度例外清单、目标文件和测试安排。当前仅完成设计文档；未修改生产代码、提交、推送或发布。
