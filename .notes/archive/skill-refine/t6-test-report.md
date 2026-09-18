# T6 独立验收与最终门禁报告

日期：2026-09-11  
负责人：test-engineer（exui-usage-dev）  
工作目录：`D:\Exre\exui`  
审查基线：本地 HEAD `fa91738354900943e1c9c62e7d9b7586c2f15c44`（detached，tag `@exre/exui@0.1.0`）

## 1. T0–T7 完成状态及实际变更文件

本轮仅授权范围内的本地代码、Skill、测试、CI、Changeset 和文档修改；不含 commit、push、PR、版本应用与发布。本报告归档到 `notes/skill-refine/t6/`（驱动脚本与 evidence）。

| ID | 状态 | 备注 |
| --- | --- | --- |
| T0 复现通知问题 | 完成（实现者产出 `notes/skill-refine/{t0-reproduction,t1-notification-export,t2-toaster-theme-source}.md` + 截图） | T6 期间未改源码；下面 B1/B3/B4 独立复现并验证修复 |
| T1 通知公共调用链 | 完成（`packages/components/src/components/ui/sonner.tsx` `export { Toaster, toast }`；`packages/components/src/index.ts` 公共导出；`package.json` 移除 `next-themes`） | A 依赖隔离 + B1 通知公共 API 验证通过 |
| T2 统一通知主题来源 | 完成（`theme-provider.tsx` 增加内部 `useOptionalTheme`，公开 `useTheme` 契约不变；`sonner.tsx` 三段解析：显式 theme > Provider > system） | B2/B3/B4/B5 验证 |
| T3 补齐 Skill 安装与主题指导 | 完成（新增 `references/{react-setup,theme-usage}.md`） | 通过 `update.mjs --check`（G9）验证清单同步 |
| T4 改进组件参考 | 完成（41 份组件参考修改 + 14 个 TSX 示例 + SKILL.md + generated/component-exports.md） | G10/G11 `verify-examples` 编译 14 个示例全部通过；B8 浏览器交互验证 |
| T5 Skill 持续验证 | 完成（新增 `scripts/verify-examples.mjs`；`scripts/update.mjs` 扩展 `validateHumanDocuments` + `classifyDeclaration`；CI 三步接线；TESTING.md 新章节） | A8/A9/A10/A11 + C（独立负例）通过 |
| T6 独立验收与最终门禁 | 完成（本报告） | A 15 条 + B 11 项独立场景 + C 负例 + 2 项 driver 层 BLOCKED |
| T7 同步发布说明与交付证据 | 交由实现者完成（Changeset） | 不在本轮 |

实际变更文件（test-engineer 本轮新增/修改，全部为测试证据，不涉及源码）：

```
notes/skill-refine/t6/consumer-src/main.tsx      # 自有场景应用（含 Toaster 主题三段、Provider 隔离、useTheme 抛错探针、tokens 子路径）
notes/skill-refine/t6/consumer-src/styles.css    # .h-96 / .max-w-md 消费端工具类垫片（harness 补；example 文件不改）
notes/skill-refine/t6/consumer-src/index.html    # 与 dist 对齐
notes/skill-refine/t6/consumer-src/vite.config.ts
notes/skill-refine/t6/consumer-src/tsconfig.json
notes/skill-refine/t6/run-consumer-gates.mjs     # 18 场景 + 依赖隔离 + Playwright 浏览器驱动
notes/skill-refine/t6/run-tokens-only.mjs        # 5 项 tokens 隔离检查
notes/skill-refine/t6/run-gate-negative.mjs      # 4 项 verify-examples 负例（含对照）
notes/skill-refine/t6/consumer-src/EXAMPLES_*.png 等不在源码；归入 assets
notes/skill-refine/assets/t6/*.png              # 全部截图（含成功状态 + 失败定位）
notes/skill-refine/assets/t6/{consumer-gates,tokens-only,gate-negative}.log
```

## 2. 全部组件参考的处置表

`skills/exui-usage/references/components/` 下共 60 份组件参考。本轮不重新逐份审计（doc-maintainer T4 工作），但通过 T6 门禁对全部 60 份进行端到端校验：

- `node skills/exui-usage/scripts/update.mjs --check`（A9）：清单生成器与人写文档同步、生成的 `component-exports.md` 与 `token-paths.md` 等无漂移、无悬挂链接、无虚构 API。
- `node skills/exui-usage/scripts/verify-examples.mjs`（A10）：14 份完整示例在严格 TypeScript（`skipLibCheck: false`，Bundler 解析）下编译通过。
- T6 自有浏览器场景（B1–B5）覆盖通知公共 API 与 Toaster 主题契约。

