# ExForm 配置式与组合式表单设计

> 历史设计快照：本文的状态和验证结论记录 2026-09-27 设计阶段。当前实现与验证结果见[实施与验证记录](../reports/implementation-validation.md)。

- 日期：2026-09-27
- 状态：待用户审阅
- 模块根目录：`.notes/ex-form/`
- 本文是设计草案，不代表实现、测试、发布或最终设计批准。

用户已经同意“常用完整表单能力 + 配置式 ExForm”的首期方向，并确认按标准拼写使用 `Form`、`FormItem`。已确认核心结构是 ExForm 配置层、Form/FormItem 组合层和统一的字段状态及校验层。下文的具体类型、属性、方法及行为契约仍是待审阅提案。

## 1. 目标与范围

简单表单只需 schema、字段对象、默认值和提交回调，自动获得绑定、标签、说明、错误、可访问性和布局。复杂表单可以使用同一实例组合 FormItem、自定义控件、依赖字段、动态列表及分步界面，不另建字段 store。

首期提供：嵌套字段路径；Zod schema 校验及输入/输出类型区分；提交、失焦和变更校验；同步/异步校验；字段依赖和条件展示；对象数组动态列表；纵向、横向、inline 和响应式列布局；读值、写值、重置、指定字段校验及错误定位；Modal 生命周期和分步表单；配置式、组合式及复杂场景的 Showcase。

参考 Ant Design Form 的使用能力和分层，不承诺其属性名称、规则系统、事件顺序、NamePath 或 FormInstance 的逐项兼容。首期不实现 `rules`、任意子元素自动注入绑定、跨表单 Provider、拖拽排序引擎、可视化表单编辑器、远端 schema 或业务申请后端。标准组件名称为独立的 `FormItem`、`FormList`，不要求 `Form.Item` 等静态别名。

交接文档中的两类申请内容用作能力需求参考；邮件、去重、审核、HTTP Contract、附件存储与数据库仍由消费应用负责。本期 Showcase 可以展示申请风格的精简分步场景，不能宣称完整申请业务闭环通过。

## 2. 核心结构与依赖

`@exre/exui` 根入口公开 ExForm、Form、FormItem、FormList、FormErrorSummary，以及同源 useForm、useFormContext、useWatch、useFieldArray。表单仍属于唯一公开包，不新增公开包或 `forms` 子入口。

ExForm 将字段配置转为 FormItem/FormList；组合式调用直接使用同一组组件。内置适配器复用现有 Field、Input、Select、Checkbox 等公开组件。React Hook Form 负责字段值、dirty、touched、字段注册及字段错误；表单协调器负责校验请求仲裁、提交锁、步骤校验和生命周期，不能复制一份字段值或持久化草稿。

RHF 作为开发依赖加入组件工作区并编译进产物，只有 React/React DOM 保持宿主运行时。公开 useForm 是 ExUI 的精简实例入口，内部委托 RHF；它不是裸 RHF useForm 的直接转发。Form、FormItem 和同源 hooks 只接受此入口创建的实例，并在运行时检查实例来源。消费者自行安装的 RHF Provider、Controller 或 UseFormReturn 不在兼容承诺内，不通过类型断言伪装支持。

schema 采用官方完整 Standard Schema V1 结构类型，在源码内按官方许可完整内联并保留来源；不能缩减 `validate`、Issue.path、输入/输出推导或 Promise 分支。发布声明不得残留消费方必须安装的 spec、RHF 或 Zod 裸类型引用，使用现有 bundle-types 和严格 pack 消费者门禁验证。

不引入 Zod 实现依赖、`z` 命名空间或 `@hookform/resolvers` 运行时依赖。库调用消费方 schema 的 `~standard.validate`，通过一个薄的结果到 RHF 错误桥接完成绑定。现有 Zod 3.25.28 和 workspace override 保留；Showcase 使用现有版本，Zod 4 的结构类型和运行时兼容由隔离 pack fixture 单独验证。官方 Standard Schema 将 Zod 3.24.0+ 列为实现者，因此无须先升级全仓 Zod。

## 3. 公开 API 提案

### 配置式

