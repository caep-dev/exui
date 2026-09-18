# 跨模块总览

最后更新：2026-09-18

## 仓库形态

仓库是一个私有 pnpm workspace，根目录本身是私有的编排层，永不发布。成员只有三个，各自承担一种角色：

| 成员 | 包名 | 可见性 | 角色 |
| --- | --- | --- | --- |
| `packages/tokens` | `@exre/exui-tokens` | 私有 | Token 源、生成器与校验的构建位置 |
| `packages/components` | `@exre/exui` | 公开 | 唯一的发布包，拥有组件根、`style.css` 与 tokens 子路径 |
| `packages/showcase` | `@exre/exui-showcase` | 私有 | 只通过公开入口消费组件库的 Vite 应用 |

私有成员永不参与 Changesets 版本计算与发布；发布契约在 `scripts/release-bootstrap/plan.mjs` 与 `scripts/package-contract.mjs` 中双重拒绝私有包与内部包名泄漏。理由见 [[release/01-single-public-package]]。

## 依赖方向

依赖是单向的，不允许反向引用：

```text
packages/tokens  (私有)
      │  构建期：产物被复制进公共包的 dist/tokens/
      ▼
packages/components  (@exre/exui，唯一公开包)
      │  仅公开入口
      ▼
packages/showcase  (私有；只 import @exre/exui 的公开入口)
```

- `tokens` 不依赖任何人，其 JavaScript 入口无 React、DOM、存储、网络或全局 CSS 副作用。
- `components` 对 tokens 只有**开发期工作区依赖**（`workspace:*`，位于 `devDependencies`）。打包后的产物不得引用内部包名，由 `assertPublishableManifest` 的 production 依赖字段检查保证。
- `showcase` 依赖 `@exre/exui` 的 `workspace:*` 链接，但源码中只出现公开入口。

## 构建链

根 `package.json` 的 `build` 脚本按依赖顺序串联三个成员：

```text
tokens: build:js + build:cjs → generate-css → copy-css → validate
   └─► components: tsc 双层类型检查 → vite build → copy-tokens-dist
           → build:types（tsc + tsc-alias + CSS 声明修复 + docs 主题放置 + 声明整合）
           → generate-notices → check-dist
           └─► showcase: tsc 类型检查 → vite build
```

两个跨成员的产物移动点：

1. `packages/tokens/src/index.css` 不参与；`packages/components/src/index.css` 通过 `@import "@exre/exui-tokens/style.css"` 与 `font.css` 在**构建期**把 Token 变量与字体并进组件样式表，最终产出 `dist/index.css`。
2. `packages/components/scripts/copy-tokens-dist.mjs` 在 Vite 清空 `dist/` **之后**把 tokens 的完整产物（ESM/CJS JavaScript、类型、`style.css`、`font.css` 及其声明）复制到 `dist/tokens/`。顺序不可交换，否则复制的产物会被清掉。

`typecheck` 与 `lint` 同样按成员逐个展开，`typecheck` 额外包含 `components` 的 `build:types`，因此声明整合阶段的失败会在类型检查阶段暴露。

## 模块文档

- Token 生成与消费结构：`architectures/tokens/token-pipeline.md`
- 公共包的入口与构建边界：`architectures/components/public-surface.md`
- Showcase 的消费模型与视觉测试：`architectures/showcase/consumption.md`
- CI、发布与打包消费者门禁：`architectures/release/delivery-pipelines.md`

## 交付如何约束整条链

`release` 模块不拥有独立产物，它是对上面三层的门禁集合：

- **CI**（`.github/workflows/ci.yml`）在 Windows 上按固定顺序跑 tokens 校验 → 类型 → lint → 构建 → 技能示例 → 视觉测试 → 打包消费者 → 发布配置校验 → 发布自动化测试，最后由 `ci-gate` 聚合。
- **打包消费者门禁**在 workspace 之外安装真实 tarball，是唯一能证明"消费者真的装得上"的环节；workspace 内的 `pnpm` 解析会掩盖缺失依赖。理由见 [[release/03-packed-consumer-gates]]。
- **发布流水线**由成功的主分支 CI 触发，串行完成版本提交、注解标签与 npm OIDC 发布；标签推送只发布被标记的那个包。理由见 [[release/02-tag-driven-oidc-release]]。