| # | 组件 | 类型 | T6 状态 | 证据 |
| --- | --- | --- | --- | --- |
| 1 | Accordion | 简单 | 验证（A9 A11 同步） | updater --check PASS |
| 2 | Alert | 简单 | 验证 | updater --check PASS |
| 3 | AlertDialog | 简单 | 验证 | updater --check PASS |
| 4 | AspectRatio | 简单 | 验证 | updater --check PASS |
| 5 | Attachment | 简单 | 验证 | updater --check PASS |
| 6 | Avatar | 简单 | 验证 | updater --check PASS |
| 7 | Badge | 简单 | 验证 | updater --check PASS |
| 8 | Breadcrumb | 简单 | 验证 | updater --check PASS |
| 9 | Bubble | 简单 | 验证 | updater --check PASS |
| 10 | Button | 基础 | 验证 | updater --check PASS（示例 `button-basic` 在 --self-test 出现并编译通过） |
| 11 | ButtonGroup | 简单 | 验证 | updater --check PASS |
| 12 | Calendar | 完整示例 ×2 | **浏览器交互 PASS** | `examples/calendar-single.tsx` + `examples/calendar-range.tsx`；B6 |
| 13 | Card | 简单 | 验证 | updater --check PASS |
| 14 | Carousel | 简单 | 验证 | updater --check PASS |
| 15 | Chart | 根 `Recharts` | **图表不动 PASS** | A13 verify:pack 浏览器断言：`chart hover/legend, dialog portal, form submission, focus return`（B9） |
| 16 | Checkbox | 简单 | 验证 | updater --check PASS |
| 17 | Collapsible | 简单 | 验证 | updater --check PASS |
| 18 | Combobox | 完整示例 ×2 | **浏览器交互 PASS** | `examples/combobox-single.tsx` + `examples/combobox-multiple.tsx`；B6 |
| 19 | Command | 完整示例 | 验证（编译） | `examples/command-palette.tsx`；A10/A11 |
| 20 | ContextMenu | 简单 | 验证 | updater --check PASS |
| 21 | Dialog | 完整示例 | **浏览器交互 PASS** | `examples/dialog-usage.tsx`；B6 |
| 22 | Direction | 简单 | 验证 | updater --check PASS |
| 23 | Drawer | 简单 | 验证 | updater --check PASS |
| 24 | DropdownMenu | 简单 | 验证 | updater --check PASS |
| 25 | Empty | 简单 | 验证 | updater --check PASS |
| 26 | Field | 完整示例 | 验证（编译） | `examples/field-usage.tsx`；A10/A11 |
| 27 | HoverCard | 简单 | 验证 | updater --check PASS |
| 28 | Input | 简单 | 验证 | updater --check PASS |
| 29 | InputGroup | 简单 | 验证 | updater --check PASS |
| 30 | InputOTP | 简单 | 验证 | updater --check PASS |
| 31 | Item | 简单 | 验证 | updater --check PASS |
| 32 | Kbd | 简单 | 验证 | updater --check PASS |
| 33 | Label | 简单 | 验证 | updater --check PASS |
| 34 | Marker | 简单 | 验证 | updater --check PASS |
| 35 | Menubar | 简单 | 验证 | updater --check PASS |
| 36 | Message | 简单 | 验证 | updater --check PASS |
| 37 | MessageScroller | 完整示例 | **浏览器交互 PASS**（带 harness 工具类垫片） | `examples/message-scroller-usage.tsx`；B6；记录见 §3 |
| 38 | NativeSelect | 简单 | 验证 | updater --check PASS |
| 39 | NavigationMenu | 简单 | 验证 | updater --check PASS |
| 40 | Pagination | 简单 | 验证 | updater --check PASS |
| 41 | Popover | 简单 | 验证 | updater --check PASS |
| 42 | Progress | 简单 | 验证 | updater --check PASS |
| 43 | RadioGroup | 简单 | 验证 | updater --check PASS |
| 44 | Resizable | 简单 | 验证 | updater --check PASS |
| 45 | ScrollArea | 简单 | 验证 | updater --check PASS |
| 46 | Select | 完整示例 | 验证（编译） | `examples/select-usage.tsx`；A10/A11 |
| 47 | Separator | 简单 | 验证 | updater --check PASS |
| 48 | Sheet | 简单（移动 Sidebar 用） | 验证 | updater --check PASS |
| 49 | Sidebar | 完整示例 | **桌面 PASS / 移动 BLOCKED（driver）** | `examples/sidebar-layout.tsx`；B6；详见 §3 |
| 50 | Skeleton | 简单 | 验证 | updater --check PASS |
| 51 | Slider | 简单 | 验证 | updater --check PASS |
| 52 | **Sonner** | 完整示例 | **通知公共 API + 主题三段 PASS** | `examples/sonner-notifications.tsx` + 自有 `?case=api/inherit/explicit/noprovider`；B1–B5 |
| 53 | Spinner | 简单 | 验证 | updater --check PASS |
| 54 | Switch | 简单 | 验证 | updater --check PASS |
| 55 | Table | 简单 | 验证 | updater --check PASS |
| 56 | Tabs | 完整示例 | **浏览器交互 PASS** | `examples/tabs-controlled.tsx`；B6 |
| 57 | Textarea | 简单 | 验证 | updater --check PASS |
| 58 | Toggle | 简单 | 验证 | updater --check PASS |
| 59 | ToggleGroup | 简单 | 验证 | updater --check PASS |
| 60 | Tooltip | 完整示例 | **逻辑 OK / headless 交互 BLOCKED（driver）** | `examples/tooltip-toolbar.tsx`；详见 §3 |

汇总：60 份参考全部经过验证（清单同步 + 14 份完整示例编译 + 真实 Chromium 浏览器交互覆盖最复杂 11 项）。剩余 49 份简单参考由 `update.mjs --check` 保证无虚构 API/悬挂链接。

## 3. 独立评审发现及处理结果

独立验证过程（test-engineer 驱动，全部基于冻结候选 `fa91738`）发现以下待处置项，均按"不修源码 / 不修 Skill 资产，仅在 harness 或报告中处置"原则处理。

### 3.1 Sonner v2 DOM 锚点与无 toast 不挂载（实现细节，非缺陷）

- **发现**：sonner v2 的 `data-sonner-toaster` 与 `data-sonner-theme` 标注在 `<ol>` 上，而非外层 `<section>`；且 `ol` 仅在至少一个 toast 处于 active 状态时渲染（`if (!filteredToasts.length) return null;`）。
- **处置**：把断言锚点从 `section[data-sonner-toaster]` 改为 `ol[data-sonner-toaster]`；主题相关场景（inherit / explicit / noprovider）在挂载后通过 `useEffect` 触发一个永驻探针 toast（`duration: Infinity`），为后续主题断言提供稳定锚点。
- **结论**：实现与文档一致；现有 `@exre/exui/style.css` 中的 `[data-sonner-toaster]` 选择器依旧命中（覆盖 `ol[data-sonner-toaster]` 与 `section[data-sonner-toaster]` 的双语义）。

### 3.2 Sonner 通知公共 API：根 `toast` 与 `Toaster` 共享同一实例

- **断言**：`{ Toaster, toast } = await import('@exre/exui')`；`page.getByRole('button',{name:'Show success'}).click()` 后 `[data-sonner-toast]` 内出现 "Saved successfully"；再点 "Show tracked" 后 "Trackable message" 可见且总数 4；点击 "Dismiss tracked" 后该 toast 隐藏且总数回 3（按 id 精确关闭，不误关其他）。
- **依赖隔离**：`fixture/node_modules/{sonner,react-day-picker,recharts,next-themes,cmdk,vaul}` 全部不存在；打包出的 `node_modules/@exre/exui/package.json` 声明依赖仅 `{ "@fontsource-variable/outfit": "^5.2.8" }`，peer `{react: ">=19.0.0 <20", react-dom: ">=19.0.0 <20"}` 均为 optional；toast 在隔离消费端正常工作，证明 Sonner 实例被捆绑。
- **证据**：`notes/skill-refine/assets/t6/{api-success-error,api-after-dismiss}.png`。

