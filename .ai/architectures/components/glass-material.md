# 玻璃材质的结构与落点

最后更新：2026-09-21

共享玻璃材质（`glass` prop / `ex-glass` class）横跨 Token 与组件两个模块：参数在 `packages/tokens` 生成，规则与生命周期在 `packages/components`。材质本身是新增公共视觉能力，公开面只有 `GlassSeed` 一个符号加各表面的布尔属性。

## 模块构成

```text
packages/components/src/
├── lib/glass.ts                    标记常量、GlassSurfaceProps、精确 token 识别与标记迁移
├── lib/glass-capabilities.ts       supportsGlassRefraction(view, reference)：纯函数，导入期不读浏览器全局
├── components/glass-seed.tsx       静态 SVG 滤镜定义 + 按 document 引用计数的根变量登记
├── glass.css                       材质规则（无 layer）与 @layer base 的私有变量重置
├── index.css                       以 @import "./glass.css" 接入现有完整样式表
└── index.ts                        显式导出 GlassSeed（与其他显式导出并列，不用 export *）
```

Token 侧的 `themes.<theme>.glass` 分组与它在样式表里的发射方式见 [Token 生成与消费结构](../tokens/token-pipeline.md)；该分组是唯一不按字面值展平的组，这一事实记在那篇文档里，此处不重复。

`src/index.ts` 对本模块只做一件事：`export { GlassSeed }`。标记常量、`GlassSurfaceProps` 与能力判定都是包内复用面，不进公共导出——`lib/glass.ts` 不通过 `src/index.ts` 的 `export * from "./lib/utils"` 泄漏，那条转发只覆盖 `lib/utils`。

## 两个等价入口

| 入口 | 形式 | 语义 |
| --- | --- | --- |
| 属性 | `glass?: boolean`，合并进各表面现有 props | 默认 `false`；只决定是否添加标记，绝不透传为原生属性 |
| 类 | `className="ex-glass"` | 不依赖父节点是 ExUI 组件、不依赖 context，普通 `div` 同样生效 |

标记以空白分词精确匹配，`ex-glass-foo` 是另一个类。`glass={false}` 不撤销调用方显式写入的 `ex-glass`；两者同时出现时显式类生效。标记本身不向普通后代传播，嵌套表面各自按实际 DOM 背景合成。

## 标记落点

标记必须落在真正绘制背景的那一层。多数表面与自身可见元素重合，例外集中在组合表面：

| 表面 | 落点 |
| --- | --- |
| 普通表面 | 组件现有的可见元素 |
| `Bubble` | 不绘制自身；根上只写 `data-exui-glass-delegate="bubble"`，由 `glass.css` 的直接子选择器把材质画到该 Bubble 自己的 `BubbleContent`。`BubbleContent` 单独开启也走同一套规则，两种入口不叠加 |
| `NativeSelect` | 调用方的 `className` 保留在 wrapper（承载布局），只有标记被抽到内部 `<select>` |
| `InputGroup` / `ComboboxInput` | 外层输入框表面承载；`ComboboxInput` 把 `glass` 下传给它渲染的 `InputGroup`，内部控件继续透明 |
| `Sidebar` | 三个分支分别落点：`collapsible="none"` 作用于自身，桌面分支作用于 `sidebar-inner`，移动分支把标记作为 `glass` 传给 `SheetContent`。移动分支一贯忽略 `className`，因此只搬布尔标记，不改布局行为 |
| `CommandDialog` | 材质位于 `DialogContent`；`DialogContent` 同时得到命令对话框专属标记，使未独立开启 Glass 的直属 `Command` 让出底色 |
| 其余 Portal Content | 材质放在实际 Content，而不是 Root / Positioner / Overlay |

`Select` 是复合包装控件，`glass` 跟着 `className` 走向 `SelectTrigger`；`SelectContent` 保持独立开启。

弹出层表面（`SelectContent`、`ComboboxContent`、`DropdownMenu*`、`ContextMenu*`、`Menubar*`）自带 `::before` 模糊层。开启材质时该层被条件性移除，避免两套材质叠加；判定同时接受 `glass` 属性与 `ex-glass` 类两个入口。

## 增强链路

```text
GlassSeed 挂载
  → ref 回调取得 ownerDocument.defaultView
  → supportsGlassRefraction(view, 'url("#exui-glass-distortion-v1")')   # 语法接受度检查
  → 通过则在 documentElement 上写 --_exui-glass-reference
  → glass.css 的 backdrop-filter 以 var(--_exui-glass-reference, brightness(1)) 收尾
```

- 没有 seed 时链尾是恒等 `brightness(1)`，链中不含 URL，因此不会留下指向不存在滤镜的引用。
- `glass-seed.tsx` 渲染静态 SVG（`aria-hidden`、`focusable="false"`、零尺寸、绝对定位、不吃指针事件），服务端可安全输出。
- 同一 document 上的 seed 以 `WeakMap<Document, { count, previous, previousPriority }>` 引用计数：第一个登记时捕获宿主原有值与优先级，最后一个撤销时按原值与原优先级恢复，因此挂载、卸载、重挂、Strict Mode 与"多个 seed 里先卸载一个"都不会留下悬空引用，也不会在仍有 seed 时把增强关掉。
- 一个 document 只应挂载一个 seed；多 seed 不属于支持用法，引用计数只保证它的卸载顺序无关，不提供自动去重。
- 滤镜定义为共享，跨 document（`iframe`）需各自挂载；Shadow DOM 的跨边界滤镜解析不在契约内。

资格判定的依据、被否的浏览器能力表方案以及这条路径的残留风险见 [[components/04-glass-capability-gating]]；边缘如何提供见 [[components/05-glass-edge-from-inset-shadow]]。

## 状态与层叠

- 只有带 `data-exui-glass-interactive` 的表面响应 hover / active，静态 `div` 不会因为加了材质就变得可交互。
- 选中 / 按下 / 展开态由 `:is([aria-checked="true"], [aria-pressed="true"], …, [data-state="open"])` 匹配，与 hover / active 同特异性，靠源码顺序实现 active > selected > hover > default；禁用态在三者上都被排除。层级与特异性的具体约束见 [玻璃材质的层叠与运行约束](../../knowledge/components/glass-material-constraints.md)。
- 危险语义用 `data-exui-glass-tone="danger"` 表达，值来自组件自己的 variant；该标记与 `glass` 是否开启无关，因此调用方事后加 `ex-glass` 仍能得到危险材质。
- 材质只写绘制属性，不动 `display` / `position` / `z-index` / 尺寸 / 内边距 / 间距 / 圆角 / `overflow` / 指针事件，也不新增包裹节点。

## 门禁与验证边界

| 层 | 门禁 |
| --- | --- |
| Token | `pnpm tokens:check` 的 `glass-policy.mjs`：形状、rem 长度、正的 saturation、派生关系、发射保持引用、三主题状态对比度 |
| 组件行为 | `packages/showcase/src/showcase/Glass.vrt.test.tsx`（computed style 与标记落点，不录截图基线） |
| 打包产物 | `scripts/verify-packages.mjs` 的 packed tokens 断言、`glass-types.tsx` 负向类型 fixture、SSR seed 断言；`scripts/verify-react-browser.mjs` 的隔离消费者浏览器断言 |

这些门禁都只读 computed style 与标记，**不构成对折射渲染的证明**。原因与后果见 [玻璃材质的层叠与运行约束](../../knowledge/components/glass-material-constraints.md)。
