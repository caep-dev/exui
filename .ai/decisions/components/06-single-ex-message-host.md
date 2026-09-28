# 全局消息复用单个 Sonner 宿主

最后更新：2026-09-28

状态：已接受
模块：components
日期：2026-09-28
来源：`.notes/ex-message/specs/2026-09-28-ex-message-exui-design.md`、`packages/components/src/components/ex-message-context.tsx`、`packages/components/src/lib/ex-message-controller.ts`

背景：ExWebsite 已有包装 `Toaster` / `toast` 的全局提示能力，需要把它放进 ExUI，供多个消费应用使用。ExUI 根入口原本就公开 `Toaster` 与 `toast`，因此新增能力必须与它们共享运行实例，避免两个宿主各自显示通知。

决策：公开自包含的 `<ExMessageContext />` 与静态 `ExMessage`，只挂载一个宿主。它复用现有 Sonner `Toaster`，控制器仅管理经 `ExMessage` 创建的消息；既有 `Toaster` 和 `toast` 继续公开。消费应用自行把宿主放在应用树中，不需要 Provider 包裹 children。结构与控制流见 [`ex-message`](../../architectures/components/ex-message.md)。

考虑过保留站点中的 `<ExMessage />` 命名、引入包裹 children 的 Context Provider，或在库中创建第二套 Toaster。前者不能清晰区分公共宿主与原站点组件；Provider 为静态命令式入口引入不需要的组件树依赖；第二套宿主会使位置、可见数量和关闭行为分裂。现有 Sonner 实例已足够承担显示，包装层只需要拥有自己的 ID 与生命周期。

代价：同一页面必须避免重复挂载宿主；原生 `toast` 不受包装层的逐出顺序管理。发布后的 ExWebsite 迁移还需要更新依赖版本和调用处，不能仅凭本仓库构建通过就删除站点本地实现。

重新审视条件：需要多独立通知区域、跨标签页同步，或公开 API 必须承载交互操作及完整 Sonner 选项时。

证据：批准的设计记录；`packages/components/src/index.ts` 中并存的公共导出；`packages/showcase/src/showcase/ExMessage.vrt.test.tsx` 的单宿主、原生 toast 共存及生命周期用例；`scripts/verify-react-browser.mjs` 的打包消费验证。
