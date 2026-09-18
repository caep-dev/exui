# 交付流水线与门禁

最后更新：2026-09-18

`release` 模块不产出可安装的包，它由三类互相衔接的门禁组成：合并前质量门禁、打包消费者门禁与基于标签的发布流水线。

## CI 质量门禁

`.github/workflows/ci.yml` 在 `pull_request` 与推送 `main` 时运行，只有一个执行作业：

| 项 | 取值 |
| --- | --- |
| runner | `windows-latest`（与视觉基线的平台绑定，见 [[showcase/02-windows-pinned-visual-baselines]]） |
| 运行环境 | Node.js 24、pnpm 11.9.0、`pnpm install --frozen-lockfile` |
| 预置 | 缓存并安装 Playwright Chromium（缓存键为 `pnpm-lock.yaml` 哈希） |
| 顶层权限 | `contents: read` |

步骤顺序固定：tokens 校验 → 类型检查 → lint → 构建 → 技能自测 → 技能生成物一致性 → 技能示例 → 视觉测试 → 打包消费者 → 发布配置校验 → 发布自动化测试。前两步失败会阻断后续所有需要构建产物的步骤。

第二个作业 `ci-gate` 以 `if: always()` 依赖 `verify`，把 `verify` 的结果字符串与 `success` 比较。分支保护只要求这一个聚合检查名，因此新增或重命名 `verify` 内部步骤不会改变必需检查的名称。

## 发布声明

`.release-bootstrap.yaml` 是仓库的对外声明，`pnpm release:verify` 逐字段校验它：

| 字段 | 值 | 含义 |
| --- | --- | --- |
| `schemaVersion` | `1` | 声明格式版本 |
| `provider` | `github` | 必需的工作流文件为 `.github/workflows/ci.yml` 与 `release.yml` |
| `defaultBranch` | `main` | 发布基线 |
| `packageManager` | `pnpm` | 包管理器 |
| `tagStrategy` | `adaptive` | 发布标签形态由仓库是否为 workspace 决定 |
| `changesets.required` | `false` | 不强制每个 PR 携带 Changeset |
| `ci.aggregateCheck` | `ci-gate` | 聚合检查名 |
| `ci.scripts` | `lint`、`typecheck`、`build` | 声明引用的质量脚本必须真实存在于根 `package.json` |
| `hooks[].id` | `npm` | 每个 hook 一个 provider、一个包集合 |

`verify.mjs` 还会拒绝未替换的模板占位符、缺失的 Changesets 配置，以及非 kebab-case 或重名的 hook id。

## 版本与标签流水线

`.github/workflows/release.yml` 由 `CI` 工作流运行完成事件触发，`if` 条件同时要求仓库变量 `RELEASE_AUTOMATION_ENABLED == 'true'`、事件类型为 `push`、结论为成功、分支为 `main`，且被验证的仓库就是本仓库。并发组 `release-main` 且不取消进行中的运行，使相邻合并串行化。

作业内的阶段：

```text
checkout EXPECTED_MAIN（= 被验证的 head_sha，fetch-depth: 0）
  → 安装依赖
  → pnpm release:verify
  → 计划：拉取 origin/main 并要求其仍等于 EXPECTED_MAIN；
         强制建立本地 main 引用（Changesets 按 baseBranch 解析本地 ref，
         而 checkout 处于 detached 状态）；
         changeset status --output → plan.mjs → mode: version | recover | no-op
  → mode == version：version.mjs 应用版本计划，lockfile-only 安装，
         重新跑 tokens:check / typecheck / lint / build / verify:pack / test:release，
         再以 --verify 复核，保证写回的版本差异与校验过的完全一致
  → mode != no-op：用 Release App 生成仓库范围令牌，配置机器人身份与 git 凭据
  → mode == version：只 git add 版本结果里列出的路径，
         提交前确认暂存区非空，提交后再次要求 origin/main 未前进，再推送
  → mode != no-op：tags.mjs 逐个创建并推送注解标签
```

标签阶段只对"被提交的版本差异所声明的"发布创建标签：`tags.mjs` 要求目标提交是受信任的 `chore(release): version packages` 提交、是 `origin/main` 的祖先，并且远端已存在的同名标签必须是注解标签且指向同一提交。已存在的注解标签被视为可恢复状态而非冲突。`plan.mjs` 在 HEAD 提交主题已是 `chore(release): version packages` 时直接返回 `recover` 模式，使中断的发布无需再次升版本即可续跑。设计取舍见 [[release/02-tag-driven-oidc-release]]。

## npm 发布钩子

`.github/workflows/tag-npm.yml` 只在推送匹配 `@exre/exui@*` 的标签时运行，使用 `npm-release` environment 并申请 `id-token: write` 以走 OIDC，不依赖长期 npm 写令牌。步骤顺序：

