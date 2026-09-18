# 合并即发布：标签驱动的 OIDC 发布流水线

最后更新：2026-09-18

状态：已接受
模块：release
日期：2026-09-09
来源：`.notes/archive/automated-npm-release/specs/2026-08-31-automated-npm-release-design.md`、`.release-bootstrap.yaml`

背景：已确认的要求是"合格的主分支合并之后自动发版，不再需要另一次人工合并"；发布不得依赖长期 npm 写令牌；中断或部分成功的发布必须能续跑，而不能产生第二次版本提升。仓库是私有组织仓库，历史上 GitHub 计划不支持分支保护，Actions 默认权限只读。npm 只能为已存在的包配置 Trusted Publisher，因此首次发布无法由该流水线完成。

决策：不采用官方的 Changesets Version PR 流程，也不用标签驱动或手动触发的发布入口，而是使用自定义的即时发布工作流。主分支 CI 成功事件触发发布作业，在**被验证的那个提交**上计算版本计划并写回版本变更，再创建注解标签；标签推送触发独立的 npm 钩子，用 npm OIDC 与 provenance 只发布被标记的包。整个过程串行、幂等且可恢复：计划有 `no-op` / `version` / `recover` 三态，推送前后都要求 `origin/main` 未前进，发布钩子对已存在的版本跳过。仓库变量 `RELEASE_AUTOMATION_ENABLED` 是总开关。

理由：官方 Version PR 流程最安全，但要求一次额外的人工合并，不满足已确认的要求；标签驱动或手动触发同样不满足。既然必须让机器人绕过常规评审路径提交，就用一组更强的约束来补偿：只读默认权限加按需申请的窄范围令牌、基于受验证提交的工作、写回前后两次比较主分支、串行并发组、以及从已提交的版本差异中恢复而不是重新计算。OIDC 消除了长期写令牌，也避免了令牌泄露直接导致供应链失守。

影响：发布能力依赖仓库外部配置（Release App 凭据、受保护引用、npm Trusted Publisher、仓库变量），在这些配置完成前流水线只会运行校验而不发布。从开发者机器或自托管 runner 发布被明确排除。版本变更只提交计划中列出的路径，空提交被视为无效差异而中止。标签必须逐个创建且必须是注解标签；已存在的同名标签只有在指向同一提交时才被当作可恢复。首次发布仍需一次带双因素认证的人工引导。

重新审视条件：GitHub 提供既能满足"合并即发布"又同样安全的托管流程时；或 npm 的 OIDC / Trusted Publisher 配置方式变化使人工引导不再需要时。

证据：`.github/workflows/release.yml` 的触发条件、`vars.RELEASE_AUTOMATION_ENABLED == 'true'` 判断、`EXPECTED_MAIN` 与两次 `MAIN_ADVANCED` 比较、`changeset status --output` 与 `plan.mjs` 的调用、`version.mjs` 的 `--verify` 复核、只 `git add` 版本结果中列出的路径、以及 `mode == no-op` 时的显式 no-op 报告；`scripts/release-bootstrap/plan.mjs` 的三态判定与私有包拒绝；`scripts/release-bootstrap/version.mjs`、`tags.mjs` 的注解标签创建与 `TAG_CONFLICT` / `TAG_UNANNOTATED` 中止；`scripts/release-bootstrap/hook-context.mjs` 对标签、受信任提交主题与主分支祖先的校验；`.github/workflows/tag-npm.yml` 的 `id-token: write`、`environment: npm-release`、全局安装 `npm@11.9.0` 与 `release:verify` + `build` + `verify:pack` 前置步骤；`scripts/release-bootstrap/npm.mjs` 的 `--provenance`、注册表存在即跳过、以及要求上下文必须是 GitHub Actions 且仓库为 `caep-dev/exui` 的守卫；`.release-bootstrap.yaml` 的 `tagStrategy: adaptive`、`auth: oidc`、`provenance: true`；`TESTING.md` 的 Release automation 段（测试使用临时本地 Git 仓库并注入注册表边界，从不真实发布）；设计文档中列出的 Non-goals。
