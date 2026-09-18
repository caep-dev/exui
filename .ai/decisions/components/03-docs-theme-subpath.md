# Fumadocs UI 只提供主题子路径，不做组件包装

最后更新：2026-09-18

状态：已接受
模块：components
日期：2026-09-18
来源：`packages/components/src/docs/theme.css`、`packages/components/package.json`、`.changeset/fumadocs-ui-theme-sheet.md`

背景：文档站需要在 ExUI 配色下渲染 Fumadocs UI。最初的设计是在公共包上新增一个 `/docs` JavaScript 子路径，转发 fumadocs 的内容组件，让"写文档页"和"写普通页"共用同一个入口。这个设计在实现前被否决，理由有三条：

1. **声明产物没有干净的解。** 转发层会让 `/docs` 的声明保留裸 `fumadocs-ui/*` 引用，直接违反 `bundle-types.mjs` 结尾那条"已发布声明只能引用 React 与本包文件"的不变量；若改为交给 `bundle-types.mjs` 自动内部化，则会把 fumadocs-ui 与 fumadocs-core 的整个类型图冻进 `types/vendor/`，消费者装到别的版本时，类型就不再描述实际运行的代码。
2. **净收益只有一行 import。** `import { Callout } from "@exre/exui/docs"` 相比 `from "fumadocs-ui/components/callout"` 并不减少工作量，却要求 `verify-packages.mjs` 新增一个打包消费者 fixture，并让 `package-contract.mjs`、`check-dist.mjs`、`bundle-types.mjs` 三处门禁开洞，此后长期维护一份别人 API 的清单。
3. **转发层解决不了真正的重叠。** fumadocs 的内容组件里只有 `Callout`/`Card`/`Accordion`/`Tabs` 与 ExUI 概念重叠，其中 `Tabs` 与 `Accordion` 的 API 与 ExUI 不兼容。包装不消除这个冲突，只是把它暴露出来。

真正需要包来承担的只有主题。`fumadocs-ui/css/shadcn.css` 把 `--color-fd-*` 无 fallback 地映射到 shadcn 的短变量名，而 ExUI 的 token 表定义的正是这些名字，所以两边天然能对接；但必须有人保证 token 表被加载、且两个 fumadocs 样式表顺序正确，否则整站 docs 变量静默计算为 unset，页面只是看起来坏掉而没有任何报错。

实现中还否决了一个中间方案：把 `fumadocs-ui` 声明为**可选 peer**，借包管理器传递兼容范围。前提假设是"可选 peer 不会被自动安装"，实测不成立——pnpm 默认 `auto-install-peers=true`，声明之后它把整个 fumadocs 依赖树真的装进了 workspace（`packages/components/node_modules/fumadocs-ui` 成为符号链接，lockfile 从 830 个包条目涨到 1078），而仓库里没有任何代码使用它。隔离消费者那边确实没有被装入，发布行为是安全的，代价却是为本仓库引入一份纯粹的死重。兼容范围因此改由打包消费者 fixture 钉住并写进 README，不进入 manifest。

决策：公共包新增唯一的 docs 相关入口 `@exre/exui/docs/theme.css`，内容只有三条按固定顺序排列的 `@import`——ExUI token 表 → `fumadocs-ui/css/shadcn.css` → `fumadocs-ui/css/preset.css`。样式表不经过 Tailwind 预编译，原样交给消费者的构建解析。manifest 的**任何依赖字段都不出现 `fumadocs-ui`**；兼容范围 `^16.15.0` 由 `scripts/verify-packages.mjs` 的打包消费者 fixture 钉住，并写进包 README。不新增任何 JavaScript 子路径，不转发 fumadocs 组件。

理由：主题是这里唯一"不做就会静默失败"的部分，而它的成本是一个纯 CSS 文件加一条 `exports` 记录。完全不声明依赖，使 [[components/01-bundle-implementation-dependencies]] 的核心目的——tokens-only 消费者不沾 React——从"依赖管理器的默认行为"变成"manifest 里根本没有这条路径"，并由 `package-contract.mjs` 的字段检查与 `verify-packages.mjs` 的树扫描断言双重锁住。

影响：新增 `packages/components/scripts/build-docs-theme.mjs` 与共享常量 `docs-theme-contract.mjs`。放置步骤是 **`build:types` 链的一步**（紧跟 `fix-css-dts.mjs`），不是 `build` 的独立一步——`clean-types.mjs` 会整体删除 `types/`，任何在 `types/` 里产出声明的步骤都必须属于同一条链，否则 `pnpm typecheck` 单独调用 `build:types` 时会把声明删掉且不再补回。这个缺口在 CI 的顺序（`typecheck` → `build` → `verify:pack`）下恰好被掩盖，只能靠显式跑一次 `build` → `typecheck` → `verify:pack` 暴露；`package-contract.mjs`、`check-dist.mjs`、`verify-packages.mjs` 三处各新增断言；`.gitattributes` 钉死源文件换行符，使拷贝进产物的字节与平台无关。仓库自身的安装图与 lockfile 不受影响。契约的边界要一并理解：它只对齐颜色，fumadocs 的圆角、间距、动效，以及它自己的 `Tabs`/`Accordion` API 都不变；主题切换也只能有一个驱动者，因为 `RootProvider`（next-themes）与 ExUI 的 `ThemeProvider` 共用 `theme` 这个 localStorage key，而后者不能服务端渲染。

重新审视条件：fumadocs 改变 `--color-fd-*` 的映射机制或其样式表结构时；ExUI 决定拥有并定制 docs 组件（而非只对齐主题）时；或某个版本的 Fumadocs 提供了类型可自包含的转发面时。

证据：`packages/components/src/docs/theme.css`；`packages/components/scripts/docs-theme-contract.mjs`；`packages/components/scripts/build-docs-theme.mjs`；`packages/components/package.json` 的 `exports` 与未被改动的依赖字段；`scripts/package-contract.mjs` 对 `./docs/theme.css` 入口与"依赖字段不得出现 fumadocs-ui"的断言；`packages/components/scripts/check-dist.mjs` 对产物导入顺序的断言；`scripts/verify-packages.mjs` 的 `verifyDocsThemeConsumer` 与 `assertTokensOnlyTree` 中的 fumadocs-ui 缺席断言；fumadocs-ui 16.15.11 发布的 `css/shadcn.css`、`css/preset.css` 与 `dist/tailwind/typography.js`。
