# RFC：ExForm 统一表单接口与实施契约

> 历史设计快照：本文的状态和验证结论记录 2026-09-27 设计阶段。当前实现与验证结果见[实施与验证记录](../reports/implementation-validation.md)。

- 日期：2026-09-27
- 状态：RFC_PROPOSED，待独立 Architecture Reviewer 评审
- 来源：[ExForm 设计](../specs/2026-09-27-ex-form-design.md)，用户于 2026-09-27 回复 `y` 批准全文。源文件保留原文，其“待审阅”状态不在本 RFC 阶段改写。
- 前置评审：spec 独立评审结论 APPROVED，并有三个需在本 RFC 落实的关注点；原评审记录未纳入仓库。
- 本 RFC 只定义实施契约；未实现、安装依赖、提交或发布。

## 1. 决策与实施边界

在唯一公开包根入口增加配置式 ExForm、组合式 Form/FormItem/FormList/FormErrorSummary 和同源 hooks。RHF 只维护一份字段状态；完整 Standard Schema V1 结构类型接收消费方 schema；协调器显式管理最新校验批次、提交锁和生命周期。首期能力、非目标及 Showcase 场景沿用已批准设计，不在此重复业务说明。

落实前置评审：提交 preflight 被替代时明确结算 cancelled 并释放锁；所有 state 消费者通过 React 订阅更新；列表 dirty 按 RHF 默认值比较；完整 issue 保存在 RHF 错误节点中，展示层可按相同文案去重。

依赖决策：组件工作区 devDependency 固定 `react-hook-form: 7.89.0`，不增加生产/optional/peer RHF 依赖，维持仅 React/React DOM 外部化。Leader 已于 2026-09-27 只读查询 npm 核对该版本的 React 19 peer 和 Node >=18；这不证明安装或打包通过。保持当前 Zod 3 override；Showcase 显式 devDependency `zod: 3.25.28`。隔离 fixture 固定 Zod `3.25.28` 和 `4.6.5`，后者于本次只读 npm 查询核实。fixture 在工作区之外，不使用 workspace override。工具链继续 Node 24、pnpm 11.9.0。

## 2. 文件责任和依赖方向

以下是后续实施位置，不是本阶段创建的文件。

| 位置 | 唯一责任 |
| --- | --- |
| `packages/components/src/lib/forms/standard-schema.ts` | 按官方许可完整内联 V1 类型，保留上游来源与许可；无运行时代码 |
| `src/lib/forms/types.ts` | 公开输入/输出、路径、配置、实例、hooks 和组件 props 类型 |
| `src/lib/forms/paths.ts` | 安全路径解析、prefix 比较、scope 投影、对象/数组快照；不读 Zod 内部结构 |
| `src/lib/forms/validation.ts` | 调用 `~standard.validate`、归一化 issue、桥接/合并 RHF 错误节点 |
| `src/lib/forms/coordinator.ts` | revision/epoch/request/attempt、批次与提交状态机、取消和稳定状态快照；通过注入端口访问 RHF |
| `src/lib/forms/context.ts` | 私有 Context 和模块私有实例 WeakMap；不导出 RHF control 或创建第二个 store |
| `src/hooks/use-form.ts` | 内置 RHF useForm、协调器、state 订阅及精简 facade |
| `src/hooks/use-form-context.ts`、`use-form-watch.ts`、`use-form-field-array.ts` | 同源上下文、路径观察、对象数组操作；不直接转发外部 RHF 实例 |
| `src/components/patterns/form.tsx` | 原生 form、连接 owner、布局 Context、submit 路由与卸载清理 |
| `form-item.tsx` | RHF useController 绑定、字段元数据、条件依赖、label/help/error 与内置或自定义 render |
| `form-list.tsx` | 对象数组外壳、稳定行身份、行操作、数组错误与相对路径展开 |
| `ex-form.tsx` | 配置生成 FormItem/List、step controller、默认/自定义 footer |
| `form-error-summary.tsx` | 根错误和字段导航；调用已登记 focus target，不访问控件内部 |
| `form-controls.tsx`、`form-controls/files.tsx` | 内置控件绑定适配、组合式选择控件、本地文件选择/drop/paste/reset |
| `form.css`、`src/index.css` | 容器断点、有限列/span 样式和可收缩布局；根样式 import 新 CSS |
| `src/index.ts` | 显式导出上述公开值及类型，内部 Context、协调器和 helpers 不导出 |
| `packages/showcase/src/showcase/FormExamples.tsx`、`Showcase.tsx`、`Showcase.css` | 五类真实预览、目录搜索条目、页面本地样式；只消费公开包 |
| `packages/showcase/src/showcase/Form.vrt.test.tsx` | 公共接口行为与反例，复用当前 Browser Mode |
| `scripts/verify-packages.mjs`、`verify-react-browser.mjs` | Zod 双版本隔离 types/SSR/build/browser，以及 tokens-only 排除新实现包 |
| `packages/components/README.md`、`skills/exui-usage/`、`TESTING.md` | 新公开契约、消费 schema 安装、可编译示例及 gate 边界；生成 inventory 用 updater |

协调器依赖一个私有 RHF 端口：读输入快照、读写错误、通知字段变动、订阅既有状态。它不持有长期字段值、dirty/touched 副本或第二套验证规则。组件 → hooks/facade → RHF + 协调器 → schema；schema 和协调器不依赖 Showcase、路由、HTTP 或存储。

## 3. 公开类型和推导约束

下列签名是实施契约。辅助类型的含义在紧接的规则中定义，不是允许用 any 替代的占位符。StandardSchemaV1 为官方完整类型，包含 Options、Types、Result、Issue、PathSegment 和 InferInput/InferOutput。

