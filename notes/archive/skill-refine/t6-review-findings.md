# T6b 独立代码评审报告：冻结候选（相对 fa91738）

日期：2026-09-11。评审人：code-reviewer（独立只读评审，未实施本工作区任何改动）。

## 0. 候选身份校验（开始前执行）

| 项 | 声明值 | 实测值 | 结果 |
| --- | --- | --- | --- |
| HEAD | fa91738354900943e1c9c62e7d9b7586c2f15c44 | fa91738354900943e1c9c62e7d9b7586c2f15c44 | 匹配 |
| tracked diff | 52 files +1466/−107 | 52 files changed, 1466 insertions(+), 107 deletions(-) | 匹配 |
| `git diff \| sha256sum` | 429b393603d0017bf6e7ea1750e55e2c8fe5589898b30d15eda2a3c811afe547 | 429b3936…e547 | 匹配 |
| untracked digest | 6b864f30d7dc4f70523c8a876a3872c8cf68f2885c1d75c64102200b52342fca | 6b864f30…2fca | 匹配 |

候选与冻结声明一致，评审基于该候选进行。

## 1. 评审清单逐项核查结果

### 1.1 通知契约正确性 — PASS

- **三段优先级**：`packages/components/src/components/ui/sonner.tsx:10-12` 实现 `const resolvedTheme = explicitTheme ?? providerTheme ?? "system"`，与约定一致。
- **无 Provider 不抛错**：`useOptionalTheme`（`packages/components/src/components/theme-provider.tsx:175-178`）返回 `undefined` 而不抛错，Toaster 回退 `"system"`，由 sonner 内部解析 `prefers-color-scheme`。
- **公开 useTheme 契约未放宽**：`theme-provider.tsx:160-168` 的 `useTheme` 一行未改，Provider 外仍抛 `useTheme must be used within a ThemeProvider`；dist/exui.js 中该错误字符串保留（grep 计 1 次）。
- **同一打包实例**：sonner.tsx:60 在组件文件内 `export { Toaster, toast }`，`src/index.ts` 经 `export * from "./components/ui/sonner"` 拾取；`vite.config.ts` 的 external 仅 react/react-dom（`isHostRuntime`，vite.config.ts:10-12），sonner 不在 external 中；`dist/bundled-modules.json` 中 sonner 仅一个条目（2.0.7，来自 node_modules pnpm store），单 chunk 单模块注册表 → Toaster 与 toast 共享同一队列状态。
- **八方法与无 active**：vendored 声明 `packages/components/types/vendor/sonner/dist/index.d.mts:127-142` 确认 `success/info/warning/error/custom/message/promise/dismiss/loading` 存在、**无 `active`**；pnpm-lock 确认 sonner 锁定 2.0.7。示例实际使用 `toast.success/error/info/loading/dismiss`，均在约定面内。完整性表述问题见发现 N1。

### 1.2 公开导出面 — PASS

- **净增仅 toast**：`skills/exui-usage/references/generated/component-exports.md` 的 diff 仅新增一行 `- \`toast\` — value`（归入 Sonner 家族）；`dist/exui.js` 导出语句含 `ThemeProvider, Toaster, toast, useTheme`。
- **useOptionalTheme 未泄漏**：`packages/components/src/index.ts:4-8` 将 `export * from "./components/theme-provider"` 收窄为显式 `export { ThemeProvider, useTheme }`；`types/index.d.ts` 首行同步；dist 导出与 `component-exports.md`、`SKILL.md` 中 grep `useOptionalTheme` 均为 0 次。
- **无手写缩水类型门面**：`types/components/ui/sonner.d.ts` 直接 `import { toast, type ToasterProps } from "../../vendor/sonner/dist/index.mts"`，使用 bundle-types.mjs 自动 vendor 的完整 sonner 声明，未手写缩水类型。
- **Theme provider 家族**：component-exports.md 的 Theme provider 组为 `ThemeProvider`、`useTheme` 两个 value，清单正确。

### 1.3 打包边界 — PASS