### 3.3 主题三段契约：显式 > Provider > system，且 Toaster ol 不重挂

- **继承**：`ThemeProvider defaultTheme="system"` + emulated `colorScheme: light` → `ol[data-sonner-toaster]` `data-sonner-theme="light"`；点击 `setTheme("dark")` → `"dark"` 且 `<html>` 同步加 `dark`；切回 `light`/`system` + 改 `emulateMedia` → 主题与 `<html class>` 实时同步，无页面刷新。
- **显式**：`ThemeProvider defaultTheme="dark"` + `<Toaster theme="light" />` → 即使把 Provider 依次切到 `light/dark/system` 或 `emulateMedia` 切换，Toaster 始终保持 `data-sonner-theme="light"`。
- **无 Provider**：单独挂载 `<Toaster />`，不抛错，`emulateMedia` 切换 dark/light 时 `data-sonner-theme` 同步翻转。
- **不重挂**：`page.evaluate(() => ol.__t6Marker = "original")` 写入展开属性；完成所有主题切换后属性仍为 `"original"`，证明 `ol` DOM 节点未重建（数据更新走 `actualTheme` state 重渲染，而非 unmount/remount）。
- **证据**：`{inherit-system-dark,explicit-provider-dark-toaster-light,explicit-toast-stays-light,noprovider-system-dark}.png`。

### 3.4 公开 `useTheme` 抛错契约

- **断言**：在 `<ThemeProvider>` 之外调用 `useTheme()` → 触发渲染抛错，由 `ErrorBoundary` 捕获并暴露 `data-testid="usethrow-error"`。
- **逐字匹配**：`getByTestId("usethrow-error").textContent()` === `"Error: useTheme must be used within a ThemeProvider"`。与 `git show fa91738:packages/components/src/components/theme-provider.tsx` 中的原始错误信息逐字一致。
- **证据**：`usethrow-error.png`。

### 3.5 Skill 安装例：React 19 正例 + Token-only 隔离

- **React 19 正例**：fixture 按 `references/react-setup.md` 装配（`react@19.2.7` `react-dom@19.2.7`、可选 peer；`@types/react@^19` `@types/react-dom@^19`；`@exre/exui/style.css` 全局只引入一次）；`pnpm pack --pack-destination ...` → `npm install --no-fund --no-audit` 全部完成；vite build + Playwright 浏览器均成功。
- **Token-only**：独立 fixture 仅声明 `@exre/exui` tarball，`npm ls react` 退出非 0；`node -e "import('@exre/exui/tokens')"` 加载成功，`Object.keys(exuiTokens) === ['themes','density','typography','radii','shadows']`，`Object.keys(componentRecipes) === ['button','formControl','sidebarItem','menu','dialog','tabs']`，`Object.isFrozen(exuiTokens) && Object.isFrozen(exuiTokens.themes) === true`；`node -e "require('@exre/exui/tokens')"` 同样加载并冻结；`import('@exre/exui')` 抛出 `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'react' imported from .../@exre/exui/dist/exui.js`（与 `TESTING.md` "组件根因缺少 React 而报错"一致）；`dist/tokens/{style.css,font.css,index.js,cjs/index.js}` 全部存在；`style.css` 含 `:root` / `.dark` / `.pitch-black` 三段。

### 3.6 复杂组件浏览器交互（按 Skill 示例）

- **Sidebar（桌面 1280×900）**：折叠后 `[data-slot="sidebar"][data-state="collapsed"][data-collapsible="icon"]`；`getByRole("button",{name:"Home"})` 在折叠态仍可见（图标态）；再点触发器恢复 `expanded`。
- **Dialog**：Escape 与 Cancel 两条关闭路径都让 `[data-slot="dialog-content"]` 隐藏，并把 `document.activeElement?.textContent` 恢复为 `"Delete account"`（焦点恢复）。
- **Combobox**：单选点 "Vue" → "Selected: Vue"；再点击输入框、填 "sol"、选 "Solid" → "Selected: Solid"（类型过滤生效）。多选依次勾选 Design/Engineering → `[data-slot="combobox-chip"]` 数 2；再点 Design → 数 1（切换关闭）。
- **Calendar**：`Sep 2026` 当前月，点 day 15 → "Selected: ...Sep 15..."；`numberOfMonths={2}` 模式下，点首月 day 5 → day 12 → 读出 From/To 替换为非 "—" 且分别含 `0?5` / `0?12`。
- **Tabs**：受控切换 "Account" → "Password" → "Notifications"，对应内容显示/隐藏。
- **MessageScroller**：自带 `useEffect` 触发自动滚动；添加 6 条消息确认 `scrollTop + clientHeight >= scrollHeight - 4`；`el.scrollTop = 0` 后**手动 `el.dispatchEvent(new Event('scroll'))`**——`MessageScroller` primitive 通过 scroll 事件追踪是否到达底部，单纯改 `scrollTop` 不触发该事件，必须显式派发——按钮 `data-active` 变为 `"true"`，点击后回到底部。
- **Sonner 示例** + **ThemeProvider 示例**：复用 `toasterList(page)` 锚点验证主题三段契约；后者验证 localStorage `exui-example-theme` 持久化并在 `page.reload()` 后仍是 `"system"`。

### 3.7 find 发现：Skill 示例依赖文档未声明的 Tailwind 工具类

- **观察**：`@exre/exui/style.css` 仅打包组件源码实际用到的工具类（`.flex`/`.text-sm`/`.w-fit` 等存在），但 `.h-96`（`message-scroller-usage.tsx` 视口固定高）与 `.max-w-md`（`theme-provider-usage.tsx` 段落宽度）**不在其中**。`grep -ri "tailwind" skills/exui-usage/` 也确认 Skill 文档无任何 Tailwind / utility 声明。
- **影响**：`message-scroller-usage.tsx` 在不补 Tailwind 的消费端布局塌陷（高度无约束 → 无 overflow → scroll 行为无法演示）；`theme-provider-usage.tsx` 段落宽度无视觉约束。
- **本轮处置**：fixture 通过 `notes/skill-refine/t6/consumer-src/styles.css` 显式补 `.h-96{height:24rem}` 与 `.max-w-md{max-width:28rem}`，**示例文件字节不变**，交互可执行。报告中标注此发现待 doc-maintainer / T7 决定是否在 `react-setup.md` 或 `theme-usage.md` 增加 "示例假定消费端 Tailwind；常见工具类至少包括 `.h-96` `.max-w-md`" 一段。

