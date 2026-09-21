# 增强资格用运行时语法检查，不维护浏览器能力表

最后更新：2026-09-21

状态：已接受
模块：components
日期：2026-09-21
来源：`packages/components/src/lib/glass-capabilities.ts`、`packages/components/src/components/glass-seed.tsx`、`packages/components/src/glass.css`、`.changeset/glass-material.md`

背景：玻璃材质的增强部分是一个 SVG 折射滤镜，经 `backdrop-filter` 链里的 `url(#exui-glass-distortion-v1)` 生效。源设计（`.notes/glass-effects/`）把"URL 链会不会被引擎整体丢弃"当成主要风险：它引用了 WebKit 317059（含 URL 的 backdrop-filter 链被整体丢弃）与 245510（SVG 背景滤镜实现差异），并据此要求一张保守能力表——用 UA Client Hints 推断引擎主版本与平台，比对"实际做过渲染验证"的清单，未收录版本一律退回基础毛玻璃，且明确拒绝把 `CSS.supports` 或一条 CSS URL 声明当作渲染成功的证据。设计还把"绝不先放一个未经验证的 URL 再期待浏览器保留 blur"写成硬约束。

实现前对本地 pinned 环境做了实测（Playwright 1.62.1 的 Chromium 151.0.7922.34，Windows headless）：`CSS.supports("backdrop-filter", 'blur(8px) url("#invert")')` 返回 `true`；把 url 链与纯 blur 分别渲染后比较同一区域像素，八组用例得到八种不同结果；`blur(8px) url(#invert)` 既不等于纯 blur（URL 被忽略）也不等于无滤镜（整条链被丢弃），说明 Chromium 确实应用了该引用；RFC 5.1 的候选滤镜链（`feTurbulence` + `feGaussianBlur` + `feDisplacementMap scale=8`）有可见位移。也就是说，能力表主要防范的那个失败模式在目标引擎上不成立，"为它维护一张需要持续补证据的版本表"性价比很低。

决策：增强资格由 `supportsGlassRefraction(view, reference)` 在做 ref 回调时判定，同时试标准属性与 `-webkit-backdrop-filter` 前缀属性，要求两者之一既接受 `blur(1px) saturate(1.2) brightness(1)` 也接受同一串加 URL 引用的形式；探测字面量与 `glass.css` 里实际声明的形状一致（`var()` 在解析期不会被替换，探测必须用字面量）。通过则该 document 的 `documentElement` 得到 `--_exui-glass-reference`，否则不写，链尾落在恒等 `brightness(1)`。函数是纯的、导入期不读 `navigator`，缺失 `CSS.supports`、detached window 与服务端渲染一律返回 `false`。

理由：这条件只依赖引擎自身能力，不需要在每次浏览器发主版本时重跑验证、补表项、或忍受新版本静默降级；`pnpm tokens:check`、Showcase 契约测试与打包消费者门禁共同保证基础材质、标记落点、状态与几何不因这条路径而回退。探测形状与真实声明对齐，是为了避免"测的形状和发的形状不是同一个"这类无效证据。

代价：这是一个**语法接受度**检查，不是渲染检查。一个"能解析 url 链、绘制时丢弃整条链"的引擎仍然会通过检查，而此时 `--_exui-glass-reference` 已被写入，滤镜引用与 `blur()`/`saturate()` 共用同一条 `backdrop-filter` 声明，所以丢弃会连基础模糊一起带走。CSS 层面没有"只保留 blur"的回退手段：同属性的两条声明里，一旦含 URL 的那条在级联中胜出，就不存在让浏览器退回上一条的机制（这与"解析即失败"不同，后者才会自然回退）。这条残留风险不能靠加 `@supports` 消除。另外，增强的渲染本身没有任何像素级验证覆盖（明确不做玻璃视觉验证），因此"折射在目标引擎上可用"这一结论目前只有一次性的实测记录，没有进入任何门禁。

影响：`glass-capabilities.ts` 是唯一判定点，`glass-seed.tsx` 只在它返回 `true` 时才登记根变量，`glass.css` 通过 `var(--_exui-glass-reference, brightness(1))` 消费它，三者不各自再判断一次。文档层面把限制写进了 `packages/components/README.md`、`skills/exui-usage/references/glass.md`、`TESTING.md` 与发布说明：不得声称"增强已验证"，也不得声称"增强失败不会影响基础模糊"。`.ai` 侧的具体约束见 [玻璃材质的层叠与运行约束](../../knowledge/components/glass-material-constraints.md) 与 [玻璃材质的结构与落点](../../architectures/components/glass-material.md)。

重新审视条件：需要在 Chromium 之外的引擎上承诺增强一致性时；目标 Chromium 出现"接受但丢弃 URL 链"的回归时；或要求把"折射渲染可用"纳入发布门禁的真实像素证据时——那时应恢复能力表或改为引擎实测清单，而不是继续放宽语法检查。

证据：`packages/components/src/lib/glass-capabilities.ts` 的 `supportsGlassRefraction` 与 `BASIC_CHAIN` / `referenceChain`；`packages/components/src/components/glass-seed.tsx` 的 `attachDocumentReference`；`packages/components/src/glass.css` 中 `.ex-glass` 的 `backdrop-filter` 声明；`packages/showcase/src/showcase/Glass.vrt.test.tsx` 中"引擎拒绝滤镜链时保留基础 blur"用例（该用例桩掉 `CSS.supports` 并断言桩确实生效）；本地 pinned Chromium 151.0.7922.34 的实测记录。