- `packages/components/vite.config.ts` 不在 diff 中（未修改），external 仍仅 React/React DOM。
- `packages/components/package.json` 的 `exports`/`files`/`peerDependencies` 未变；Token 子路径（`./tokens`、`./tokens/style.css`、`./tokens/font.css`）隔离未动。
- **next-themes 全清**：devDependencies 移除该条目（package.json diff 仅此一行）；`pnpm-lock.yaml` diff 仅删除 next-themes 的 importer/packages/snapshots 三处条目；`dist/bundled-modules.json` 无 next-themes。
- `scripts/verify-packages.mjs` 未修改（最后修改为基线前的 131162a），`FORBIDDEN_TOKENS_TREE_PACKAGES` 禁装清单（verify-packages.mjs:81-132）完整保留，含 sonner 与 next-themes。

### 1.4 updater 与门禁完整性 — PASS

- **entry-re-export 过滤不削弱守卫**：`skills/exui-usage/scripts/update.mjs:386-397` 的 `resolveDeclarationGroup` 过滤 `vendored` 与 `entry-re-export` 两类后仍要求 ≥1 个 approved group（"no declaration in an approved group"）且组一致；root-level vendor re-export（仅 entry specifier + vendored 声明）仍失败——self-test 有该负例的真实断言（update.mjs:818-830）。
- **validateHumanDocuments 扩展**：react-setup.md 与 theme-usage.md 成为必需人工文档（缺失即 fail，update.mjs:546-547），并纳入链接校验与 combined 私有导入检查（update.mjs:558-559, 579）；self-test 覆盖两份文档缺失的负例（update.mjs:899-903）。
- **--check 不自动修正**：`main()` 的 `--check` 分支（update.mjs:1008-1011）只调用 `checkGeneratedDirectory`（只读对比），`replaceGeneratedDirectory` 仅在 `--write` 执行。
- **verify-examples.mjs 真实性**：发现层（仅 .tsx、非空、递归、无 manifest）、导入白名单静态扫描 + fixture 只安装白名单依赖（react/react-dom/lucide-react/tarball，verify-examples.mjs:244-263）构成真实安装面约束、文档链接双向检查（无孤儿/无悬挂）、隔离严格编译（skipLibCheck:false + Bundler + react-jsx 对 packed tarball）四层齐备；`--self-test` 四个负例（禁用导入、孤儿、类型破坏——用真实 tsc 且断言诊断指向坏文件、悬空链接）逻辑真实。
- **实跑验证**：本人执行 `node skills/exui-usage/scripts/update.mjs --self-test` → exit 0（只写系统临时目录，不触碰工作区）。

### 1.5 CI 接线 — PASS

`.github/workflows/ci.yml:58-65` 三步（updater --self-test、--check、verify-examples）位于 "Build workspaces" 之后、"Run visual tests" 之前，串行执行；命令与 TESTING.md 记录一致；windows-latest runner 路径无空格，`pnpm pack` 目的地为 mkdtemp 临时目录，CI 环境下无参数分词风险（本地环境见发现 N3）。

### 1.6 文档准确性抽查 — PASS（附发现 N1）