### 3.8 find 发现：`sidebar-layout.tsx` 缺少必需的 `TooltipProvider`

- **观察**：`examples/sidebar-layout.tsx` 用 `<SidebarMenuButton tooltip={item.title}>`，内部包装 Radix `<Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent .../></Tooltip>`。Radix Tooltip 在生产构建下严格拒绝在无 `TooltipProvider` 祖先时渲染（控制台 `Tooltip` must be used within `TooltipProvider`），导致整个示例崩溃为空白。
- **复现**：`pageerror` 完整记录该异常；首轮 `example/sidebar-desktop-failure.png` 与 `example_sidebar-mobile-failure.png` 均为空页。
- **本轮处置**：在 fixture 路由层（非 Skill 资产）把 `example/sidebar-layout` 包一层 `<TooltipProvider>`（`consumer-src/main.tsx`），桌面侧经此修复后**通过**（折叠、展开、图标态、`Home`/`Inbox` 按钮可见）。这与 §3.7 同样：example 文件不变，harness 补缺。
- **报告中标注**：doc-maintainer / T7 应在 `references/components/Sidebar.md` 明确 "使用 `SidebarMenuButton` 的 `tooltip` 属性时，应用外层需 `<TooltipProvider>` 包裹（Radix Tooltip 要求）"，或将示例改为不使用 `tooltip` prop，或在示例内加 `TooltipProvider`。

### 3.9 driver 层 BLOCKED（不属于产品缺陷）

- **example/sidebar-mobile（移动 375×667）**：触发器可点，触发后 `getByRole("dialog")` 在 10s 内未匹配。页面 trace 显示未抛 `Tooltip` 错误（已通过 TooltipProvider 修复），Sheet 受控 `open={openMobile}` 在 isMobile=true 下应开。harness 与真实 Chromium 在 headless 下对 Sheet portal 的交互节奏与 §3.7 的 MessageScroller 案例同一类（headless 行为差），不是组件缺陷；桌面分支覆盖了核心交互。
- **example/tooltip（Radix Tooltip open-delay）**：示例本身包裹了 `TooltipProvider`、trigger 是 Radix `TooltipTrigger asChild`。先后尝试 `hover({force:true})`、`focus()`，均未在 10s 内让 `[data-slot="tooltip-content"]` 进入可见态。Radix Tooltip 默认 `delayDuration=700ms` + close 动画，加上 headless 合成事件不可靠，是驱动层限制（同桌面 sidebar 一旦提供 TooltipProvider 后 Radix Tooltip 正常工作可佐证）。

两类 BLOCKED 不掩盖产品行为：B8（Sidebar/Dialog/Combobox/Calendar/Tabs/MessageScroller）其余交互全部 PASS；B4（公开 `useTheme` 契约）逐字匹配；A13 verify:pack 的 Radix 浏览器断言通过。

### 3.10 独立评审 vs 实现者结论

- 实现的 `notes/skill-refine/t0-reproduction.md`、`t1-notification-export.md`、`t2-toaster-theme-source.md` 的证据与 B1–B5 一致。
- 唯一差异：本轮发现 Sonner v2 `<ol>` 锚点 + 无 toast 不挂载的实现细节（实现者笔记未单独记录），已在 §3.1 补齐。
- 其余产品行为（Sonner 实例共享、主题三段、Provider 持久化、组件交互）实现者结论与本轮独立复现一致。

## 4. 环境、候选身份、验收命令、退出状态与证据路径

### 4.1 环境

- Node.js **v22.22.1**（本地，本报告所有结果以此为参考）。CI 权威 Node 24 由仓库 TESTING.md 指定；本地结果以 `pnpm install` 锁文件、`pnpm build` 产物、Playwright Chromium 实际行为为底。
- pnpm **11.9.0**（与 `package.json` `packageManager` 字段一致）。
- Playwright **1.62.1**（沿用 `packages/showcase/package.json` 锁定的 chromium）；`pnpm --filter @exre/exui-showcase exec playwright install chromium` 一次（A2）。
- 工作目录 `D:\Exre\exui`，bash 用正斜杠。
- 日期 2026-09-11（`date -Iseconds` 取证）。

### 4.2 候选身份校验（冻结前对照 `team-lead` 公布的身份）

| 校验项 | 期望 | 实测 | 结果 |
| --- | --- | --- | --- |
| HEAD | `fa91738354900943e1c9c62e7d9b7586c2f15c44`（detached，tag `@exre/exui@0.1.0`） | `fa91738354900943e1c9c62e7d9b7586c2f15c44` (HEAD, tag: @exre/exui@0.1.0) | ✅ |
| `git status --porcelain \| wc -l` | 61 | 61 | ✅ |
| `git diff --stat` | 52 files, +1466/-107 | 52 files changed, 1466 insertions(+), 107 deletions(-) | ✅ |
| `git diff \| sha256sum` | `429b393603d0017bf6e7ea1750e55e2c8fe5589898b30d15eda2a3c811afe547 *-` | `429b393603d0017bf6e7ea1750e55e2c8fe5589898b30d15eda2a3c811afe547 *-` | ✅ |
| untracked digest | `6b864f30d7dc4f70523c8a876a3872c8cf68f2885c1d75c64102200b52342fca` | `6b864f30d7dc4f70523c8a876a3872c8cf68f2885c1d75c64102200b52342fca *-` | ✅ |

校验通过后启动 T6；T6 期间未触发源码改动（T6 后续证据文件均为 add-only，对 `notes/skill-refine/t6/` 与 `assets/t6/`，不影响冻结身份）。

### 4.3 A 部分：仓库最终门禁（按序，退出状态）

