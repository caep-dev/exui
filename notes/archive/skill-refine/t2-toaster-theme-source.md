# T2 Toaster 主题来源 — 验收报告

日期：2026-09-11
负责人：react-fe-dev
基线：T0/T1 报告所述 `fa91738` 上缺陷 (b) 成立、缺陷 (a) 已修复
目标：消除缺陷 (b) — 让打包后的 `<Toaster />` 主题遵循「显式 `theme` prop > ExUI `ThemeProvider` > `system`」三段优先级；移除 `next-themes` 依赖；保持公开 `useTheme()` 在 Provider 外抛错的契约

## 1. 改动（最小集合）

### 1.1 `packages/components/src/components/theme-provider.tsx`

新增一个**未公开**的内部 helper（沿用现有 `useTheme` 之后，添加于文件末尾）：

```ts
// Internal helper for package components that should read the current theme
// without forcing the consumer to mount <ThemeProvider> (e.g. the bundled
// <Toaster />). Returns `undefined` when no provider is present so callers
// can choose their own fallback. Not re-exported from the package root —
// not part of the public API surface.
export function useOptionalTheme(): Theme | undefined {
  const context = React.useContext(ThemeProviderContext)
  return context?.theme
}
```

公开 `useTheme()` 函数本身一行未改 — Provider 外仍抛 `useTheme must be used within a ThemeProvider`。

### 1.2 `packages/components/src/components/ui/sonner.tsx`

- 移除 `import { useTheme } from "next-themes"`。
- 改为 `import { useOptionalTheme } from "../theme-provider"`。
- `Toaster` 主题解析从「`const { theme = "system" } = useTheme()`」改为：

```ts
const Toaster = ({ theme: explicitTheme, ...props }: ToasterProps) => {
  const providerTheme = useOptionalTheme()
  const resolvedTheme = explicitTheme ?? providerTheme ?? "system"
  return <Sonner theme={resolvedTheme as ToasterProps["theme"]} ... />
}
```

### 1.3 `packages/components/src/index.ts`

将 `export * from "./components/theme-provider"` 收窄为 `export { ThemeProvider, useTheme } from "./components/theme-provider"`。

**为什么必须收窄**：原来的 `export *` 会把同文件新加的 `useOptionalTheme` 也顺手导出到包根，破坏「不为此扩大根导出」的约束。这同时与 AGENTS.md 中"Prefer named exports for public components"的风格保持一致。

### 1.4 `packages/components/package.json`

`devDependencies` 中移除 `"next-themes": "^0.4.6"`。生产依赖（`dependencies` 仅 `@fontsource-variable/outfit`）未动；`exports` / `files` / `peerDependencies` 未动。

### 1.5 锁文件

`pnpm install` 自动从 `node_modules/.pnpm/lock.yaml` 移除 next-themes 条目；无其他无关更新。

## 2. 验证（命令 + 退出状态）

```
pnpm --filter @exre/exui install               # 移除 next-themes，退出 0
pnpm --filter @exre/exui build                 # 退出 0
  → vite build → 4101 modules transformed（比 T1 后的 4102 少 1）
  → dist/exui.js 1,728.58 kB（比 T1 后少 1.23 kB，与移除的 next-themes 内联代码一致）
  → bundled-modules.json 20.82 kB（"Generated third-party notices for 117 packages"，比 T1 后 118 少 1）
  → build:types → 65 包声明 + 76 vendored

pnpm typecheck (workspace root)                # exit 0
pnpm lint                                     # exit 0（15 → 16 条警告；新增一条来自 theme-provider.tsx
                                                中 useOptionalTheme 的 react(only-export-components)，
                                                与 message-scroller.tsx / sidebar.tsx 同模式、未禁用，
                                                一致项目风格；零错误）

# Tarball 静态检查
pnpm pack --json --pack-destination <root>     # exit 0 → exre-exui-0.1.0.tgz
tar -xOf exre-exui-0.1.0.tgz package/dist/bundled-modules.json | grep -c next-themes
                                              # 0（next-themes 不再内联）
tar -xOf exre-exui-0.1.0.tgz package/types/index.d.ts | grep -c next-themes
                                              # 0（next-themes 类型未引用）
ls packages/components/types/vendor/next-themes # 目录不存在（vendor 已清空）
```