- **react-setup.md 与 package.json 一致**：React 19 peers（`>=19.0.0 <20`，仅 react/react-dom 且 optional）、类型包 `@types/react@19`/`@types/react-dom@19` 非可选且不传递安装、根入口仅 ESM（exports `.` 只有 import 条件）、`style.css` 包含 Token 与 font 样式（`src/index.css:4-5` @import 两者的产物内联）均核实。
- **theme-usage.md 与代码一致**：Toaster 三段优先级同 1.1；useTheme 抛错原文一致；SSR 限制准确（`theme-provider.tsx:66-73` useState 初始化读 localStorage，服务端渲染即抛；`"use client"` 不改变首帧服务端执行）；system 跟随无需重挂载（`theme-provider.tsx:101-118` matchMedia 监听）；无 `setTheme("pitch-black")`、无 SSR 接入示例承诺。
- **组件参考与源码核对**（逐条对照源码/底层类型）：
  - Sidebar.md：`sidebar_state` cookie 7 天（sidebar.tsx:27-28）、Ctrl/Cmd+B（sidebar.tsx:100）、768px 断点（use-mobile.ts:3）、`tooltip`/`isActive`（sidebar.tsx:498-507）均属实。
  - Dialog.md：`showCloseButton`（DialogContent 默认 true / DialogFooter 默认 false，dialog.tsx:53,100）、Portal+Overlay 内置属实。
  - Combobox.md：Base UI（非 Radix）、`value/onValueChange`（单选 `Value | null`）、`showTrigger` 默认 true / `showClear` 默认 false（combobox.tsx:54-55）、`useComboboxAnchor`（combobox.tsx:276-278）均属实。
  - MessageScroller.md：Provider props（autoScroll/defaultScrollPosition/scrollEdgeThreshold/scrollPreviousItemPeek/scrollMargin）、Viewport `preserveScrollOnPrepend`、Button `direction`、三个 hooks 返回值逐一与 `@shadcn/react@0.2.0` message-scroller 类型声明核对一致。
  - Calendar.md：mode 决定受控类型、`DateRange` 不从根导出（结构化描述正确）、`buttonVariant`/`captionLayout`/`components.DayButton` 属实。
  - Tabs.md / Tooltip.md：值关联、`delayDuration` 默认 0（tooltip.tsx:9）属实。
  - 示例抽查（sonner-notifications、theme-provider-usage、sidebar-layout、dialog-usage、message-scroller-usage、combobox-single、tabs-controlled、tooltip-toolbar、calendar-single/range）：导入面全部在白名单内（react、@exre/exui、lucide-react、style.css）；useTheme 均在 Provider 内调用；`<Toaster theme={explicitTheme ?? undefined} />` 正确演示优先级切换。
- **链接有效性**：updater `--check` 的 `validateRelativeLinks` 覆盖 SKILL.md、token/icon/react-setup/theme-usage 与全部 60 份组件参考；verify-examples 的 `checkExampleDocumentation` 覆盖 skill 根下全部 .md 对 examples/ 的双向链接。14 个示例与文档链接互查无孤儿。

### 1.7 安全与回归 — PASS

- 无新依赖引入（package.json 仅删 next-themes）；lockfile 无其他变化。
- 无无关重构：diff 集中于通知链路、Skill 资产、CI、TESTING.md；`packages/tokens`、`packages/showcase`、视觉基线均不在 diff 中，Token 数值与视觉基线未变。
- 用户既有资产未被触碰：`notes/release-bootstrap-setup.md` 的改动为用户既有改动（评审范围外）；`notes/automated-npm-release/`、`notes/exui-usage-skill/`、`notes/single-package-exui/`、`notes/todos/` 为用户新增目录，未修改。
- React 19 hooks 规则：sonner.tsx 与 theme-provider.tsx 的 hooks 均在组件/hook 顶层调用，无条件调用。

### 1.8 测试充分性 — PASS（附局限性）

- TESTING.md 记录的命令全部真实存在可执行：root package.json scripts（tokens:check/typecheck/lint/build/test:visual/verify:pack/test:release/release:verify）与三个 node 脚本文件均在。
- TESTING.md 新增的 "Skill example gates" 段准确描述了 verify-examples.mjs 的实际行为与 `--self-test` 负例集。
- 验收矩阵 vs 改动面：浏览器行为（主题跟随、Dialog Escape 焦点恢复、Sidebar 移动端、通知显示/更新/关闭）由 test-engineer 的 T6 并行验收覆盖（t6-test-report.md 撰写中）；本人静态验证与 t0/t1/t2/t4 报告证据链交叉核对无矛盾。
- `git diff --check` 无空白错误（exit 0；CRLF 提示为 Windows autocrlf 正常告警）。

## 2. 发现清单

### N1（NON-BLOCKING）Sonner.md 的方法集列举声称"full"但不完整

