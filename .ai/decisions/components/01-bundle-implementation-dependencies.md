# 组件实现依赖编译进产物

最后更新：2026-09-18

状态：已接受
模块：components
日期：2026-09-09
来源：`.notes/archive/single-package-exui/rfcs/single-package-exui-rfc.md`、`packages/components/vite.config.ts`

背景：组件库依赖 Radix UI、Base UI、Recharts、cmdk、vaul、sonner 等一批实现库，而这些库自身带必需的 React peer。若把它们声明为运行时依赖，任何安装组件的消费者都会被带入这些库及其 React 传递安装路径；tokens-only 消费者也会被牵连，而 tokens 本应完全不需要 React。仅调整顶层 `peerDependenciesMeta` 并不能阻止安装期的 React 传递依赖。

决策：Vite 构建只把 `react`、`react-dom` 及其全部子路径视为外部宿主运行时，其余实现库全部打进 `dist/exui.js`；实现库改列 `devDependencies`，公共 manifest 的 `dependencies` 只保留字体包，React 与 React DOM 保持范围 `>=19.0.0 <20` 的可选 peer。声明产物同步内部化第三方类型图，使 TypeScript 消费者也不需要安装实现包。清除工作不使用 npm `bundledDependencies`。

理由：实现代码被编译进产物后，生产依赖图里没有能让安装器引入 React 的路径，tokens 隔离因此成为产物内容问题，可以在打包消费者门禁里直接断言。相比携带第三方 `node_modules`，编译打包能真正消除裸模块说明符；相比关闭 peer 安装、削减 props 或用 ambient 空壳掩盖类型，它不削弱公开类型契约。

影响：同时自行使用这些库的消费者会下载重复的实现代码；同一页面内消费者自己的 Radix / Base UI provider 与 ExUI 内置实例不共享 context，必须用 ExUI 自己的 provider 包裹组件，失效模式见 `knowledge/components/bundled-runtime-constraints.md`。包体积与构建时间增加。声明整合成为构建的必需阶段：若某个公开类型无法内部化，必须停止并上报冲突，不允许回退到恢复安装依赖。

重新审视条件：宿主运行时不再只有 React 时；某个被内置的库提供了稳定的跨实例共享机制时；或包体积成为主要约束时。

证据：`packages/components/package.json` 的 `dependencies`（仅 `@fontsource-variable/outfit`）、`peerDependencies` / `peerDependenciesMeta` 与 `devDependencies`；`packages/components/vite.config.ts` 的 `isHostRuntime` 前缀判定及其关于不得误放 `react-is`、`react-day-picker`、`react-resizable-panels` 的注释、`externalRequireToImport` 与 `recordBundledModules` 插件；`scripts/verify-packages.mjs` 的 `FORBIDDEN_TOKENS_TREE_PACKAGES` 集合与 `@radix-ui/`、`@base-ui/`、`d3-` 前缀判定，以及"生产依赖字段不得引用私有 tokens 工作区"检查；`scripts/package-contract.mjs` 对可选 React peers 与 exports 的锁定；`packages/components/scripts/bundle-types.mjs`；`packages/components/README.md` 的 Bundled implementation dependencies 段。