```ts
type FormValues = Record<string, unknown>
type FormSchema = StandardSchemaV1<FormValues, unknown>
type FormInput<S extends FormSchema> = StandardSchemaV1.InferInput<S>
type FormOutput<S extends FormSchema> = StandardSchemaV1.InferOutput<S>
type FormMode = 'onSubmit' | 'onBlur' | 'onChange'
type FormPath<I extends FormValues> = SafeFieldPath<I>
type FormPathValue<I extends FormValues, P extends FormPath<I>> = FieldPathValue<I, P>
type FormErrorPath<I extends FormValues> = FormPath<I> | 'root' | `root.${string}`
type FormSnapshot<T> = DeepReadonlySnapshot<T>
type FormDefaults<I extends FormValues> = DefaultValues<I>

interface FormOptions<S extends FormSchema> {
  schema: S
  defaultValues: FormDefaults<NoInfer<FormInput<S>>>
  mode?: FormMode
  reValidateMode?: FormMode
}

interface FormIssue extends StandardSchemaV1.Issue {
  readonly source: 'schema' | 'server' | 'manual' | 'execution'
  readonly scopeId?: string
}
interface FormErrorNode { readonly issues: readonly FormIssue[] }
interface FormErrors<I extends FormValues> {
  readonly fields: Readonly<Partial<Record<FormPath<I>, FormErrorNode>>>
  readonly root: Readonly<Record<string, FormErrorNode>>
}
interface FormState<I extends FormValues> {
  readonly isDirty: boolean
  readonly dirtyFields: FormSnapshot<Partial<FieldNamesMarkedBoolean<I>>>
  readonly touchedFields: FormSnapshot<Partial<FieldNamesMarkedBoolean<I>>>
  readonly errors: FormErrors<I>
  readonly isValidating: boolean
  readonly isSubmitting: boolean
  readonly submitCount: number
  readonly validationStatus: 'unvalidated' | 'valid' | 'invalid'
}
interface FormFieldState {
  readonly isDirty: boolean
  readonly isTouched: boolean
  readonly isValidating: boolean
  readonly invalid: boolean
  readonly issues: readonly FormIssue[]
}
interface FormErrorInput {
  message: string
  issues?: readonly StandardSchemaV1.Issue[]
}
interface FormValidationScope<I extends FormValues> {
  id: string
  fields: readonly FormPath<I>[]
  validationSchema: FormSchema
  validationDependencies?: readonly FormPath<I>[]
}
type FormSubmitResult = { status: 'submitted' | 'invalid' | 'failed' | 'cancelled' }
interface FormSubmitContext<I extends FormValues> {
  readonly signal: AbortSignal
  setFieldError<P extends FormPath<I>>(name: P, error: FormErrorInput): void
  setFormError(error: string | FormErrorInput): void
}
type FormSubmitHandler<I extends FormValues, O> =
  (data: O, context: FormSubmitContext<I>) => void | Promise<void>

interface FormInstance<I extends FormValues, O> {
  readonly state: FormState<I>
  getValues(): FormSnapshot<I>
  getValues<P extends FormPath<I>>(name: P): FormSnapshot<FormPathValue<I, P>>
  setValue<P extends FormPath<I>>(name: P, value: NoInfer<FormPathValue<I, P>>,
    options?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }): void
  reset(values?: FormDefaults<I>): void
  resetField<P extends FormPath<I>>(name: P,
    options?: { defaultValue?: FormPathValue<I, P> }): void
  setError(name: FormErrorPath<I>, error: FormErrorInput): void
  clearErrors(names?: FormErrorPath<I> | readonly FormErrorPath<I>[]): void
  getFieldState(name: FormPath<I>): FormFieldState
  setFocus(name: FormPath<I>, options?: { shouldSelect?: boolean }): void
  scrollToField(name: FormPath<I>, options?: { focus?: boolean; behavior?: ScrollBehavior }): void
  trigger(names?: FormPath<I> | readonly FormPath<I>[],
    options?: { shouldFocus?: boolean }): Promise<boolean>
  validateScope(scope: FormValidationScope<I>,
    options?: { shouldFocus?: boolean }): Promise<boolean>
  submit(): Promise<FormSubmitResult>
  cancelPending(): void
}

function useForm<const S extends FormSchema>(options: FormOptions<S>):
  FormInstance<FormInput<S>, FormOutput<S>>
function useFormContext<I extends FormValues, O>(expected: FormInstance<I, O>): FormInstance<I, O>
function useFormContext<I extends FormValues = FormValues, O = unknown>(): FormInstance<I, O>
function useWatch<I extends FormValues, O, P extends FormPath<I>>(
  options: { form: FormInstance<I, O>; name: P }): FormSnapshot<FormPathValue<I, P>>
function useWatch<I extends FormValues, O, P extends readonly FormPath<I>[]>(
  options: { form: FormInstance<I, O>; name: P }): SnapshotPathTuple<I, P>
function useFieldArray<I extends FormValues, O, P extends FormObjectArrayPath<I>>(
  options: { form: FormInstance<I, O>; name: P }): FormFieldArray<I, P>
```

SafeFieldPath 以内部化 RHF FieldPath 为基础，排除顶层 root、__proto__/prototype/constructor 段、symbol、含点号的字面键；索引采用非负整数。运行时再次拒绝不安全路径，不能仅靠类型保护原型。FieldPathValue、DefaultValues 和 FieldNamesMarkedBoolean 为内部化的 RHF 官方类型。DeepReadonlySnapshot 递归只读对象/数组；File 等原生对象保持自身类型并按只读使用。快照复制普通容器，File 身份保留，不 JSON 序列化；getValues 不暴露可直接修改的 RHF store 对象。消费方 validator 不得修改输入或原生对象。SnapshotPathTuple 保持 name 元组顺序及每个路径的独立值类型。

实例在类型层包含模块私有品牌，在运行时由模块私有 WeakMap 检查；品牌不能让消费方构造合法实例。FormItem/List 从 form 推导 I/O，其 name、配置、defaultItem、render 参数使用 NoInfer 防止反向扩大输入模型。无 expected 的 useFormContext 不能恢复 JSX 祖先泛型，调用方需显式提供 I/O；expected overload 同时检查最近 provider 身份。输入根必须是对象；输出可以被 schema 变换，不能强行要求 O=I。完整 schema 引用是实例初始化契约，须使用模块常量或 useMemo 保持稳定；在既有实例上改变引用时报清晰使用错误，不静默替换校验器。改变模型用新实例/React key；defaultValues 的新对象引用不重置草稿，基线改变必须调用 reset。步骤/scope 校验定义更新采用第6节的版本契约，与初始化 schema 区分。

FormObjectArrayPath 只选择去除 undefined 后为可写对象数组的路径；FormFieldArray 提供 readonly items `{key:string,index:number}[]`、append(item)、insert(index,item)、remove(index|readonly number[])、move(from,to) 和 readonly issues。item 的类型是对应数组元素的完整输入类型，不能提交部分元素或额外生成id；数组索引越界操作报使用错误。模型声明为 readonly array/tuple 的路径不接受内置数组控件或 FormList，只可通过 typed render/setValue 提交符合其原类型的新值；公开读取快照的 readonly 不改变模型本身是否可写的判定。

### 3.1 字段、列表与组件 props

