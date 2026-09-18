# 只发布 @exre/exui 一个公共包

最后更新：2026-09-18

状态：已接受
模块：release
日期：2026-09-09
来源：`.notes/archive/single-package-exui/rfcs/single-package-exui-rfc.md`、`scripts/package-contract.mjs`

背景：仓库原本有两个发布候选：`@exre/exui`（React 组件）与 `@exre/exui-tokens`（框架中立 Token）。Token 的定位是不需要 React，而组件库的实现库都带必需的 React peer。在双包结构下，"只装 Token 就不装 React"只能靠安装期行为与 peer 语义间接保证，难以稳定验证；此外两个包还会带来版本与兼容矩阵的额外负担。

决策：只发布 `@exre/exui`。Token 产物在构建期被复制进公共包的 `dist/tokens/`，通过 `@exre/exui/tokens`、`@exre/exui/tokens/style.css`、`@exre/exui/tokens/font.css` 暴露；内部工作区 `@exre/exui-tokens` 保持 `private: true`，不参与版本计算与发布。Token 隔离改为由"组件实现库全部内置 + React 保持可选 peer"实现，而不通过关闭 peer 安装或掩盖类型错误。私有包即便只有它自己变动，也要为公共包写 Changeset，因为它改变的是公共包产物。

理由：单包结构下 tokens-only 消费者的依赖树完全由 tarball 内容决定，可以在门外环境直接断言其中不存在 React 与任何实现库；双包结构只能间接推断。单包还消除了两个包之间的版本与兼容矩阵，以及"发 Token 还是发组件"的发布决策。

影响：组件消费者会连同 Token 一起下载。发布相关的所有组件都按单包假设编写：公共包名集合只含一个名字，发布计划拒绝私有包，npm 钩子只声明一个包，标签匹配只认 `@exre/exui@*`，Changesets 关闭私有包的 version 与 tag。构建顺序中多出"把 Token 产物复制进公共包"这一步，且必须发生在 Vite 清空 `dist/` 之后。

重新审视条件：Token 需要脱离组件包独立发布且具备独立节奏时；或出现必须只安装 Token 的体积敏感消费者时。

证据：`scripts/package-contract.mjs` 的 `PUBLIC_PACKAGE_NAMES`（只含 `@exre/exui`）、`TOKEN_PACKAGE_NAME`，以及"生产依赖字段不得引用私有 tokens 工作区"的检查；`packages/tokens/package.json` 的 `private: true` 与恒为 `0.0.0` 的版本；`packages/components/package.json` 的 tokens 三个子路径 exports 与 `workspace:*` 开发期依赖；`packages/components/scripts/copy-tokens-dist.mjs`；`scripts/release-bootstrap/plan.mjs` 对私有包的拒绝；`.release-bootstrap.yaml` 的 hook `packages` 只列 `@exre/exui`；`.github/workflows/tag-npm.yml` 的标签匹配；`.changeset/config.json` 的 `privatePackages` 关闭 version 与 tag；根 `README.md` 与 `packages/tokens/README.md` 的说明。
