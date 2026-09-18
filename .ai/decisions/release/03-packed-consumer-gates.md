# 发布前以 workspace 外的打包消费者门禁验收

最后更新：2026-09-18

状态：已接受
模块：release
日期：2026-09-09
来源：`scripts/verify-packages.mjs`、`scripts/verify-react-browser.mjs`、`TESTING.md`

背景：workspace 内的模块解析会通过 `workspace:*` 链接、路径映射与提升后的依赖满足导入，因此"在仓库里能跑"无法证明"消费者装得上"。项目历史上出现过对包契约的判断来自双包结构 CI 的情况，而那套证据不能代表迁移后的单包产物。产物层面还有一类只能靠真实安装暴露的失效：产物清单少了文件、声明引用了没有安装的包、依赖树里混进了本不该出现的 React 或实现库。

决策：发布前必须通过一组在 workspace 之外、只安装打包后 tarball 的消费者门禁。fixture 建在系统临时目录，使用默认的 npm 与 pnpm peer 行为安装——不使用 `--legacy-peer-deps`、`--omit=peer`，也不注入任何 workspace override。门禁覆盖：tokens-only 依赖树（含 pnpm 虚拟店与嵌套 `node_modules`）、tokens 的两种模块系统运行时一致性与深度冻结、tokens 在 Bundler 与 NodeNext 下的类型解析（含 `.cts` 消费者）、tokens 样式表的独立构建、React 消费者的严格类型检查与生产构建与服务端渲染与单 React 实例，以及生产构建在 Chromium 中的真实交互与根字号几何。该门禁同时是 CI 步骤、发布前的版本复核步骤与 npm 钩子的前置步骤。

理由：只有把 tarball 装进干净环境，才能覆盖那些在 workspace 内被链接与提升掩盖的失效模式。默认安装行为是刻意选择：用 override 让 fixture 通过，等于把真实消费者会遇到的安装问题从发布路径上移走，而这些问题正是发布后最难回滚的一类。把同一门禁挂在三个位置，可以保证被验证过的产物与最终被发布的产物是同一个。

影响：本地运行需要先安装 Chromium，fixture 安装需要网络，门禁耗时明显长于其他检查。fixture 与临时目录必须在 `finally` 中清理；Windows 上还需要让 preview 进程在删除目录前退出，否则原生绑定未释放会导致清理失败。任何为了"方便安装"而放宽 fixture 依赖的改动都会使门禁失去意义，因此这类改动必须连带讨论它替代了什么证据。

重新审视条件：出现能等价证明消费契约的更轻量机制时；或包管理器默认安装行为变化使某条 fixture 不再可复现时。

证据：`scripts/verify-packages.mjs` 的整体流程（在 `os.tmpdir()` 下建 fixture、`finally` 中清理）、`verifyRootBoundary`、`assertTokensOnlyTree` 对虚拟店与嵌套 `node_modules` 的递归收集与禁止包集合、`tokensRuntimeCheck` 的 CJS/ESM 等值、深度冻结、主题与密度键名完整、rem 值与固定像素例外断言、缺失 React 时组件根入口必须报错、`verifyTokensTypecheck` 的 `skipLibCheck: false` 与两种解析模式与 `tsc --listFiles` 声明入口断言、`verifyTokensStylesheet` 的独立 Vite 构建与"不得泄漏组件 Tailwind 样式"断言、`verifyReactConsumer` 的严格类型检查与生产构建与服务端渲染冒烟与单 React 实例断言，以及"在子进程中运行 preview 以便 Windows 释放原生绑定"的注释；`scripts/verify-react-browser.mjs` 的图表、Dialog、表单与根字号几何断言；`scripts/package-contract.mjs` 的 manifest 与 exports 锁定；`TESTING.md` 的 Packed-consumer gates 段；根 `package.json` 的 `verify:pack`，以及 `ci.yml`、`release.yml`、`tag-npm.yml` 对它的调用。