- **位置**：`skills/exui-usage/references/components/Sonner.md:17`；关联 `TESTING.md:58`。
- **问题**：该句以 "the full Sonner method set works as Sonner documents it:" 引出八方法列举（success/error/warning/info/loading/promise/custom/dismiss），但 vendored sonner 2.0.7 声明实际还有第 9 个命名方法 `toast.message(message, data?)`，且 `toast()` 本身可直接调用（`packages/components/types/vendor/sonner/dist/index.d.mts:127-142`）。八方法作为示例 API 面约定没有问题，但"full"的表述与实际 API 面存在完整性出入。
- **影响**：不误导行为、不影响门禁与类型；仅为文档措辞精确性问题。
- **修复建议**：将 Sonner.md:17 的列举补上 `toast.message`（及可调用的 `toast(...)` 本身），或把 "the full Sonner method set" 改为 "Sonner 的方法集（示例中使用并验证的是以下八方法）" 一类的限定表述。TESTING.md:58 描述的是"示例中的 API 面"，可保持不动。

### N2（NON-BLOCKING）sonner.tsx 存在多余的类型断言

- **位置**：`packages/components/src/components/ui/sonner.tsx:16`。
- **问题**：`resolvedTheme as ToasterProps["theme"]` 的 cast 并非必要——`Theme`（"dark"|"light"|"system"）与 sonner `ToasterProps["theme"]` 的类型集合一致。断言会掩盖未来两侧类型漂移时的编译期报错。
- **影响**：无运行时影响。
- **修复建议**：后续迭代中移除该断言（本轮不必为它单独重建候选）。

### N3（NON-BLOCKING）verify-examples.mjs 在 Windows 上以 shell 模式运行 pnpm/npm

- **位置**：`skills/exui-usage/scripts/verify-examples.mjs:46`。
- **问题**：`shell: process.platform === "win32" && ["pnpm", "npm"].includes(command)` 用 cmd shell 运行 pnpm/npm。与 update.mjs 的做法不一致——后者显式通过 Corepack 的 `pnpm.js` 以 `shell:false` 运行（update.mjs:167-188，注释说明了原因）。若本地 Windows 用户名含空格，`os.tmpdir()` 派生的 `--pack-destination` 参数会被 shell 分词破坏。CI（windows-latest，runneradmin 短路径）与当前本地环境（grimeszhang）均不受影响，因此为理论性脆弱点。
- **影响**：当前 CI 与本机不受影响；仅在其他 Windows 环境存在失败风险。
- **修复建议**：后续将 verify-examples.mjs 的 pnpm/npm 调用统一为 update.mjs 的 Corepack 直跑模式（`process.execPath + corepack/dist/pnpm.js`、`shell:false`）。

### 范围内无 BLOCKING 发现

三项均为文档措辞或环境健壮性层面的改进建议，不构成对通知契约、公开导出面、打包边界、门禁完整性、CI 或安全回归的阻塞问题。

## 3. 证据清单

- 候选身份：`git rev-parse HEAD`、`git diff --stat`、`git diff | sha256sum`、untracked files digest（见 §0，全部匹配）。
- 实例与导出：`dist/bundled-modules.json`（sonner 2.0.7 唯一条目、无 next-themes）、`dist/exui.js` 导出语句尾部、`grep -c "useTheme must be used within a ThemeProvider" dist/exui.js` = 1。
- 类型面：`packages/components/types/index.d.ts`、`types/components/ui/sonner.d.ts`、`types/components/theme-provider.d.ts`、`types/vendor/sonner/dist/index.d.mts:124-142`、shipped 声明中裸 `react-dom` 导入计数 = 0（`@floating-ui/react-dom` 为相对路径引用、recharts/radix 命中均为注释或 URL）。
- 守卫与门禁：`update.mjs` 全文及 diff、`verify-examples.mjs` 全文、`verify-packages.mjs:81-143`、`.github/workflows/ci.yml`、实跑 `node skills/exui-usage/scripts/update.mjs --self-test` exit 0。
- 文档与源码核对：sonner.tsx、theme-provider.tsx、dialog.tsx、sidebar.tsx、combobox.tsx、message-scroller.tsx（+ `@shadcn/react@0.2.0` node_modules 类型）、calendar（react-day-picker 类型经 t4 报告与示例）、tooltip.tsx、use-mobile.ts、`src/index.css`、root/components package.json。
- 示例集：14 个 `skills/exui-usage/examples/*.tsx` 全部读取/抽查，导入面 `from "react" / "@exre/exui" / "lucide-react"` + 14/14 含 style.css。
- 交叉证据（实现者叙述，仅作背景、结论均经本人代码核实）：`notes/skill-refine/t0-reproduction.md`、`t1-notification-export.md`、`t2-toaster-theme-source.md`、`t4-reference-audit.md`（含 react-fe-dev 的 verify-examples 四层 dry-run exit 0 记录）。

