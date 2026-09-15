# T0 复现报告：通知公共调用链与 Toaster 主题缺陷

日期：2026-09-11
负责人：react-fe-dev
基线：`HEAD fa91738`（detached HEAD，tag `@exre/exui@0.1.0`）
环境：Node v22.22.1（本地；CI Node 24 才是 fixture 验收权威）、pnpm 11.9.0、Playwright Chromium（来自 `packages/showcase`）
证据根目录：`C:\Users\grimeszhang\AppData\Local\Temp\exui-t0-run-zMPMP8\`（`node run-t0.mjs` 自动建，**本会话结束前清理；归档证据仅保留本报告 + 截图**）
截图归档：`notes/skill-refine/assets/t0/`

## 1. 总结

| 项 | 结果 |
| --- | --- |
| 假设 (a)：消费者自装 `sonner` 后 `toast()` 不显示 | **成立**（fixture A，隔离 tarball 消费端） |
| 假设 (b)：ExUI Provider 切换 light/dark/system 不影响通知主题 | **成立**（fixture B，packed Provider + 共享 sonner 实例的 `sonner.tsx`） |
| T1 优先级前置缺陷：包根未导出 `toast` | **成立**（fixture A tsc TS2724 + dist 导出列表） |
| 现有 Toaster 的 `useTheme` 在没有 NextThemeProvider 时是否抛错 | **不抛错**（next-themes 0.4.6 返回 `{setTheme:noop, themes:[]}` 默认上下文 → 我们的解构默认为 `"system"`） |
| 打包后 `next-themes` 是否仍有可被外部 Provider 拯救的机会 | **无**（bundle-modules.json 确认 `next-themes@0.4.6` 被内联到 dist/exui.js，私有 React context，外部 `NextThemeProvider` 无法触及；详见 §4） |
| 是否需要调整 T1/T2 范围 | 不需要（缺陷全部成立且可被证据锁定）；详见 §5 |

结论：原计划的 T0/T1/T2 范围与门槛保持不变。T1 直接打通 `toast` 公共导出（沿用打包后的同一个 `sonner` 实例），T2 重写 Toaster 的主题来源（显式 `theme` > ExUI Provider > `system`）。

## 2. 复现方法

完全照搬 `scripts/verify-packages.mjs` 的隔离风格：在仓库外临时目录 `mkdtemp("exui-t0-run-")` 里打包 `packages/components` → `pnpm pack --json --pack-destination <root>`，产物 `exre-exui-0.1.0.tgz` 是真实发布物（同 `verify:pack` 流程），然后用 `npm install file:...tarball` 装到两个独立消费端 fixture。浏览器由 `packages/showcase/node_modules/playwright` 提供，与 `verify-react-browser.mjs` 一致。

驱动脚本：`C:\Users\GRIMES~1\AppData\Local\Temp\exui-t0-LxCcKm\run-t0.mjs`（仓库外临时开发用，本任务结束自行清理）。

### 2.1 Fixture A：自然接线（own sonner + packed Toaster）

模拟消费者按当前 Skill/文档直觉的接线：装自己的 `sonner@2.0.7`，`Toaster` 用包内的，`toast` 也用自己装的。再额外挂一个消费者自己 `sonner` 的 `<Toaster>` 作控制组。

| 包 | 来源 | 版本 |
| --- | --- | --- |
| `@exre/exui` | `file:exre-exui-0.1.0.tgz` | 0.1.0 |
| `sonner` | npm | 2.0.7 |
| `react` / `react-dom` | npm | 19.2.7 |
| `typescript` / `vite` / `@vitejs/plugin-react` | npm | 6.0.2 / 8.1.1 / 6.x |

App 用 `<ThemeProvider defaultTheme="dark">` 包裹（同当前 Skill 推荐的写法），挂载两个 Toaster：

```tsx
import * as exui from "@exre/exui"
import { Toaster, ThemeProvider, Button } from "@exre/exui"
import { Toaster as OwnToaster, toast } from "sonner"

