# 发布自动化的启用前提与不可逆点

最后更新：2026-09-18

## 仓库内的流水线不等于已启用的发布能力

`.github/workflows/release.yml` 存在且通过 `pnpm release:verify` 校验，但它的整个作业有一个显式开关：

```yaml
if: >-
  vars.RELEASE_AUTOMATION_ENABLED == 'true' &&
  github.event.workflow_run.event == 'push' && ...
```

也就是说，**在仓库变量 `RELEASE_AUTOMATION_ENABLED` 被设为 `true` 之前，主分支合并不会触发任何版本提交或标签**，流水线只会被跳过。同理，`.github/workflows/tag-npm.yml` 的发布步骤依赖 `npm-release` environment 与 OIDC 身份，这些都存在于 GitHub 与 npm 两侧而非仓库中。

因此有两条容易误判的结论：

- "CI 全绿 + 发布配置校验通过" **不证明发布可用**。`pnpm release:verify` 校验的是声明与文件的一致性，`pnpm test:release` 校验的是脚本逻辑，两者都在本地/CI 中运行，都不接触真实注册表。
- 首次发布无法由流水线完成。npm 只能为已存在的包配置 Trusted Publisher，所以初始版本必须人工发布一次，之后自动化才有意义。

## 无法在本地发布

`scripts/release-bootstrap/npm.mjs` 在入口处就要求运行上下文必须是 GitHub Actions 且仓库为 `caep-dev/exui`，否则直接报 `PUBLICATION_CONTEXT_REQUIRED`。这是刻意的：发布只能经由标签推送触发的工作流发生，绕过它的尝试会立即失败而不是悄悄发布。

另外 `tag-npm.yml` 会全局安装 `npm@11.9.0` 再发布，因为 OIDC 与 provenance 需要该版本以上；固定版本而不是用 runner 自带 npm。

## 标签是不可静默覆盖的

标签阶段（`scripts/release-bootstrap/tags.mjs`）对已存在的同名标签只有两种处理：

- 本地或远端存在同名**注解**标签且指向同一提交 → 视为可恢复状态，继续。
- 标签不存在 → 创建注解标签并推送。
- 其余情况（标签存在但指向别的提交、或标签不是注解标签）→ 报 `TAG_CONFLICT` / `TAG_UNANNOTATED` 并中止。

因此**打错位置的发布标签无法通过重跑流水线修好**，必须先人工处理标签本身。这也是"中断的发布要能续跑"与"标签不能被默默移动"两个要求的折中：恢复路径只覆盖幂等情形。

## 发布提交的信任条件

发布钩子（`hook-context.mjs`）与标签创建都要求目标提交是一次受信任的版本提交——提交主题必须正好是 `chore(release): version packages`，提交必须是 `origin/main` 的祖先，且该标签必须出现在这次版本差异声明的发布列表中。改动这个提交主题会使发布无法通过校验。
