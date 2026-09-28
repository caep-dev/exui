# Showcase 消费模型与视觉测试

最后更新：2026-09-28

## 应用

`packages/showcase` 是私有 Vite 应用（`@exre/exui-showcase`），`main.tsx` 先 `import "@exre/exui/style.css"`，再在 `StrictMode` 下渲染 `App → Showcase`。源码中不出现任何指向 `packages/components/src` 的路径或别名，`vite.config.ts` 的插件只有 `@vitejs/plugin-react`，没有 Tailwind 插件，也没有 `resolve.alias`。

两个直接后果：

- 它消费的是**构建后的公共包产物**，不是组件源码。因此视觉测试前必须先完成一次 workspace 构建，否则测试会对着上一版产物运行。
- Showcase 没有自己的 Tailwind 构建，只有组件产物里已经存在的工具类可用。测试夹具里需要额外样式时只能写 inline `style`，不能用自由生成的 Tailwind 类。

## 组件目录

`Showcase` 是单页开发者组件目录。它以语义分类（Foundation、Actions、Form controls、Data display、Feedback、Overlays、Navigation & layout）组织公开组件入口；Overview 同时列出全量目录卡片并支持按名称或用途搜索。分类选择写入 URL hash，浏览器前进、后退和直达链接都从 hash 恢复当前分类。

分类页只渲染该类别的既有交互预览，避免把全部示例堆进长页；`Quality recipes` 是独立入口，承载 `ComponentRecipeContract` 的确定性视觉回归夹具。目录数据与选中状态在 `Showcase.tsx`，其响应式网格、桌面粘性侧栏、移动筛选面板和搜索框间距在同目录的 `Showcase.css`。后者是 Showcase 的本地 CSS，不依赖未编译进公共样式表的 Tailwind 工具类。

Feedback 分类包含 `ExMessage` 的可操作预览。`ShowcaseContent` 挂载唯一的 `ExMessageContext`，预览通过公共 `ExMessage` 入口发出普通提示，并保存 loading 句柄以完成或关闭提示；预览卸载时关闭仍在加载的提示。目录与预览交互由 `ShowcaseCatalog.vrt.test.tsx` 在桌面和移动视口验证，消息控制器的边界见 [`components/ex-message`](../components/ex-message.md)。

## 语言切换

`ShowcaseLanguageProvider` 只管理私有 Showcase 的英语与简体中文。首次读取浏览器 `navigator.language`（`zh` 前缀选中文，其余选英文）；手动选择写入 `localStorage`，后续访问优先使用该选择。切换时同步更新页面 `lang` 与标题，不改变分类 hash。`translations.ts` 以英文原文作为文案键；目录中的组件/API 名称保持英文，目录说明与两种语言的分类名称都能用于搜索。

表单示例保留稳定的英文 Schema 和同一表单实例。公开组件的 `formatIssue` 只转换显示中的字段错误和摘要，不改写原始校验记录，因此切换语言时草稿及已出现的错误仍留在页面，并立即按当前语言显示。步骤、文件与关闭按钮的可配置文案见 [`components/forms`](../components/forms.md) 和公开组件参考文档。

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
| `ShowcaseCatalog.vrt.test.tsx` | 目录分类与 hash、全量目录搜索、指标布局及 Feedback 的全局消息预览 | 否 |
| `ShowcaseLocale.vrt.test.tsx` | 浏览器默认语言、手动持久化、中文搜索、表单草稿与错误、内置按钮文案 | 否 |
| `ExMessage.vrt.test.tsx` | 全局消息的容量、时限、加载句柄与宿主生命周期 | 否 |

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