FormFieldConfig<I> 是逐条 FormPath 分配的联合，不是 `{name: string, render: (...unknown[]) => ...}`。每个普通字段拥有 name、label、description、required、disabled、dependencies、visibleWhen、disabledWhen、preserve、colSpan、className、noStyle，以及互斥的内置 control/controlProps 或 render。visibleWhen/disabledWhen 的输入是 FormSnapshot<I>，读取路径必须在 dependencies 声明；可选 validationScope 用于可靠的依赖局部校验。

| control | 允许的非 undefined 输入值 | controlProps |
| --- | --- | --- |
| text/email/password/number/date | string | Input props 去除绑定属性和 type |
| textarea | string | Textarea props 去除绑定属性 |
| checkbox/switch | boolean | 对应公开控件 props 去除绑定属性 |
| select/radio-group | string 或 string literal/enum 联合 V | options: readonly `{value: NoInfer<V>; label: ReactNode; disabled?: boolean}[]`，及 placeholder/className/glass 等对应展示属性 |
| checkbox-group/multi-select | 可写字符串数组 V[] | options.value 为 NoInfer<V>，V 是对应路径数组元素的 string literal/enum 联合或 string；另有 placeholder/className |
| select-or-input | 完整 string | options: readonly `{value: string; label?: string; disabled?: boolean}[]`、placeholder/className；value 同时是可填写文本 |
| files | File[] | accept、选择按钮文案、说明、className；没有独立 maxCount/maxSize/rules |

路径值在去除 undefined 后必须完整落入表内类型，string|number 或 nullable 值不能通过强制断言使用文本内置适配器。自由输入的 text/email/password/number/date/textarea/select-or-input 必须允许完整 string，checkbox/switch 必须允许完整 boolean；较窄 literal 值采用枚举选择或 typed render。options 的值类型从 form/schema 和 name 推导，不能反向扩大路径值；例如 role:'admin'|'member' 的 option.value:'owner'，以及 tags:('a'|'b')[] 的 option.value:'c' 均为类型错误。内置多选只产生由其已类型化 options 组成的新数组，数组外壳或 options 为 readonly 不等于输入模型允许 readonly array。控制权属性统一排除 name/value/defaultValue/checked/defaultChecked/onChange/onValueChange/onCheckedChange/onBlur/ref/id/disabled/aria-invalid/aria-describedby/required。label/description 支持 ReactNode；required 仅展示，不产生原生约束或 schema 规则。render 的签名为 `(args: FormRenderArguments<I,P>) => ReactNode`，args.field 是只读值、类型化 onChange(next)、onBlur、真实 HTMLElement ref；args.state 是字段状态加 disabled；args.accessibility 包含 id/name/aria-invalid/aria-describedby/aria-required，不能包括绑定事件或 value。

列表配置以 `kind:'list'` 区分：name 为对象数组合法路径，defaultItem 为数组元素完整输入值，itemFields 为元素模型的 FormFieldConfig，相对路径会加数组路径和当前 index；支持递归对象数组，标量数组只由多选管理。每层组件调用自己的 hook，不在条件循环里调用 hooks。

| 接口 | 必需属性与附加约束 |
| --- | --- |
| Form<I,O> | form、onSubmit、children；禁用原生 onSubmit/onReset 替代入口，外壳 always noValidate；支持 name/disabled/clearOnDestroy、布局、onInvalid(errors)、onSubmitError(error)、通用错误文案和 DOM className/style |
| FormItem<I,O,P> | form、name 及上述字段属性；control/controlProps 与 render 互斥，children?:never；必须位于同一 form 的 Context |
| FormList<I,O,P> | form、name、defaultItem、render；render 接收 items `{key,index}`、append/insert/remove/move、完整数组 issues；label/description/layout 展示可选 |
| FormErrorSummary<I,O> | form；按错误路径读取字段标签和焦点，无法定位的根错误只展示 |
| ExForm<S> | schema、defaultValues、fields、onSubmit；内部实例，禁止同时传 form；其余为 Form 选项 + steps/footer/submitLabel/resetLabel |
| ExForm<I,O> | form、fields、onSubmit；禁止同时传 schema/defaultValues/mode/reValidateMode；消费方使用已有实例 |

ExForm 用两组泛型 overload 形成自建/传入实例互斥，schema/form 是唯一推导来源。Form 原生 `disabled` 只控制 UI，不设置 RHF 的 disabled 字段过滤标志，禁用值仍参加 schema。单实例只连接一个 Form；重复连接、外部 RHF 实例、非法路径、未连接时 submit 均为使用错误，不降级为空操作。DOM 提交处理程序捕获方法的拒绝并交错误处理，不产生 unhandled rejection。

布局 options 为 layout vertical/horizontal/inline、columns `{base?,sm?,md?,lg?}`（1–4，base 默认1）、字段 colSpan（1–4 或 full）。inline 使用 wrap 布局，columns 用于给每行设置同样的最大列数，宽度不足自动减少；vertical/horizontal 使用网格。container 阈值固定 sm=30rem/md=48rem/lg=64rem，缺失档继承较小档；colSpan 超过当前列数时缩到当前列数。窄容器横向标签转纵向，inline 换行。样式用具名容器、有限 class 和 CSS变量，保留 min-width:0 和长内容换行。

### 3.2 方法的状态语义

setValue 默认 shouldDirty=true、shouldTouch=false、shouldValidate=false；绑定变化总是执行 RHF field.onChange 并由协调器按公开模式排校验，RHF setValue 的 shouldValidate 始终传 false。reset 无参回到当前默认值，有参更新 RHF 默认值基线；清 dirty/touched/errors/submitCount/校验状态并取消所有任务。resetField 调用 RHF resetField 并由桥接清除该路径/后代的错误记录，保留其他字段状态；可更新该字段默认值，同时取消受影响的全局在途任务。

setError 默认 manual，提交上下文写 server；传 issues 时完整保留，否则合成 `{message}` issue。clearErrors 只清指定路径/后代或全部错误；它不把 validationStatus 改为 valid。getFieldState 对父路径按子树计算 invalid/dirty/touched，dirty/touched 始终读取 RHF，validating 读取当前批次目标。

trigger() 完整验证并更新全部 schema 错误和 validationStatus。trigger(names) 运行完整 schema，但只提交指定路径/后代 issue，以及本轮 schema 的全局 root issue；不把无关字段错误当作其返回 false 的理由。本轮 schema 的 root issue、选中 issue、执行失败或取消返回 false，既存 manual/server 错误不充当另一套 schema 规则。只执行局部更新不改变完整 validationStatus。validateScope 的结果遵循第6节。提交失败后设置“进入重验模式”，后续事件使用 reValidateMode；reset 清除此状态。submitCount 在实际取得锁时加1，重复请求不重复计数。