```text
checkout 标签（fetch-depth: 0）
  → 重新拉取真正的注解标签对象（checkout 会留下指向 peeled commit 的 ref）
     → hook-context.mjs 校验：提交匹配、标签为注解标签、标签属于版本差异、
       提交主题受信任、提交是 origin/main 的祖先、目标包公开且版本与标签一致
  → 全局安装 npm@11.9.0（OIDC 支持下限）
  → 安装依赖
  → release:verify + build + verify:pack
  → npm.mjs 发布
```

`npm.mjs` 只发布声明中的包：打包后重新校验 tarball 内的 manifest，再以 `npm publish --access public --provenance --ignore-scripts` 发布，预发布版本落到 `next` 标签。发布前查询官方注册表，已存在则跳过（幂等），不可用或返回不一致元数据则中止。整个钩子要求运行上下文必须是 GitHub Actions 且仓库为 `caep-dev/exui`，无法在开发者机器上执行，见 `knowledge/release/release-automation-activation.md`。

## 打包消费者门禁

`scripts/verify-packages.mjs` 用 `pnpm verify:pack` 运行，是唯一在 workspace 之外验证产物的环节。它先做仓库边界检查（根包与 Showcase 必须私有，且不得占用公开包名），再 pack 公共包并按 `package-contract.mjs` 校验 manifest 与产物清单，然后建立独立的临时消费者 fixture：

| fixture | 断言重点 |
| --- | --- |
| npm + pnpm 的 tokens-only 消费者 | 依赖树中不得出现任何 React 运行时、类型包或组件实现库（含 pnpm 虚拟店与嵌套 `node_modules`）；字体依赖必须装上；CJS/ESM 两棵 Token 树逐值相等且深度冻结；主题与密度键名完整；缺失 React 时导入组件根入口必须以缺失 React 报错 |
| tokens 类型消费者 | 在 `skipLibCheck: false` 下用 Bundler 与 NodeNext 两种解析编译 `.ts`/`.mts`/`.cts`；`.cts` 走 `import = require` 并断言非法属性与赋值被拒绝；通过 `tsc --listFiles` 证明加载的是 CommonJS 声明入口 |
| tokens 样式消费者 | 独立 Vite 构建能解析字体资源、含配方变量、且不泄漏组件 Tailwind 样式 |
| React 消费者 | `skipLibCheck: false` 类型检查、生产构建、服务端渲染冒烟（Button、字段、Chart），并断言包与消费者解析到**同一个** React 实例 |
| 生产构建的浏览器断言 | `scripts/verify-react-browser.mjs` 在 Chromium 中验证图表两点数据、ExUI 图例与 hover 后变化的 tooltip 值、Dialog 经 portal 打开、表单提交、Escape 归还焦点，以及 16px / 32px 根字号下的 Button 几何与 portal Dialog 内边距 |

fixture 一律建在 `os.tmpdir()` 下的临时目录并在 `finally` 中清理；控制器复用 Showcase 锁定的 Playwright 依赖，浏览器只服务隔离消费者的构建产物。门禁的失效模式与不可替代性见 [[release/03-packed-consumer-gates]]。

## 脚本模块

`scripts/release-bootstrap/` 是一组可单测的纯模块，由 `pnpm test:release` 用 Node 内置测试运行器覆盖（`*.test.mjs`），测试使用临时本地 Git 仓库并注入 npm 注册表边界，从不真实发布：

| 模块 | 职责 |
| --- | --- |
| `_lib.mjs` | 参数解析、`fail(code, message)`、workspace 清单发现、glob 匹配、`adaptiveTag` / `parseTag`、`git()` |
| `plan.mjs` | 由 Changesets status 产出 `version` / `recover` / `no-op` 计划；拒绝私有包与版本不匹配 |
| `version.mjs` | 应用版本计划并支持 `--verify` 复核写回结果 |
| `release-diff.mjs` | 从受信任的版本提交中还原本次发布的包与标签 |
| `tags.mjs` | 创建、冲突检测与恢复注解标签 |
| `hook-context.mjs` | 发布前把标签、提交、包与主分支关系收敛成上下文文件 |
| `npm.mjs` | 注册表状态查询、存在即跳过、tarball 复校验与发布 |
| `verify.mjs` | 校验发布声明、Changesets 配置、质量脚本与 provider 文件 |

`adaptiveTag` 依据仓库是否为 workspace 决定标签形态：workspace 用 `<包名>@<版本>`，单包仓库用 `v<版本>`。本仓库始终是 workspace，因此标签形如 `@exre/exui@<版本>`。
