# 独立最终验证

结论：PASSED。环境：Windows、Node.js 24.21.0、pnpm 11.9.0、Playwright Chromium。

独立 Test Engineer 对冻结候选执行了最新 `TESTING.md` 的全部门禁。15 个修复及文档文件的 SHA256 清单在验证前后相同，聚合值为 `A02FFE3B90EC2B39830713D2BFFC6D5F18E2D142393CBDC156C3FAAABFB9CD0F`。本文件及第二轮审查结论在门禁完成后记录，不改动该候选的代码、测试或配置。

| 命令 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS，退出码 0 |
| `pnpm --filter @exre/exui-showcase exec playwright install chromium` | PASS，退出码 0 |
| `pnpm release:verify` | PASS，退出码 0 |
| `pnpm test:release` | PASS，18/18 |
| `pnpm tokens:check` | PASS，55/55 行为测试及生成校验 |
| `pnpm typecheck` | PASS，退出码 0 |
| `pnpm lint` | PASS，退出码 0 |
| `pnpm build` | PASS，退出码 0 |
| `pnpm test:regressions` | PASS，2/2 |
| `node skills/exui-usage/scripts/update.mjs --self-test` | PASS，退出码 0 |
| `node skills/exui-usage/scripts/update.mjs --check` | PASS，退出码 0 |
| `node skills/exui-usage/scripts/verify-examples.mjs` | PASS，19 个示例 |
| `pnpm test:visual` | PASS，32 文件、344 用例 |
| `pnpm verify:pack` | PASS，独立安装、严格类型、生产构建、SSR、Chromium，以及 Zod 3.25.28 / 4.6.5 消费者 |
| `git diff --check` | PASS，退出码 0 |

完整日志由独立验证成员保存在系统临时目录，主 Agent 已读取各阶段日志及打包门禁终态。输出仍包含组件导出、包体积、菜单定位及 Node 子进程相关警告；它们没有使门禁失败。本地验证不代表远端 CI、npm 发布或下游应用验收。
