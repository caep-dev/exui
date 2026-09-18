# 公共包的入口与构建边界

最后更新：2026-09-18

## 源码布局

```text
packages/components/
├── components.json           shadcn/ui 生成配置（style: radix-luma，baseColor: olive，别名 @/*）
├── index.ts 等价物 → src/index.ts
└── src/
    ├── index.ts              唯一公共导出汇总
    ├── index.css             组件样式表源，最终产出 dist/index.css
    ├── docs/theme.css        Fumadocs UI 主题契约源，最终产出 dist/docs/theme.css
    ├── components/
    │   ├── theme-provider.tsx
    │   └── ui/*.tsx          shadcn/ui 源组件（约 60 个文件）
    ├── hooks/use-mobile.ts
    └── lib/utils.ts
```

当前所有可复用组件都位于 `src/components/ui`，包括组合度较高的那些。术语表中 `控件组件`、`模式组件`、`布局组件` 描述的是分类意图，对应的目录尚未建立；新增组件时以其所属分类决定落点。

## 公开入口

`exports` 显式列出六个入口，不使用通配符：

| 入口 | 产物 | 契约 |
| --- | --- | --- |
| `@exre/exui` | `dist/exui.js` + `types/index.d.ts` | ESM only；React 19；需要 React 与 React DOM 在宿主中存在 |
| `@exre/exui/style.css` | `dist/index.css` | 完整组件样式，已内含 Token 变量与字体 |
| `@exre/exui/tokens` | `dist/tokens/index.js`（import）/ `dist/tokens/cjs/index.js`（require），各自绑定对应种类的声明 | 无 React 运行时与类型依赖 |
| `@exre/exui/tokens/style.css` | `dist/tokens/style.css` | 仅 Token 变量，保留三套主题 |
| `@exre/exui/tokens/font.css` | `dist/tokens/font.css` | 可选字体，资源可解析 |
| `@exre/exui/docs/theme.css` | `dist/docs/theme.css` | 未预编译的三条固定顺序 `@import`；要求消费者自装 `fumadocs-ui`，包不声明任何依赖 |

React 与 React DOM 是**可选 peer**，范围 `>=19.0.0 <20`，`peerDependenciesMeta.optional` 为 `true`。包不会代装它们；tokens-only 消费者不需要它们。`@exre/exui/docs/theme.css` 面向消费者自己的 Fumadocs 安装，manifest 中不出现 `fumadocs-ui`，理由与边界见 [[components/03-docs-theme-subpath]]。入口形状与依赖排除由 `scripts/package-contract.mjs` 的 `requireExportsEntry` / `assertPublishableManifest` 逐项锁死，任何尝试改动都会在 `pnpm verify:pack` 阶段失败。

包内还随 tarball 附带 `src/`（`files` 字段包含 `src/components`、`src/hooks`、`src/lib`、`src/index.css`、`src/index.ts`）供参考与既有工具复制源码使用，但支持的消费边界只有 `exports`；复制源码的消费者自行承担第三方源码依赖。

## 导出汇总

`src/index.ts` 汇总三层：

- `src/components/theme-provider.tsx` 以**显式命名导出**给出 `ThemeProvider` 与 `useTheme`，不使用 `export *`。
- `src/components/ui/*` 与 `src/hooks/use-mobile`、`src/lib/utils` 以 `export *` 逐文件转发。

新增 shadcn/ui 组件时必须同时在这里补一行转发，否则组件不会被发布，而 Oxlint 的 `react/only-export-components` 规则会提示同时导出组件与非组件的文件。

## 样式表源

`src/index.css` 按顺序 `@import` 四层内容：`tailwindcss`、`tw-animate-css`、`shadcn/tailwind.css`、以及内部工作区的 `font.css` 与 `style.css`（后两者在构建期被解析并内联）。随后用 `@custom-variant dark (&:is(.dark *))` 定义暗色变体，用 `@theme inline` 把 shadcn/ui 的短变量名（`--primary`、`--border`、`--chart-*`、`--sidebar-*`、`--radius` 等）映射为 Tailwind 的 `--color-*`，使工具类能读到 Token。