```tsx
import { ExForm, type FormFieldConfig } from '@exre/exui'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1, '请填写名字'),
  email: z.string().email('请填写有效邮箱'),
  age: z.string().regex(/^\d+$/, '请填写年龄').transform(Number),
  accepted: z.boolean().refine(Boolean, '请确认申请须知'),
})

const fields = [
  { name: 'name', label: '名字', control: 'text', required: true },
  { name: 'email', label: '邮箱', control: 'email', required: true },
  { name: 'age', label: '年龄', control: 'number', required: true },
  { name: 'accepted', label: '我确认申请须知', control: 'checkbox' },
] satisfies FormFieldConfig<z.input<typeof schema>>[]

<ExForm
  schema={schema}
  fields={fields}
  defaultValues={{ name: '', email: '', age: '', accepted: false }}
  layout="vertical"
  columns={{ base: 1, md: 2 }}
  onSubmit={async (data, { signal, setFormError }) => {
    // data.age 是 number；编辑状态中的 age 仍是 string。
    const result = await saveProfile(data, { signal })
    if (!result.ok) setFormError('保存失败，请重试')
  }}
/>
```

`saveProfile` 是消费方业务回调，不是 ExUI 能力。ExForm 默认提供提交操作，允许自定义 footer；重置按钮只有显式配置时出现。自定义 footer 获得当前状态和操作，不能绕过完整提交校验。

### 组合式

```tsx
import { Form, FormItem, Input, Button, useForm } from '@exre/exui'

const form = useForm({
  schema,
  defaultValues: { name: '', email: '', age: '', accepted: false },
  mode: 'onBlur',
})

<Form form={form} onSubmit={async (data, context) => {
  const result = await saveProfile(data, { signal: context.signal })
  if (!result.ok) context.setFormError('保存失败，请重试')
}}>
  <FormItem form={form} name="email" label="邮箱" control="email" />
  <FormItem
    form={form}
    name="name"
    label="名字"
    render={({ field, state, accessibility }) => (
      <Input
        {...accessibility}
        ref={field.ref}
        value={field.value}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        disabled={state.disabled}
      />
    )}
  />
  <FormItem form={form} name="age" label="年龄" control="number" />
  <FormItem form={form} name="accepted" label="我确认申请须知" control="checkbox" />
  <Button type="submit" disabled={form.state.isSubmitting}>保存</Button>
</Form>
```

组合式 FormItem/FormList 的 `form` 是显式的类型推导来源，也必须与最近 Form 上下文一致。React 父节点的泛型不能自动传到 JSX 子节点；因此不承诺仅靠父 Form 就检查所有子节点的字段路径。ExForm 会自动传递实例，配置式用户无须重复绑定。

FormItem 接收内置 `control + controlProps` 或 `render`，两者互斥。不识别任意 children，不猜其事件、值属性或 ref。字段 render 返回控件内容；标签、说明、错误及布局仍由 FormItem 负责。`noStyle` 允许省去该外壳，调用方须保留所提供的可访问性属性。

### 实例和 hooks

`useForm({ schema, defaultValues, mode, reValidateMode })` 返回 FormInstance<Input, Output>。默认 mode 为 onSubmit，首次提交失败后默认在 onChange 重新校验；支持 onBlur、onChange、onSubmit。schema 是实例初始化契约，不能随 render 静默切换；切换数据模型应创建新实例或改变 React key。默认值更新必须显式 reset。

实例公开 getValues、setValue、reset、resetField、setError、clearErrors、getFieldState、setFocus、scrollToField、trigger、validateScope、submit 和 cancelPending。读写值均使用输入类型，字段名使用输入模型的 FieldPath，setValue 的值必须符合对应 FieldPathValue；submit 的成功回调使用输出类型。不复制 AntD 整套方法名，也不公开 RHF 内部 control 或 subjects。读取与 render 提供的值按只读快照使用，写入只能经过绑定回调、setValue 或列表操作；校验快照复制对象/数组容器，保留 File 等原生对象的身份，不 JSON 序列化或暴露可绕过 revision 的 store 引用。

`useFormContext` 读取同源实例；`useWatch({ form, name })` 按路径订阅输入值；`useFieldArray({ form, name })` 提供同源对象数组操作。类型可以引用内部化的 RHF 路径与数组类型，但消费者无需安装 RHF。

`form.state` 公开 isDirty、dirtyFields、touchedFields、errors、isValidating、isSubmitting、submitCount，以及最近完整校验状态 `validationStatus: 'unvalidated' | 'valid' | 'invalid'`。dirty/touched/errors 来自 RHF；校验和提交 flags 来自协调器。输入或结构变动使完整校验状态回到 unvalidated。局部成功不能把整份表单标成 valid；不公开具有不同含义的裸 RHF formState.isValid/isValidating/isSubmitting。

## 4. 类型、字段配置与校验结果

