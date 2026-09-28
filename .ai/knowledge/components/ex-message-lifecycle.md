# 全局消息的订阅时序与句柄约束

最后更新：2026-09-28

结构与所有权见 [`ex-message`](../../architectures/components/ex-message.md)。

- React 中排在宿主前面的兄弟组件，其 passive effect 可能先于宿主的 passive effect 调用 `ExMessage`。此时宿主的 layout effect 已完成登记，但 Sonner 的 Toaster 仍可能未订阅。直接向 Sonner 发消息会让调用成功却不显示，因此控制器待 Toaster 子组件订阅后再发布；待发布期间的完成和关闭只作用于最后的待发布状态。
- `ExMessage` 在宿主首次登记之前和卸载之后调用会抛错。宿主重新挂载不复用旧消息或加载计时器，旧加载句柄完成回调也不能让消息重现。
- 无显式期限的加载提示持续显示，必须由原句柄完成或关闭。传入期限只负责关闭，不把超时解释为业务失败。完成时使用当时的宿主默认时长，除非完成调用另有覆盖。
- 控制器只逐出 `ExMessage` 创建的消息。直接调用 `toast` 的消息可能占据可见槽位，但不会被控制器按顺序关闭；不要把两种入口的容量管理视为同一队列。

证据：`packages/components/src/lib/ex-message-controller.ts`、`packages/components/src/components/ex-message-context.tsx`、`packages/components/src/components/ui/sonner.tsx`；`packages/showcase/src/showcase/ExMessage.vrt.test.tsx` 的兄弟 effect、提前完成/关闭、StrictMode 和逐出用例；`scripts/verify-react-browser.mjs` 的打包浏览器用例。