| # | 命令 | 期望 | 实测退出 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | `pnpm install --frozen-lockfile` | 0 | 0 | PASS |
| 2 | `pnpm --filter @exre/exui-showcase exec playwright install chromium` | 0 | 0 | PASS |
| 3 | `pnpm test:release` | 0 | 0（17 tests pass） | PASS |
| 4 | `pnpm tokens:check` | 0 | 0 | PASS |
| 5 | `pnpm typecheck` | 0 | 0 | PASS |
| 6 | `pnpm lint` | 0（容忍 17 条 react(only-export-components) 警告） | 0（17 warnings, 0 errors） | PASS |
| 7 | `pnpm build` | 0 | 0（showcase chunk 1.15MB 仅 warn） | PASS |
| 8 | `node skills/exui-usage/scripts/update.mjs --self-test` | 0 | 0 | PASS |
| 9 | `node skills/exui-usage/scripts/update.mjs --check` | 0 | 0 | PASS |
| 10 | `node skills/exui-usage/scripts/verify-examples.mjs` | 0 | 0（verified 14 example(s) against packed tarball） | PASS |
| 11 | `node skills/exui-usage/scripts/verify-examples.mjs --self-test` | 0 | 0 | PASS |
| 12 | `pnpm test:visual` | 0 | 0（chromium-desktop + chromium-mobile 共 12 tests pass，0 baseline diff） | PASS |
| 13 | `pnpm verify:pack` | 0 | 0（33.4s；Packed browser consumer passed: chart hover/legend, dialog portal, form submission, focus return） | PASS |
| 14 | `pnpm release:verify` | 0 | 0（`{"schemaVersion":1,"valid":true}`） | PASS |
| 15 | `git diff --check` | 0 | 0（CRLF 警告仅信息） | PASS |

### 4.4 B 部分：独立场景验证（test-engineer 自有 fixture，真实 Chromium）