Form 的输入模型是带字符串字段键的对象，允许嵌套对象及数组。输入、默认值、控件绑定和路径检查基于 Standard Schema InferInput；成功提交接收 InferOutput，允许 schema trim、coerce 和 transform。解析结果不回写输入，不把 File/日期字符串或数字字符串偷偷改成另一种控件状态。

字段配置使用按路径分配的联合类型，使 name 与 render.field.value/onChange 的值类型保持对应；内置 control 只能用于兼容的路径类型。text/email/password/textarea/date/number 输入字符串；checkbox/switch 输入 boolean；select/radio-group/select-or-input 输入字符串；multi-select/checkbox-group 输入 string[]；files 输入 File[]。可选字段可以包含 undefined，但控件按自己的空值显示约定呈现；推荐为已显示字段提供明确默认值。number 是数字输入外观，原始值仍为字符串，数字转换由 schema 显式定义。

controlProps 为对应适配器的展示和交互选项，禁止覆盖受表单管理的 name、value、defaultValue、onChange、onBlur、ref、id、disabled 和错误关联属性。required 只表达必填展示和 aria-required，不能新增规则；原生表单使用 noValidate，避免浏览器另立校验来源。

custom render 得到：对应路径的值和类型化 onChange(nextValue)、onBlur、聚焦 ref；字段错误、touched、dirty、disabled/validating；以及稳定 id、name、aria-invalid、aria-describedby。调用方负责把这些值映射到自定义控件的真实事件和可聚焦元素，不要求任意控件能直接展开 field。

路径采用 RHF 风格点号字符串和数字数组下标，不支持 AntD 数组 NamePath、symbol 字段键或含点号的字面键。保留顶层 root 作为表单错误命名空间，拒绝 __proto__/prototype/constructor 路径段。Standard Schema 的字符串、数字和 `{ key }` 路径段按完整 V1 处理；不能表示、不能归属到输入模型或没有路径的 issue 显示为表单级错误，不能静默丢弃。输出形状变换后的 refinement 如需定位控件，作者必须提供输入字段路径。

同一路径的多条 schema 错误保留，并由 FieldError 展示。数组整体错误与行内错误分别显示。服务器字段错误通过 setError 映射；表单错误通过 root 命名空间和 FormErrorSummary 展示。schema 验证抛出异常属于执行失败，不伪装成用户输入错误，保留输入并经错误回调报告；界面显示可配置的通用失败文案，不直接展示异常堆栈。

## 5. 依赖、条件字段与动态列表

字段 `dependencies` 明确声明上游输入路径。visibleWhen/disabledWhen 读取输入快照；依赖改变时重新评估展示和禁用，并按该字段的校验模式安排重验。条件函数读取的每个路径都必须列入 dependencies，不自动观察整份表单。

条件隐藏默认保留值，隐藏不等于免校验；完整 schema 必须通过 optional、union 或 refinement 表达分支约束。需要隐藏后删除值时显式设置 preserve=false，并确保 schema 接受该缺失值。展示隐藏、取消注册和错误清理的差异记录在组件使用文档；不根据 Zod 内部结构自动猜测规则。

FormList 管理对象数组，提供 append、insert、remove、move，及稳定的行 key。新增必须提供完整 defaultItem，重排移动值、dirty/touched 与对应错误；RHF 生成的 key 仅用于 React 渲染，不进入业务提交数据。删除/重排会使旧异步校验失效，结构改变后重新验证受影响数组。标量数组通过多选控件使用，不承诺 FormList 管理标量数组。

ExForm 的字段联合还支持 `kind: 'list'`：name 指向对象数组，defaultItem 提供新行输入，itemFields 使用数组元素的相对合法路径。FormList 组合式 render 可接收 items 和上述操作自行排版；不在现有列表项内嵌套原生 form。列表大小及跨行约束由 schema 定义，按钮是否可添加可作为展示配置，不能替代 schema。

## 6. 分步校验契约

ExForm 可接收 steps；每步包含 id、title、fields，以及显式 validationSchema 和可选的 validationDependencies。steps.fields 指向全局字段配置的路径或列表父路径；每个可编辑字段归属一个步骤。确认摘要可以作为只读 review 步，不复制一份字段值。

前进调用 validateScope：从同一份输入快照按本步 fields 和 validationDependencies 构建保持原路径的对象，然后执行本步 schema。步骤 schema 及其 issue 路径必须采用这些输入路径；跨步骤依赖可包含已填字段，不能把未来未填写字段设为本步必需输入。root issue 阻止本步前进；本步及明确依赖的错误映射到原字段。scope 的解析输出只用于验证，不回写或提交。