## 4. 局限性说明

1. 本人未重跑 `pnpm verify:pack`、`pnpm test:visual`、`node skills/exui-usage/scripts/verify-examples.mjs` 全量门禁——test-engineer 正在并行执行 T6 最终验收，且 pack 类命令与其构建并行存在读到半成品产物的风险。行为性结论依赖：源码静态核查 + 已构建 dist/types 产物检查 + update.mjs --self-test 实跑 + t0/t1/t2/t4 报告证据链交叉核对。若 T6 最终门禁出现与上述静态结论矛盾的结果，以 T6 实测为准。
2. 浏览器交互行为（主题实时跟随、Dialog Escape 焦点恢复、Sidebar 移动端 Sheet、通知更新/关闭）未由本人重复执行，以 t6-test-report.md 的 Chromium 证据为准。
3. vendored sonner 声明与 node_modules 中 sonner@2.0.7 的一致性由 `bundle-types.mjs` 每次构建重新 vendor 保证，本人做了内容抽查而非逐字节比对。
4. 60 份组件参考中，8 份优先组件与约 10 份其他组件由本人直接对照源码/类型抽查；其余依据 t4 处置表与 updater --check 的机器校验（导出清单 60/60 一致、链接全量检查）采信。
5. Changeset 属 T7（任务 #8，pending），当前候选不含 changeset 属预期状态，不作为本评审缺陷；发布前必须由 T7 补齐。

## 5. 结论

**APPROVED**

冻结候选（HEAD fa91738 之上 52 files +1466/−107，digest 429b3936…/6b864f30…）满足本轮全部评审维度：通知契约（三段优先级、useTheme 契约、单实例、八方法无 active）、公开导出面最小且类型完整、打包边界与 Token 隔离未破坏、updater/verify-examples 门禁与 CI 接线真实且未被削弱、文档与 package.json 及组件源码一致、无安全与回归风险。3 项 NON-BLOCKING 发现（N1 文档措辞、N2 多余断言、N3 shell 模式健壮性）可在后续迭代处理，不阻塞本候选验收。

---

# 增量复核：修复轮（N1/N2/N3、N2'/N3'，2026-09-11 晚）

评审人：code-reviewer（同前，独立只读）。范围：首轮 APPROVED 后的 9 文件修复增量 + 修复后候选身份校验。

## A. 修复后候选身份校验

| 项 | 声明值 | 实测值 | 结果 |
| --- | --- | --- | --- |
| HEAD | fa91738 不变 | fa91738354900943e1c9c62e7d9b7586c2f15c44 | 匹配 |
| tracked diff | 52 files +1466/−107 | 52 files changed, 1466 insertions(+), 107 deletions(-) | 匹配 |
| `git diff \| sha256sum` | c40933e527c3a9fcf197dcc9aeef2c5eda9cc164e325f6f65ed0cb2207f81c29 | c40933e5…81c29 | 匹配 |
| 生产口径 untracked digest（排除 notes/skill-refine/） | 04f057a0…fcef7 | 04f057a08c662039c9ed59997786f101f4100c0c0d1cffd21d1d5a3e031fcef7 | 匹配 |

说明：全量 untracked digest 实测为 f8f7949e…（非声明的 e3b2365c…），差异来源为 `notes/skill-refine/` 证据目录（t6/、t6-test-report.md 及截图）在 team-lead 捕获快照后仍被 test-engineer 持续写入，属证据资产漂移而非候选内容变化；生产口径 digest 完全吻合可排除候选本体意外变化。遗留 tarball `packages/components/exre-exui-0.1.0.tgz` 当前已不在工作区。

## B. 9 文件增量逐项复核

### B.1 Sonner.md — N1 修复 — PASS