## 3. 浏览器行为验证

驱动：`/tmp/exui-t2-umsinf/run-t2.mjs`（仓库外临时目录）。四组场景每组都通过实时 DOM 断言（避免 React 间歇文本带来的滞后），所有断言通过：

```
scenario A step 1: provider=dark + OS=light -> toast dark (provider follows)
scenario A step 2: switch to provider=light -> toast light (no remount)
scenario A step 3: provider=system + OS dark -> toast dark (live OS tracking)
scenario A step 4: provider=system + OS light -> toast light (live OS tracking)
scenario B step 1: provider=dark + explicit theme=light -> toast light
scenario B step 2: provider switched to light -> toast still light (explicit wins)
scenario B step 3: provider=dark again -> toast still light
scenario C step 1: no provider + OS=light -> toast light (no throw, system fallback)
scenario C step 2: no provider + OS=dark -> toast dark (matchMedia tracks OS)
scenario D: public useTheme() outside provider still throws — contract preserved

T2 verification finished successfully
```

### 3.1 场景 A — Provider 切换跟随

| 步骤 | ExUI Provider | OS colorScheme | `<html>` class | `ol[data-sonner-theme]` |
| --- | --- | --- | --- | --- |
| 1 | `dark` | `light` | `dark` | **`dark`** |
| 2 | `light` | `light` | *(无)* | **`light`** |
| 3 | `system` | `dark` (emulate) | `dark` | **`dark`** |
| 4 | `system` | `light` (emulate) | *(无)* | **`light`** |

每一格都断言 `html.classList` 与 `ol[data-sonner-theme]` 在每次 `setTheme()` 或 `emulateMedia` 后到达一致值，且 Toaster 无重挂载。截图：`assets/t2/t2-a-provider-dark-toast-dark.png`（步骤 1，整个应用 + 通知都暗色；与 T0 截图 `fixture-b-provider-dark-toast-light.png` 形成直接对照 — 缺陷 (b) 已修）。

### 3.2 场景 B — 显式 `theme` 优先

`<Toaster theme="light" />` 与 `<ThemeProvider defaultTheme="dark">` 同时存在：

| 步骤 | Provider | 显式 theme | `ol[data-sonner-theme]` |
| --- | --- | --- | --- |
| 1 | `dark` | `light` | **`light`** |
| 2 | `light`（切了） | `light` | **`light`** |
| 3 | `dark`（再切回） | `light` | **`light`** |

显式 theme 在 Provider 反复切换过程中始终胜出。截图：`assets/t2/t2-b-explicit-light-overrides-provider-dark.png`。

注意：本场景在打包态下 toast 的可见底色仍以 ExUI tokens 的 `--popover`（被 Toaster 自身的 `style={{"--normal-bg":"var(--popover)"}}` 内联覆盖）为主，因此视觉上颜色变化不那么明显；DOM 层 `data-sonner-theme` 属性才是判定对象 — sonner 自身的 close-button、description 颜色、`[data-invert]` 等 CSS 规则都基于这个属性。这是设计意图（保留 ExUI tokens 的 toast 底色），不是 bug。

### 3.3 场景 C — 无 Provider 回退 `system`

无 `<ThemeProvider>`、仅 `<Toaster duration={60000} />`：

| 步骤 | OS colorScheme | `html` class | `ol[data-sonner-theme]` | 抛错？ |
| --- | --- | --- | --- | --- |
| 1 | `light` | *(无)* | **`light`** | 无 |
| 2 | `dark` (emulate) | *(无)* | **`dark`** | 无 |

`htmlClass.trim()` 始终为空字符串，证明 Provider 不在的时候 `document.documentElement.className` 不会被错误地加上 `.light`/`.dark`。整页 `<p>` 无页面错误日志。截图：`assets/t2/t2-c-no-provider-os-dark.png`（无 provider 时整页保持 token 默认的浅底、通知跟随 OS 暗色）。

### 3.4 场景 D — 公开 `useTheme()` 在 Provider 外仍抛错

用一个 class 错误边界包裹一个**渲染时**直接调 `useTheme()` 的子组件（避免在 `useEffect` 内调用 hook 触发 React #321 "Rendered more hooks than during the previous render"）。捕获到 `error.message === "useTheme must be used within a ThemeProvider"` —— 与修改前完全相同，未放宽也未收紧。