步骤 schema 必须显式提供，不能自动对任意完整 schema 使用 pick/partial，不能只过滤完整 schema 的错误就声称步骤已被正确验证。调用方复用共享字段 schema 构造完整 schema 和各步 schema；跨字段规则在需要时放入明确的相关 scope，最终完整 schema 仍是提交权威。

```tsx
const emailField = z.string().email('请填写有效邮箱')
const nameField = z.string().trim().min(1, '请填写名字')
const contactStep = z.object({ email: emailField, name: nameField })
const completeSchema = z.object({
  email: emailField,
  name: nameField,
  accepted: z.boolean().refine(Boolean, '请确认须知'),
})

<ExForm
  schema={completeSchema}
  fields={[
    { name: 'email', label: '邮箱', control: 'email' },
    { name: 'name', label: '名字', control: 'text' },
    { name: 'accepted', label: '确认须知', control: 'checkbox' },
  ]}
  defaultValues={{ email: '', name: '', accepted: false }}
  steps={[
    { id: 'contact', title: '联系方式', fields: ['email', 'name'], validationSchema: contactStep },
    { id: 'confirm', title: '确认', fields: ['accepted'], validationSchema: z.object({ accepted: completeSchema.shape.accepted }) },
  ]}
  onSubmit={sendApplication}
/>
```

后退不校验、保留值；前进只在本步有效时切换；向未完成后续步骤跳转按顺序验证经过的步骤。最后一步提交完整 schema。最终错误位于其他步骤时，先切到最早错误所属步骤，等待控件挂载，再聚焦/滚动；无字段路径的错误显示摘要。支持受控 currentStep/onStepChange，但控件发出的前进操作仍经过校验，调用方直接改 currentStep 属于展示控制，不能替代最终完整验证。

trigger(names) 在非分步用途中运行完整 schema，并只更新指定路径的字段错误；它不保证完整 schema 在其他字段缺失时仍执行所有 refinement。需要独立或跨字段的可靠局部验证时使用显式 validateScope，步骤与依赖字段可以复用相同 scope。

## 7. 异步仲裁、提交与取消

Standard Schema validate 可以同步或返回 Promise，但标准没有通用 AbortSignal 契约。校验取消的承诺是“旧结果不再应用”，不是强行终止任意 Zod refinement 或网络请求。

协调器记录输入/结构 revision、生命周期 epoch 和当前校验 request。任何输入变动、列表结构变动、reset、模型销毁或 cancelPending 都使旧结果失效。每次校验在稳定输入快照上执行，只有仍匹配最新 request/revision/epoch 的结果才能调用 RHF setError/clearErrors。所有字段变更、依赖重验、trigger、validateScope 和最终提交都经过同一协调器；不把裸异步 resolver 的提交顺序当成已有取消保障。

以一次最新的校验批次为仲裁范围。新的请求替代旧请求；被替代的 trigger/validateScope 返回 false，且不显示取消错误、不前进一步。旧请求仍待验证的目标路径/scope 纳入新批次，在当前快照上重验，不能因为另一个字段开始校验就丢掉它应执行的检查。输入连续变动时按最新快照安排请求，可以合并同一轮内的依赖变更。被取消的旧 Promise 不占用可见 isValidating，不能稍后重新点亮状态或清除新错误。

submit 先同步取得提交锁，再对输入快照执行完整 schema；有效后将解析后的 Output 传给 onSubmit，等待其 Promise。校验和回调期间均保持 isSubmitting；ExForm 的按钮、内置控件和列表操作禁用，防止重复提交。来自按钮、Enter 或 form.submit() 的重复操作共享在途结果，不再执行回调。

onSubmit 的上下文提供 signal、setFieldError 和 setFormError，供消费方将预期业务失败映射到当前草稿；调用这些方法将本次结果标为 failed，保留草稿。未捕获异常调用 onSubmitError 并显示通用错误。取消、reset 和卸载会 abort 该 signal，并使旧回调的字段/表单错误写入失效；消费方是否真正停止请求取决于其是否遵守 signal，取消不代表撤回已经发生的服务器写入。

form.submit() 仅作用于与实例连接的一个 Form，返回 `Promise<{ status: 'submitted' | 'invalid' | 'failed' | 'cancelled' }>`。无连接 Form 属于使用错误；一个实例不能同时驱动两个 Form。reset/cancelPending 使旧尝试结束为 cancelled，不等待不可取消的外部 Promise 才解除界面锁；其后结果被忽略。普通 setValue 使正在校验的快照失效；若业务回调已经开始，则保留其已提交快照，旧业务错误不覆盖随后被改变的草稿。