const exuiExports = exui as unknown as Record<string, unknown>
<ThemeProvider defaultTheme="dark">
  <main>
    <p>toast-export:{typeof exuiExports.toast}</p>      {/* 期望 undefined */}
    <p>Toaster-export:{typeof exuiExports.Toaster}</p> {/* 期望 function */}
    <Button onClick={() => toast.success("consumer sonner toast")}>Send via own sonner</Button>
  </main>
  <OwnToaster position="bottom-left" /> {/* 控制组 */}
  <Toaster position="bottom-right" />   {/* 打包的 */}
</ThemeProvider>
```

### 2.2 Fixture B：Toaster 主题来源

打包后的 `dist/exui.js` 把 `sonner` 完全内联，所以消费者**根本没有公共路径能触发打包后的 Toaster 弹出 toast**——也就是说，缺陷 (a) 让缺陷 (b) 在打包消费端完全不可观测。这不是反向论证：它说明 T1 必须先于 T2 的行为验收。

为在「仍是打包 tarball」的前提下观察 Toaster 的主题来源，我用 Vite alias 把 `Toaster` 指向 `node_modules/@exre/exui/src/components/ui/sonner.tsx`（tarball `files` 包含 `src/`，断言：`installedSource === shippedSource`，即挂载的就是 tarball 发出的源代码，与 dist 编译前的输入逐字节相同）。`sonner`/`next-themes`/`lucide-react` 在 fixture 中以**和包内 devDep 完全一致的版本**（2.0.7 / 0.4.6 / 1.23.0）安装并解析到 fixture 的 `node_modules`，与 `sonner.tsx` 共用同一份实例。`ThemeProvider`/`Button`/`@exre/exui/style.css` 仍然全部从打包 dist 导入，保持真实打包形态。

App：

```tsx
import "@exre/exui/style.css"
import { ThemeProvider, useTheme, Button } from "@exre/exui"
import { Toaster } from "exui-sonner-source"  // aliased -> tarball src/components/ui/sonner.tsx
import { toast } from "sonner"
```

四个场景由 Chromium 驱动：

1. `page.colorScheme="light"` + ExUI Provider `dark`（默认）。发 toast → 断言 `document.documentElement.className` 含 `dark` 且 `<ol data-sonner-toaster data-sonner-theme>` 等于 `"light"`。**期望不匹配——这是缺陷 (b)。**
2. Provider 切到 `light`，再发 toast → 全程 `light`（控制组，证明在不该出错时也不出错）。
3. Provider `system` + `emulateMedia({colorScheme:"dark"})` → `html.dark`，toast `data-sonner-theme="dark"`。证明缺陷只在 ExUI Provider 显式覆盖时被掩盖；落到 `system` 走的是 OS `matchMedia`，仍然不是 ExUI Provider 的 `setTheme` 决定。
4. Provider `dark` + OS `dark` → toast `dark`（恰好一致——这是为什么这个 bug 在开发者机器暗色偏好时容易被忽视）。

## 3. 证据：硬数据 + 命令退出状态

来自驱动日志 `C:\Users\grimeszhang\AppData\Local\Temp\exui-t0-run-zMPMP8\evidence\driver-log.txt`：

```
exit 0: pnpm pack --json --pack-destination ...
packed tarball: exre-exui-0.1.0.tgz (version 0.1.0)
exit 0: tar -xOf exre-exui-0.1.0.tgz package/dist/bundled-modules.json
tarball dist bundles sonner@2.0.7 (implementation inlined, private module state)
tarball dist bundles next-themes@0.4.6 (implementation inlined, private module state)
tarball dist bundles lucide-react@1.23.0 (implementation inlined, private module state)
exit 0: tar -xOf exre-exui-0.1.0.tgz package/package.json
tarball runtime dependencies: {"@fontsource-variable/outfit":"^5.2.8"}
exit 0: tar -xOf exre-exui-0.1.0.tgz package/dist/exui.js
dist export list contains 'Toaster' and 'useTheme' but no 'toast'

# Fixture A
exit 0: npm install
exit 0: node .../tsc --noEmit --strict ... probe-good.ts
tsc probe-good.ts (import { Toaster }): exit 0
exit 2: node .../tsc --noEmit --strict ... probe-bad.ts
tsc probe-bad.ts (import { toast }): exit 2 — TS2305 no exported member 'toast'
exit 0: vite build