`skills/exui-usage/references/components/Sonner.md:17` 现为 "call `toast(message, data?)` directly, or use `toast.success`, `toast.error`, `toast.warning`, `toast.info`, `toast.message`, `toast.loading`, `toast.promise`, `toast.custom`, and `toast.dismiss`"。与 vendored sonner 2.0.7 声明（`packages/components/types/vendor/sonner/dist/index.d.mts:127-142`）逐项核对：可调用签名 `(message: titleT, data?: ExternalToast)` ✓；9 个命名方法集合完全一致（success/error/warning/info/message/loading/promise/custom/dismiss）✓；仍无 `active` ✓。首轮 N1 关闭。

### B.2 三个示例内联样式替换 — N2 修复 — PASS（含全量抽验）

- `examples/message-scroller-usage.tsx:20`：`className="h-96"` → `style={{ height: "24rem" }}`（h-96 = 24rem，等价替换）。
- `examples/theme-provider-usage.tsx:38`：`max-w-md` → `style={{ maxWidth: "28rem" }}`（等价）。
- `examples/select-usage.tsx:46`：`w-48` → `style={{ width: "12rem" }}`（等价）。

对 doc-maintainer "14 示例 className 全量审计归零" 结论做独立复算：提取全部 14 个示例的 className 字符串（37 处、20 个 distinct token，均为字符串字面量形式、无其他 className 形式遗漏），逐一以 Tailwind 转义规则在 `packages/components/dist/index.css` 中查找——**missing = 0**。保留的 `absolute top-4`（message-scroller-usage.tsx:36）等类均真实存在于产物 CSS（组件源码使用过的类被 Tailwind 生成）。结论成立。

### B.3 react-setup.md — N2 修复 — PASS

`skills/exui-usage/references/react-setup.md:31` 新增边界说明段。核实："component styles and the Token custom properties" 与 `src/index.css` 构成一致；举例 `h-96`、`max-w-md` 经 grep 实测**均不在** dist/index.css（0 命中），"does nothing" 表述真实；"Use inline styles or your own CSS" 与示例修复方式一致。

### B.4 sidebar-layout.tsx — N3 修复 — PASS

`TooltipProvider` 改从 `@exre/exui` 根导入（公开导出，line 16）并包裹 `<SidebarProvider>` 外层（line 28-66）。该修复是**必要**而非仅风格改进——见 B.5 的抛错证据；test-engineer 重验已原样渲染通过。

### B.5 Sidebar.md — N3 修复 — PASS

`skills/exui-usage/references/components/Sidebar.md` 的 `collapsible="icon"` 条目新增 "The `tooltip` prop renders a [Tooltip](Tooltip.md), so a `TooltipProvider` from the package root must wrap the tree — without one, the tooltip throws."。经底层源码坐实：`@radix-ui/react-tooltip@1.2` 的 `Tooltip.Root`（即 ExUI `Tooltip`，tooltip.tsx:21-25 直通）第一行调用 `useTooltipProviderContext`（tooltip dist index.mjs:83），该 hook 由 `createTooltipContext(PROVIDER_NAME)` 生成，`@radix-ui/react-context` 在 Provider 缺失时抛 "`Tooltip` must be used within `TooltipProvider`"（react-context dist index.mjs:17,40）。ExUI `Tooltip` 组件不内嵌 Provider，sidebar.tsx 的 tooltip 分支（sidebar.tsx:543-556）直接用 `<Tooltip>`——**"throws" 声明准确**。

### B.6 sonner.tsx — N2' 修复 — PASS

`packages/components/src/components/ui/sonner.tsx:16` 的 `as ToasterProps["theme"]` 断言已移除，`theme={resolvedTheme}` 原生通过。类型同构验证：vendored `ToasterProps.theme?: 'light' | 'dark' | 'system'`（index.d.mts:100）；`explicitTheme: ToasterProps["theme"]`、`providerTheme: "dark"|"light"|"system"|undefined`（ExUI `Theme`），`??` 链推断结果为非 undefined 的三字面量联合，与目标类型集合相同——原生约束成立，且不再掩盖未来类型漂移。重验 typecheck PASS（7/7 门禁）佐证。首轮 N2 关闭。