校验桥接只负责 Standard Schema 到 RHF 字段/根错误的精确映射，生命周期元数据与公开 flags 由协调器定义。它不承诺 RHF 原生 handleSubmit、trigger 或 formState.isValid 的完整语义，避免 setError/clearErrors 与 resolver 驱动状态之间出现假一致。

## 8. 控件、布局与生命周期

首期适配文本/邮箱/密码/数字外观、Textarea、原生日期字符串、Select、RadioGroup、Checkbox、Switch、CheckboxGroup、MultiSelect、选择或自由填写、File[] 和自定义 render。Select 使用底层组合入口，把 ref/id/aria/blur 落到真正的 Trigger；复选与开关绑定 checked/onCheckedChange，不强套 value/onChange。日期采用 input type=date 的 YYYY-MM-DD 字符串，不偷偷转为 Date/dayjs；消费方需要 Calendar 时可通过自定义适配显式转换。

选择或自由填写控件的值始终是最终字符串；多选是 string[]。文件控件支持选择、拖放、粘贴文件和删除，组合现有 Attachment 显示文件名及大小。数量、大小和允许类型由 schema 定义，accept 只作为浏览器选择提示；不维护第二套校验规则。文件只存在于 RHF 内存值，不自动上传、不持久化、不自动编码成 JSON；传输、进度、重试由业务回调处理。reset 同时清理原生 file input，允许重新选择同一个文件；对象 URL 若为预览创建，移除或卸载时必须释放。

layout 接受 vertical、horizontal、inline；columns 接受 base/sm/md/lg 的 1–4 列配置，字段 colSpan 可选择列宽或整行。所有断点由库 CSS 固定，窄屏默认一列；横向及 inline 在窄容器中换行或转纵向。布局依赖容器宽度，不把 Dialog 窄表单误判成桌面宽表单。标签、错误、长文件名可换行，网格内容允许收缩，320px 视口不能水平溢出。几何使用现有 Token/rem；动态配置映射有限样式/CSS变量，不依赖消费方生成 Tailwind 类。

错误元素和说明各有稳定 id；控件关联 aria-describedby 和 aria-invalid，分组控件关联组标签。FormErrorSummary 显示字段导航及根错误。错误定位依赖已注册真实 focus target，不能只滚动不存在的 id；尊重 reduced motion，兼容 Dialog 的内部滚动区域。

普通字段卸载 preserve 默认为 true。整份 Form 的 clearOnDestroy 默认为 false：外层持有的实例可以保留草稿，但校验和提交请求始终取消。需要 Modal 关闭清除时显式 clearOnDestroy；若 Dialog 仅隐藏而不卸载，关闭回调须调用 reset/cancelPending。实例由已卸载 ExForm 自己持有时自然释放。切换申请类型使用独立实例/key；不共享文件或另一种模型的值。提交成功默认不自动 reset，交由消费方在确认成功后处理。

## 9. Showcase 与验收

在现有 Form controls 类别增加可搜索的 ExForm、Form、FormItem、FormList 目录条目，保留基础控件示例。展示内容按可运行预览组织：

1. 简单配置式表单：Zod、默认值、错误、transform 输出和 reset。
2. 组合式和自定义 render：Select/Checkbox 正确绑定、字段说明、实例方法及错误聚焦。
3. 依赖与列表：密码确认或条件字段、对象数组新增/删除/移动、数组整体错误。
4. Modal 分步申请示例：未来字段未填仍可前进、后退保留、最终完整校验、关闭清理和窄屏布局。
5. 本地文件和异步提交：选择/拖放/粘贴/删除、schema 文件限制、在途防重复、失败保留及重试。

Showcase 只从公共包入口消费，使用本地 CSS 或已构建样式，不导入组件源码或私有 hook；演示提交使用本地可控 Promise，不接真实申请 API。

依 TESTING.md，在已有 Vitest Browser/Chromium 公共产物测试中新增行为用例，不另起无必要的测试框架。重点覆盖合法/非法路径和控件值类型、input/output transform、根/嵌套/数组错误、类型正确的 custom render、真实 select focus/blur、checkbox/multi-select、条件隐藏、列表重排、步骤与跨字段反例、async 乱序、reset/unmount 后旧结果、重复提交、业务失败、文件边界/同文件重选、Dialog 焦点与滚动、320px/375px/桌面长内容布局。

