# Single-package ExUI 分支审查

## Findings

### [P1] 内置 Recharts 后，公开 ChartTooltip / ChartLegend 无法读取消费者图表的上下文

位置：`packages/components/vite.config.ts:174-175`（external 改为只保留 React / React DOM）。

本次打包策略将 Recharts 及其状态/context 实例编进 ExUI。现有公开 API 中，`ChartTooltip` 和 `ChartLegend` 分别是这份内置 Recharts 的 Tooltip / Legend；消费者创建实际图表仍需要从自己的 `recharts` 导入 `BarChart`、`Bar` 等，因为 ExUI 根入口没有导出这些图表组件。于是图表 provider 与 ExUI 导出的 tooltip / legend 不属于同一实例，后两者静默不渲染。

**本轮实测：**用当前构建的 `dist/exui.js`、已锁定 Recharts 3.8.0 和同一份 React，创建临时 Vite production build，在 Playwright Chromium 中并排渲染两个 400×300 图表。两者都使用 ExUI `ChartContainer`，外部 `BarChart` / `Bar`、两条数据，以及 `active=true, defaultIndex=0` 的 tooltip；仅切换 Tooltip / Legend 来源：

| 来源 | 柱形数量 | tooltip 文本 | legend 文本 |
| --- | --- | --- | --- |
| 消费者 Recharts 的 Tooltip / Legend | 2 | `0value : 10` | `value` |
| ExUI 的 ChartTooltip / ChartLegend | 2 | 无 DOM | 无 DOM |

浏览器没有 page error，因此普通“页面未报错”检查也抓不到它。复现使用本次构建产物和本地已安装依赖，并非独立 tarball fixture；独立 tarball fixture 的现有检查另行通过，见下文。

这不是设计已接受的“外部 Radix / Base UI provider 不共享 context”限制：现有 Chart API 自身就需要与外部图表组件组合。RFC 明确要求保留组件行为，并在已有必需组合受损时报告具体冲突。

**最小修复方向：**先为这个公开组合加入真实浏览器回归断言，再为图表 primitive 和 ExUI Chart 包装层提供同一 Recharts 实例的消费方案，且保留 tokens-only 安装不拉入 React 的约束。若需要新增公开图表入口，应明确评审该 API 调整，不能只加文档宣称不支持现有组合。

相关测试缺口：`scripts/verify-packages.mjs` 的 React fixture 在 `ChartContainer` 内只放 `<span>chart</span>`；独立的 `ChartTooltip` 没有真实图表 provider。build 和 SSR smoke 均没有断言图表、tooltip、legend 行为，因此本轮全部既有检查通过仍会漏掉此回归。

### [P2] CommonJS 类型 fixture 使用普通 require，未验证 require 条件的声明契约

位置：`scripts/verify-packages.mjs:296-300`。

`tokens.cts` 使用 `const { ... } = require("@exre/exui/tokens")`。启用 Node 类型后，普通 `require()` 返回 `any`，不会让 TypeScript 解析并验证该包的 CommonJS 声明入口；后续把属性赋给 `string` 也不能恢复类型检查。即使 require 条件的声明路径失效或公共属性类型发生变化，这个用例仍可能通过。运行时 require 检查只证明 JavaScript 可以加载，不能补足声明解析。

**本轮实测：**使用同样的 strict、NodeNext、skipLibCheck=false、Node 类型配置，将表达式改为 `require("@exre/exui/does-not-exist")` 并访问 `componentRecipes.nonexistent.wrong`，TypeScript diagnostics 仍为 `[]`。这证明当前写法无法检测包入口和属性错误。

**最小修复方向：**在 `.cts` 中使用 `import tokens = require("@exre/exui/tokens")`，对真实导出的类型和值进行赋值断言，并增加错误属性/错误赋值的负向检查。保持无 React 类型和 skipLibCheck=false，确认实际解析到 `dist/tokens/cjs/index.d.ts`。这对应 RFC 明确要求的 NodeNext `.cts` 消费验收。

## 测试意图核查

