# ADR 02: ExForm 的同源 RHF facade 与状态所有权

> 历史设计快照：本文的状态和验证结论记录 2026-09-27 设计阶段。当前实现与验证结果见[实施与验证记录](../reports/implementation-validation.md)。

- 日期：2026-09-27
- 状态：Accepted (design only; not implemented)
- 适用范围：ExForm 表单实例、字段状态、校验/提交协调与依赖边界
- 依据：[已批准设计规格](../specs/2026-09-27-ex-form-design.md)、[已评审 RFC](./ex-form-rfc.md)

## Context

ExForm 要同时提供配置式和组合式 API、异步校验与步骤导航，并保持输入、错误和提交状态一致。若配置组件、组合组件、消费方 hooks 各自创建 RHF 实例或维护字段值副本，状态就可能分叉；若直接暴露 RHF 实例，又会把其运行时、上下文和原生校验语义变成 ExUI 的公开兼容承诺。

异步 schema、服务器错误、导航和取消也无法由 RHF 的原生 `handleSubmit`/`trigger` 单独表达为本设计要求的 revision、owner、settle 与过期结果规则。ExUI 因此需要一个统一 facade 与请求协调边界，同时让 RHF 继续负责字段数据及其基础状态。

## Decision

ExForm 配置式与组合式 API 共用同一由 ExUI `useForm` 创建的 RHF 实例。公开实例是 ExUI 自己的 facade：带模块私有品牌并由私有 WeakMap 校验来源；`Form`、`FormItem`、`FormList` 和同源 hooks 只接受该实例。外部创建的 RHF `UseFormReturn`、Provider 或 Controller 不属于支持的输入，公开 API 不暴露内部 `control` 或 `subjects`。

RHF 是字段值、dirty、touched、字段注册及唯一权威错误 records 的来源。协调器不复制长期字段值、dirty/touched 或错误 records。完整错误 records 存在 RHF errors 的固定内部叶节点 `root.__exui`；叶节点记录逻辑 target、source、owner 和原始 issue。公开的 `errors.fields`、`errors.root`、字段 issues 与 React state snapshot 都从此记录和 RHF 基础状态派生，不能作为后续错误合并的第二权威 store。配置元数据 registry 可以记录路径、标签、步骤和 focus target，但不得保存字段值。

RHF 内部固定使用 `mode: 'onSubmit'`、`reValidateMode: 'onSubmit'`、`shouldUnregister: false`、`shouldUseNativeValidation: false`，且不配置 rules、resolver、form-level validate 或 RHF deps。所有原生 change/blur 只更新 RHF 字段值和 touched/dirty；公开 `mode`、`reValidateMode`、触发、重验与错误清理均由 ExUI 协调器执行。公开状态不读取或转发裸 RHF 的 `isValid`、`isValidating`、`isSubmitting`、`isSubmitted`；字段错误展示订阅 facade 的归一化记录。

协调器拥有瞬时任务和状态：输入/结构 revision、生命周期 epoch、requestId 与待校验目标/scope、校验定义版本、navigationVersion、submit attempt/锁、公开验证和提交 flags。每个结果仅在其捕获的 revision、epoch、请求/导航版本、定义版本和 owner 仍有效时才能提交；取消会立即结束对应可见任务，旧 Promise 之后的完成不能写入错误、状态或解锁新 attempt。业务回调错误有两道独立检查：attempt/epoch 有效且未取消时，先将该 attempt 标为业务失败；仅当捕获 revision 也匹配时，才把错误记录写到当前草稿。因而草稿改变后收到的服务器失败仍使原 attempt 结算为 failed，却不能把旧草稿错误显示到新草稿。

RHF public subscribe 观察 dirty、touched 和 errors 等基础状态；协调器发布任务及生命周期变化。两者合成缓存的不可变 facade snapshot，并通过 `useSyncExternalStore` 通知 `useForm`、`useFormContext`、`Form` 及字段订阅者。实现库 RHF 内置进 ExUI 产物，RHF 类型随声明内部化；唯一宿主运行时仍是 React/React DOM。保持 tokens-only 安装不引入 React、RHF、Zod 或其类型依赖。

## Alternatives Considered

- **配置式与组合式 API 各自管理值或错误副本。** 两条路径可能产生不同草稿、错误或提交状态，也会形成第二权威 store；不采用。
- **公开原生 RHF 实例并接收外部 RHF Provider/实例。** 这会让外部 RHF 版本/context 与 ExUI 的实例状态语义成为兼容面，并允许绕开请求仲裁；不采用。
- **把校验交给 RHF 原生 mode、resolver、trigger 与 handleSubmit。** 原生入口无法保证公开触发模式、错误来源所有权、过期结果失写、导航取消和 attempt 锁的一致契约；不采用。
- **把实现 RHF 声明为运行时依赖或 peer，或提供独立 forms 子入口。** 这会扩大安装/宿主契约或新增入口与构建门禁；已批准设计选择内置 RHF 并沿用根公开入口，同时要求 tokens-only 消费路径继续隔离。

## Consequences

所有 ExForm 公开读写和组件绑定必须经过同源 facade/协调器；不得向调用方暴露内部 control，也不得用另一份长期状态缓存来解决 React 更新问题。RHF `root.__exui` 仅为私有物理存储叶，业务 root 错误名和字段路径均以记录 target 表达，避免与合法业务字段键或 RHF 错误元数据冲突。

验证、导航及提交行为需要用独立 token/revision 守卫异步回调，并测试旧结果乱序、reset/unmount/cancel、输入在 preflight 或业务回调期间变化，以及错误写入不能污染新草稿。对外部 RHF 实例的拒绝和 tokens-only 依赖隔离也必须由类型/运行时及打包消费者门禁验证。

同源实例、订阅快照和协调器增加内部实现工作；公开状态语义由 ExUI 定义，不能依赖 RHF 私有行为或原生校验标志。RHF 需要进入 bundled module/notices，类型声明须内部化；打包与 tokens-only 门禁应确认组件消费者可用且 tokens-only 安装树没有引入组件实现依赖。

该决策目前只被记录为设计。新增的 facade、错误桥、协调器、订阅、取消及消费者验证均未由本 ADR 实施或证明通过。

## Evidence and validation boundary

- 已批准规格规定 RHF 负责字段值/dirty/touched/注册和字段错误，协调器负责异步校验仲裁、提交锁、步骤校验及生命周期；并明确禁止公开 RHF control/subjects。
- 冻结 RFC 第 4–7 节定义原生校验隔离、`root.__exui` 唯一错误 records、派生状态订阅、revision/epoch/request/navigation/attempt 守卫及业务失败双检查；其打包约束保留 tokens-only 隔离。
- 上述 RFC 的独立架构评审已 APPROVED；RFC SHA256：`D0721184694F14B1718D5E08E69AF1588C3B4A573B371A8C6CA85DE42DB90080`。
- 本 ADR 不代表 ExForm 代码、类型、SSR、build、pack 或浏览器用例已经验证。