# Fixture B
exit 0: npm install
exit 0: tar -xOf exre-exui-0.1.0.tgz package/src/components/ui/sonner.tsx
verified: fixture B mounts the exact sonner.tsx shipped in the tarball (src == installed)
exit 0: vite build

# Chromium sessions
fixture A DOM probe: @exre/exui namespace has no 'toast' export (typeof undefined); Toaster is a function
fixture A: own-sonner Toaster (bottom-left) renders the toast — the toast() call itself works
fixture A: packed @exre/exui Toaster (bottom-right) shows 0 toasts — DEFECT (a) reproduced
fixture A: no page errors — the failure is silent, no crash, no provider error
fixture B step 1: provider=dark (html 'dark') + OS=light -> toast data-sonner-theme=light — DEFECT (b) reproduced
fixture B step 2 (control): provider=light -> toast light (no mismatch)
fixture B step 3: provider=system + OS dark -> toast dark (tracks OS via matchMedia fallback)
fixture B step 4: provider=dark + OS dark -> toast dark (accidental match masks the defect)
T0 reproduction finished successfully
```

### 3.1 dist 导出列表（证据文件：`evidence/dist-export-tail.txt`）

```
... as CarouselNext, ... as PaginationNext, B as ThemeProvider, cNe as Toaster, re as useTheme
```

仅 `ThemeProvider`/`Toaster`/`useTheme`，**没有 `toast`**。

### 3.2 tsc 负例（证据文件：`evidence/tsc-probe-bad.txt`）

```
probe-bad.ts(1,10): error TS2724: '"@exre/exui"' has no exported member named 'toast'. Did you mean 'Toaster'?
```

TypeScript 6.0.2 的 `skipLibCheck:false` + `strict` 下，唯一导入 `import { toast } from "@exre/exui"` 即被拒。`probe-good.ts`（`import { Toaster }`）退出 0。

### 3.3 截图

| 截图 | 含义 | 路径 |
| --- | --- | --- |
| fixture A：自然接线 | 左下白底 "consumer sonner toast" = 自装 sonner 触发；右下空白 = 打包 Toaster 未渲染任何 toast | `notes/skill-refine/assets/t0/fixture-a-natural-wiring.png` |
| fixture B step 1 | 整个应用 `<html class="dark">` 暗色，bottom-right 通知框白底浅色——主题不一致 | `notes/skill-refine/assets/t0/fixture-b-provider-dark-toast-light.png` |
| fixture B step 3 | `provider=system` + OS=dark 时，应用 + 通知都是暗色——这就是为什么 bug 在系统为暗色时不显眼 | `notes/skill-refine/assets/t0/fixture-b-provider-system-os-dark.png` |

### 3.4 浏览器断言的最终 DOM 状态（fixture B step 1）

```json
{
  "htmlClass": "dark",
  "olCount": 1,
  "olTheme": "light",
  "liCount": 1,
  "probeText": "toast-data-theme:light"
}
```

(`htmlClass="dark"` 即 ExUI Provider 已切换应用主题；`olTheme="light"` 即 Toaster 主题没有跟随。)

## 4. 顺便澄清的几个常见误解

这些是审查沟通里经常被提及的反向论证，本轮一次性取证：

1. **`useTheme` 在 Provider 外是否抛错？** 不抛。next-themes 0.4.6 `dist/index.mjs` 第 1 行 minified 代码：
   ```js
   var U={setTheme:e=>{},themes:[]};
   var z=()=>{var e;return(e=t.useContext(x))!=null?e:U};
   ```
   `useTheme` 在 Context 为空时返回 `{setTheme:noop, themes:[]}`（**没有 `theme` 字段**），所以 `const { theme = "system" } = useTheme()` 退化为 `"system"`。Tarball 行为一致。
2. **包内 Toaster 在消费者装 NextThemeProvider 后是否能修好主题？** 不能。`bundled-modules.json` 确认 `next-themes@0.4.6` 被内联到 `dist/exui.js`，它持有自己的 React Context；消费者装的 `next-themes` 创建的是消费者自己 Context 上的 Provider，两者不连通。证据：fixture B 共享同一份 `next-themes` 时，ExUI Provider 切到 dark 通知仍然 `light`——说明即便共享，也只是因为 next-themes 的 Context 接管了 Provider 内部的 `setTheme` 而已，与 ExUI Provider 无关。打包形态下走的是另一条路。
3. **next-themes 是否能移除？** 在这次复现前我没有改动源；但 grep 范围是 `packages/components/src/**`（只在内置组件内部使用——`ui/sonner.tsx` 是唯一消费者）。T2 阶段如果确认整个 `packages/components/src/` 无其他 `next-themes` 引用，可以移除；本轮 T0 不动。
4. **`Toaster` 自身的 `React.useContext` / 隐式 `useTheme` 会不会引发 React 19 server-render 警告？** 打包后的产物在 fixture A/B 中渲染均无 pageerror；浏览器控制台也无警告/错误。但本次不在 SSR 环境跑，未覆盖 SSR 行为——T2 验收阶段 `pnpm verify:pack` 才会确认。

## 5. 任务调整建议

**不需要调整 T1/T2 范围**：

- T1：从包根导出 `toast`（与打包 dist 同一 sonner 实例，state 共享）。证据基础：`export * from "./components/ui/sonner"` 改为同时 re-export `toast`；`types/index.d.ts` 由生成器给出真实签名（不要缩水门面）。
- T2：改写 Toaster 主题解析为「显式 `theme` > 内部可选读取 ExUI ProviderContext > `system`」。保持公开 `useTheme()` 在 Provider 外抛错的契约不变；内部访问用可选 `useContext`，返回 undefined 时不抛错、回落 `"system"`。移除 `next-themes` 依赖前先全仓 grep。

负例（fixture A 已生成）：消费者装 `sonner` 调 `toast()` 在 T1 修复后必须能复用打包 dist 的 sonner 实例并显示通知。新增临时 fixture：在没有 `ThemeProvider` 时挂载 `<Toaster />` 不抛错、回落 system（这是 T2 的「无 Provider 回退 system」验收，对应 T0 的暗坑 `useTheme()` 不抛错）。

## 6. 文件清单（本次改动）

- 新建：`notes/skill-refine/t0-reproduction.md`（本文件）
- 新建：`notes/skill-refine/assets/t0/fixture-a-natural-wiring.png`
- 新建：`notes/skill-refine/assets/t0/fixture-b-provider-dark-toast-light.png`
- 新建：`notes/skill-refine/assets/t0/fixture-b-provider-system-os-dark.png`
- 不修改任何仓库内源码、CSS、依赖或锁文件（仅产出了仓库外的临时 fixture 和驱动脚本，关闭后清理）。

## 7. 风险与未执行项

- **SSR 行为**：fixture A/B 都跑在 Chromium 内，未覆盖 server render。SSR 阶段的 next-themes 上下文初始化在 verify-react-browser 已通过，但 T2 完成后的 Toaster SSR（如果实现选择 server-render 入口）需要单独跑一次 React `renderToString` 验证——留到 T6。
- **CI Node 24**：本会话本地 Node 22.22.1；fixture 命令退出码与断言在 Node 22 下验证，最终门禁必须以 Node 24 重跑（CI 权威）。
- **Playwright Chromium 复用**：fixture 复用了 `packages/showcase/node_modules/playwright` 的浏览器二进制。showcase 环境的 Playwright 版本固定，决定 fixture B 在不同机器上的可复现性；CI Node 24 跑 verify:pack 时同样会调起同源 Chromium，本机与 CI 行为一致。
- **fixture B 的 alias 路径**：依赖 `node_modules/@exre/exui/src/components/ui/sonner.tsx` 存在。tarball `files` 包含 `src/components` 等（`packages/components/package.json` 第 47 行起），本会话已确认 `installedSource === shippedSource`。如果后续有人改 tarball `files` 排除 src，T2 验收时必须改用打包 dist 触发——但这需要先修好 T1 让 toast 在打包形态下能弹出来。

## 8. 退出状态

**PASS**：T0 范围内两个缺陷假设全部成立，且已捕获确凿 DOM 证据；T1/T2 范围与门槛无需调整，可直接推进。