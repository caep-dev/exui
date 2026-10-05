# ADR 01: ExForm 的 Standard Schema 校验契约

> 历史设计快照：本文的状态和验证结论记录 2026-09-27 设计阶段。当前实现与验证结果见[实施与验证记录](../reports/implementation-validation.md)。

- 日期：2026-09-27
- 状态：Accepted (design only; not implemented)
- 适用范围：ExForm 的 schema 校验 API、步骤校验与提交类型
- 依据：[已批准设计规格](../specs/2026-09-27-ex-form-design.md)、[已评审 RFC](./ex-form-rfc.md)

## Context

ExForm 需要让消费方以自己的 schema 描述完整表单规则，并支持异步校验、字段路径错误和输入到输出的转换。当前工作区使用 Zod 3.25.28；消费方也可能使用 Zod 4。若 ExUI 将某个校验库的运行时或专有类型写进公开 API，就会要求消费方与 ExUI 共享该库版本，并扩大 ExUI 依赖和类型声明边界。

分步表单还有额外约束：某一步可以只检查当前步骤及显式声明的依赖，但最后提交必须遵守完整 schema。任意从 schema 自动挑选字段或把完整 schema 的错误过滤成步骤错误，无法普遍保留 refinement、union、transform 和跨字段约束的含义。

## Decision

ExForm 的公开校验边界采用完整的 Standard Schema V1 结构契约。ExUI 调用消费方 schema 的 `~standard.validate`，并将成功输出或完整 issues 转换为 ExForm 自己的结果和错误视图。公开声明完整表达 V1 的同步/异步校验、输入/输出类型及 issue 路径；发布类型不得要求消费方安装 Standard Schema 包、RHF 或 Zod 才能编译。

Zod 通过其 Standard Schema V1 实现接入。设计支持仓库现有 Zod 3 版本，也支持独立消费者使用 Zod 4；Showcase 使用当前 Zod 3，Zod 4 由独立打包消费者 fixture 验证。ExUI 不增加 Zod 运行时依赖、不导出 `z` 命名空间，也不依赖 `@hookform/resolvers`。消费方负责安装和选择 schema 实现及版本。

表单输入模型、默认值、字段路径、控件绑定和读写操作使用 schema 的 Input 类型。完整校验成功后，提交回调接收 schema 的 Output 类型。schema 可以 trim、coerce 或 transform 输入；解析输出不回写表单草稿，也不改变控件的输入值类型。

步骤前进只运行显式提供的步骤 schema，并按其字段与声明的依赖构建保留原路径的输入投影。步骤 schema 必须接受该投影并以输入路径表达可定位的 issues。任何完成态提交仍运行完整 schema；库不从完整 schema 自动执行 `pick`/`partial`，也不通过过滤完整校验的 issues 冒充步骤校验。

## Alternatives Considered

- **将 Zod 作为 ExUI 的运行时 API 和专有类型。** 这会将公开 API 绑定到 Zod 及其版本，并使 Zod 4 支持与当前工作区版本管理纠缠；不采用。
- **要求消费方传入 `@hookform/resolvers` resolver。** 这会暴露底层表单实现的接线方式，并增加 resolver 依赖和类型边界；不采用。
- **定义只覆盖同步校验或简化 issue 路径的私有 schema 接口。** 这会丢失 Standard Schema 的异步和错误定位能力，并要求各 schema 库另写适配；不采用。
- **根据完整 schema 自动推导步骤 schema，或过滤完整 schema 的错误。** 这无法可靠处理跨字段规则、union/refinement 和 transform，也可能让步骤要求未来字段；不采用。步骤校验由调用方明确提供 schema 和依赖。
- **步骤通过后直接以局部 schema 结果提交。** 这会允许未检查的跨步骤约束绕过完整模型；不采用。最终提交一律执行完整 parse。

## Consequences

消费方可使用不同实现 Standard Schema V1 的校验库，而无需让 ExUI 暴露该库的类型或运行时。Zod 3 与 Zod 4 的兼容承诺来自结构契约，具体构建兼容性仍须由各自版本的隔离 pack fixture 验证；现阶段已有的 Zod 3 runtime 探针和版本查询不能替代新组件的类型、SSR、build、pack 或浏览器验证。

输入与输出分离保留了字符串控件对草稿的准确表示，同时允许提交数据由 schema 转换。调用方必须认识到转换值只存在于成功解析结果中，不能期望表单状态自动变成 Output。

显式步骤 schema 需要调用方维护步骤可用规则，且 schema 的 issue 路径需匹配输入投影路径；最终完整校验可再次报告跨字段约束。这种明确边界避免库猜测任意 schema 的语义。

实现时需覆盖 Standard Schema V1 同步/异步结果、issue 路径保留、Zod 3/4 的输入输出类型推导、transform 不回写、未来必填字段不阻挡当前步骤，以及完整 schema 跨步骤约束仍阻止最终提交等消费者测试。以上均为设计要求，尚未由 ExForm 代码验证。

## Evidence and validation boundary

- 已批准规格规定采用官方完整 Standard Schema V1、保留仓库当前 Zod 3 且在隔离 fixture 验证 Zod 4，并区分 schema 输入与输出。
- 冻结 RFC 将这些规则细化为公开类型、校验流程、步骤投影和最终完整校验，并将新增组件测试状态标为 `NOT_EXECUTED`。
- 本 ADR 记录已批准的设计决定，不宣称生产代码或消费者兼容测试已完成。
- [Standard Schema V1 规范](https://standardschema.dev/schema) 与 [Zod 基础文档](https://zod.dev/basics) 为相关技术契约的上游资料。