## 4. 单一字段状态和 React 订阅

内部 RHF 实例固定 mode='onSubmit'、reValidateMode='onSubmit'、shouldUnregister=false、shouldUseNativeValidation=false，原始输入类型为 I；不安装 rules/resolver/form-level validate，不注册 RHF deps，也不调用 RHF 原生 trigger/handleSubmit。不订阅/读取裸 RHF isValid/isValidating/isSubmitting/isSubmitted。RHF 的提交状态因此始终不进入原生 submitted 模式，change/blur 只更新值与 dirty/touched；公开 mode/reValidateMode 只由协调器解释，不能透传给 RHF。所有 useController/register 使用相同配置且没有校验选项；register 只在内部绑定使用，不作为公开逃生入口。

useController 的 field 完成值、blur、ref 和注册，fieldState.error/invalid 不用于公开错误展示；FormItem、FormList 和 render.state 订阅 facade 的归一化错误视图。桥接只通过 RHF setError/clearErrors 写第5节的内部根节点，原生 change/blur 不能清除其 manual/server/schema 记录。适配器先更新 RHF，再由协调器安排校验；任何原生 validation 入口均不得绕过此边界。对尚未挂载的 ExForm/step 字段，元数据 registry 保存路径、标签、步骤和焦点出口，不能保存第二份值。

RHF public subscribe 订阅 isDirty、dirtyFields、touchedFields、errors；协调器订阅生命周期元数据。两者合成一个缓存的不可变 FormState snapshot，通过 useSyncExternalStore 向 useForm、useFormContext 和 Form 订阅者通知；getSnapshot 仅在版本变化时返回新对象。`form` 身份和方法稳定，`form.state` getter 读取当前 snapshot。拥有实例的 useForm 也订阅，保证父组件中的 `form.state.isSubmitting` 改变后按钮重新渲染；不能只更新一个 ref。useWatch 和 useFieldArray 委托同源 RHF hooks，并使用内部 control；公开面不暴露 control。

subscribe回调只读状态并发布版本，不在该回调内setValue/reset/setError；输入写入的revision与后续微任务由绑定/facade入口控制，避免违反RHF订阅回调不得写字段的约束。

getServerSnapshot 提供初始化快照；SSR 不读 document/File constructor/localStorage，不执行验证或创建对象 URL。连接、订阅与事件注册在 effect 中，所有 cleanup 幂等；Strict Mode 的 effect 卸载/重连按不同 owner epoch 处理，旧任务不能写到新连接。没有连接的订阅者可读初始值，但不能 submit。

FormList 行 key 来源于 RHF useFieldArray 的生成 id，对外仅名为 key；id 不混入 getValues/onSubmit。move/remove/insert 由 RHF 管理行值和 touched；桥接按同一索引置换更新 RHF 内部根节点中该数组后代的错误记录，第5节定义映射，不能期待 RHF 自动移动根命名空间记录。dirty 是“当前路径值相对于 RHF 默认值”的比较，不是随稳定 key 保存的标志；移动两条不同的默认行可使两处路径变 dirty，移回可以恢复。文件 dirty 沿用 RHF 的原生对象比较限制，不另造 File 比较 store；文件有效性仍由 schema 判断。

## 5. Schema 结果、完整 issues 与错误所有权

StandardSchemaV1 原文完整内联，版本固定1，保持 `validate(value, options?)`、readonly Issue[]、PropertyKey/PathSegment、可选 types 和同步/Promise 分支。引擎只传输入，不依赖 vendor 和 Zod 私有字段。`await Promise.resolve(validate(snapshot))` 接受同步结果和 Promise；异步抛错进入 execution failure。schema 输出不回写 RHF。

唯一权威错误存储为 RHF errors 中固定的 `root.__exui` 叶节点，不把业务输入路径展开为 RHF FieldError 树。该叶的内部 ErrorOption 扩展包含 `records: readonly StoredIssue[]`；每条记录含 target（`{kind:'field',path:安全输入路径}` 或 `{kind:'root',key:逻辑根名}`）、source、owner（full/scopeId/manual/submitAttempt/execution）与完整原始 Standard Schema issue。重复文案和原 path 均保留，字段父路径与子路径是数组内独立记录，不存在 metadata 与业务键的冲突。`profile.message/profile.type/profile.types/profile.issues/profile.ref` 都是合法字段，不能增加禁名或用跳过遍历掩盖丢失。

