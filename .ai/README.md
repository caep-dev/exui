# ExUI 仓库知识库

最后更新：2026-10-05

本目录记录 ExUI 仓库中**不能直接从源码读出来**的知识：系统边界与依赖方向、已被接受的技术决策及其理由、以及只有在真实运行或 CI 中才会暴露的约束。已落地行为以源码和运行证据为准；已批准但尚未实施的设计只放在标明“待实现”的决策记录中，不能当作当前行为。这些结论来自仓库证据或已批准设计，不包含未被接受的推测。

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
| `decisions/<模块>/` | 为什么这样选：背景、备选方案、理由、代价、重新审视条件；待实现决策须标明状态 | 该选择产生的结构本身 |
| `knowledge/<模块>/` | 读源码看不出来的行为：失败模式、运行约束、集成陷阱 | 签名、字段清单、命令清单等可直接读到的内容 |

决策记录引用格式为 `[[<模块>/<NN>-<kebab-title>]]`，不使用裸编号。编号在模块内从 `01` 开始，模块内不复用。

## 主要证据来源

表单模块：当前结构见 [`architectures/components/forms.md`](architectures/components/forms.md)，异步任务与消费约束见 [`knowledge/components/forms-lifecycle.md`](knowledge/components/forms-lifecycle.md)；ExItem 展示边界的决策见 [[components/07-ex-item-presentation-boundary]]。消费 API 用法继续由 `skills/exui-usage/references/components/Form.md` 维护；本目录不复制完整签名。

全局消息模块：宿主和状态边界见 [`architectures/components/ex-message.md`](architectures/components/ex-message.md)，订阅时序与句柄约束见 [`knowledge/components/ex-message-lifecycle.md`](knowledge/components/ex-message-lifecycle.md)，共享宿主的取舍见 [[components/06-single-ex-message-host]]。

图表外部配置的 SSR 与 CSS 边界见 [`knowledge/components/chart-style-inputs.md`](knowledge/components/chart-style-inputs.md)；源码监听中生成 CSS 的循环风险见 [`knowledge/release/watch-rebuilds.md`](knowledge/release/watch-rebuilds.md)。

- 工作区与构建：`package.json`、`pnpm-workspace.yaml`、`tsconfig.json`、各包的 `package.json` 与 `vite.config.ts`
- 生成与校验：`packages/tokens/scripts/`（`generate-css.mjs`、`verify-cjs.mjs`、`validate-tokens.mjs`、`token-length-policy.mjs`、`color-contrast-policy.mjs`、`foundation-reference-policy.mjs`、`glass-policy.mjs`）、`scripts/package-contract.mjs`、`scripts/verify-packages.mjs`、`scripts/verify-react-browser.mjs`、`scripts/verify-form-browser.mjs`、`scripts/form-consumer-fixture.mjs`
- 交付与发布：`.github/workflows/ci.yml`、`release.yml`、`tag-npm.yml`、`.release-bootstrap.yaml`、`scripts/release-bootstrap/`、`.changeset/config.json`
- 测试与视觉基线：`TESTING.md`、`packages/showcase/vitest.config.ts`、`packages/showcase/src/showcase/*.vrt.test.tsx` 与其 `__screenshots__/` 基线
- 设计依据：`.notes/archive/`、`.notes/rem-sizing/` 与 `.notes/glass-effects/` 下已归档或已被实现印证的设计文档
