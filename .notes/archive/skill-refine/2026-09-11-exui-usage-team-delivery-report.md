# ExUI 代码与 exui-usage Skill 优化——最终交付报告

- 日期：2026-09-11
- 执行：Agent Team `exui-usage-dev`（team-lead 调度；react-fe-dev 实现、doc-maintainer 文档、test-engineer 独立验收、code-reviewer 独立评审）
- 依据计划：`notes/todos/2026-09-11-exui-usage-optimization-plan.md`（T0–T7）
- 交付边界：**未执行 commit、push、PR/MR、版本应用或发布**；保留可审阅的工作区差异
- 最终结论：**T0–T7 全部完成**；门禁与验收全绿（详见 §5、§6），无未关闭阻塞发现；2 项浏览器场景为 driver 层 BLOCKED（定性证据见 §6.2），CI Node 24 实际运行待用户推送后触发（见 §6.3）

---

## 1. T0–T7 完成状态与实际变更文件

| ID | 状态 | 摘要 | 主要变更文件 |
| --- | --- | --- | --- |
| T0 复现 | ✅ PASS | 隔离 packed consumer（真实 tarball + Chromium）确认双缺陷：toast 不可见（实例隔离、静默失败）；Toaster 主题来自内联 next-themes 不跟随 ExUI Provider | 证据：`notes/skill-refine/t0-reproduction.md`、`assets/t0/*.png` |
| T1 toast 导出 | ✅ PASS | 包根导出 `toast`（后按 updater 分类要求迁入组件文件，公开面不变）；消费者禁自装 sonner（负例实证） | `packages/components/src/components/ui/sonner.tsx`、`src/index.ts` |
| T2 主题统一 | ✅ PASS | 显式 theme prop > ExUI Provider > system 三段解析；公开 useTheme Provider 外抛错契约保持；next-themes 依赖与 bundle 全清 | `ui/sonner.tsx`、`src/components/theme-provider.tsx`（内部 useOptionalTheme）、`src/index.ts`（导出收窄）、`package.json`、`pnpm-lock.yaml`（−14 行） |
| T3 安装/主题文档 | ✅ PASS | React 19 安装、类型包非 optional peers、根入口仅 ESM、CSS 单次引入、实现依赖实例边界、Toaster 优先级、SSR/Pitch Black 仅述限制 | `skills/exui-usage/references/react-setup.md`（新）、`references/theme-usage.md`（新）、`SKILL.md` |
| T4 组件参考 | ✅ PASS | 60 份全量处置（见 §2）；41 份修改 + 14 个完整 TSX 示例（单一来源，门禁编译） | `references/components/`（41 份）、`skills/exui-usage/examples/`（14 个 .tsx）、`references/generated/component-exports.md`（updater 生成，Sonner 家族 +toast） |
| T5 门禁与 CI | ✅ PASS | verify-examples.mjs 四层门禁（发现/白名单/双向链接/隔离编译）；updater 扩展校验两份新参考；ci.yml 三步接线；TESTING.md 记录 | `skills/exui-usage/scripts/verify-examples.mjs`（新，539 行）、`scripts/update.mjs`（分类修复 + 校验扩展）、`.github/workflows/ci.yml`、`TESTING.md` |
| T6 独立验收 | ✅ PASS（带 2 项 driver 层 BLOCKED 定性） | 15 条最终门禁 + 重验 7 条门禁全部 exit 0；20 浏览器场景 18 PASS / 2 BLOCKED(driver)；负例 4/4；tokens-only 5/5 | 证据：`notes/skill-refine/t6-test-report.md`（含 §6 重验）、`assets/t6/`（截图+日志） |
| T6b 独立评审 | ✅ APPROVED（首轮 + 增量复核） | 首轮 0 阻塞 / 3 非阻塞 → 修复轮全部关闭；增量复核 0 新发现 | `notes/skill-refine/t6-review-findings.md` |
| T7 Changeset + 报告 | ✅ 完成 | minor bump 发布说明（九方法清单）；本报告 | `.changeset/toast-export-and-toaster-theme.md`（新）、本文件 |

