# 发布产物的运行时约束

最后更新：2026-09-18

以下三条都是 `@exre/exui` 消费者会踩到、但从组件源码读不出来的行为。它们的根因是构建边界：实现库被打进产物，宿主运行时只有 React（见 [[components/01-bundle-implementation-dependencies]]）。

## 1. 内置实例与消费者自装实例不共享 context

产物里的 Radix UI、Base UI、Recharts 等各自是一份独立副本。消费者如果自己也安装了这些库，两份副本不会互相通信：

- 消费者用自己的 Radix / Base UI provider 包裹 ExUI 组件，ExUI 组件读不到该 provider 的值，因为它在读自己那份实现里的 context。要共享状态必须使用 ExUI 导出的 provider。
- 这一点在图表上后果最隐蔽：从 `recharts` 直接导入图表原语时组件照常渲染，但 `ChartTooltip` 与 `ChartLegend` 的内容消失，且没有任何报错。必须从根入口的 `Recharts` 命名空间取原语，见 [[components/02-bundled-recharts-namespace]]。

**判断方法**：如果消费者代码里出现来自 `radix-ui`、`recharts`、`vaul`、`cmdk`、`sonner` 等包的导入，且这些组件需要与 ExUI 组件协作，就存在两份实例的风险。

## 2. ThemeProvider 无法在服务端渲染

`ThemeProvider` 在渲染期间读取 `localStorage`，因此在没有 `window`/`localStorage` 的环境里无法渲染，SSR 场景下会失败。`"use client"` 不足以规避：它只影响打包分组，不阻止预渲染。

**操作约束**：SSR 框架中必须在 hydration 之后、只在浏览器里挂载 `ThemeProvider`。这一限制不是文档疏漏而是刻意保留的边界——仓库自己的服务端渲染冒烟用例就绕开了它，只覆盖其余公开面（Button、表单、Chart 系列），因此**服务端渲染能力在 `ThemeProvider` 上没有被门禁覆盖**。

## 3. 缩放只覆盖 ExUI 自己管理的尺寸

ExUI 的可缩放长度随应用根字号变化，但边界只到 ExUI 自己的代码：

- 第三方内部几何保持固定：Sonner 的 toast、Recharts 的坐标轴与容器不随根字号缩放。ExUI 自己提供的图例、tooltip 与图标内容会缩放。
- 数字型定位参数（`sideOffset`、`alignOffset`）按上游像素契约解释，永远不乘根字号。浮层因此不会随根字号等比例远离触发器——这是有意的，浮层仍会重新定位以保持与触发器的关系。
- 固定像素的可见效果同样不缩放：发丝边框与分隔线、焦点环与阴影、胶囊圆角。

**判断方法**：不要因为根字号翻倍就预期整页严格等比放大。需要严格的视觉比例时，应自行控制第三方组件的尺寸参数，而不是依赖根字号。