### 3.5 类型签名

fixture 内 `probe-types.tsx`：

```tsx
import { Toaster, ThemeProvider, useTheme, toast } from "@exre/exui"
export function _Wrap() {
  return (
    <ThemeProvider>
      <Toaster theme="light" />
      <Toaster theme="dark" />
      <Toaster theme="system" />
    </ThemeProvider>
  )
}
const _ctx = useTheme
export const _use = _ctx
export const _t = toast
```

`tsc --strict --jsx react-jsx --module esnext --moduleResolution bundler` 退出 0。`ToasterProps["theme"]` 的真实签名直接走 sonner 的 vendor `.d.ts`（沿用 T1 的 build:types 产物），没有缩水门面。

## 4. 范围与依赖

- 没有改 `peerDependencies`：`react`/`react-dom` 仍是 `>=19.0.0 <20` 可选 peer。
- 没有改 `files`/`exports`。
- 没有改 `scripts/**`、`.github/**`、`TESTING.md`、`AGENTS.md`、其他组件、`tokens` 子路径、Showcase。
- 锁文件 diff：仅 `next-themes@0.4.6` 条目被移除，没有无关更新。

## 5. 遗留风险 / 留给 T6

1. **CI Node 24 vs 本地 Node 22**：本机 Node 22.22.1 通过全部断言；T6 阶段 test-engineer 在 Node 24 重跑同一套四个场景 + tsc 探针 + `pnpm verify:pack`。
2. **SSR 行为**：场景 A/B/C 都在 Chromium 客户端跑。ExUI 的 `ThemeProvider` 在 server render 期间读 `localStorage`（会抛或被 catch），公开 `useTheme()` 在 server-render 阶段调用即抛 — 这是**当前既有行为**，T2 未改。Skill 文档（T3）需要明确写出"`<Toaster />` 仅在 client 挂载；SSR 阶段不可用"作为当前边界。
3. **Pitch Black**：当前 `ThemeProvider` 主题 API 仍只接受 `"light" | "dark" | "system"`。Token CSS 的 `.pitch-black` 是 CSS 层 class，与 Provider 主题是两个独立维度 — T2 不动 Provider 主题 API 也不动 token CSS，文档明确写「不要 `setTheme("pitch-black")`」。
4. **lint 警告 +1**：来自 `theme-provider.tsx` 的 `useOptionalTheme`。这是 React fast-refresh 提示而非错误，与 `message-scroller.tsx`、`sidebar.tsx` 等同模式（未禁用）一致；后续如果要收敛，可以让所有这种文件统一加 `// oxlint-disable-next-line react/only-export-components`，但属于风格统一工作，不在 T2 范围。

## 6. 退出状态

**PASS**：缺陷 (b) 已修复；`next-themes` 已从 devDep、内联 dist、vendor types 三处清除；公开 `useTheme()` 契约保持；类型签名走 sonner vendor；四个验收场景全部通过；`pnpm typecheck` / `pnpm lint` / `pnpm build` 退出 0。

## 7. 改动与产物清单

- 修改：`packages/components/src/components/theme-provider.tsx`（新增 `useOptionalTheme`，+18 行）
- 修改：`packages/components/src/components/ui/sonner.tsx`（移除 next-themes、改主题解析，±10 行）
- 修改：`packages/components/src/index.ts`（`theme-provider` 的 re-export 收窄，±2 行 + 4 行注释）
- 修改：`packages/components/package.json`（移除 `next-themes` devDep，−1 行）
- 修改：`pnpm-lock.yaml`（自动同步 −1 条，无无关更新）
- 生成：`packages/components/dist/exui.js` 等所有 build 产物（由生成器产生，不手改）
- 新增：`notes/skill-refine/t2-toaster-theme-source.md`（本文件）
- 新增：`notes/skill-refine/assets/t2/t2-a-provider-dark-toast-dark.png`
- 新增：`notes/skill-refine/assets/t2/t2-b-explicit-light-overrides-provider-dark.png`
- 新增：`notes/skill-refine/assets/t2/t2-c-no-provider-os-dark.png`
- 未提交、未推送、未改 CI、未改其他组件。