# ExUI 仓库知识库

最后更新：2026-09-18

本目录记录 ExUI 仓库中**不能直接从源码读出来**的知识：系统边界与依赖方向、已被接受的技术决策及其理由、以及只有在真实运行或 CI 中才会暴露的约束。这些结论全部来自仓库证据（代码、配置、CI、变更记录与已归档的设计文档），不包含推测。

普通的使用说明、安装步骤和入门指引不在这里：React 消费者看 `packages/components/README.md`，框架中立消费者看 [`skills/exui-usage/SKILL.md`](../skills/exui-usage/SKILL.md)，测试与提交流程看 `TESTING.md`、`CONTRIBUTING.md`。

## 模块划分

模块名是固定集合，目录按模块创建，只有写出第一篇文档时才建目录。

| 模块 | 覆盖范围 |
| --- | --- |
| `tokens` | `packages/tokens`：私有工作区 `@exre/exui-tokens`，框架中立的 Token 源、生成器与校验 |
| `components` | `packages/components`：唯一公开发布包 `@exre/exui`，React 19、shadcn/ui 源码、公开入口与子路径 |
| `showcase` | `packages/showcase`：私有 Vite 应用 `@exre/exui-showcase`，只通过公开入口消费组件库，承载视觉测试 |
| `release` | 仓库级交付：`scripts/`、`scripts/release-bootstrap/`、`.github/workflows/`、`.release-bootstrap.yaml`、`.changeset/` |

跨模块的事实写在本文件所在的 `architectures/overview.md`，不在各模块中重复。

## 目录结构

```text
.ai/
├── README.md              本文件：导航、模块划分、证据来源
├── CONTEXT.md             领域语言（规范术语与应避免的说法）
├── architectures/         结构：边界、职责、接口、流程
│   ├── overview.md        跨模块总览
│   └── <模块>/
├── decisions/             原因：已接受的决策及其理由
│   ├── README.md          决策索引
│   └── <模块>/<NN>-<kebab-title>.md
└── knowledge/             非显然行为：失败模式与运行约束
    └── <模块>/
```

## 文档分工

同一件事实只写在一个地方，其余位置用链接指向它。

| 位置 | 承载 | 不承载 |
| --- | --- | --- |
| `CONTEXT.md` | 领域术语的定义与应避免的同义词 | 实现选择、API 形状、字段清单、模块名 |
| `architectures/<模块>/` | 组件边界、依赖方向、请求与控制流、扩展点 | 选择背后的理由、失败模式 |
| `decisions/<模块>/` | 为什么这样选：背景、备选方案、理由、代价、重新审视条件 | 该选择产生的结构本身 |
| `knowledge/<模块>/` | 读源码看不出来的行为：失败模式、运行约束、集成陷阱 | 签名、字段清单、命令清单等可直接读到的内容 |

决策记录引用格式为 `[[<模块>/<NN>-<kebab-title>]]`，不使用裸编号。编号在模块内从 `01` 开始，模块内不复用。

## 主要证据来源

- 工作区与构建：`package.json`、`pnpm-workspace.yaml`、`tsconfig.json`、各包的 `package.json` 与 `vite.config.ts`
- 生成与校验：`packages/tokens/scripts/`（`generate-css.mjs`、`verify-cjs.mjs`、`validate-tokens.mjs`、`token-length-policy.mjs`、`color-contrast-policy.mjs`）、`scripts/package-contract.mjs`、`scripts/verify-packages.mjs`、`scripts/verify-react-browser.mjs`
- 交付与发布：`.github/workflows/ci.yml`、`release.yml`、`tag-npm.yml`、`.release-bootstrap.yaml`、`scripts/release-bootstrap/`、`.changeset/config.json`
- 测试与视觉基线：`TESTING.md`、`packages/showcase/vitest.config.ts`、`packages/showcase/src/showcase/*.vrt.test.tsx` 与其 `__screenshots__/` 基线
- 设计依据：`.notes/archive/` 与 `.notes/rem-sizing/` 下已归档且被实现印证的设计文档
