# Showcase 只通过公开入口消费组件库

最后更新：2026-09-18

状态：已接受
模块：showcase
日期：2026-09-09
来源：`packages/showcase/package.json`、`packages/showcase/vite.config.ts`、`packages/showcase/src/main.tsx`

背景：Showcase 与组件源码同处一个 workspace，直接引用 `packages/components/src` 或配置别名可以绕过构建、加快反馈，但那样它验证的就不再是对外发布的东西：源码路径与别名能解析的导入，在打包后的 tarball 里未必存在。而仓库把公共入口当作唯一承诺的消费边界。

决策：Showcase 只通过公开入口消费组件库——依赖声明为 `"@exre/exui": "workspace:*"`，源码只导入 `@exre/exui`、`@exre/exui/style.css` 等公开子路径，`vite.config.ts` 不配置任何指向组件源码的别名或路径映射。视觉测试作为独立命令运行，且要求先完成 workspace 构建。

理由：让 Showcase 成为与外部消费者同构的使用方，它的视觉测试便同时充当公共入口的集成验证：入口缺失、产物缺文件、样式表没带上 Token 变量都会在 Showcase 直接暴露。反过来，如果 Showcase 走源码路径，这类问题只能等到发布后由消费者发现。

影响：Showcase 无法使用组件包尚未导出的符号，也不能依赖只有源码才存在的路径。开发时修改组件源码必须重新构建组件包才能看到效果；`pnpm dev` 会先构建 tokens 与组件，但不监听它们的源码变化。Showcase 因此也没有自己的 Tailwind 构建，只能使用组件产物已含的工具类，夹具中的额外样式需要写成 inline `style`。

重新审视条件：需要在 Showcase 中演示尚未发布的组件时；或引入监听式库构建，使源码路径不再是唯一的快速反馈手段时。

证据：`packages/showcase/package.json` 的 `@exre/exui: workspace:*` 依赖与 `test:visual` 脚本；`packages/showcase/vite.config.ts` 只有 `@vitejs/plugin-react`，既无 Tailwind 插件也无 `resolve.alias`；`packages/showcase/src/main.tsx` 与四个 `*.vrt.test.tsx` 的导入；根 `README.md` 关于 `pnpm dev` 不监听库构建、Showcase 消费已构建公开入口的说明；`CONTRIBUTING.md` 的"保持 Showcase 导入走公开入口"与 `TESTING.md` 的"先构建 workspace 再跑视觉测试"要求；`RemSizing.vrt.test.tsx` 中关于 Showcase 没有自有 Tailwind 的注释。