| 设计意图 | 当前证据 | 判断 |
| --- | --- | --- |
| npm/pnpm 默认安装 tokens 不拉入 React | 实际 tarball 的隔离消费 fixture、本轮 verify:pack | PASS |
| tokens ESM/CJS 值一致、深冻结、主题与 recipes | tokens:check、打包运行时检查 | PASS |
| Bundler / NodeNext ESM 类型、独立 CSS 和字体 | 打包 fixture 的严格类型检查及 Vite CSS 构建 | PASS |
| NodeNext CommonJS 声明条件解析 | 普通 require 返回 any | 缺口，见 P2 |
| 根组件声明、组件 production build、基础 SSR | 打包消费 tsc / Vite / SSR smoke | PASS，不能代表交互验收 |
| Windows 视觉契约 | 现有 12 项浏览器视觉测试 | PASS，未覆盖上述真实 Chart 组合 |
| tarball 中 Dialog/Portal、表单、Chart 的实际交互 | 新 fixture 仅 build + SSR；未启动打包消费者做交互断言 | 尚未完成；Chart 已复现 P1 |
| 单包发布规划、私有包排除、旧标签拒绝、错误与幂等路径 | release 测试 17 项、release:verify | PASS；没有执行真实发布 |
| exui-usage 迁移与生成内容一致 | updater --self-test、--check | PASS |

该变更跨越产物、模块实例和浏览器 context 边界，需要实际浏览器集成测试；纯类型检查和 SSR 不足以完成 RFC 运行时验收。

## 验证记录与边界

本轮环境：Windows，Node **22.22.1**、pnpm **11.9.0**、npm **11.12.1**。RFC / TESTING.md 要求的 Node 24 CI 没有在本轮执行，不能把本地结果升级为该 CI 门禁通过。

- PASS：`pnpm build`。
- PASS：`pnpm tokens:check`、`pnpm typecheck`。
- PASS：`pnpm lint`；有 15 条现有 only-export-components 警告，无错误。
- PASS：`pnpm test:release`（17/17）、`pnpm release:verify`。
- PASS：`pnpm test:visual`（12/12，Windows Chromium 两个 viewport）。
- PASS：`pnpm verify:pack`，约 48 秒。
- PASS：`node skills/exui-usage/scripts/update.mjs --self-test`、`--check`。
- PASS：`git diff --check origin/main...HEAD`。
- FAIL：新增的临时 Chart 真实浏览器对照复现，ExUI tooltip / legend 缺失。
- 测试缺口复现：无效 CommonJS 包路径及属性访问仍得到零 TypeScript diagnostics。
- NOT_EXECUTED：Node 24 验收、远端 exact-head CI/review threads、真实 npm 发布。此次为本地 branch review，未执行发布、推送或外部评论。

技能静态扫描脚本首次因控制台 GBK 无法输出 emoji 失败；切换 Python 输出为 UTF-8 后完成。其把 RegExp.exec 识别为危险调用属于误报，不计 finding。

## 审查范围与结论

结论：**NACK，需要修复已复现的 Chart 回归并补足 CommonJS 类型检查。** Findings：P0=0、P1=1、P2=1、P3=0。

- 分支：`main`；HEAD：`5b1f22af7538be38f9f42ac351da04b312950fc1`。
- 基线：本地 `origin/main`，`0c4a099d52ea17a906d50a4615ee3f23a783e12f`。当前 main 比该引用超前 4 个提交，因此使用 `origin/main...HEAD`；没有把空的 `main...HEAD` 当作审查结果，也没有 fetch 改变基线。
- 变更范围：4 个已提交的单包迁移提交，32 个文件。重点审查声明整合、打包消费校验、Vite 打包、notices 生成和技能迁移，并核对公共 manifest 与发布契约。
- 设计依据：`../specs/2026-09-09-single-package-exui-design.md` 与 `../rfcs/single-package-exui-rfc.md`。
- 初始工作区有已修改的 `notes/release-bootstrap-setup.md`，以及未跟踪的 automated-npm-release、exui-usage-skill、single-package-exui 笔记目录；它们不作为提交 diff 的实现变更审查。除本报告外未修改受版本管理的源码或这些既有笔记。构建仅刷新生成产物；临时复现目录已清理。

单包发布和 tokens 隔离的主要实现已有较充分的本地证据，但目前不满足“保持既有组件行为”和完整 CommonJS 类型验收的设计要求。