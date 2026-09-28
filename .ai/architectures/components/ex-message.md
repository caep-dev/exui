# 全局消息的宿主与状态边界

最后更新：2026-09-28

`@exre/exui` 根入口导出自包含的 `ExMessageContext` 宿主和静态 `ExMessage` 调用入口。宿主不接收 children，不是 React Provider；应用在组件树中挂载一次，即可从其他模块发出提示。消费示例与参数说明见 [`Sonner` 参考](../../../skills/exui-usage/references/components/Sonner.md)。为何复用现有 Toaster 而非另建一套消息系统，见 [[components/06-single-ex-message-host]]。

## 所有权与流向

`components/ex-message-context.tsx` 持有宿主配置及挂载身份，并渲染现有 `components/ui/sonner.tsx` 的 `Toaster`。`lib/ex-message-controller.ts` 在模块级维护仅由 `ExMessage` 创建的消息 ID、顺序、加载阶段和期限计时器，再调用同一份 Sonner `toast`。宿主卸载时，控制器撤销这些消息和计时器。第二个宿主会被拒绝。

普通消息经控制器进入 Sonner；达到 `maxCount` 前，控制器先关闭最早仍受管理的消息。加载消息保留同一个 ID，完成后由 `onSuccess` 或 `onError` 更新为有时限的结果；关闭、超时或逐出后的句柄不再能更新消息。直接调用公共 `toast` 的消息不进入控制器注册表，但与受管理消息共享宿主的可见数量限制。

宿主在 layout effect 中登记，随后在 passive effect 中启用发布；期间创建的消息暂存在控制器中。此时完成或关闭加载消息会更新或移除待发布内容。时序原因和集成约束见 [`ex-message-lifecycle`](../../knowledge/components/ex-message-lifecycle.md)。

## 验证边界

`packages/showcase/src/showcase/ExMessage.vrt.test.tsx` 经公共包入口覆盖容量、时限、加载结果、卸载及兄弟组件 effect 时序。`scripts/verify-packages.mjs` 和 `scripts/verify-react-browser.mjs` 从打包后的独立消费者检查宿主与消息实际渲染；这不等于下游应用已经迁移或 npm 版本已经发布。

证据：`packages/components/src/components/ex-message-context.tsx`、`packages/components/src/lib/ex-message-controller.ts`、`packages/components/src/components/ui/sonner.tsx`、`packages/components/src/index.ts`；上述浏览器测试和打包消费者门禁。
