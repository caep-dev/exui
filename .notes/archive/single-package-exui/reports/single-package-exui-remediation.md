# Single-package ExUI 修复记录

## 结论

原报告的 P1 / P2 均确认，并按维护者批准的方案完成修复。独立只读复核未发现阻塞问题。本记录对应基于 `5b1f22af7538be38f9f42ac351da04b312950fc1` 的当前未提交工作区；没有提交、推送、发布或变更发布开关。

原始报告：[single-package-exui-review.md](single-package-exui-review.md)。原报告保留为修复前的历史证据。

## P1：Chart 共享 Recharts 实例

- 原因：消费者独立安装的 Recharts 与 ExUI 内置实例具有不同的图表 context。混用外部 BarChart 和 ExUI ChartTooltip / ChartLegend 会丢失后两者的内容；自动尺寸也可能因 context 分离失效。
- 实现：`packages/components/src/components/ui/chart.tsx:368` 将已有的 `RechartsPrimitive` 以 `Recharts` 导出，经现有组件根入口公开。图表 primitive 与 Chart 包装层使用同一内置实例，没有引入新的 npm 依赖或子路径。
- 已批准的兼容性调整：消费者需要迁移 primitive 的导入；不宣称独立安装的 Recharts 与 ExUI Chart 可以无修改地继续混用。

```tsx
import { Recharts, ChartContainer, ChartTooltip } from "@exre/exui"

const { BarChart, Bar } = Recharts
```

package README、技能 Chart 用法和生成的导出索引已更新。新增 `.changeset/shared-chart-primitives.md`，使用 minor bump，未执行版本更新。

### 回归测试

`scripts/verify-packages.mjs` 的隔离 React 消费者只安装实际 ExUI tarball、React / React DOM 和开发工具。fixture 经严格类型检查及 Vite production build 后，由 `scripts/verify-react-browser.mjs` 启动 Chromium，验证：

- 两条数据对应的柱形均出现；legend 显示配置中的 `Visitors`。
- 鼠标在两根柱形之间移动时，ExUI tooltip 分别显示 January / 10 和 February / 20；移开后隐藏。
- Dialog 通过 portal 挂载到应用根之外；输入并提交邮箱后显示正确值；Escape 关闭弹窗并恢复触发按钮焦点。
- 页面没有未捕获的运行时异常。

控制器复用 Showcase 已锁定的 Playwright，浏览器只加载隔离消费者的生产构建。Vite preview 在独立子进程运行，退出后才删除 fixture，避免 Windows 的原生 binding 文件占用。

**红绿证据：**新消费 fixture 在导出加入前报 TS2305（ExUI 没有 Recharts 导出）；实现加入后完整打包消费及浏览器验证通过。

**原始故障反向验证：**在仓库之外复制验证脚本，仅向 React fixture 安装 Recharts 3.8.0，并把 BarChart / Bar / XAxis 改为外部导入。首次使用自动尺寸时更早失败于柱形未出现；为隔离原报告症状，给图表设置固定 width / height，柱形断言通过后，浏览器在 `.recharts-legend-wrapper` 的 `Visitors` 断言处超时。该负向对照证明测试能捕获实际 context 混用，不只是检查导出是否存在。负向对照未修改仓库源码，临时验证目录已清理。

## P2：CommonJS 声明契约

- 原因：普通 Node `require()` 返回 any，不能验证 require 条件的类型入口。
- 实现：`scripts/verify-packages.mjs:296` 的 `.cts` fixture 改用 `import tokens = require("@exre/exui/tokens")`；通过 `tokens.ComponentRecipes` 检查公开类型，并以两条 `@ts-expect-error` 验证不存在的 recipe 和错误数字赋值必须报错。
- `--listFiles` 输出必须包含 `dist/tokens/cjs/index.d.ts`；保持 strict、skipLibCheck=false 和无 React 类型条件。
- 红绿证据：在旧 require 写法上先加入负向断言，出现两条 TS2578（未使用的 expect-error）；改为 typed import 后，实际 tarball 的 NodeNext 类型检查通过。

## 验证结果

核心验证使用 Node **24.20.0**、pnpm **11.9.0**、npm **11.12.1**，Windows Chromium。

| 检查 | 结果 |
| --- | --- |
| `pnpm build` | PASS |
| `pnpm tokens:check` | PASS，包括 ESM/CJS parity 与深冻结 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS，15 条已有 Fast Refresh 警告，无错误 |
| `pnpm verify:pack` | PASS，包括 npm/pnpm tokens 隔离、CJS 声明、CSS/字体、React 严格类型/构建/SSR、浏览器交互及清理；最终完整正向运行约 40 秒 |
| `pnpm test:visual` | PASS，12/12，Windows 双 viewport |
| `pnpm test:release` | PASS，17/17 |
| `pnpm release:verify` | PASS |
| updater `--write` / `--self-test` / `--check` | PASS，生成索引新增 Recharts，token 索引内容不变 |
| `git diff --check` | PASS |
| 独立只读代码复核 | 无阻塞 finding |
| 外部 Recharts 负向对照 | PASS：按预期捕获缺失 legend |
| 远端 CI / 真实 npm 发布 | NOT_EXECUTED |

Node 24 命令通过 `npm exec --yes --package=node@24 -- ...` 运行。技能 updater 的既有 Windows 实现假定 Corepack 紧邻当前 Node；npm 临时 Node 24 不满足该假定，因此该工具使用本机已安装的 Node 22.22.1 完成生成和自检，没有扩大本次范围修改 updater。核心 Node 24 包验证不依赖这项工具假定。

## 成本与剩余边界

- 新 namespace 暴露完整的内置 Recharts public API。组件 `dist/exui.js` 从约 1,313.44 kB 增加到 1,729.79 kB，gzip 从 324.97 kB 增加到 413.97 kB。Showcase 生产 JS 从 858.42 kB 增加到 1,152.43 kB，gzip 从 250.28 kB 增加到 323.36 kB；没有宣称未使用图表时该增量会被完全消除。本次未额外调整 bundler 优化策略。
- tokens 的 npm/pnpm 默认安装、独立 JS/CJS、声明及 CSS 隔离继续通过。统一图表入口不要求消费者额外安装组件实现包。
- 原先已有的 `notes/release-bootstrap-setup.md` 修改和其他未跟踪笔记未由本次修复改动；原始设计、RFC 和审查报告保留。
- 调试时第一次在主进程运行 Vite preview，断言通过但清理因 Windows EPERM 失败。后续已用子进程修复，完整正向验证退出码为 0。自动审批拒绝了单独清理旧残留目录的命令，仅返回 `blocked by policy`，未说明更具体原因；未绕过拒绝。仍保留：`C:\Users\grimeszhang\AppData\Local\Temp\exui-pack-check-VUqOXC`。这是调试临时文件残留，不是当前验证流程的失败。

以上属于本地实施与验证完成，不代表远端 CI、提交交付或发布验收。
