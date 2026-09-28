# 表单异步任务与消费约束

最后更新：2026-09-27

结构与权威状态边界见 [`forms`](../../architectures/components/forms.md)。以下约束解释消费代码为什么可能出现看似意外的行为。

- 初始化 schema 引用是模型身份。每次 render 创建新 schema 会被拒绝；使用模块常量或 `useMemo`，模型切换使用新实例或 key。新的默认值对象不会自动覆盖草稿，修改默认基线必须显式 `reset`。等价的普通字段及步骤配置数组可以重建，schema 定义引用变化则具有实质含义。
- 局部 scope 接收保留原路径的字段与依赖投影。数组索引保持原位置及空洞；需要密集整数组的规则应声明数组父路径。局部通过不等于完整 schema 通过，scope transform 不回写输入，也不成为业务提交数据。
- 校验取消代表结果失去写入权，不代表任意 validator 已停止执行。同批 scope 撤销后会移除它的等待权，复用仍有效的校验 Promise；撤销的 validator 即使不结算，也不能拖住独立字段校验。提交的 abort signal 同样依赖消费方合作，不能撤回已发送的服务器副作用。`cancelPending`、reset、卸载会及时结算界面任务，不等待外部 Promise 完成。
- 提交前校验期间的输入修改取消该次提交；业务回调已经开始后修改草稿，则保留已发送的快照。后来的服务器错误仍可将原尝试标为 failed，但不写到新 revision 的草稿上。旧尝试完成不能释放新尝试的锁。
- 受控导航的 Promise 要等待目标 `currentStep` prop 确认；只调用 `onStepChange` 不代表已经切换。结构更新移除当前合法步骤时会取消旧导航并请求首步，同值旧 prop 的普通重渲染不重复请求；无步骤时不发出 undefined 目标。返回、外部切步、新导航或关闭清理会取消旧导航。非末步的原生提交事件推进当前步，业务 `form.submit()` 在非末步拒绝。
- 文件只在内存中保留原生对象身份，不通过 JSON 快照转换。文件 dirty 沿用 RHF 的原生对象比较限制；有效性由 schema 检查，不能用 dirty 判断文件内容是否相同。选择器 `accept` 只是提示。
- `clearOnDestroy` 依赖 Form 真正卸载。只隐藏的 Dialog 必须由消费方关闭处理程序调用 reset/cancelPending。步骤暂时隐藏与条件字段 `preserve=false` 删除值是不同操作。

证据：协调器与路径快照源码；`FormAsync.vrt.test.tsx`、`FormSteps.vrt.test.tsx`、`FormControls.vrt.test.tsx` 的公共接口反例；消费契约见 [`Form` 参考](../../../skills/exui-usage/references/components/Form.md)。本地检查结果不代表远端 CI 或 npm 发布已通过。
