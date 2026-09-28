# 表单结构与状态边界

最后更新：2026-09-27

表单在唯一公开包根入口提供配置式 `ExForm`、组合式 `Form` / `FormItem` / `FormList` / `FormErrorSummary` 和同源 hooks。消费用法与属性说明见 [`Form` 参考](../../../skills/exui-usage/references/components/Form.md)。它们不创建新包或子入口；实现依赖的打包边界沿用 [[components/01-bundle-implementation-dependencies]]。

## 数据与请求流

`use-form.ts` 创建 RHF 实例与 facade。内部 RHF 只负责输入值、注册、dirty/touched 和错误记录；校验不接入其 resolver、rules 或原生提交入口。`context.ts` 的私有 WeakMap 将 facade 与内部实例关联，组件及 hooks 通过它检查实例来源。Context 负责同一实例的连接，不接受消费方另建的 RHF 实例。

`types.ts` 区分 schema 输入与输出：输入决定字段路径、控件值、默认值及读写类型；完整校验成功后才将输出交给业务提交函数。`standard-schema.ts` 保留完整的上游 V1 结构类型和许可，校验实现由消费方提供。`paths.ts` 负责安全路径、容器快照与按原路径投影，不读取 Zod 的内部结构。

`validation.ts` 将每条原始 issue 归属到字段或逻辑根目标。权威记录保存在 RHF 的固定私有叶 `root.__exui`，字段路径是记录中的数据，不能与错误节点的 `message/type/ref` 元数据相互覆盖。公开错误视图和 React state 快照由记录派生；后续合并重新读取 RHF，派生视图不作为另一份可写 store。

`coordinator.ts` 管理请求批次、输入 revision、生命周期 epoch、提交 attempt 和 scope 定义版本，不另存长期输入值。它将 RHF 的基础状态与请求状态合成缓存快照，`useSyncExternalStore` 向 owning hook、Context 及字段组件发布更新。读取具体值的观察使用同源 RHF `useWatch`，不能用一次 `getValues` 读取代替值订阅。

## 展示与导航

`components/patterns/` 中的组件复用基础控件：`FormItem` 通过内部 `useController` 注册字段，再将 change/blur 经协调器处理；适配器将 id、aria、ref 和绑定事件送到实际控件。配置层递归生成普通字段和对象数组列表，不在配置遍历中调用 hook。

`form-steps.ts` 只保存步骤配置和导航任务。scope 的字段及显式依赖决定验证投影，局部输出丢弃；最终提交仍验证完整 schema。受控切步由父组件确认，值与错误继续属于同一表单实例。焦点登记只包含标签、步骤与真实元素，不保存字段值。

`form.css` 使用具名容器与有限列数；容器宽度决定网格及横向标签布局，Dialog 内的窄表单不依赖页面视口断点。Showcase 五类预览和行为测试只消费公开产物。跨工作区的构建顺序仍见 [`overview`](../overview.md)。

证据：`packages/components/src/lib/forms/`、`src/hooks/use-form*.ts`、`src/components/patterns/`、`src/form.css` 和 `src/index.ts`；`packages/showcase/src/showcase/FormExamples.tsx` 与 `Form*.vrt.test.tsx`；隔离消费者 `scripts/form-consumer-fixture.mjs`。