### B.7 verify-examples.mjs — N3' 修复 — PASS

`skills/exui-usage/scripts/verify-examples.mjs:42-75` 重构为无 shell 纪律，逐点核验：

- `shell: false` 恒定（line 63）；命令与参数始终走数组、无任何字符串拼接（line 60）。
- `windowsCliArguments`（line 47-56）对 pnpm 解析到 `join(dirname(process.execPath), "node_modules", "corepack", "dist", "pnpm.js")`、对 npm 解析到 `node_modules/npm/bin/npm-cli.js`，与 update.mjs:173-187 的既有模式同款。本机实测两个 CLI 入口均存在于 `C:\Program Files\nodejs` 下（**含空格路径**——恰是原 shell 方案的破坏场景，新实现经 spawnSync 数组参数天然正确引用）。
- `result.error` 检查（line 68-70）正确处理 spawnSync 的 ENOENT/EPATH 类失败（不抛异常而是置 error 字段的路径）。
- POSIX 分支：非 win32 时 `cliArguments = null` → `spawnSync(command, args)` 原样执行，行为不变。
- 非 pnpm/npm 命令（`node` + tsc 路径）在 win32 直接 spawn node.exe，可行。
- 逐段比对首轮版本：除 `run`/`windowsCliArguments` 区域外，header、发现、白名单、链接检查、隔离编译、self-test、CLI 各段与首轮完全一致——修复未夹带其他改动。

首轮 N3 关闭。test-engineer 重验 verify-examples ± self-test PASS 为运行时佐证。

### B.8 范围确认 — 无第 10 处改动 — PASS

mtime 扫描（`skills/exui-usage`、`packages/components/src`、`packages/components/scripts`、`scripts`、`.github` 下晚于首轮评审时点的文件）恰好命中 9 个声明文件：4 个示例（message-scroller/select-usage/sidebar-layout/theme-provider，22:18-22:19）+ Sonner.md/Sidebar.md/react-setup.md/verify-examples.mjs/sonner.tsx。其余 10 个示例 mtime 停留在首轮前（18:39-18:41）；`theme-provider.tsx`、`index.ts`、`update.mjs`、CI 等未被修复轮触碰。tracked diff 变化面（Sonner.md、Sidebar.md、sonner.tsx 三文件）与 untracked 变化面（4 示例 + verify-examples.mjs + react-setup.md）合并恰为 9 文件。重建后的 dist（22:35）导出面复验：`ThemeProvider`/`useTheme`/`Toaster`/`toast` 全部在位，`useOptionalTheme` 零泄漏。

## C. 增量发现清单

无新增 BLOCKING 或 NON-BLOCKING 发现。

观察备注（不计入发现）：react-setup.md:31 "It does not include general-purpose layout utilities" 的字面表述与产物 CSS 实际包含部分工具类（`.flex`、`.p-6`、`.absolute` 等组件样式副产品）存在措辞张力；但其传递的信息（不能依赖任意工具类存在）与具体举例（`h-96`/`max-w-md` 无效）均经实测准确，消费端导向保守安全，不构成误导。

## D. 增量复核结论

**APPROVED（增量）**

修复后候选身份四项校验全部匹配（生产口径 digest 吻合；全量 untracked digest 漂移仅源于并行写入的验收证据资产）；N1/N2/N3（doc-maintainer）与 N2'/N3'（react-fe-dev）五项修复全部正确落地，其中 Sidebar.md 的 "tooltip throws" 声明经 Radix 底层源码实证、verify-examples 无 shell 重构经含空格路径的本机环境入口验证；9 文件之外无意外改动；首轮三项 NON-BLOCKING 全部关闭。修复轮增量无遗留问题。

增量复核局限性：与首轮相同，行为性结论以 test-engineer T6 最终报告为准（重验 7/7 门禁与 18/20 浏览器场景 PASS 已由 team-lead 转达，2 个 BLOCKED 为 headless 时序边缘且最后一次有头尝试并行执行中，与本增量复核的静态结论无交集冲突）。
