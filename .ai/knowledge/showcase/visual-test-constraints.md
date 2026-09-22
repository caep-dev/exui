# 视觉测试的运行前提与失败模式

最后更新：2026-09-21

## 必须先构建，否则测的是旧产物

Showcase 只导入公开入口，解析到的是 `packages/components/dist/` 与 `dist/tokens/`。`pnpm test:visual` 本身不构建，所以：

- 修改了 Token 或组件源码而只跑 `pnpm test:visual`，得到的是上一次构建的结果。测试可能通过，而通过的并不是改动。
- 在干净检出上直接跑视觉测试会因为找不到产物而失败。

正确顺序是先 `pnpm build`（或至少构建 tokens 与 components），再跑视觉测试。仓库为此专门调整过 CI 步骤顺序，把构建前置。

## 门禁实际上只在 Windows 上有效

截图基线的查找路径按**浏览器与平台**区分，仓库里提交的基线全部是 `*-chromium-win32.png`（见 [[showcase/02-windows-pinned-visual-baselines]]）。在其他平台上运行时不会找到匹配的参考图，因此：

- 本地在 macOS 或 Linux 上运行视觉测试，结果不能当作通过/失败的判据，只能当作"渲染大致没崩"的信号。
- 本地新采集的基线不能直接提交：它属于另一个平台变体，会与 CI 使用的基线并存并造成两套参考。
- 判定渲染是否变更，应以 CI（Windows）的结果为准。

## 预期产物与失败产物

- 失败时的附件写入 `.vitest-attachments/`，该目录已被忽略，不会污染工作区。
- 测试文件间串行执行（`fileParallelism: false`），因为四个套件共用同一个浏览器实例。单个套件内部的用例也在共享一个挂载容器：`beforeEach` 会 `document.body.replaceChildren(container)` 并重建 root，所以用例之间不能依赖 DOM 残留。
- 断言前必须 `await document.fonts.ready`。字体尚未替换时文本几何与最终值不同，直接读取会得到偶发失败。
- 需要读浮层几何时不能只读一次：Radix 在 resize observer 里异步重排，根字号或布局变化后立刻读取可能拿到旧位置。`RemSizing.vrt.test.tsx` 用轮询到几何稳定（或达到尝试上限）的方式规避，跨根字号断言尤其依赖这一点。

## 截图比较带颜色容差，小幅改色不会变红

`toMatchScreenshot` 走 `@vitest/browser` 内置的 pixelmatch 比较器，默认 `threshold: 0.1`，`allowedMismatchedPixels` / `allowedMismatchedPixelRatio` 未配置时按 `0` 处理（见 `node_modules/@vitest/browser/dist/index.js` 里 `defaultOptions$1` 与 `pixelmatch()` 的实现）。判定标准是"单像素色差是否超过 YIQ 距离阈值"，不是逐字节比对：偏移落在阈值内的像素根本不计入不匹配像素数。

2026-09-21 实测：把 dark 主题的 `surface.modal` / `surface.menu` 从 `#181c25` 改成 `#1b1b1b`（通道变化 -3/+1/-10）并重建后跑 `pnpm test:visual`，12 文件 122 用例全绿，8 张受影响基线的 PNG 字节零变化——门禁既没失败，也没重写参考图。同一个比较器对版式、几何、字号和大幅颜色变化仍然有效，所以基线照旧无需为这类改动重抓。

**How to apply:** 纯色微调的验证证据不能取自"视觉测试通过"（跑 `-u` 同样不会写出新图）。要么直接断言解析后的计算值（`getComputedStyle` 探针读 `--exui-surface-*` 一类的变量并比较 RGB 通道），要么如实说明该改动没有图像级覆盖。

## 前置依赖

Playwright Chromium 不随 `pnpm install` 安装：

```bash
pnpm --filter @exre/exui-showcase exec playwright install chromium
```

该步骤同时是视觉测试与打包消费者浏览器门禁的前置条件；控制器复用 Showcase 锁定的 Playwright 版本，不由 `scripts/` 自己声明依赖。
