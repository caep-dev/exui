# T1 通知公共调用链 — 验收报告

日期：2026-09-11
负责人：react-fe-dev
基线：T0 报告（`notes/skill-refine/t0-reproduction.md`）所记录的 `fa91738` 上缺陷 (a) 成立
目标：消除缺陷 (a) — 从 `@exre/exui` 导出与 `<Toaster />` 共用同一份 Sonner 实例的 `toast`，并确保消费者无需自己安装 `sonner`

## 1. 改动

仅一处源代码改动（独占所有权内的最小动作）：

`packages/components/src/index.ts`：在所有组件 re-export 之后，附加 `export { toast } from "sonner"`。Vite 把 `sonner` 折叠为 dist 内唯一的内联模块；`ui/sonner.tsx` 中的 `import { Toaster as Sonner, type ToasterProps } from "sonner"` 与这里的 `export { toast } from "sonner"` 解析到同一份打包后的副本，因此 `<Toaster />` 和 `toast()` 共享同一队列。

未改动：
- `packages/components/src/components/ui/sonner.tsx`（主题解析留给 T2）
- `packages/components/vite.config.ts`
- `packages/components/package.json`（依赖拓扑、`files`、`exports` 全部不变；`sonner` 继续作为 `devDependency`，运行时不暴露给消费者）
- 锁文件
- 任何文档

## 2. 验证（命令 + 退出状态）

```
pnpm --filter @exre/exui build
   → tsc --noEmit + vite build + copy-tokens-dist + build:types + generate-notices + check-dist
   → 退出 0
   → dist/exui.js 1,729.81 kB，dist/bundled-modules.json 21.02 kB（声明 65 个包，vendored 76 个）

pnpm typecheck (workspace root)
   → @exre/exui-tokens + @exre/exui (tsc + build:types) + @exre/exui-showcase
   → 退出 0

pnpm lint
   → oxlint src
   → 退出 0（15 条警告均为 message-scroller.tsx / sidebar.tsx 的 pre-existing `react(only-export-components)`，
     与本次改动无关；T1 未引入任何新警告）
```

T1 隔离打包消费端验证（仓库外临时目录 `/tmp/exui-t1-rqS0R7/`，驱动 `run-t1.mjs`）：

```
exit 0: pnpm pack --json --pack-destination ...          # 真实发布物 exre-exui-0.1.0.tgz
exit 0: tar -xOf exre-exui-0.1.0.tgz package/dist/exui.js
dist export list now contains Toaster, toast, and useTheme
exit 0: tar -xOf exre-exui-0.1.0.tgz package/types/index.d.ts
types/index.d.ts toast line: export { toast } from "./vendor/sonner/dist/index.mts";

# T1 positive fixture (only @exre/exui, no own sonner)
exit 0: npm install (fixture-positive)
exit 0: tsc --strict probe-toast.ts (import { toast, Toaster }, toast.success/error/dismiss)
exit 0: vite build

# T1 negative fixture (own sonner + packed Toaster — must STILL fail)
exit 0: npm install (fixture-negative-own-sonner)
exit 0: vite build

# Chromium sessions
T1 positive: @exre/exui exports toast with .success/.error/.dismiss methods
T1 positive: packed Toaster shows success toast triggered by @exre/exui.toast.success
T1 positive: packed Toaster shows error toast triggered by @exre/exui.toast.error
T1 positive: toast.dismiss(successKey) removes the success toast while leaving the error toast
T1 negative: own sonner + packed Toaster still produces no toast — fix is targeted, not a coincidence
```

## 3. 静态产物检查（从 tarball 提取）

`evidence/dist-export-tail.txt`：

```
... as CarouselNext, ... as PaginationNext, B as ThemeProvider, lNe as Toaster, ZMe as toast, re as useTheme
```

`evidence/types-indexdts.txt`（types/index.d.ts 单行匹配）：

```
export { toast } from "./vendor/sonner/dist/index.mts";
```

公共 `types/` 通过 `bundle-types.mjs` 把 sonner 的真实声明 vendor 进来，未写缩水门面：`toast.success` / `toast.error` / `toast.dismiss` 等签名都由 sonner 的 `.d.ts` 直接派生；负例 fixture 内的 strict tsc 编译 `import { toast } from "@exre/exui"; toast.success("hi");` 通过退出 0 证明这一点。

## 4. 浏览器行为验证

### 4.1 正例：仅用 `@exre/exui`，不装 `sonner`

`assets/t0/t1-positive-success-toast.png` 与 `assets/t0/t1-positive-error-toast.png` 显示：