**tracked diff 总计**：52 文件，+1466 / −107（`git diff --stat` vs 基线）。
**用户既有改动保留**：`notes/release-bootstrap-setup.md`（修改）与 `notes/automated-npm-release/`、`notes/exui-usage-skill/`、`notes/single-package-exui/`、`notes/todos/`（未跟踪）原样未动。

---

## 2. 60 份组件参考处置表

统计：**已核实无需修改 19；微调 1（Button）；需修正+补示例 6（Sonner、Sidebar、Combobox、MessageScroller、Calendar、Select）；需补示例 34**。每份判定的源码依据见 `notes/skill-refine/t4-reference-audit.md` §5。

| # | 参考 | 判定 | 处置动作 |
| --- | --- | --- | --- |
| 1 | Accordion | 补示例（轻量） | 最小例（value + 单开/多开） |
| 2 | Alert | 补示例（轻量） | 最小例 |
| 3 | AlertDialog | 补示例 | 最小例 + size/media 说明 |
| 4 | AspectRatio | 无需修改 | 无 |
| 5 | Attachment | 补示例 | 最小例（含上传状态机） |
| 6 | Avatar | 补示例（轻量） | 最小例 + Group |
| 7 | Badge | 无需修改 | 无 |
| 8 | Breadcrumb | 补示例（轻量） | 最小例 |
| 9 | Bubble | 补示例（轻量） | 最小例 |
| 10 | Button | 微调 | 补 buttonVariants 提及 |
| 11 | ButtonGroup | 补示例（轻量） | 最小例 |
| 12 | Calendar | **修正+补示例** | 重写 Usage；v10 mode 驱动受控类型；单选/范围两例 |
| 13 | Card | 无需修改 | 无 |
| 14 | Carousel | 补示例 | 最小例（useCarousel 边界） |
| 15 | Chart | 无需修改 | 无（Recharts 命名空间核实准确） |
| 16 | Checkbox | 无需修改 | 无 |
| 17 | Collapsible | 无需修改 | 无 |
| 18 | Combobox | **修正+补示例** | 重写为 Base UI 真实接口；单选 + 多选 chips 两例 |
| 19 | Command | 补示例 | 最小例 + Dialog 变体 |
| 20 | ContextMenu | 补示例（轻量） | 最小例（共享菜单模式说明） |
| 21 | Dialog | 补示例 | 最小例 + Portal 已封装说明 |
| 22 | Direction | 补说明（轻量） | RTL 用法说明 |
| 23 | Drawer | 补示例（轻量） | 最小例 |
| 24 | DropdownMenu | 补示例 | 主例（destructive/Sub/Checkbox） |
| 25 | Empty | 补示例（轻量） | 最小例 |
| 26 | Field | 补示例 | 最小例 + errors 用法 |
| 27 | HoverCard | 补示例（轻量） | 最小例 |
| 28 | Input | 无需修改 | 无 |
| 29 | InputGroup | 补示例（轻量） | 最小例 |
| 30 | InputOTP | 补示例（轻量） | 最小例 |
| 31 | Item | 补示例（轻量） | 最小例 |
| 32 | Kbd | 无需修改 | 无 |
| 33 | Label | 无需修改 | 无 |
| 34 | Marker | 补示例（轻量） | 最小例 |
| 35 | Menubar | 补示例（轻量） | 最小例 |
| 36 | Message | 补示例（轻量） | 最小例 |
| 37 | MessageScroller | **修正+补示例** | 重写 Usage；Provider>Root>Viewport>Content>Item 五层例 |
| 38 | NativeSelect | 补示例（轻量） | 最小例 |
| 39 | NavigationMenu | 补示例（轻量） | 最小例（含虚构 Link 导入修正） |
| 40 | Pagination | 补示例（轻量） | 最小例 |
| 41 | Popover | 补示例（轻量） | 最小例 |
| 42 | Progress | 无需修改 | 无 |
| 43 | RadioGroup | 无需修改 | 无 |
| 44 | Resizable | 补示例（轻量） | 最小例（direction→orientation 勘误已修） |
| 45 | ScrollArea | 无需修改 | 无 |
| 46 | Select | **修正+补示例** | 重写 Usage；双 API（简化/组合式）各一例 |
| 47 | Separator | 无需修改 | 无 |
| 48 | Sheet | 补示例（轻量） | 最小例 |
| 49 | Sidebar | **修正+补示例** | 重写 Usage；布局例 + icon 折叠例；TooltipProvider 要求说明 |
| 50 | Skeleton | 无需修改 | 无 |
| 51 | Slider | 无需修改 | 无 |
| 52 | Sonner | **修正+补示例** | 重写：根 toast、九方法清单、触发/更新/关闭、主题优先级、禁自装 sonner |
| 53 | Spinner | 无需修改 | 无 |
| 54 | Switch | 无需修改 | 无 |
| 55 | Table | 补示例（轻量） | 最小例 |
| 56 | Tabs | 补示例 | 最小例 + line 变体说明 |
| 57 | Textarea | 无需修改 | 无 |
| 58 | Toggle | 无需修改 | 无 |
| 59 | ToggleGroup | 补示例（轻量） | 最小例 |
| 60 | Tooltip | 补示例 | 最小例（Provider 包裹；delayDuration 默认 0） |

