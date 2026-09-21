# 玻璃材质的层叠与运行约束

最后更新：2026-09-21

以下四条都是读单个源文件看不出来、且改动后会**静默**改变结果的行为。它们来自 Tailwind v4 的产物分层、CSS 级联规则与 `backdrop-filter` 的浏览器语义。

## 1. 材质规则与重置分属不同层，改错层就静默失效

`glass.css` 里两类声明刻意放在不同的层，这条分工是整套覆盖关系成立的前提：

| 声明 | 层级 | 为什么 |
| --- | --- | --- |
| 材质本体（背景、前景、`backdrop-filter`、`box-shadow`）与状态规则 | **无 layer** | 组件配方写在 `@layer utilities`，无 layer 声明胜过任何 layer，因此材质不会被调用方的 class 顺序或工具类优先级打掉 |
| `--_exui-glass-host-shadow` 的默认值 | `@layer base` | 它必须**输给** utilities 层的伴随变量（`focus-visible:[--_exui-glass-host-shadow:…]` 等），否则宿主阴影与焦点环会被重置值盖掉；同时它必须是本地声明，否则外层玻璃面的运行态变量会继承进嵌套表面 |

实测的层序是 `properties → theme → base → components → utilities`，所以 base 里的重置输给 utilities 里的伴随变量，两者又都输给无 layer 的材质本体。把重置搬进无 layer、或把材质规则搬进任何 layer，都会让某一边的覆盖关系反过来，而 `pnpm typecheck`、`pnpm build` 与截图都不会报错。

## 2. 交互状态的特异性是刻意为零和

三条状态规则（hover / selected / active）共用同一个形状：`.ex-glass[data-exui-glass-interactive]` 加一个伪类或 `:is()`，把"是否禁用"的排除条件放进 `:where()`。`:where()` 贡献 0 特异性，`:is()` 取参数中最高的那一项（这里是属性选择器），于是三者权重相同，`active > selected > hover > default` 完全由源码顺序实现。禁用排除条件写成 `:not(:disabled, [aria-disabled="true"], [data-disabled="true"], [data-disabled=""])`：`data-disabled` 按值匹配而不是按存在匹配，因为 Radix 写空串而其他库写 `"true"`/`"false"`。把排除条件从 `:where()` 里挪出来会抬高该规则的特异性，顺序就不再决定优先级。

## 3. `CSS.supports` 只证明解析，不证明绘制

`supportsGlassRefraction` 是语法接受度检查。一个引擎可以接受含 URL 的 `backdrop-filter` 链而在绘制时把整条链丢弃；此时 `--_exui-glass-reference` 已经被写入，而滤镜引用与 `blur()`/`saturate()` 共用同一条声明，于是丢弃会连基础模糊一起带走。**CSS 没有"只保留 blur"的回退手段**：同属性的多条声明里，只要含 URL 的那条在级联中胜出，就不存在让浏览器退回上一条的机制（"解析即失败"才会自然回退，这个场景不是）。这不是可以用 `@supports` 补掉的缺口，判断依据与被否的备选方案见 [[components/04-glass-capability-gating]]。

**操作约束**：不要声称"增强失败不影响基础模糊"；也不要把"未收录/不接受的引擎"与"接受但绘制失败的引擎"混为一谈——前者走恒等 `brightness(1)`、基础材质完好，后者会一起丢。

## 4. 增强没有任何像素级验证覆盖

仓库明确不做玻璃的视觉验证（不加截图基线、不做像素比对）。因此关于材质的自动化证据只有三类，且都只读 computed style 或标记：`pnpm tokens:check` 的 `glass-policy.mjs`（形状、派生关系、发射保持引用、三主题对比度）、`Glass.vrt.test.tsx`（标记落点、几何与层叠不变、状态可辨、seed 生命周期）、打包消费者门禁（真实 tarball 的 Token 变量、负向类型、SSR seed、computed style）。

**操作约束**：这三类证据都不能支持"折射**渲染**可用"的结论，交付与发布说明里该结论必须标为未验证。已完成的既有非 Glass 视觉基线仍然照跑，那属于回归覆盖而不是玻璃验证。需要真实像素证据时，按 [[components/04-glass-capability-gating]] 的重新审视条件处理。

## 5. 未知能力与没有 seed 是两条不同路径

容易混淆的两个降级入口，行为并不相同：

- **没有 seed**：链尾落在恒等 `brightness(1)`，链中不含任何 URL。
- **有 seed 但 `CSS.supports` 不通过**：`glass-seed.tsx` 不做登记，链尾同样是 `brightness(1)`。

两条路径都不写 `--_exui-glass-reference`，也不留下指向不存在滤镜的引用。`#3` 描述的"接受但绘制失败"是第三条路径，只有它会连基础模糊一起丢。
