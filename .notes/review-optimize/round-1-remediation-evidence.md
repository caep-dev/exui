# 第 1 轮修复验证记录

审查基线：`5743c17080be1e1e71892402b8eb4b28ae0d6054`。本机使用 Node.js 24.21.0、pnpm 11.9.0，Windows Chromium。下面是本轮实际执行的命令和关键输出；审查报告由审查 Agent 独立维护。

## 修复前（RED）

- R1-01：对现有公共构建产物 `packages/components/dist/exui.js` 使用 `ChartContainer` + `renderToStaticMarkup`，外部 `color` 为 `</style><script>globalThis.chartExploit=1</script><style>`。实际输出：`RED: script element emitted`。随后运行 `node --test scripts/chart-style.test.mjs scripts/watch.test.mjs`，Chart 用例失败于 `SSR must not emit a script element`；实际 HTML 中有 `<script>window.__chartAttack = true</script>`。
- R1-02：Node.js 的 `relative("D:/Exre/exui/packages/tokens/src", "style.css")` 实际返回 `..\\..\\..\\style.css`，`ignored` 为 `false`。运行 `node --test scripts/watch.test.mjs` 时，隔离的 watcher 在 0.5 秒内把预期的一轮 `[tokens, components]` 追加为四轮以上，失败于 `generated style.css must not schedule another build`。

## 修复后（GREEN）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @exre/exui build` | PASS，组件构建、声明和产物检查通过 |
| `pnpm test:regressions` | PASS，2/2：公开 ChartContainer 的 SSR + Chromium 恶意配置、合法主题色、特殊 id/key；隔离真实 watcher 的生成 CSS 与一次源修改 |
| `pnpm --filter @exre/exui typecheck` | PASS |
| `pnpm --filter @exre/exui lint` | PASS，有 19 条既有 `react/only-export-components` 警告，修改文件无新警告 |
| `pnpm exec oxlint scripts` | PASS，无警告 |
| `pnpm release:verify` | PASS，`{"schemaVersion":1,"valid":true}` |
| `node skills/exui-usage/scripts/update.mjs --check` | PASS，生成引用保持最新；该命令按既有行为又构建了 Token 与组件 |
| `git diff --check` | PASS，只有本机 Git 的 LF 到 CRLF 提示，无空白错误 |

完整仓库门禁由独立 Validation Agent 执行。本文件记录的复现与 focused 检查不代替独立复查。