examples/ 14 个文件：calendar-range、calendar-single、combobox-multiple、combobox-single、command-palette、dialog-usage、field-usage、message-scroller-usage、select-usage、sidebar-layout、sonner-notifications、tabs-controlled、theme-provider-usage、tooltip-toolbar。

---

## 3. 独立评审发现及处理结果

评审人 code-reviewer（独立于全部实现者）。完整记录：`notes/skill-refine/t6-review-findings.md`。

**首轮（冻结候选 v1）**：APPROVED，0 BLOCKING / 3 NON-BLOCKING：

| 编号 | 发现 | 处理 | 复核结果 |
| --- | --- | --- | --- |
| N1 | Sonner.md:17 "full Sonner method set" 漏列 `toast.message` 与直接调用 | doc-maintainer 补全（九方法 + 直接调用，与 vendored 类型逐项核对） | 增量复核关闭 |
| N2 | sonner.tsx:16 `as ToasterProps["theme"]` 断言多余，掩盖类型漂移 | react-fe-dev 移除，类型原生约束 | 增量复核关闭 |
| N3 | verify-examples.mjs:46 Windows `shell:true` 与 update.mjs 模式不一致（含空格路径破坏分词） | react-fe-dev 重构为无 shell args 数组 + windowsCliArguments（本机 `C:\Program Files\nodejs` 空格路径实证） | 增量复核关闭 |

**增量复核（修复轮 9 文件）**：APPROVED，0 新发现。要点：37 处 className 独立复算缺失为 0；Radix TooltipProvider 抛错经底层源码实证（修复必要非风格）；verify-examples 无 shell 重构与 update.mjs 逐段比对无夹带；mtime 扫描确认恰好 9 文件改动、无第 10 处。

**观察备注（不计发现，无需处理）**：react-setup.md:31 "does not include general-purpose layout utilities" 与产物 CSS 含部分工具类副产品（.flex/.p-6 等）有措辞张力；信息意图与举例实测准确、导向保守，未误导。

**验收侧独立发现（test-engineer，已全部处理）**：示例依赖未声明工具类（.h-96/.max-w-md/.w-48 → 内联样式 + react-setup.md 边界说明）；sidebar-layout.tsx 缺 TooltipProvider（示例内补齐 + Sidebar.md 说明）。

---

## 4. 环境与候选身份

**环境**：Windows 11 Pro；pnpm 11.9.0；本地 Node **v22.22.1**（本报告全部本地结果为 Node 22 参考；**CI Node 24 为验收权威**）；Playwright Chromium（showcase 依赖内安装）；无 CodeGraph 索引；仓库根存在 git-ignored 陈旧 `dist/exui.js`（历史遗留、无引用、未动）。

