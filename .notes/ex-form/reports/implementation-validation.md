# ExForm 实施与验证记录

日期：2026-09-27

状态：实施与必需本地验证 PASS；最终独立评审结论单独记录在第二轮报告中。

## 范围

依据 [RFC](../rfcs/ex-form-rfc.md)、两个 accepted ADR 和 [设计](../specs/2026-09-27-ex-form-design.md)，提供配置式 ExForm、组合式 Form/FormItem/FormList/FormErrorSummary 和四个公共 hook。涵盖 Standard Schema V1 Input/Output、单一 RHF 状态、显式校验 scope、异步仲裁与取消、受控步骤、依赖/条件字段、对象列表、全部首期控件、内存文件及容器响应布局。新增五个 Showcase 预览、使用文档、技能示例、隔离消费者门禁、minor Changeset 和源码支持的 .ai 知识。

本次没有提交授权。原有五份未跟踪需求/设计笔记保留；未暂存或修改已有提交。生成 dist/types 只经构建器更新。

## 验证证据

环境：Windows，Node 24.21.0，pnpm 11.9.0。

| 命令 | 已执行结果 |
| --- | --- |
| pnpm install --frozen-lockfile | PASS；同步新增 Zod 条目与现有 workspace override 后复跑通过，没有更新其他依赖版本 |
| pnpm release:verify | PASS |
| pnpm test:release | PASS，18 用例 |
| pnpm tokens:check | PASS，55 用例 |
| pnpm typecheck | PASS |
| pnpm lint | PASS；17 条既有 Fast Refresh 警告及 Form 文件的两条同类警告，无 Hook 清理警告 |
| pnpm build | PASS；保留 Vite 现有大 chunk 提示 |
| node skills/exui-usage/scripts/update.mjs --self-test | PASS |
| node skills/exui-usage/scripts/update.mjs --check | PASS |
| node skills/exui-usage/scripts/verify-examples.mjs --self-test | PASS |
| node skills/exui-usage/scripts/verify-examples.mjs | PASS，17 个示例在严格隔离消费者中编译 |
| pnpm test:visual | PASS，20 文件、236 用例；包含两个评审缺陷在桌面/移动项目的回归 |
| pnpm verify:pack | PASS，最终源码复跑 91.7 秒；Zod 3.25.28/4.6.5 的严格类型、真实 async refinement、SSR、生产构建和 Chromium 交互；tokens-only npm/pnpm 依赖隔离及原有门禁均通过 |
| git diff --check | PASS |

初始表单测试因公共 Form 尚未导出而红。首次完整表单测试的文件选择器重复可访问按钮缺陷已修复并回归通过。安装门禁中新增 Zod 锁条目的 specifier 不一致已修复。

## 独立评审

code-review 在 working-tree 模式审阅全部指定文件，包括已跟踪 diff 与未跟踪新文件，不按文件数截断。

第一轮已实证两个 P2：

1. 撤销同批次步骤校验后，独立 trigger 会被其尚未结算的 validator 拖住。公共接口回归在桌面/移动项目均红；取消等待集合修复后 2/2 转绿，异步与步骤套件 56/56 通过。同批仍有效的 schema Promise 保持复用。
2. 步骤结构移除当前受控步骤时，父组件暂时仍传旧 id，控制器抛错而未按 RFC 请求切到首步。公共回归在两个项目均红；记录此前合法 id、建立首步请求并等待 prop 确认后，两个项目转绿。重复渲染不重复请求，值与 dirty 保留；任意未知 id 继续报使用错误。

两项整改后已复跑最终完整验证，并再次调用 code-review 的完整 54 路径工作树评审。独立评审的逐路径 SHA、原反例复测和最终结论见本机临时目录中的 [第二轮报告](C:/Users/GRIMES~1/AppData/Local/Temp/exui-form-review-round2.md)；本记录不替代该评审结果。

## 边界与剩余验证

- 本地验证不代表远端 CI 或发布成功；未执行提交、推送、发布或业务服务器调用。
- schema validator 取消只撤销结果写入权；业务 signal 依赖消费方合作，不能撤回已发送服务器副作用。
- 动态数组路径接受普通 number 插值，运行时限制规范非负整数下标与安全路径；不声称 TypeScript 能排除所有数字字符串。
- 文件保持原生对象身份，dirty 沿用 RHF 文件比较边界。SSR 文件控件以空列表验证，schema 中的 File 构造器由消费方避免在服务器求值。
- 本次浏览器行为、布局、ARIA、焦点/滚动验证没有新增视觉截图基线。

## 精确修改路径

共 54 个文件，包括本记录。原有五份 .notes 需求笔记不在修改范围。

- `.ai/CONTEXT.md`
- `.ai/README.md`
- `.ai/architectures/components/public-surface.md`
- `.ai/decisions/README.md`
- `TESTING.md`
- `packages/components/README.md`
- `packages/components/package.json`
- `packages/components/src/index.css`
- `packages/components/src/index.ts`
- `packages/showcase/package.json`
- `packages/showcase/src/showcase/Showcase.css`
- `packages/showcase/src/showcase/Showcase.tsx`
- `packages/showcase/src/showcase/ShowcaseCatalog.vrt.test.tsx`
- `pnpm-lock.yaml`
- `scripts/verify-packages.mjs`
- `skills/exui-usage/SKILL.md`
- `skills/exui-usage/references/components/Field.md`
- `skills/exui-usage/references/generated/component-exports.md`
- `skills/exui-usage/references/react-setup.md`
- `skills/exui-usage/scripts/update.mjs`
- `skills/exui-usage/scripts/verify-examples.mjs`
- `.ai/architectures/components/forms.md`
- `.ai/knowledge/components/forms-lifecycle.md`
- `.changeset/new-ex-form.md`
- `packages/components/src/components/patterns/ex-form.tsx`
- `packages/components/src/components/patterns/form-controls.tsx`
- `packages/components/src/components/patterns/form-controls/files.tsx`
- `packages/components/src/components/patterns/form-error-summary.tsx`
- `packages/components/src/components/patterns/form-item.tsx`
- `packages/components/src/components/patterns/form-list.tsx`
- `packages/components/src/components/patterns/form-steps.ts`
- `packages/components/src/components/patterns/form.tsx`
- `packages/components/src/form.css`
- `packages/components/src/hooks/use-form-context.ts`
- `packages/components/src/hooks/use-form-field-array.ts`
- `packages/components/src/hooks/use-form-watch.ts`
- `packages/components/src/hooks/use-form.ts`
- `packages/components/src/lib/forms/context.ts`
- `packages/components/src/lib/forms/coordinator.ts`
- `packages/components/src/lib/forms/paths.ts`
- `packages/components/src/lib/forms/standard-schema.ts`
- `packages/components/src/lib/forms/types.ts`
- `packages/components/src/lib/forms/validation.ts`
- `packages/showcase/src/showcase/Form.vrt.test.tsx`
- `packages/showcase/src/showcase/FormAsync.vrt.test.tsx`
- `packages/showcase/src/showcase/FormControls.vrt.test.tsx`
- `packages/showcase/src/showcase/FormExamples.tsx`
- `packages/showcase/src/showcase/FormSteps.vrt.test.tsx`
- `scripts/form-consumer-fixture.mjs`
- `scripts/verify-form-browser.mjs`
- `skills/exui-usage/examples/form-composed.tsx`
- `skills/exui-usage/examples/form-configured.tsx`
- `skills/exui-usage/references/components/Form.md`
- `.notes/ex-form/reports/implementation-validation.md`