pack 门禁增加隔离 Zod 3.25.28 与 Zod 4 消费者，分别用消费方 schema 检查严格类型、异步校验和 transform；负例须证明非法路径、值类型及误把 Output 当 Input 会失败。实际 packed ExForm 还须通过 SSR、生产构建、Chromium 交互，不把既有原生 form smoke 当作新组件证明。tokens-only npm/pnpm 安装继续不引入 React/RHF/Zod 等组件实现依赖，并扩大禁止依赖树集合覆盖新实现包。

基础验证为 typecheck、lint、build、相关浏览器用例、verify:pack、skill inventory/example gates 和 diff --check；用户可见新能力需要 Changeset。测试基础规则如需补充同步 TESTING.md。本次 Leader 的只读 Node 探针已验证当前 Zod 3.25.28 的 V1 version/vendor、trim、字符串到数字 transform、email issue 路径及 async refinement 成功/失败结果。新增 ExForm 的类型、SSR、pack 和浏览器测试均为 NOT_EXECUTED；该探针只证明现有 schema 的运行时协议，不能证明尚未实现的组件。

## 10. 备选方案、风险与后续

选择根入口内置 RHF 与精简同源实例，沿用单公开包及内置实现决策。独立 forms 子入口能单独消费表单代码，但带来额外构建、声明和入口门禁；首期收益不足。外部 RHF runtime/peer 会扩大宿主依赖契约，并须重新验证 tokens-only 安装和根模块解析。仅实现 handoff 最小配置层不能覆盖已确认的常用完整能力。

最大风险是 schema 局部校验与异步仲裁，而不是表单标签外观。通过显式 scope、最新快照仲裁和公开 flags 边界解决；代价是高级实例为精简 facade，不能当作完全等同 RHF/AntD 的对象。类型分配联合与递归列表须控制 TypeScript 推导复杂度；兼容性验收以严格消费 fixture 为准，不能以 any 或类型断言绕过。

用户审阅本草案后，默认交给 technical-design-doc-creator 在 `.notes/ex-form/rfcs/` 创建一个实施就绪 RFC，再由独立 Architecture Reviewer 审阅。RFC 再细化文件划分、接口类型、校验批次实现、landing order、回归用例和依赖版本。不在本阶段实现或提交；新的持久决策是否进入 `.ai/` 由用户按仓库规则另行确认。

建议 RFC 标记两个 ADR 需求：统一 Standard Schema 类型契约；同源 RHF facade 与协调器拥有的校验/提交状态。它们沿用原依赖打包方向，不授权修改既有 ADR。

## 11. 证据来源

- 前期需求交接记录（未纳入本次提交）：其中的可选入口建议、单一 schema、input/output、显式步骤和控件范围用于界定首期能力；本文以此次用户选择扩展首期范围。
- `.ai/architectures/components/public-surface.md:24–81`、`.ai/decisions/components/01-bundle-implementation-dependencies.md:12–18`、`.ai/knowledge/components/bundled-runtime-constraints.md:7–13`：公开入口、声明内部化、实现内置和 context 副本约束。
- `packages/components/package.json:13–43,69–116`、`pnpm-workspace.yaml`、`packages/components/src/index.ts`：当前入口、仅字体生产依赖、React 可选 peer、Zod 3 开发依赖及尚无 Form 导出。
- `packages/components/src/components/ui/field.tsx:52–80,174–221`、`select.tsx:16–54`、`attachment.tsx:27–196`：既有布局/错误复用、Select 触发器适配和文件展示边界。
- `.ai/architectures/showcase/consumption.md:7–18`、`packages/showcase/src/showcase/Showcase.tsx:151–153,898–969`、`TESTING.md`：Showcase 公共产物消费、现有基础表单演示和验证规则。
- [Ant Design Form](https://ant.design/components/form-cn/)：能力分层、布局、依赖、列表、方法、错误定位和生命周期的参考，未引入其实现。
- [Standard Schema V1](https://standardschema.dev/schema)：完整结构类型、同步/异步结果、路径、input/output 推导和 Zod 3.24.0+ 支持。
- [Zod 基础用法](https://zod.dev/basics)：异步 schema 与输入/输出变换的官方说明。
- [RHF Standard Schema resolver 源码](https://github.com/react-hook-form/resolvers/blob/master/standard-schema/src/standard-schema.ts)：已有结果到嵌套错误桥接的参考；本文采用自有最新结果提交门，不声称该 resolver 自带本设计的生命周期仲裁。