**候选身份（最终，捕获于 2026-09-11T23:32:33+08:00，全部改动收口后）**：

| 校验项 | 值 |
| --- | --- |
| 基线 / HEAD | `fa91738354900943e1c9c62e7d9b7586c2f15c44`（detached，tag `@exre/exui@0.1.0`；全程无新提交） |
| manifest 条目数 | 62（候选 61 + changeset 1） |
| tracked diff | 52 files，+1466 / −107 |
| tracked diff SHA-256 | `604e0e02dd841196b899c4c7d8e8d2bd6009499b07746d0df707adcf9ed21cbe` |
| untracked digest（全量） | `22fdaa528301ace90c65164688f2c248d0654c128333cbf4cc199a410a3d3c25` |
| untracked digest（生产口径，排除 notes/skill-refine/ 证据目录） | `93a4c24a3adf19497cc1fef0f83c684ebbd3fb9841e9266e5adac38845688e5d` |

口径说明：全量含 add-only 证据目录（随报告增长，仅作时点快照）；生产口径只含候选生产内容（含 `.changeset/`），跨时间稳定，供后续比对。

---

## 5. 验收命令与退出状态

全部本地 Node 22.22.1 执行，**全部 exit 0**。逐条记录见 `notes/skill-refine/t6-test-report.md`（A 部分 15 条门禁 + §6 重验 7 条）。

**门禁（两轮均通过）**：`pnpm install --frozen-lockfile`、playwright install chromium、`pnpm test:release`、`pnpm tokens:check`、`pnpm typecheck`、`pnpm lint`（17 条 react(only-export-components) 警告 = 既有基线 +1，0 错误）、`pnpm build`、`update.mjs --self-test`、`update.mjs --check`、`verify-examples.mjs`（14 示例）、`verify-examples.mjs --self-test`、`pnpm test:visual`（无基线更新）、`pnpm verify:pack`（含 Chromium 断言：chart hover/legend/tooltip、dialog portal、form submit、focus return）、`pnpm release:verify`（`{"schemaVersion":1,"valid":true}`）、`git diff --check`。

**浏览器场景（20 项）**：通知 api/主题继承/显式优先/无 Provider 回退/useTheme 抛错契约、dependency-isolation、dialog、combobox 单选/多选、calendar 单选/范围、tabs、message-scroller、sonner-notifications、theme-provider-usage、sidebar-desktop、select-usage（双模式）——**18 PASS**；2 项 BLOCKED(driver) 见 §6.2。

**门禁负例（4/4 如期失败）**：类型错误示例（真实 tsc 拒绝、诊断指向文件）、违禁 `from "sonner"` import、孤儿示例、悬挂文档链接——全部非零退出，临时副本操作未触主工作区。

**tokens-only 隔离（5/5）**：依赖树无 react/react-dom/@types/react；ESM+CJS 加载一致且冻结；根 import 抛 `Cannot find package 'react'`；style.css 含 `:root`/`.dark`/`.pitch-black`。

**证据索引**：`notes/skill-refine/{t0-reproduction,t1-notification-export,t2-toaster-theme-source,t4-reference-audit,t6-test-report,t6-review-findings}.md`；截图与日志 `notes/skill-refine/assets/{t0,t2,t6}/`（含 36+ 张截图、consumer-gates 日志、headed 模式日志）。

---

## 6. PASS / FAIL / NOT_EXECUTED 与剩余风险

### 6.1 结果分类

- **PASS**：T0–T5 全部；T6 门禁（15+7 条）；浏览器场景 18/20；门禁负例 4/4；tokens-only 5/5；T6b 评审（APPROVED ×2）。
- **FAIL**：无。
- **BLOCKED（driver 层，非产品缺陷）**：2 项，见 6.2。
- **NOT_EXECUTED**：见 6.3。

### 6.2 两项 BLOCKED(driver) 定性（剩余风险 R1）