- 页面底部右下方的通知框（包 `<Toaster position="bottom-right" />`）依次弹出 success 和 error 通知，文字 "T1 success toast" / "T1 error toast"，图标分别使用 lucide `CircleCheckIcon` 与 `OctagonXIcon`。
- DOM 内 `data-sonner-toast` + `data-type="success"` / `data-type="error"` 的 `li` 节点真实出现，证明 `toast()` 调用与 `<Toaster />` 渲染走的是同一份状态。
- 域内探针：`toast-export:function`、`toast.success-method:function`、`toast.error-method:function`、`toast.dismiss-method:function` — 四个方法都从 `@exre/exui` 命名空间暴露。
- `toast.dismiss(successKey)` 调用之后，`li[data-type=success]` 在 800ms 内清零，而 `li[data-type=error]` 仍在屏（按 id 精准移除，验证了 dismiss 的签名）。整个会话 `pageerror` 为空。
- 注意：本截图未对 `page.colorScheme` 显式设置，Chromium headless 默认情况下 toast 主题由 next-themes 路径决定的（"system" → `prefers-color-scheme`），所以底色与 ExUI 主题意外一致是巧合，不是 T1 修复 — **缺陷 (b) 仍未修，留给 T2**。

### 4.2 负例：装自己的 `sonner`（`import { toast } from "sonner"`）

`assets/t0/t1-negative-own-sonner-still-fails.png`：消费者点击按钮触发自有 `sonner` 的 `toast.success(...)`，但包内 `<Toaster />` 区域持续为空（`ol[data-sonner-toaster][data-x-position=right] li[data-sonner-toast]` 计数 = 0）。

含义：
- T1 没有把"坏接线"也救起来。修复严格限定在正确路径上 — 消费者必须使用 `@exre/exui` 暴露的 `toast`，否则依然走的是与打包实例隔离的自装实例。
- 这正是 T0 报告 §4 第 1、2 条（"next-themes 行为" + "打包后 NextThemeProvider 无法触及"）背后的同一种隐患：单源 Sonner 实例。Skill 文档（T3）需要明确告知消费者不要再单独装 `sonner` 或 `next-themes`。

## 5. 范围确认

- 不改变依赖拓扑（`sonner` 仍是 `devDependency`）。
- 不新增公开子路径；`exports` map 不变。
- 不顺带导出全部 Sonner API — 只把 `toast` 本身的命名导出 + 它作为函数对象自带的 `success/error/dismiss` 等方法暴露出来（它们是同一个对象的属性，不可能只导出部分；如果以后需要命名导出某个 helper，再单独评估）。
- 不动 Token 隔离 — 现有 `tokens` 子路径、`@fontsource-variable/outfit` 唯一运行依赖保持原状。
- 不放开现有 `useTheme()` 在 Provider 外抛错的契约（留给 T2 内部使用，不动公开 API）。
- 锁文件未做无关更新。

## 6. 遗留风险

- **next-themes 内联 + Toaster 主题解析未改**：toast 现在能弹了，但主题仍走 `next-themes` 默认 `"system"` → `prefers-color-scheme`，T2 才会改为「显式 `theme` > ExUI Provider > system」。T2 完成后必须把这两张 T1 截图重跑一遍，确认主题跟随 ExUI Provider；当前 evidence 仅证明 toast 出现在正确 Toaster 上，不证明主题正确。
- **CI Node 24 vs 本地 Node 22**：fixture 命令在本机 Node 22.22.1 下退出 0。T6 阶段 test-engineer 会用 Node 24 重跑同一套断言与 tsc 探针。
- **Skill 文档同步**：T3 之前消费者仍按错误的直觉接线。doc-maintainer 应在 T3 中明确写"仅 `import { toast, Toaster } from "@exre/exui"`，**不要**再 `import { toast } from "sonner"`"。

## 7. 退出状态

**PASS**：T1 范围内缺陷 (a) 已修复并经隔离打包消费端 + Chromium 双重验证，公共类型签名正确，未引入 lint 新警告，未变更依赖拓扑与发布范围。下一步进入 T2。

## 8. 改动与产物清单

- 修改：`packages/components/src/index.ts`（追加 1 行 + 5 行注释）
- 生成：`packages/components/dist/exui.js`、`packages/components/dist/index.css`、`packages/components/dist/bundled-modules.json`、`packages/components/types/index.d.ts`、`packages/components/types/vendor/sonner/dist/index.mts`（由 build:types 生成）
- 新增：`notes/skill-refine/t1-notification-export.md`（本文件）
- 新增：`notes/skill-refine/assets/t0/t1-positive-success-toast.png`
- 新增：`notes/skill-refine/assets/t0/t1-positive-error-toast.png`
- 新增：`notes/skill-refine/assets/t0/t1-negative-own-sonner-still-fails.png`
- 未提交、未推送、未改锁、未改 CI、未改其他组件。

## 9. 补记（2026-09-11，doc 阶段期间）：toast re-export 位置迁移

