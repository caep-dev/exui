# Showcase 消费模型与视觉测试

最后更新：2026-09-18

## 应用

`packages/showcase` 是私有 Vite 应用（`@exre/exui-showcase`），`main.tsx` 先 `import "@exre/exui/style.css"`，再在 `StrictMode` 下渲染 `App → Showcase`。源码中不出现任何指向 `packages/components/src` 的路径或别名，`vite.config.ts` 的插件只有 `@vitejs/plugin-react`，没有 Tailwind 插件，也没有 `resolve.alias`。

两个直接后果：

- 它消费的是**构建后的公共包产物**，不是组件源码。因此视觉测试前必须先完成一次 workspace 构建，否则测试会对着上一版产物运行。
- Showcase 没有自己的 Tailwind 构建，只有组件产物里已经存在的工具类可用。测试夹具里需要额外样式时只能写 inline `style`，不能用自由生成的 Tailwind 类。

## 视觉测试配置

`vitest.config.ts` 定义一个名为 `visual` 的 project：

| 项 | 取值 |
| --- | --- |
| `include` | `src/**/*.vrt.test.tsx` |
| `fileParallelism` | `false`（串行，避免多文件并发争用同一浏览器实例） |
| provider | `@vitest/browser-playwright` |
| contextOptions | `deviceScaleFactor: 1`、`locale: "en-US"`、`reducedMotion: "reduce"`、`timezoneId: "UTC"` |
| instances | `chromium-desktop` 1280×900、`chromium-mobile` 390×844 |

这些取值决定了截图的归一化程度：分数像素比、固定语言区域、禁用动效、固定时区。基线文件名按 `浏览器-平台` 归类，因此同一份用例在不同平台上会寻找不同的基线文件。

## 测试套件

| 文件 | 关注点 | 是否记录截图 |
| --- | --- | --- |
| `ComponentRecipeContract.vrt.test.tsx` | 三套主题（`light` / `dark` / `pitch-black`）× 两种视口下的配方几何、计算样式与真实交互状态 | 是，四个场景各一张 |
| `RemSizing.vrt.test.tsx` | 根字号矩阵下的可缩放几何，以及固定像素例外 | 否 |
| `InteractiveCursor.vrt.test.tsx` | 交互元素的 `cursor` 取值与刻意保留的例外 | 否 |
| `InputGroup.vrt.test.tsx` | 输入组在多个状态下的背景与边框叠加 | 否 |

### 公共夹具模式

各套件共享一套约定，新增用例应沿用：

- 用 `createRoot` 挂到自建容器，`beforeEach` 中 `document.body.replaceChildren(container)`，避免上一个用例的 DOM 残留。
- 注入一条禁用 `animation` / `transition` 的 `<style>`，让断言读到的不是过渡中间态。
- 断言前 `await document.fonts.ready`，否则字体替换会改变文本几何。
- 一套用例允许修改的环境（根字号、主题 class、`body` margin、滚动位置）在 `beforeEach` 快照、`afterEach` 恢复，而不是清空，以免抹掉应用或相邻用例设置的值。

`RemSizing.vrt.test.tsx` 的根字号矩阵为 `16px`、`21.328px`（16 × 1.333，覆盖分数布局）、`32px`（翻倍）。几何比较容差为 0.1 CSS px，浮层相对触发器的位置比较放宽到 1px，因为浮层坐标来自渲染矩形而非计算样式。浮层几何需要轮询到稳定后再读：Radix 在 resize observer 中异步重排，根字号变化后立即读取可能拿到旧位置。

`ComponentRecipeContract.vrt.test.tsx` 里点击会在后续渲染中不稳定的用例（例如选中态）先通过真实交互进入状态再断言，且 `RemSizing` 之所以不记录截图，是为了不给平台基线再增加一组需要维护的图片。

## 断言与基线的分工

两类断言并存，互不替代：

- **计算样式与几何断言**跨平台稳定，覆盖颜色、阴影、内边距、圆角、字号、间距以及交互后的状态值。
- **截图比对**（`toMatchScreenshot`）只用于渲染结果无法用计算样式穷举的场景（配方总览、Tabs、Menu、Dialog），基线文件提交在 `src/showcase/__screenshots__/<测试文件>/` 下。

基线策略与运行平台的绑定关系见 [[showcase/02-windows-pinned-visual-baselines]]，运行视觉测试时的操作约束见 `knowledge/showcase/visual-test-constraints.md`。