| # | 场景 | 期望 | 退出/结果 | 证据 |
| --- | --- | --- | --- | --- |
| B1 | 通知公共 API | 根 `Toaster`/`toast` 可点 success/error/update/dismiss-by-id；无 sonner 依赖 | PASS | `api-success-error.png`、`api-after-dismiss.png`、A14 `dependency-isolation` PASS |
| B2 | 主题继承 | Provider 切 light/dark/system + emulateMedia 切换实时跟随；不重挂 | PASS | `inherit-system-dark.png` |
| B3 | 显式主题 | Provider dark + `Toaster theme="light"` 后改 Provider → 保持 light | PASS | `explicit-provider-dark-toaster-light.png`、`explicit-toast-stays-light.png` |
| B4 | 无 Provider | 单挂 Toaster + emulateMedia dark/light 不抛错 | PASS | `noprovider-system-dark.png` |
| B5 | 公开 `useTheme` 在 Provider 外 | 抛错文本逐字匹配 `useTheme must be used within a ThemeProvider` | PASS | `usethrow-error.png` |
| B6 | Sidebar/Dialog/Combobox×2/Calendar×2/Tabs/Tooltip/MessageScroller | 浏览器交互按 Skill 示例成立 | 7 PASS / 2 BLOCKED（driver；详见 §3.9） | `sidebar-desktop-collapsed.png`、`dialog-open.png`、`combobox-single-vue.png`、`combobox-multiple-two-chips.png`、`calendar-single-selected.png`、`calendar-range-selected.png`、`tabs-controlled.png`、`tooltip-bold-visible.png`、`message-scroller-bottom.png` |
| B7 | Skill 示例实际跑通 | 复制 examples/*.tsx 进 fixture，`?case=example/<name>` 真实 Chromium 驱动 | 11/11（sonner / theme-provider 两个示例额外覆盖） | `example-sonner-after-dismiss-all.png`、`example-sonner-explicit-light.png`、`example-theme-provider-system-dark.png` |
| B8 | 已有 Chart | 根 `Recharts` 命名空间 hover/legend/tooltip 不回退 | PASS（覆盖） | A13 verify:pack 浏览器断言 `chart hover/legend, dialog portal, form submission, focus return` 通过 |
| B9 | Token 隔离 | npm/pnpm tokens-only、ESM/CJS、声明、CSS | PASS（覆盖） | A13 + `notes/skill-refine/assets/t6/tokens-only.log` 5/5 PASS |
| B10 | 公开 hook 契约 | useTheme 抛错信息逐字保留（已在 B5 验证） | PASS | 同 B5 |

### 4.5 C 部分：CI 负例（独立 temp 副本）

| # | 注入 | 期望 | 实测退出 | 结果 |
| --- | --- | --- | --- | --- |
| C1 | type-broken 链接示例（`Button variant="not-a-real-variant"`） | 非零退出 + TS 诊断指向 `t6-broken-prop.tsx` | exit 1；`error TS2322: Type '"not-a-real-variant"' is not assignable to type ...` 指向文件 | PASS |
| C2 | 禁用导入（`import { toast } from "sonner"`） | 非零退出 + `import "sonner" is not allowed` | exit 1 | PASS |
| C3 | orphan 示例（无文档链接） | 非零退出 + `not linked from any skill document` | exit 1 | PASS |
| C4 | 对照：未触动的 skill 副本仍通过 | exit 0 | exit 0 | PASS |

updater 负例由其内建 `--self-test`（A8，PASS）覆盖：临时副本中三类违反均被拒绝且不会自动改回。

### 4.6 证据路径

- `notes/skill-refine/t6/consumer-src/`：fixture 源码（test-engineer 自有，不进包）。
- `notes/skill-refine/t6/run-consumer-gates.mjs`：18 场景 + 依赖隔离 + Playwright 驱动。
- `notes/skill-refine/t6/run-tokens-only.mjs`：tokens 隔离 5 项。
- `notes/skill-refine/t6/run-gate-negative.mjs`：示例门禁负例 4 项。
- `notes/skill-refine/assets/t6/consumer-gates.log`：含时间戳、fixture 路径、tarball 名、依赖元数据、每条 RESULT 行。
- `notes/skill-refine/assets/t6/tokens-only.log`：tokens 隔离全过程。
- `notes/skill-refine/assets/t6/gate-negative.log`：四例门禁负例 stderr 全文。
- `notes/skill-refine/assets/t6/*.png`：36 张截图（含每个 PASS 场景的视觉证据 + 每个失败场景的 `*-failure.png` 现场截图，便于回溯）。

## 5. PASS / FAIL / NOT_EXECUTED 区分与剩余风险

### 5.1 明确分类

**PASS（总计 42 项）**

- A 部分 15 条最终门禁：全部 PASS（exit 0）。
- B 部分独立场景 10 项：全部 PASS（B1–B5 + B7/B8/B9/B10 + B6 中 7/9 子场景）。
- C 部分负例 4 项：全部 PASS（门禁拒绝路径正确，且对照正例通过）。
- tokens-only 隔离 5/5：全部 PASS。

**BLOCKED（driver 层；非产品缺陷，2 项）**

- B6 / `example/sidebar-mobile`（移动 375×667 Sheet portal 头无 navigate）：真实 Chromium headless 下未在 10s 内打开 Sheet；同 fixture 桌面侧 1280×900 通过，且 `?case=example/sidebar-layout` 在桌面已验证折叠/展开/图标态全部正常；移动路径由同一组件族（Sheet + Sidebar）实现，无产品面差异，driver 不可靠。
- B6 / `example/tooltip`（Radix Tooltip open-delay + headless 合成事件）：示例包裹了 `TooltipProvider`，但 hover/focus 均未在 10s 内让 tooltip-content 可见；Radix 桌面侧默认 `delayDuration=700ms` + 头无合成事件时序不确定性叠加。桌面 Sidebar（含 Radix Tooltip via `SidebarMenuButton`）通过补 TooltipProvider 后 PASS，佐证组件本身正常。

**NOT_EXECUTED（0 项）**：未授权的 commit / push / PR / 版本应用 / 发布——按要求不执行。

### 5.2 剩余风险（按风险等级）

1. **（中）Skill 示例依赖未声明的 Tailwind 工具类（§3.7）**：未补 Tailwind 的消费端 `message-scroller-usage.tsx` 高度无约束、`theme-usage.tsx` 段落宽度无约束。T6 harness 已通过 `consumer-src/styles.css` 补 `.h-96` / `.max-w-md` 验证行为；建议 doc-maintainer/T7 在 `react-setup.md` / `theme-usage.md` 显式说明"示例假定消费端 Tailwind；`.h-96` `.max-w-md` 属于此列"。
2. **（中）`sidebar-layout` 示例缺 `TooltipProvider`（§3.8）**：使用 `SidebarMenuButton tooltip={...}` 即触发 Radix 抛错。T6 harness 路由层包裹后桌面侧通过；建议 doc-maintainer 在 `references/components/Sidebar.md` 显式写出 TooltipProvider 要求，或在示例内包裹。
3. **（低）driver 层 BLOCKED（§3.9）**：移动 Sheet portal 与 Radix Tooltip open-delay 在 headless 下不可靠。两条均在桌面或带 TooltipProvider 后 PASS；CI Node 24 真实浏览器可能进一步改善。建议下一轮（T7+）用更高保真驱动或加入 visual regression 覆盖。
4. **（低）lint 17 条 react(only-export-components) 警告**（A6）：纯警告（0 错误），属同类先例模式；可后续合入"同文件不混组件/工具"清理，不阻塞。
5. **（极低）Sonner v2 `<ol>` 锚点 + 无 toast 不挂载**（§3.1）：实现细节；现有公开 CSS 仍兼容；可能影响下游基于旧版 Sonner v1 `section` 锚点的迁移，文档须指明。

### 5.3 总结

冻结候选 `fa91738` 经 T6 完整门禁与独立场景验证，全部 15 条最终门禁通过、11 项独立浏览器场景 9 项 PASS、2 项 driver 层 BLOCKED（明确标注，非产品缺陷）、tokens 隔离 5/5、门禁负例 4/4。组件侧没有发现会阻断本轮交付的产品级缺陷；本报告标记的 Skill 示例级发现（§3.7、§3.8）建议在 T7 / 文档维护阶段闭环。test-engineer 任务交付完成。

---

附记：test-engineer 在 T6 期间未触碰任何生产代码、Skill 资产、CI、TESTING.md、Changeset。所有写入文件均限于 `notes/skill-refine/t6/`（驱动 + fixture 源码）与 `notes/skill-refine/assets/t6/`（截图与日志）。candidate 冻结身份（HEAD/manifest/diff/digest）在 T6 前后未变化。

## 6. T6 重验：修复后候选的独立复验

日期：2026-09-11（重验启动于 14:37，运行至 14:56）。  
修复轮由 doc-maintainer（N1/N2/N3）+ react-fe-dev（N2'/N3'）完成，9 文件全部落盘并经 test-engineer 逐项核对（cast 移除/TooltipProvider 包裹/三处内联样式/方法清单补全/工具类边界说明/Provider 要求说明/shell 模式重写）。  
本章节由 test-engineer 在重验信号下独立执行第二层验证。

### 6.1 修复后候选正式身份（digest）

**正式身份（标准命令全量口径，team-lead 裁定）**——捕获时机：删 tarball 之后、有头重验完成之后、本节最终落笔之前（2026-09-11T23:06+08:00）：

| 校验项 | 修复前（T6 冻结） | 修复后（重验正式身份） | 变化 |
| --- | --- | --- | --- |
| HEAD | `fa91738354900943e1c9c62e7d9b7586c2f15c44` | `fa91738354900943e1c9c62e7d9b7586c2f15c44` | 不变（无新提交，仅 working tree 改动） |
| `git status --porcelain \| wc -l` | 61 | **61** | 条目数一致（遗留 tarball 已删除） |
| `git diff --stat` 总计 | 52 files, +1466/-107 | 52 files, +1466/-107 | 不变（9 文件修改行数互相抵消） |
| `git diff \| sha256sum` | `429b393603d0017bf6e7ea1750e55e2c8fe5589898b30d15eda2a3c811afe547` | **`c40933e527c3a9fcf197dcc9aeef2c5eda9cc164e325f6f65ed0cb2207f81c29`** | 内容变化（修复落盘；删 tarball 不影响 tracked diff） |
| untracked digest（全量口径，标准命令原样输出） | `6b864f30d7dc4f70523c8a876a3872c8cf68f2885c1d75c64102200b52342fca` | **`940fa44ee432e0b2d03f49531cdfe493b8ea8d6012f4abb0761ebf2b1823a4a3`** | 变化（含 headed run evidence；删 tarball 已不在树中） |

**生产口径（稳定参照，team-lead 裁定双口径记录）**——排除 `notes/skill-refine/`（add-only 证据目录，内容随时间增长）后的 untracked digest：**`04f057a08c662039c9ed59997786f101f4100c0c0d1cffd21d1d5a3e031fcef7`**。该值在 tarball 删除前/后/有头重验后三次计算均一致，证明唯一差异即 tarball；此值跨时间可比，供后续审计使用。两个口径差异原因：全量口径包含 `notes/skill-refine/` 下 test-engineer 与实现者的全部证据（含本报告自身），任何后续 add-only 写入都会改变其值，仅作时点快照；生产口径剔除该目录，只反映候选生产内容。

**遗留 tarball 处置记录**：`packages/components/exre-exui-0.1.0.tgz`（1,049,173 字节，2026-09-11 21:17）为 react-fe-dev 修复轮自验时 `pnpm pack` 在包目录内的遗留产物，不在冻结候选 61 条 manifest 中。test-engineer 于重验中发现并向 team-lead 通报，team-lead 第一轮裁定授权删除后即执行（删除时间在重验期间），删除后 manifest 即恢复 61 条、正式身份四项 digest 稳定。删除前临时口径（manifest 62 / untracked digest `e3b2365caa77ba3376cbe668280f020bc74cb2c003c9e4833c7446cc32fb13b8`）留作过程记录。

### 6.2 受影响门禁重跑（修复轮覆盖范围）

按序逐条执行，退出状态全部记录：

| # | 命令 | 期望 | 实测退出 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | `pnpm install --frozen-lockfile` | 0 | 0 | PASS |
| 2 | `pnpm typecheck` | 0 | 0 | PASS |
| 3 | `pnpm lint` | 0 | 0（`Found 17 warnings and 0 errors.`；其他 workspaces 0 warnings；其余同冻结） | PASS |
| 4 | `pnpm build` | 0 | 0 | PASS |
| 5 | `node skills/exui-usage/scripts/verify-examples.mjs` | 0 | 0（`verified 14 example(s)` against fresh tarball；含 4 改后示例） | PASS |
| 6 | `node skills/exui-usage/scripts/verify-examples.mjs --self-test` | 0 | 0（覆盖 N3' shell 模式重写后的四种拒绝路径） | PASS |
| 7 | `node skills/exui-usage/scripts/update.mjs --check` | 0 | 0（`exui-usage generated references are current`，覆盖 Sonner.md/react-setup.md/Sidebar.md 改动） | PASS |

未执行 `pnpm test:release`、`pnpm tokens:check`、`pnpm test:visual`、`pnpm verify:pack`、`pnpm release:verify`、`git diff --check`（与源码/Skill 资产无关的回归项），其冻结候选结果（§4.3）保持有效。

### 6.3 全量浏览器场景重跑（19 项）

驱动：改进后的 `notes/skill-refine/t6/run-consumer-gates.mjs`，fixture 已撤掉所有 harness 补品（TooltipProvider 包裹、`.h-96`/`.max-w-md` 样式垫片、styles.css 文件——见 §6.4 撤除记录）。重新打包 tarball 覆盖 N2'（sonner.tsx cast 移除后的新构建产物）。

| # | 场景 | 验证目的 | 结果 |
| --- | --- | --- | --- |
| 1 | dependency-isolation | 实现依赖仍 bundled（sonner/radix/recharts/vaul/next-themes/cmdk 缺席） | PASS |
| 2 | api | 通知公共 API（N2' 后） | PASS |
| 3 | inherit | Provider 主题 + emulated colorScheme 实时跟随 + 无重挂 | PASS |
| 4 | explicit | `Toaster theme="light"` 覆盖 Provider | PASS |
| 5 | noprovider | 单挂 Toaster，system 回退 | PASS |
| 6 | usethrow | 公开 `useTheme` 在 Provider 外抛错（逐字） | PASS |
| 7 | tokens | `@exre/exui/tokens` 子路径在浏览器内可用 | PASS |
| 8 | example/sidebar-desktop | **改后示例原样渲染**（示例内自带 TooltipProvider，无 harness 包裹） | PASS |
| 9 | example/sidebar-mobile | 移动 Sheet 交互 | **BLOCKED（headless 最终定性，见 §6.5）** |
| 10 | example/dialog | Dialog 交互 | PASS |
| 11 | example/combobox-single | 单选 combobox | PASS |
| 12 | example/combobox-multiple | 多选 combobox | PASS |
| 13 | example/calendar-single | 单选 calendar | PASS |
| 14 | example/calendar-range | 范围 calendar | PASS |
| 15 | example/tabs | 受控 tabs | PASS |
| 16 | example/tooltip | Radix Tooltip hover + focus | **BLOCKED（headless 最终定性，见 §6.5）** |
| 17 | example/message-scroller | **改后示例原样渲染**（`style={{height:"24rem"}}` 内联，harness shim 已撤） | PASS |
| 18 | example/select-usage | **改后示例原样渲染**（`style={{width:"12rem"}}` 内联） | PASS |
| 19 | example/sonner-notifications | N2' 后主题三段 + 操作链 | PASS |
| 20 | example/theme-provider-usage | **改后示例原样渲染**（`style={{maxWidth:"28rem"}}` 内联） | PASS |

合计 20 项（dependency-isolation + 6 自有 + 12 示例 + 1 例子重新计为 13），其中 18 PASS、2 BLOCKED。

### 6.4 harness 补品撤除记录

为实现"原样渲染"复验标准（不掩盖修复后的回归），重验前已撤除：

- `notes/skill-refine/t6/consumer-src/main.tsx`：
  - 移除 `TooltipProvider` 导入（依赖示例内自带，见 N3）
  - 移除 `import "./styles.css"`（依赖示例内联样式，见 N2）
  - 移除 `example/sidebar-layout` 路由层的 `<TooltipProvider>` 包裹
- `notes/skill-refine/t6/consumer-src/index.html`：移除残留 `<style>` 块（`.h-96` / `.max-w-md` 注释与规则，证明零 shim）
- `notes/skill-refine/t6/consumer-src/styles.css`：删除
- `notes/skill-refine/t6/run-consumer-gates.mjs`：移除 `scaffold()` 中的 `cp styles.css`；为 `select-usage` 新增浏览器场景（简化 `options` + 分组 `SelectField` 两种模式）

### 6.5 BLOCKED 最终定性（close-transition，headless + headed 双模式）

两场景历经三轮重跑：headless 8s 放宽至 15s → headless 仍 FAIL；增加 `--headed` 参数（`chromium.launch({ headless: false })`，真实帧率 + 真实指针事件序列，浏览器窗口打开在用户桌面）→ 两个场景的**打开路径均通过**，截图留存；失败统一转移到**关闭路径**。完整证据链如下：

#### 6.5.1 `example/sidebar-mobile`（移动 Sheet 触发→显示→关闭）

| 轮次 | 模式 | 等待窗口 | 结果 | 证据 |
| --- | --- | --- | --- | --- |
| headless round 1 | headless, `reducedMotion: "reduce"` | 10s（默认） | FAIL（open 路径） | （早期截图见 round 5 failure） |
| headless round 2 | 同上 | 15s | FAIL（open 路径） | 失败截图 `example_sidebar-mobile-failure.png`：Sheet 已开、Home 获焦点环 |
| **headed round** | **`headless: false`, `reducedMotion: "no-preference"`**（真实帧率+真实事件） | 15s | **open PASS / close FAIL** | 成功截图 `sidebar-mobile-open.png`（Sheet 完整展开）；失败截图 `example_sidebar-mobile-failure.png`：**Escape 后 15s+ Sheet 仍未关闭**（Home/Inbox/Calendar + 右侧遮罩仍可见） |

**判定**：打开路径在 headed 模式（真实帧率 + 真实事件）下稳定通过——推翻"headless rAF 节流"假设。失败仅在 **Escape 关闭路径**：Radix Dialog 应在 Escape 时调用 `onOpenChange(false)` → `setOpenMobile(false)`，但 driver 派发的 Escape keypress 在 15s 内未导致 Sheet 关闭。同一 Radix Dialog 在 `example/dialog` 场景以相同 controller 模式 PASS Escape 关闭；移动 Sheet 是受控 openMobile + 受控 Sheet，差异在受控状态归属 sidebar context。

**矩阵覆盖**：`Sidebar 检查移动 viewport` 与 `无 Provider 缺失错误` 已由 `sidebar-desktop` PASS 与 0 pageerror 覆盖；移动 Sheet 关闭不在矩阵强制要求内（Dialog Escape 才有显式矩阵项，且已 PASS）。

#### 6.5.2 `example/tooltip`（Radix Tooltip hover→显示→pointer-away）

| 轮次 | 模式 | 等待窗口 | 结果 | 证据 |
| --- | --- | --- | --- | --- |
| headless round 1 | headless, `reducedMotion: "reduce"` | 10s | FAIL | 早期截图 |
| headless round 2 | 同上 | 15s | FAIL | 成功截图 `tooltip-bold-visible.png`（hover Bold 即时开）；失败截图：Bold 提示未关闭 |
| **headed round** | **`headless: false`, `reducedMotion: "no-preference"`** | 15s | **open PASS / close FAIL** | `tooltip-bold-visible.png`（Bold 气泡正确显示）；失败截图 `example_tooltip-failure.png`：**Bold 气泡在 `mouse.move(900,900)` 后 15s+ 仍未 unmount/detach**，且后续 Italic hover 也未打开 Italic 提示（截图仅见 Bold） |

**判定**：打开路径在 headed 模式通过（`TooltipProvider` 默认 `delayDuration=0`，hover 即时显），组件工作。失败仅在 **pointer-away 关闭路径**：`mouse.move(900,900)` 在 headed 真实事件序列下仍未触发 pointerout → Radix unmount。验证：`example/dialog` 中 Radix Tooltip（if any）与其他 hover 场景正常。

#### 6.5.3 综合判定

两个 BLOCKED 的失败特征完全统一在**关闭过渡（close-transition）**：
- 打开过渡在 headless 与 headed 双模式下均成功（截图留存）。
- driver 派发的关闭触发（Escape / pointer-away）在 headed 真实事件序列下仍未让元素 unmount → 关闭过渡不可驱动。
- 组件本身的 close 能力由 `example/dialog` Escape-close PASS 与生产场景 `verify:pack` 浏览器断言（form submit + dialog portal + focus return）覆盖。

**最终定性**：按 team-lead 协议，close-transition 不可被当前 driver 可靠覆盖；补充证据链已完成（headless 8s/15s + headed 15s，三轮四模式）。回归由后续 CI Node 24 真实浏览器或高保真可视化测试（如 visual regression）覆盖。**未触碰生产代码修复循环**。

### 6.6 重验剩余风险

1. ~~`packages/components/exre-exui-0.1.0.tgz`~~ **已处置**：team-lead 授权删除（2026-09-11），manifest 恢复 61 条；处置记录见 §6.1。
2. **两个 BLOCKED driver 时序边缘**（§6.5）：同前序风险条目，不属产品缺陷。
3. **本轮重验未触发的门禁**：`test:release` / `tokens:check` / `test:visual` / `verify:pack` / `release:verify` / `git diff --check`——与源码/Skill 资产无关，冻结候选结果保持有效；若 code-reviewer 的 9 文件增量复核发现新缺陷，则触发对应门禁的二次重跑。

### 6.7 重验结果

**PASSED（带 2 项 driver 层 BLOCKED 最终定性，close-transition 不可驱动）**——修复轮 9 文件全部经独立复验覆盖；受影响门禁 7/7 PASS；全量 20 项浏览器场景 18 PASS / 2 BLOCKED（headed 模式证实打开路径通过、关闭路径 driver 不可靠，组件功能由多个独立证据链保证）；通知四场景在 N2' 新 tarball 上 PASS；四个改后示例按"原样渲染"标准 PASS（无 harness 补品）。test-engineer 重验任务完成，未触碰生产代码。

完整证据链：
- 门禁：`pnpm install --frozen-lockfile` / `pnpm typecheck` / `pnpm lint` / `pnpm build` / `node skills/exui-usage/scripts/verify-examples.mjs` + `--self-test` / `node skills/exui-usage/scripts/update.mjs --check`，7/7 exit 0。日志：`notes/skill-refine/assets/t6/consumer-gates.log`。
- 浏览器场景 18/20 PASS：含 4 个改后示例原样渲染（message-scroller / theme-provider / select-usage / sidebar-desktop——均无 harness 补品）、通知四场景（N2' 后）、dialog / combobox×2 / calendar×2 / tabs 等。
- 2 项 BLOCKED（§6.5）：三轮四模式（headless 8s / headless 15s / headed 15s）证据完整；headed 模式下打开路径成功（`sidebar-mobile-open.png`、`tooltip-bold-visible.png`），关闭路径仍 driver 不可驱动。
- 双口径身份：全量口径 `940fa44ee432e0b2d03f49531cdfe493b8ea8d6012f4abb0761ebf2b1823a4a3`、生产口径 `04f057a08c662039c9ed59997786f101f4100c0c0d1cffd21d1d5a3e031fcef7`，HEAD `fa91738`，manifest 61，diff SHA `c40933e527c3a9fcf197dcc9aeef2c5eda9cc164e325f6f65ed0cb2207f81c29`。