写入先通过 RHF getErrors 读取当前 records，按拥有权/目标合并，随后以一次 setError('root.__exui', {type:'exui', message:首条文案, records}, {shouldFocus:false}) 替换完整记录数组；清空时只 clearErrors('root.__exui')。该物理路径为库内常量，未注册为字段；ref 由库的 focus registry 管理。协调器不保留第二份权威 records/map；短暂校验结果及不可变派生 state 快照不作为后续合并来源。RHF 官方 setError 会处理 message/type/types/ref 等元数据，故只在隔离叶使用这些属性；依据 [7.89.0 createFormControl](https://raw.githubusercontent.com/react-hook-form/react-hook-form/v7.89.0/src/logic/createFormControl.ts)。

公开 errors.fields 是按 target.path 归一化的 flat 只读映射，errors.root 以不含 `root.` 前缀的逻辑名为键：`validation.full`、`validation.scope.<scopeId>`、`submit`、`execution`、manual 或调用者指定逻辑名。这些名称是记录数据，不用于 RHF set/get/unset 路径拼接；派生映射使用 null-prototype 对象。public setError('root',...) 使用 manual，提交 context.setFormError 使用 submit；public 'root.<name>' 按逻辑名处理，不能访问/覆盖物理 `root.__exui`。所有根名由安全段 `[a-zA-Z0-9_-]+` 组成并拒绝 __proto__/prototype/constructor，scopeId 同样验证；不直接用未验证名称构造对象路径。

映射安全字符串/非负数字/`{key}` 段；symbol、危险段、无法归属于已声明字段/容器的路径或空路径进入逻辑 root，原路径仍保留。可声明范围由配置、mounted 元数据、默认输入、scope 路径及数组元素模板确定，不 introspect schema。一个 issue 必须恰好拥有一个字段或 root target。validateScope 替换相同 scope owner 的全部 schema 记录；trigger(names) 只替换 full owner 的选中路径/后代及 validation.full 根记录，其他 scope 记录保留；完整 trigger()/submit 校验替换所有 schema owner 的记录。manual/server/execution 不被 schema 成功误清，按各自生命周期清理。

clearErrors(name) 按逻辑 target 的路径边界匹配记录，不向 RHF 传原业务 name：字段父路径包含后代，单独清 profile.message 不影响 profile 自身或 profile.type；root 清全部逻辑根记录，root.<name> 清该逻辑名及其后代，无参清全部。resetField/unregister(preserve=false) 用相同字段匹配规则。getFieldState 的 invalid 按路径子树计算，issues 包含该子树完整记录；具体 FieldError 读取该字段自身记录，避免将子控件文案重复挂在父控件。FormErrorSummary 展示每个可定位 target，根错误单独显示。

列表结构操作先使在途任务失效，再在同一桥接事务中按旧→新 index 映射更新 field target：move 使用索引置换，insert 平移后续索引，remove 删除被删行后代并压缩余项；支持嵌套数组，其他路径和逻辑根不改。issue 原 path 是原始诊断证据，保持不变；实际定位/清理依据随行移动的 target.path，下一次校验生成新的原 path。数组父 issue 保留到结构重验替换，相关旧 server 记录按输入/结构变化生命周期清理；剩余 schema/manual 记录映射到原行的新位置。更新最终写回同一个 RHF records 叶，事务期间只发布最终 facade 快照，再由协调器重验受影响数组。

不同 scope 在同一字段产生的问题可共存，完整校验是最终提交权威；开始新提交清理前次 server/execution 错误，输入变化清理该路径的旧 server 错误。manual 错误由显式 clearErrors/reset/resetField 或字段删除清理，不能充当第二份阻止 schema 提交的规则。validationStatus 只描述最近完整 schema 的结果，不描述服务器成功；任意值/结构变化回到 unvalidated。FieldError 和 Summary 显示时可按 message 去重；state.errors 和 getFieldState.issues 必须保持所有 issue 及来源，保证同文案的两个问题不会丢失。

## 6. Scope 投影、依赖与 Steps

scope.id 使用安全非空标识 `[a-zA-Z0-9_-]+` 并排除危险段；根 issue 的逻辑 target 为 `validation.scope.<id>`。fields 是错误和更新归属路径；validationDependencies 是该校验需要读取的额外路径。投影按二者的 union 建立新对象，保持完整路径结构，父路径覆盖后代且不重复，缺失属性仍缺失而不强填 undefined。数组 index 保持原位置和长度所需空洞，不重新编号；若 schema 要验证整份数组，fields 应声明数组父路径，避免把单行投影误当密集数组。

配置比较分三层，不能以 fields/steps 数组对象身份判断模型重建。普通展示配置（label/title/description/className、options、render 回调等）取当前 render，引用变化不 reset 输入、不取消导航；已声明路径的等价字段配置保持注册身份。步骤结构以有序 `(id,kind,规范化字段集合,规范化依赖集合)` 比较，路径集合校验后去重、按段排序并折叠被父路径覆盖的后代；相同内容的新数组不改变 structureVersion。顺序、id/kind 或归属/依赖语义改变才递增 structureVersion，取消旧导航和相关校验；已有合法 currentStep 保留，移除当前步时请求/切到第一步；值和默认基线不重置。实际值删除/数组结构变化仍按 revision 仲裁。

scope 的定义为 `(id,规范化 fields,规范化 dependencies,validationSchema 引用)`，registry 保存 definitionVersion 而非配置对象引用。相同定义反复声明或 validateScope 不报重复 id 错误；仅同一 committed 配置中两个 owner 对同 id 声明不兼容定义才报使用错误。后续 commit 更新某 id 的字段/依赖/schema 引用是定义替换：递增该 definitionVersion、结算其旧请求 false、取消使用它的导航、清该 owner 旧 schema/execution 记录；不 reset 值/dirty/touched。命令式 validateScope 在请求入口提交定义；React 配置在 commit 中提交，不在 render 中写 RHF。每个校验捕获定义版本，旧结果无写权限。

任意 Standard Schema 不能安全做语义比较，scope validationSchema 必须由作者用模块常量/useMemo 稳定；新引用明确代表新校验定义，不能因外观相同而猜测等价。开发文档明确禁止在会订阅 state 的组件中每次 render 创建 z.object 作为初始化/step schema；可在开发模式提示频繁替换，但不能静默采用旧 schema。普通内联 fields/steps 数组仍支持。以下是该稳定契约的正确用法（模型规则改变时应换实例/key，规则参数改变的 scope 可用 useMemo 显式生成新定义）：

```tsx
import { z } from 'zod'
import { ExForm, useForm } from '@exre/exui'

const contactSchema = z.object({ email: z.string().email() })
const confirmSchema = z.object({ accepted: z.boolean().refine(Boolean) })
const applicationSchema = z.object({
  email: contactSchema.shape.email,
  accepted: confirmSchema.shape.accepted,
})

export function ApplicationForm() {
  const form = useForm({
    schema: applicationSchema,
    defaultValues: { email: '', accepted: false },
  })
  // 此订阅触发重渲染；下面等价的新数组不取消 next，也不重置草稿。
  return <ExForm
    form={form}
    fields={[
      { name: 'email', label: '邮箱', control: 'email' },
      { name: 'accepted', label: '确认须知', control: 'checkbox' },
    ]}
    steps={[
      { id: 'contact', title: '联系', fields: ['email'], validationSchema: contactSchema },
      { id: 'confirm', title: '确认', fields: ['accepted'], validationSchema: confirmSchema },
    ]}
    submitLabel={form.state.isSubmitting ? '保存中' : '保存'}
    onSubmit={async (output) => { await Promise.resolve(output) }}
  />
}
```

schema 输入根为该投影对象；依赖路径和当前字段 issue 都可以阻止前进。scope 输出丢弃，输入永不被部分 transform 替换。scope issue 若指向投影之外则作为该 scope root issue，不能把错误写入未参与的未来字段。validateScope 返回 false 于 issue、异常或取消；成功仅清 scope 拥有的 schema issues，不标整表 valid。全量 transform/跨字段约束只在最终完整 schema 通过后生效。

字段 dependencies 只订阅声明路径，使用 RHF useWatch；有 validationScope 时重验该 scope，否则使用具有限制的 trigger(name)。值相同的程序写入不触发依赖无限循环；条件计算只读，不隐式 setValue。visibleWhen=false 默认取消挂载并保留输入；preserve=false 显式 unregister 删除值、错误与字段标志，增 revision；schema 必须允许该缺失值。

Step 类型为可编辑步（id/title/fields/validationSchema/validationDependencies）或 `kind:'review'`（id/title/render(snapshot)，无 editable fields/schema）。steps.fields 与全局普通字段名或列表父路径对应，每个编辑字段恰归属一步；review 只读当前 RHF 快照。next 验证当前 scope，back 不验证；goTo 后续步按顺序验证途经 scope，任一取消/错误立即停止。切步前后不创建新 RHF 实例，所有步骤值保留；步隐藏与 preserve=false 的条件删除必须分开处理。

ExForm 受控 currentStep 为安全 step id；onStepChange(nextId) 是切换请求，调用方必须提交新 id。验证成功但受控值未更新时不自行跳转。footer render 接收 state、currentStep、next/back/goTo/submit/reset 操作及是否首末步，默认最后一步按钮才为 type=submit。next/goTo 返回 Promise<boolean>：非受控模式实际到达目标后为 true；受控模式只有目标 prop 确认后才为 true。等待确认期间不占 isValidating，调用方不确认则保留当前步和可取消的导航任务，不设猜测超时。

step controller 独立维护单调 navigationVersion。每次 next/back/goTo、错误定位导航，及非预期受控 currentStep 改变，都先使旧导航立即 settle false、撤销其校验需求/待确认和 focus 权限，再递增 navigationVersion；即使 back 到首步无需移动也先取消旧任务。back 不校验并立即请求/应用前一步。异步导航捕获 `(ownerEpoch,structureVersion,navigationVersion,startStep,scopeDefinitionVersions)`；校验完成到发出目标切换请求之前还必须检查实际 currentStep===startStep。goTo 向前逐个校验途经 scope，但只在全部有效后请求最终目标；验证期间后退、外部切步或新的导航都使旧任务无权继续校验/跳步。与其他独立校验共享批次时，撤销的是该导航拥有的需求，其他仍有效目标继续验证。

受控请求记录 `{navigationVersion,from,to,ownerEpoch,structureVersion}` 待确认：同一版本的 currentStep prop 从 from 变为 to 是该导航的确认，不再次递增版本；在确认阶段以目标步检查归属，结算 true 并消耗待确认。prop 未改变的普通重渲染不算外部切步；不同目标、已被新导航撤销的请求或已失效 owner 的 prop 变化按外部展示切步处理，递增版本并立即结算旧任务 false，不复活旧请求。父组件直接改 currentStep 仍是外部展示控制，最终完整校验不被绕过。

完整提交错误按步骤顺序定位最早所属步；定位同样拥有导航版本，请求切步确认后等待目标 ref 注册再 focus，受控调用方未挂载目标时 Summary 仍显示错误且不无限轮询。单次 focus 等待最多两个 animation frame；每帧检查 owner/导航版本和当前目标步，失效即停止。

非最后步的Enter或原生form submit事件preventDefault后路由next，不调用业务onSubmit；最后步才进入完整submit。form.submit()是明确的业务提交方法：连接有steps的ExForm时若尚非最后步，拒绝为Form使用错误且不发送业务回调，不隐式越过步骤；调用方使用next/goTo推进。reset/cancelPending/unmount/关闭清理/模型切换先撤销全部导航和待确认、递增 owner epoch 及 navigationVersion，使任务立即结算false。reset及clearOnDestroy随后将非受控步骤恢复steps[0].id；受控模式建立新版本的首步请求，旧步骤异步任务不得确认或导航新流程。cancelPending只取消，不改变当前步；隐藏未卸载的Dialog由调用方关闭回调执行reset/cancelPending。

## 7. 校验与提交的并发状态机

协调器只有瞬时任务快照和元数据：epoch、revision、单调 requestId、pending targets/scopes 与需求 owner、submitAttempt，以及步骤/校验定义版本。每个任务有独立 settle-once deferred。值/结构变动增 revision；reset/unmount/cancelPending 增 epoch 并清任务。导航版本与普通输入 revision 分开，back 即使不改值也使旧导航失效。提交和校验通知同一状态订阅。

校验批次启动时 capture(epoch,revision,requestId,snapshot,scopeDefinitionVersions)，并行运行所需 full/schema scopes；同一轮事件按微任务合并请求。新的正式批次使旧批次立即结算 false，旧目标/scopes 并入新批次在新快照重验；主动撤销导航需求或被替换/移除的 scope 不被作为旧需求重新带回。只有当前三元组、定义版本及有效需求 owner 全部匹配的结果才能原子更新 RHF records；任一已取消结果无写入权。被丢弃 Promise 的 rejection 仍须有 catch，不能导致 unhandled rejection。isValidating 仅表示当前有效批次，旧不可取消请求不计入。

| 提交状态/事件 | 动作、结果与锁 |
| --- | --- |
| idle → submit | 同步分配 attemptId 和 deferred/AbortController，锁定；submitCount+1；开始 full preflight |
| validating → 合法且 token/revision/epoch仍有效 | 更新 schema issues/status，进入 submitting；以解析 Output 调用 onSubmit 一次 |
| validating → schema issue | 写有效错误、定位；resolve invalid，释放本 attempt锁 |
| validating → schema抛错 | 写execution错误并回调onSubmitError；resolve failed，释放锁 |
| validating → setValue/结构变化/新的正式批次 | 立即resolve cancelled、abort、释放本attempt锁；新后台批次不继承onSubmit权限 |
| validating/submitting → reset/cancelPending/unmount | 立即resolve cancelled、abort、释放锁；旧Promise无回调/错误/状态写入权 |
| submitting → Promise resolve | 有仍有效的context业务错误则failed，否则submitted；释放锁，不自动reset |
| submitting → Promise reject | 有效时onSubmitError+root.execution并failed；失效时仅吞弃结果；释放只限自身token |
| 在途 → 重复submit | 返回同一个attempt Promise，不再验证/回调/计数 |

blur 与 submit 的顺序必须明确：submit 开始前已排队且属于同一 snapshot 的后台 blur 被完整 preflight 吸收，不形成替代请求。提交锁内适配器 onBlur 仍调用 RHF field.onBlur 记录 touched，但不排后台验证；禁用造成的 blur 不能把 Enter 提交反复取消。显式 trigger/validateScope 创建的新批次，或锁内程序 setValue 修改输入，若发生在 preflight 阶段则按表格立即取消。禁止旧 full 结果先调用 onSubmit 再检查 token。

业务回调已开始后的 setValue 不撤回已发送快照，但增 revision；旧上下文 setFieldError/setFormError 不能覆盖新草稿。两方法分开检查：attemptId/epoch 仍有效且未取消时先标记该 attempt 的 businessFailed；只有捕获 revision 也匹配时才写当前 RHF server 记录。草稿已改但服务器报告失败时，不显示旧草稿错误，submit 仍结算 failed，不能误报 submitted；已取消 attempt 对业务标记和UI均无写权限。仍有效 attempt 的回调完成依然结算 submitted/failed；不因草稿后来变化而自动reset新输入。若回调reject时revision已变，结算failed并报告onSubmitError，但不将旧异常写为新草稿的逻辑root.execution；字段写入仍只能通过守卫后的上下文。取消只能使回调signal失效和UI任务结束，不能承诺撤回服务器副作用。

finally 的解锁必须 compare attemptId；旧任务后完成不能清新锁、改新submitCount或更新state。reset/cancelPending 能在用户提供的Promise永久不resolve时立即结束可见锁；不存在默认网络超时或自动重试，消费方负责远端策略。

## 8. 控件绑定、焦点与生命周期

| 适配器 | 值/事件及 focus/aria 目的地 |
| --- | --- |
| Input/Textarea/date/number | value用字符串空显示；onChange(event.target.value)；onBlur；id/name/ref/aria在真实input/textarea；type由control决定 |
| Select | 用SelectField+Trigger+Content组合，onValueChange(next)；ref/id/aria/onBlur落Trigger；name在Root，disabled不删除RHF值；不简单展开field到高层Select |
| Checkbox/Switch | checked=boolean；onCheckedChange(next)规范为boolean，indeterminate不进入该boolean模型；ref/id/aria/onBlur落Root实际button |
| RadioGroup | value/onValueChange；组aria-labelledby/aria-describedby/invalid在group；focus指向首个可用radio，组外blur才触发，组内移焦不反复校验 |
| CheckboxGroup | string[]；每个项从数组派生checked，改变输出新数组；组label与error关联，焦点为首个可用项 |
| MultiSelect | 复用公开Combobox多选组合，value/onValueChange是string[]；搜索文本是局部UI状态，不是另一份字段值；ref/id/aria在输入，关闭或整体离焦时onBlur |
| Select-or-input | Input+原生datalist提供可填写选项；final string是唯一字段值，无额外selected值；id/list关联稳定；disabled项不展示为可选择建议 |
| Files | RHF保存File[]；原生input私有ref用于读取/清空，field.ref指向可见选择按钮，组label/error同时关联按钮和input |

自定义render按照公开参数自行映射；无法提供真实focus target的控件仍显示Summary，不宣称setFocus成功。noStyle不生成Field/Label/Error外壳，仍提供全部accessibility，调用方自行渲染错误与标签。生成id使用React useId+路径编码，不用全局自增；多个表单/SSR hydration不会撞id。input controls与summary导航阻止内部操作按钮误提交。

文件选择/drop/paste追加到现有File[]，删除按当前项位置输出新数组，不静默去重/过滤/上传；选择器accept仅提示，数量/类型/大小的最终错误来自schema。只在drop包含文件或paste含文件项时接管事件，不拦截普通文本粘贴。读取后清空原生input.value，reset再次清空，从而同一文件可重选。数据只驻内存；若创建对象URL，remove/reset/unmount立即revoke，不输出未编码文件名到HTML字符串。

Form connect effect具有owner token；unmount先取消任务再解绑，clearOnDestroy=true随后reset到当前默认值，false保留输入/dirty/touched/已显示错误。隐藏但未卸载的Dialog由消费方关闭回调reset/cancelPending，库不猜open状态。步骤卸载总保留已填值；条件preserve=false才删除。Focus/scroll仅在存在document的客户端执行，先检查HTMLElement ref.isConnected、owner及有效导航版本，滚动目标是字段容器，使用最近可滚动区域；reduced-motion时将smooth降为auto。控件提交期间禁用，布局容器不通过RHF disabled省略值。

## 9. 打包、Showcase 与消费文档

公开根必须显式导出组件、hooks及类型；不改package exports入口集合、tokens实现或React optional peers。RHF代码进入bundled-modules/third-party notices；bundle-types内部化其声明，check-dist不残留RHF/spec/Zod裸导入。类型文件在src/lib、公开hooks在src/hooks、组件在src/components，满足当前tsconfig.lib的源码覆盖与依赖遍历。生成dist/types不能手改。

Showcase五类预览对应已批准spec；新FormExamples只从`@exre/exui`及消费者`zod`导入，styles用Showcase.css。Examples必须在pnpm build后验证，目录搜索新增四个主组件，不删除基础控件例子。Zod3日期字符串及文件schema只在浏览器分支创建需要File的规则；SSR fixture可用不含文件的schema，另测试files空数组外观SSR不触发File全局读取。

消费文档新增Form参考和配置式/组合式完整TSX示例，写明自己安装Zod、同源RHF、scope限制和生命周期。当前skill example gate禁止zod，必须同步做窄变更：只追加`zod`至allowlist、fixture固定安装3.25.28并保持拒绝RHF/resolvers/私有路径；TESTING与react-setup说明同步，self-test证明zod被允许而sonner等旧禁项仍被拒绝。Zod4兼容由独立pack fixture承担，不把global override移入fixture。generated inventory通过update.mjs生成，覆盖新路径/公开符号，不手改生成内容。新用户功能为@exre/exui minor Changeset；不在本RFC阶段运行版本化或发布。

## 10. 验证矩阵与必须包含的反例

实现使用现有Vitest Browser/Chromium公共产物用例，无需新增测试框架；以下验证须通过公开接口，不访问私有subjects。异步用例使用可控制deferred schema/回调，不依赖真实网络。错误样本必须先证明反例会触发失败，避免测试只镜像实现。

| 类别 | 验证与反例 |
| --- | --- |
| 类型推导 | Zod3/4消费schema推导I/O；age输入string/输出number；非法name、错误setValue类型、number路径用text、render错误onChange、标量FormList、外部RHF实例、ExForm双schema/form用`@ts-expect-error`钉死；role enum的未知option、tags enum数组的未知option、readonly string[]用multi-select、readonly对象数组用FormList均拒绝，typed render保留readonly模型；不能把Input当Output |
| Issue桥接 | profile自身与profile.message/type/types/issues/ref子字段同时有完整issue，独立定位并只clearErrors('profile.message')后保留父/兄弟；数组父/行同样共存，move/insert/remove后的target定位/单独清理正确；同路径两个同文案issue在state都存在而DOM可合并；full/scope/manual/server来源同时存在并按各自owner替换；`{key}`、symbol、恶意路径归属root不污染原型；scope外issue不写未来字段 |
| 步骤 | 未来必填字段缺失不阻止当前scope；full schema跨字段约束仍阻止最终回调；带refine/union/transform完整schema不能自动pick；array projection保持原index；B启动异步next后back到A且输入不变，旧next立即false且稍后成功不得跳C；外部受控切步、新goTo、reset/关闭同样失写；同导航受控目标prop确认只完成该任务，普通同值prop重渲染不取消；back不校验、review不另存值；非末步Enter只next、form.submit拒绝提前提交 |
| 配置稳定性 | 读取form.state的父组件在异步next开始/结束时重渲染并内联等价fields/steps数组，schema为常量：草稿/dirty保留、next正常完成、无重复id错误；只改title/render/label不取消；有意替换scope schema引用/归属递增定义版本，旧请求立即false且旧结果不写入；初始化schema引用改变有清晰使用错误；规范示例使用稳定scope schema |
| 校验乱序 | 旧失败晚于新成功、旧成功晚于新失败；无关字段的新请求不丢待查目标；reset/unmount/StrictMode重连后的结果不写入；取消schema抛错无unhandled rejection |
| 提交竞争 | preflight pending时setValue→submit Promise及时cancelled、锁释放、旧结果永不调用onSubmit；显式trigger替代同样结算；blur先于submit及禁用导致blur不会卡死/重复回调；业务回调开始后setValue改稿，旧context报告server失败不写UI却返回failed；cancel后的context不影响新attempt；旧finally不能解新锁；永久pending回调cancel后界面可再次提交 |
| 状态订阅 | 只读取form.state的父按钮在开始/结束/取消时真实更新；useContext消费者同步；局部成功保持unvalidated；clearErrors不伪造valid；RHF默认值两行move变dirty、移回恢复，不将dirty绑到key |
| 控件 | Select的label/aria/ref在真实Trigger且失焦和focus有效；checkbox/radio/multi-select实际value类型；manual/server错误写入后blur或同值change不被RHF原生校验清空，实际输入变化只由协调器清该路径server且保留manual；公开onSubmit/onBlur/onChange模式仅由协调器决定；disabled完整验证仍包含值；自定义render同源；noStyle依然能关联错误 |
| 文件 | 限制0/1/5/6个、大小边界、允许类型由示例schema产生错误；选择/drop/paste/删除；普通文本粘贴不拦截；同文件重选；reset/unmount释放URL；无storage写入 |
| 布局/Modal | 320px、375px、390px、桌面；窄Dialog在宽视口仍单列；长label/issue/filename不水平溢出；step错误切步后focus、内部滚动、Escape恢复触发器焦点 |
| pack/SSR | 两个独立Zod版本strict skipLibCheck=false编译/SSR/生产build；packed ExForm在Chromium验证parsed提交和错误，不只测原生form；SSR无document/File读取；tokens-only npm/pnpm树仍无RHF/Zod/React及类型依赖 |

完整交付运行TESTING.md既有完整验证：tokens:check、typecheck、lint、build、skill updater self-test/check、verify-examples、test:visual、verify:pack、release:verify/test:release与diff --check。行为用例不新增截图baseline，现有Windows截图门禁照常保留；320/375宽度用当前浏览器用例临时resize并恢复，不能只依靠默认390px实例。

当前证据：Leader的Zod3 V1/transform/async runtime探针PASS；RHF7.89.0与Zod4.6.5registry只读核对PASS。新增组件的类型/SSR/build/pack/browser全部NOT_EXECUTED。RFC自身只做文档检查，不把计划测试当已通过。

## 11. 落地顺序、停止条件与回滚

这是依赖顺序，不是额外implementation plan：先落官方结构类型/精确公开类型与依赖锁；再落快照/投影/错误桥接/coordinator/facade；随后Form/Item与基础适配器；再List/依赖/Steps/files/布局；最后Showcase、消费文档和完整pack门禁。类型/协调器反例必须在复杂展示前有可运行验证。每个阶段保留既有组件与tokens gates，最终公开交付一个coherent表单子系统，不发布半成品接口。

如任何RHF声明不能内部化、tokens-only引入React/RHF、输入输出类型被迫any化、async反例失败或schema路径无法无损保留，停止进入发布阶段并交Leader处理，不恢复RHF生产依赖或削减schema类型绕过。pnpm-lock.yaml需集中由依赖修改阶段维护，保留其他已存在内容；本RFC不授权覆盖无关改动或提交。

没有数据迁移或持久化变化。发布前回滚为撤销新增表单文件、显式导出、样式import及其依赖/gates/docs/Changeset，继续运行旧pack/visual验证。已经被消费方使用后，删除公开表单接口属于breaking change，不用回滚名义静默删除；修补缺陷或由维护者单独决定major兼容策略。回滚不能撤回消费方已发送的HTTP请求或服务器写入。

## 12. 风险、ADR 与待决策项

| 风险 | 缓解与检测 |
| --- | --- |
| 泛型联合/递归列表导致推导变宽或过深 | schema/form单一推导源+NoInfer；严格类型fixture和嵌套列表样本，不能扩大到string/any |
| 仲裁/订阅漏掉写入或解锁 | 全部公开写入与绑定经revision；attempt token解锁；deferred反例和父按钮state订阅用例 |
| scope作者未复用业务规则或数组投影schema不符 | 显式scope与投影文档；最终full schema必跑；跨字段/稀疏数组反例 |
| 可取消UI与不可撤回业务副作用混淆 | signal与token分开；文档明确消费方abort合作和服务器责任，无自动重试 |
| 本地File自定义对象dirty不可靠 | 公开沿用RHF行为，不新增第二store；有效性在schema，文件操作有明确展示和测试 |
| 新库与Zod版本声明冲突 | 保持内置RHF/结构化V1；双外部Zodfixture和tokens-only排除树 |

ADR_REQUIRED: yes。独立评审后由ADR Writer在`.notes/ex-form/rfcs/`记录“Standard Schema V1公开校验契约”和“同源RHF facade/协调器状态所有权”两项决策；不写`.ai/`。本RFC没有待用户重新选择的方向或TBD，具体实现不得改写已批准spec。若独立评审找到真实契约冲突，由Leader仲裁后定向修订。

证据来源：批准spec及其引用的仓库文件；spec独立评审；`TESTING.md`、`CONTRIBUTING.md`、`pnpm-workspace.yaml`、组件`tsconfig.lib.json`、skill`verify-examples.mjs`的现有allowlist。技术原文：[Standard Schema V1](https://standardschema.dev/schema)、[RHF public subscribe](https://react-hook-form.com/docs/useform/subscribe)、[RHF useFieldArray](https://react-hook-form.com/docs/usefieldarray)、[Zod基础用法](https://zod.dev/basics)。精确依赖版本来自本次官方npm registry查询，不构成运行兼容证明。