三轮四模式（headless 8s/15s + headed 真实事件）证据链定位于 **close-transition 不可自动驱动**——打开路径双模式全部通过（截图 `sidebar-mobile-open.png`、`tooltip-bold-visible.png` 在案）：

1. `example/sidebar-mobile`：375×667 移动 Sheet **打开 PASS**；Escape 后 15s+ 未关闭（失败截图显示 Sheet 内容与遮罩仍在）。
2. `example/tooltip`：hover 提示**显示 PASS**（delayDuration=0 即时）；`mouse.move(900,900)` 后 15s+ 未 unmount。

补偿证据：同 harness 的 Dialog Escape-close PASS；verify:pack 浏览器断言（form/dialog/focus）PASS；`sidebar.tsx`/`tooltip.tsx` 本轮零改动（无回归向量）；矩阵强制项（移动 viewport 打开、无 Provider 错误、提示操作）均有 PASS 证据。完整记录：t6-test-report.md §6.5。

### 6.3 NOT_EXECUTED 项

1. **CI Node 24 全量门禁实际运行**（R2）：ci.yml 已接线三步（updater --self-test / --check / verify-examples + 既有 verify:pack 等），但实际 CI 触发需 push（本轮未授权）。本地 Node 22 结果为参考。
2. **SSR 场景验收**：按计划本轮只文档化现有限制（ThemeProvider 初始化读 localStorage；Toaster 为客户端挂载组件），未实现也未验收 SSR 支持。
3. **Pitch Black 功能验收**：同上，仅文档化 `.pitch-black`（Token CSS 层）与 Provider `light/dark/system` 是不同契约，禁写 `setTheme("pitch-black")`。

### 6.4 其余风险与备注

- R3（低）：react-setup.md:31 措辞张力观察（§3），无需本轮处理。
- R4（低）：lint 17 条 only-export-components 警告为既有模式延续，0 错误。
- R5（环境）：本地无 Node 24（无 nvm-windows），全部本地验收标注"Node 22 参考"。

---

## 7. 过程事件记录（关键决策与偏差）

1. **用户干预写入（2026-09-11 18:39–18:49）**：examples/ 两文件替换、四份参考改写、审计 §9、一次失败 --write 及 `.tmp-doc-examples-real\` harness——经用户确认由其本人（或其会话）执行；**无团队成员违规**；技术内容经仲裁采纳（含双 Toaster 真实错误修正）。记录：t4-reference-audit.md §14。
2. **toast 方法清单三阶段演进**：`toast.active` 过度声明（实现者探针仅实证 3 方法）→ 勘误为八方法（漏 message）→ T7 前逐行核证为**九方法 + 直接调用**（另 getHistory/getToasts）；Sonner.md、changeset、TESTING.md 三处最终对齐。
3. **updater 两根因分类阻塞**：toast 根级放置 + theme-provider 具名 re-export 别名均触发 `no approved group: types/index.d.ts`。修复方案（doc-maintainer 诊断、react-fe-dev 实现、Leader 裁定）：toast 迁入组件文件（chart.tsx 先例）+ classifyDeclaration 增加 entry-re-export 可过滤类别（守卫不降级：vendor-only 根级导出仍失败，self-test 负例证明）。
4. **遗留 tarball**：react-fe-dev 修复轮自验 `pnpm pack` 产物遗留在包目录（manifest 61→62），由 test-engineer 在 Leader 授权下删除（manifest 恢复），最终交付前再确认不在工作区。
5. **--write 交错运行**：react-fe-dev 在"单一执行者"裁定在途时运行过一次 --write（时序交错，幂等、内容正确，doc-maintainer 闭环重跑无 diff）。
6. **react-fe-dev 问责闭环**：曾被推断为越权写入者，以三轴证据（mkdtemp 指纹/时间线空窗/知识非独占）自证，经用户裁决洗清。

---

## 8. 交付说明

工作区保留全部差异供审阅（未 commit/push/发布）。后续建议：用户推送后 CI Node 24 自动运行全部新门禁；版本应用（`pnpm version-packages`）与 npm 发布由用户另行安排（changeset 已就绪，minor bump）。
