# 产物样式表把 foundation 引用生成为 CSS 变量引用

最后更新：2026-09-18

状态：已接受
模块：tokens
日期：2026-09-18
来源：`packages/tokens/scripts/generate-css.mjs`、`packages/tokens/scripts/foundation-reference-policy.mjs`、`packages/tokens/src/style.css`、`packages/components/README.md`

背景：配方树对 foundation Token（`typography`、`radii`、`shadows`）的引用是契约要求——`validate-tokens.mjs` 强制 `radius`、`fontSize`、`lineHeight`、`fontWeight`、`fontFamily`、`shadow` 字段必须是 `{ kind: "foundation" }` 引用，`token-length-policy.mjs` 也在 JS 层按引用解析取值。但生成器把这 61 处引用（`typography.fontFamily`×7、`bodyFontSize`×10、`radii.extraLarge`×8、`shadows.focus`×9 等）在生成期替换成了字面值，只把 `{ kind: "semantic" }` 引用写成 `var(--exui-…)`。结果是：消费者在 `:root` 覆盖 `--exui-font-family` 或 `--exui-radii-*` 时，`root` 变量确实变了，组件里却仍是冻结的旧值，而且渲染完全正常——截图对比、计算样式断言、打包消费者门禁都发现不了。换品牌字体是外部项目最常见的定制诉求，却需要同时覆盖 7 个 `--exui-component-*-font-family` 才能生效；`:root` 上也只有 `--exui-font-family`、`--exui-font-weight-*` 与 `--radius` 存在，`typography` 的字号行高、`radii` 与 foundation `shadows` 根本没有对应变量。

被否的备选方案：

1. **只写文档，让消费者照清单逐个覆盖配方变量。** 表达力足够但不解决问题：清单有几百项且随版本漂移，foundation 组连变量都不存在，消费者只能硬编码字面值，等于把内部实现复制进应用。
2. **在公共包上导出生成器**（把 `createCssVariables` / `renderCss` 从 `scripts/` 移进 `src/` 并从 `@exre/exui/tokens` 导出），让消费者在构建期 deep-merge 自己的 Token 树再自己产出样式表。表达力最强（连 density 都能改），但把展平规则、语义映射表与跳过 `defaultVariant`/`defaultSize` 等实现细节一次性变成公共 API，还要同步 CJS 入口、声明产物与三处契约门禁。当前需求（换色、换字体、换圆角）用不着这个代价，保留为将来真正出现深度定制需求时的选项。
3. **让 shadcn 短别名全部改成引用 Token**（`--primary: var(--exui-control-primary)` 等）。它修的是另一个问题（别名与 Token 各持一份拷贝），涉及 30 余条别名与 shadcn 生态的变量语义，单独评估；本次只把与之同源的 `--radius` 改成 `var(--exui-radius-large)`，其余写进文档。

决策：生成器新增 `foundationVariableByReference` 映射表，把每个 foundation 契约路径固定对应到一个 CSS 变量名（`radii.*` → `--exui-radius-*`、`typography.fontFamily*` → `--exui-font-family*`、`typography.fontWeight*` → `--exui-font-weight-*`、`bodyFontSize`/`smallFontSize` → `--exui-font-size-body`/`-small`、`bodyLineHeight`/`smallLineHeight` → `--exui-line-height-body`/`-small`、`shadows.*` → `--exui-shadow-*`）。`:root` 由同一张表生成 foundation 变量声明，配方解析对 `{ kind: "foundation" }` 输出 `var(<映射名>)`，与 semantic 引用一致；未映射的路径仍在生成期硬失败。`--radius` 改为 `var(--exui-radius-large)`。基础变量只声明在 `:root`：foundation 与主题无关，`.dark`/`.pitch-black` 仍然是相对 light 的差异块，`.density-compact` 不变。

理由：契约（JS）已经把 foundation 引用定为引用，产物此前是不一致的另一半；让两者对齐不需要新增公共 API，只把已有的 61 处引用按同一规则写出来。消费者覆盖因此获得一个可预测的三段式模型——语义 Token、foundation Token、`--radius` 派生——而配方变量退回为组件内部层，只在需要精确到某个状态色时才被覆盖。

影响：计算值逐值不变（引用解析到同一个值），因此没有视觉基线变动，也不是破坏性变更；变的是"覆盖 foundation 会传导到组件"，这使 `--exui-font-family` 等基础变量成为配方的运行时依赖——若某个作用域内被重新定义，其下的组件会跟着变，这正是覆盖契约本身。`--exui-shadow-{small,medium,large}` 是新增的未引用变量（契约里有、配方没用），保留它们是为了让"契约里的每个 foundation Token 都有 CSS 变量"这条不变量完整可断言。新增纯策略模块 `foundation-reference-policy.mjs`（含 `*.test.mjs`）承担四条断言：映射与契约叶子集合互相覆盖、映射命名的变量已声明且取值等于契约值、配方变量不引用未声明变量、每条 foundation 引用的出现次数等于引用它的配方叶子数。`tokens:check` 的步骤与 `verify-cjs.mjs` 的模块种类判定都不受影响。

重新审视条件：出现真正需要改 density 或改展平规则的定制需求（此时方案 2 重新进入评估）；或 shadcn 别名与 Token 的关系本身需要重构（此时方案 3 与本次的 `--radius` 处理要一起重看）。

证据：`packages/tokens/scripts/generate-css.mjs` 的 `foundationVariableByReference`、`readFoundationValue`、`addFoundationVariables` 与 `resolveRecipeValue` 的 `foundation` 分支；`packages/tokens/scripts/foundation-reference-policy.mjs` 及其 `*.test.mjs`（含"配方变量内联 foundation 取值"的否定用例）；`packages/tokens/scripts/validate-tokens.mjs` 的 `validateFoundationReferences()`；`packages/tokens/src/style.css` 中新增的 15 个 foundation 变量、`--radius: var(--exui-radius-large)` 与 61 处 `var()` 配方取值；`packages/tokens/scripts/validate-tokens.mjs:151` 的 foundation 引用允许集合；`packages/components/README.md` 的 Customizing tokens 段与 `packages/tokens/README.md` 的 Overriding Tokens 段；`skills/exui-usage/references/generated/token-paths.md` 的 CSS custom properties 清单。