**背景**：doc-maintainer 运行 skill updater 时发现本报告 §1 所述的根级放置方式（`src/index.ts` 末尾 `export { toast } from "sonner"`）会让构建后的 `types/index.d.ts` 出现一条不属于 `update.mjs` `classifyDeclaration` 任何批准组的声明（批准组仅 `types/components/ui/*`、`theme-provider`、`hooks`、`lib`），updater 报错 `component export declaration has no approved group: types/index.d.ts`，文档阶段被阻塞。

**修复（公开面与运行时行为完全等价的一行移动）**：
- `packages/components/src/index.ts`：删除根级 `export { toast } from "sonner"` 及其注释。
- `packages/components/src/components/ui/sonner.tsx`：import 增加 `toast`，导出块改为 `export { Toaster, toast }`，附注释说明实例共享与声明落位原因。`src/index.ts` 的既有 `export * from "./components/ui/sonner"` 拾取该导出。
- 仓库先例：`chart.tsx` 内 re-export `RechartsPrimitive as Recharts`，声明落在 `types/components/ui/chart.d.ts` 归入 Chart 家族；同样地 toast 现归入 Sonner 家族，与 Sonner.md 的 Exports 清单（Toaster + toast）一致。

**迁移后验证（全部重跑，本地 Node 22.22.1）**：
- `pnpm --filter @exre/exui build` 退出 0；`types/index.d.ts` 不再含根级 toast 声明；`types/components/ui/sonner.d.ts` 含 `import { toast, type ToasterProps } from "../../vendor/sonner/dist/index.mts"` 与 `export { Toaster, toast };`。
- TypeScript checker 直接验证公开类型入口：`toast` 与 `Toaster` 均为 `types/index.d.ts` 的导出符号（经 `export * from "./components/ui/sonner"` 链可达）。
- `pnpm typecheck` 退出 0；`pnpm lint` 退出 0，17 条警告（原 16 + `sonner.tsx:60` 混合导出的同模式 `react(only-export-components)`，与 chart.tsx / theme-provider.tsx 先例一致），零错误。
- T1 隔离打包消费端驱动全量重跑通过：dist 导出列表含 Toaster/toast/useTheme；strict tsc 探针（`import { toast, Toaster }` + `toast.success/error/dismiss`）exit 0；Chromium 正例（包 Toaster 弹出 success/error、按 id dismiss）与负例（自装 sonner 仍不显示）全部保持。驱动中"types/index.d.ts 须含 toast 字样"的过时断言已更新为检查 `types/components/ui/sonner.d.ts`（声明的新落位）。
- T2 驱动全量重跑通过：四场景（Provider 跟随 / 显式覆盖 / 无 Provider 回退 / useTheme 契约）全部保持。

**结论**：公开 API 集合、运行时行为、实例隔离特性均不变；唯一变化是 toast 的类型声明落位（root → sonner.d.ts），恰好使其进入 updater 的 Sonner 家族分类，解除文档阶段阻塞。

**§9 补充（同日稍后）——第二个同模式根因与修复**：doc-maintainer 重跑 `--write` 仍失败，诊断出 §9 原先只归因了两个叠加根因之一。第二个根因：T2 为收窄 `useOptionalTheme` 把 `src/index.ts` 的 theme-provider 行从 `export *` 改为具名 `export { ThemeProvider, useTheme }`，具名 re-export 使编译器在 `types/index.d.ts` 生成 export-specifier 声明；updater `loadComponentInventory` 的声明并集（targetSymbol + exportedSymbol 的声明）把它们纳入，而 `classifyDeclaration` 不批准 `types/index.d.ts` → `ThemeProvider`/`useTheme` 失败（我用独立探针复现：两符号的声明集均为 `[types/components/theme-provider.d.ts（批准）, types/index.d.ts（无组）]`；toast/Toaster 已清洁）。

修复（方案 A，`skills/exui-usage/scripts/update.mjs`，react-fe-dev 所有权，doc-maintainer 推荐、team-lead 此前"批准组模型是保护性设计"的裁定实质保持）：`classifyDeclaration` 对 `types/index.d.ts` 返回可过滤类别 `{category: "root"}`（注释说明：root specifier 是 re-export 管道而非符号真实声明，与 vendored 同样在 `loadComponentInventory` 过滤）；**守卫强度不降**——某符号若只有 root specifier（及 vendored）声明仍会以 "no declaration in an approved group" 失败（即原 toast 根级放置形态在修复后依然会被拒绝）。自测新增四条 classifyDeclaration 钉扎断言（root / vendored / theme-provider / ui-Sonner）。

验证：`update.mjs --self-test` exit 0；`update.mjs --write` exit 0（"generated references updated"）；`update.mjs --check` exit 0（"generated references are current"）。生成清单确认：`### [Sonner](../components/Sonner.md)` 下含 `toast — value` 与 `Toaster — value`；`## Theme provider` 下含 `ThemeProvider — value` 与 `useTheme — value`；`useOptionalTheme` 在全清单零出现（未泄漏为公共 API）。