`package.json` 的 `sideEffects` 把 `*.css` 与 `src/index.css` 标为有副作用，避免打包器在树摇时丢掉样式导入。

## 构建边界

`vite.config.ts` 以库模式构建，入口 `src/index.ts`，输出 `dist/exui.js`、`dist/index.css` 与 `dist/bundled-modules.json`，格式仅 ESM。

外部化判定 `isHostRuntime` 只放行 `react`、`react-dom` 及其子路径（前缀匹配而非包含匹配，避免误放 `react-is`、`react-day-picker`、`react-resizable-panels` 等同样以 `react` 开头的包）。其余实现库全部被打进产物，原因见 [[components/01-bundle-implementation-dependencies]]。

两个自定义插件承担产物完整性：

- `externalRequireToImport`：把被打包的 CommonJS 模块里对宿主运行时的 `require("react"…)` 改写成注入的 ESM 命名空间导入，否则 Rolldown 的 ESM 输出会残留运行期 `require` 调用。判定条件要求文件确实形如 CommonJS，避免改写字符串或注释里出现 `require` 的 ESM 文件。
- `recordBundledModules`：在 `generateBundle` 阶段遍历 chunk 的模块图，回溯每个模块归属的包并记录真实版本，输出 `dist/bundled-modules.json`，供第三方 notices 覆盖实际打进产物的代码而非声明的依赖树。

## Fumadocs 主题契约的放置

`dist/docs/theme.css` 与 `types/docs/theme.css.d.ts` 由 `scripts/build-docs-theme.mjs` 生成，它是 **`build:types` 链的一步**，紧跟 `fix-css-dts.mjs`，排在 `bundle-types.mjs` 之前。

位置由所有权决定：`clean-types.mjs` 是 `build:types` 的第一步，会整体删除 `types/`，所以任何在 `types/` 里产出声明的步骤都必须是同一条链的一部分。把它放进 `build` 会留下一个只在特定顺序下发作的缺口——`pnpm typecheck` 会单独调用 `build:types`，把声明删掉且不再补回，`verify:pack` 随后报打包产物缺文件。注意 CI 的顺序是 `typecheck` → `build` → `verify:pack`，**恰好掩盖**这个缺口，所以它不会被 CI 自动拦住。

排在 `bundle-types.mjs` 之前，则让新声明进入声明整合的最终边界检查。

拷贝是逐字节的，因此源文件在 `.gitattributes` 里钉死 `eol=lf`，避免 CI 的 autocrlf 让产物字节随平台变化。三条 `@import` 的顺序由 `scripts/docs-theme-contract.mjs` 导出为单一常量，放置步骤与 `check-dist.mjs` 都读它，构建期与产物期不会各写一份而漂移。

## 声明产物

`build:types` 依次执行：`clean-types` → `tsc -p tsconfig.lib.json`（`emitDeclarationOnly` 到 `types/`）→ `tsc-alias`（把 `@/*` 别名改写成相对路径）→ `fix-css-dts` → `bundle-types`。最终 `types/index.d.ts` 与 `types/index.css.d.ts` 是入口，`types/vendor/` 承载内部化后的第三方类型。

目标是根声明只依赖包内声明、标准 TypeScript 类型与 React / React DOM 类型：不残留 `radix-ui`、`recharts` 等裸模块引用，也不借助 `any`、削减 props 或 ambient 空壳绕过检查。打包消费者门禁以 `skipLibCheck: false` 编译 React 消费者来验证这一点。

## 构建后检查

`check-dist.mjs` 在构建末尾扫描 `dist/` 与 `types/`：检查期望产物是否存在，并用 `module-specifiers.mjs` 抽取裸模块说明符，确保产物中没有解析不了的第三方导入。`generate-notices.mjs` 依据 `bundled-modules.json` 生成 `dist/third-party-notices.md`。
