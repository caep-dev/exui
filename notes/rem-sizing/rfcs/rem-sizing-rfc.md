# RFC：现有 ExUI 默认尺寸迁移到 rem

日期：2026-09-15

状态：依据已批准设计编写，待实现；未执行实现验收

设计依据：[rem 尺寸迁移设计](../specs/2026-09-15-rem-sizing-design.md)

核对基线：`df1c269`，分支 `chore/exui-usage-catalog`

用户已于本次对话批准源设计。源设计文件保留原文；本 RFC 记录批准后的技术细化，不意味着代码已完成或发布已授权。

## 1. 决策摘要

ExUI 管理的可缩放尺寸采用 rem，转换基准为 `16px = 1rem`。应用设置根字号即可调整 UI 尺寸，公共入口保持 `@exre/exui`、`@exre/exui/tokens` 及现有 CSS 子路径。

公共库不设置 `html` 字号、不声明 `--ui-scale`、不提供自动高度断点，也不新增 `/rwd` 入口或缩放运行时。保留固定描边、阴影、数字定位参数和第三方算法坐标的既有单位。

本 RFC 将基础 Token、组件消费、验证和发布说明作为一个交付单元。拆开发布会导致字号和控件几何使用不同的缩放基准。

## 2. 当前行为与问题

- [tokens.ts](../../../packages/tokens/src/tokens.ts) 定义两套 density、基础字体、圆角、阴影和三主题值。
- [recipes.ts](../../../packages/tokens/src/recipes.ts) 提供 Button、FormControl、SidebarItem、Menu、Dialog、Tabs 六套组件 Recipe。
- [recipeTypes.ts](../../../packages/tokens/src/recipeTypes.ts) 的 `RecipeLength` 当前只支持 px 或 `0`。
- [generate-css.mjs](../../../packages/tokens/scripts/generate-css.mjs) 将基础引用解析成固定字符串，再生成 CSS 变量；JS 和 CSS 都暴露当前 px 值。
- [validate-tokens.mjs](../../../packages/tokens/scripts/validate-tokens.mjs) 对长度做 px 校验，并检查结构、引用、冻结、语义颜色和 CSS 一致性。
- 组件混用 Recipe 变量、Tailwind 尺寸和少量直接写出的 CSS px。只改基础字号会造成文字放大而控件高度、图标或位移不匹配。

这里的 `packages/tokens` 是私有工作区，制品经公共 `@exre/exui` 的 tokens 子路径发布。不能新增一个独立发布包来承载本次迁移。

## 3. 目标与范围

### 必须达成

1. 根字号为 16px 时，转换项保持原有计算尺寸和现有视觉基线。
2. 根字号变化后，可缩放 Token 和 ExUI 自有组件布局按 `rootFontSize / 16` 变化。
3. 保持公开名称、变量名称、引用树结构、组件属性及 ESM/CJS 入口；`RecipeLength` 仅作类型扩展。
4. 保持 Token 无浏览器全局依赖、深冻结、框架中立以及 tokens-only 无 React 安装要求。
5. 固定像素例外有准确清单和验证，不以“所有 px 全部消失”作为完成标准。
6. 公共使用说明准确解释非 16px 根字号、JS Token 值变化及第三方尺寸限制。

### 不包含

自动响应式预设、密度接线改造、统一断点、局部缩放 Provider、第三方依赖重写、业务页面迁移、独立 RWD 入口、新的运行时根字号监听器。

## 4. 尺寸契约

### 4.1 源值与类型

需转换的长度直接在规范源中写为 `N / 16 rem`。有限小数保留精确结果并去除多余尾零，不把 1.333 当作精确的 4/3；零值允许 `0`。示例：36px → 2.25rem，14px → 0.875rem，1.5px → 0.09375rem，-5px → -0.3125rem。

目标类型：

```ts
export type RecipeLength = `${number}rem` | `${number}px` | "0"
```

保留 px 成员，避免拒绝现有消费者的自定义 Recipe 值。宽松的公共长度类型与严格的内置值策略分别验证；不把整个类型退化成 `string`。

`RecipeDuration`、`RecipeLetterSpacing`、字重、颜色及引用类型保持原含义。生成器继续序列化源值，不新增 DOM 换算、视口判断或 `calc(... * var(--ui-scale))`。

### 4.2 Token 转换清单

| 源字段 | 决策 |
| --- | --- |
| `exuiTokens.density.standard.*` / `compact.*` | 所有尺寸除以 16 转 rem |
| `typography.bodyFontSize`、`bodyLineHeight`、`smallFontSize`、`smallLineHeight` | 转 rem |
| `radii.small`、`medium`、`large`、`extraLarge` | 转 rem |
| `radii.none` / `radii.full` | 保留 `0` / `9999px` |
| 六套 Recipe 的 height、minHeight、padding、gap、iconSize、fontSize、lineHeight、普通 radius、margin、位置和 offset 长度 | 转 rem；基础引用继续引用原路径 |
| `componentRecipes.tabs.indicator.thickness` | 2px → 0.125rem |
| `componentRecipes.dialog.overlay.backdropBlur` | 4px → 0.25rem |
| `componentRecipes.menu.separator.thickness` | 保留 1px 分隔线 |
| `exuiTokens.shadows.*` 和各主题 `shadow.*` | 保留整段像素阴影，包括焦点环 |
| `menu.shortcut.marginInlineStart`、letterSpacing、duration、数字状态字段 | 保留 auto、em、ms 和原数字含义 |

基础圆角变化会通过 `--radius` 影响 [组件 CSS](../../../packages/components/src/index.css) 中的 Tailwind 圆角映射，映射表达式本身无需再除以 16。

### 4.3 自有组件中的固定 CSS 长度

以下路径均相对于 `packages/components/src/components/ui/`：

| 文件 / 用途 | 修改或保留 |
| --- | --- |
| `checkbox.tsx`：5px 圆角 | 改为 0.3125rem |
| `chart.tsx`：自有图例 / tooltip 标记的 2px 圆角 | 改为 0.125rem；1.5px 虚线描边保留 |
| `drawer.tsx`：100px 手柄宽度 | 改为 6.25rem |
| `switch.tsx`：`calc(100% - 8px)` 中的几何修正 | 8px 改为 0.5rem，保留运算符和百分比语义 |
| `tooltip.tsx`：箭头 2px 圆角和位移修正 | 2px 改为 0.125rem；±1.5px 改为 ±0.09375rem |
| `sidebar.tsx`：折叠宽度表达式中的 2px | 保留现有固定边框补偿；16px 基线与缩放后检查实际盒模型 |
| `sidebar.tsx`：rail 的 2px 细线 | 保留 2px |
| `button.tsx`：`translate-y-px` | 保留按下时一像素反馈 |
| 分隔线、边框、ring、阴影和明确的一像素对齐修正 | 保留现有像素效果 |
| 已使用 Tailwind 相对单位的 padding、字号、图标、宽高 | 保持现有表达式；检查生成 CSS 的计算单位 |

扫描源码时，Tailwind `px-4` 中的 `px` 表示水平 padding，不是像素单位，不能用字符串替换处理。`border`、`ring-*`、`h-px`、`w-px` 等要按效果分类。新发现的固定值依照本节政策加入精确清单，不扩大为全目录白名单。

### 4.4 定位与第三方边界

以下默认数值保持不变：Combobox `sideOffset=6` / `alignOffset=0`；DropdownMenu、HoverCard、Popover `sideOffset=4`；Menubar `sideOffset=8` / `alignOffset=-4`；Tooltip `sideOffset=0`。

所有调用者传入的定位数值、碰撞间距、浏览器测量结果及第三方图表数值保持上游单位契约。此迁移不对它们乘根字号，不向数字参数传 rem 字符串。

Portal 内由 ExUI 提供的 CSS 长度仍使用同一 document 的根字号。改变根字号后，定位库必须继续正确跟随锚点；验证失败时先诊断具体布局或上游自动更新路径，不能通过改变公共数值单位来绕过。

Sonner、Recharts 及其他依赖内部的固定几何不承诺同步缩放。实现者需核查实际打包样式和支持的扩展接口，在使用说明记录限制；不复制第三方完整样式、不修改依赖源码。ExUI 自有图例、tooltip 内容和图标仍属于转换范围。

## 5. 校验和生成链路

### 长度合法性

`validate-tokens.mjs` 的通用 Recipe 长度检查接受有限十进制 rem / px 和 `0`，错误消息同步说明接受范围。继续拒绝错误单位、非长度字符串、非法引用和结构缺项。

另设内置值策略检查：

- 遍历基础 density、四个字号/行高字段、普通圆角以及 Recipe 长度字段。
- 可缩放内置值必须是 rem 或 `0`；基础引用按目标路径检查规范源。
- 只按本 RFC 的字段与用途放行分隔线、full radius 和阴影例外。
- 对阴影不运行普通单长度正则，仍保留现有颜色和引用验证。
- 构建制品保持 CSS 内容一致、所有主题块完整、ESM/CJS 深等价和深冻结。

为策略检查提供行为测试：合法 rem、合法公共 px、非法单位、内置字体回退 px、遗漏几何转换、误改固定分隔线分别覆盖。可在 `packages/tokens/scripts/` 增加独立 `*.test.mjs`，由 token 检查脚本执行；若验证函数需要测试入口，提取小型纯函数模块即可，不创建新的测试框架。负例使用内存克隆，不修改真实源文件。

规范修改后通过工作区构建生成 `packages/tokens/src/style.css`，再经已有复制脚本进入公共包。不得手工修正 dist 来取得测试通过。

## 6. 文件责任与落地顺序

| 顺序 | 责任 / 文件 | 完成条件 |
| --- | --- | --- |
| 1 | `packages/tokens/src/{tokens,recipes,recipeTypes}.ts`；token 校验脚本及必要测试 | 源值和类型契约完成，固定例外可检测 |
| 2 | 本 RFC §4.3 的组件文件及实际扫描发现的同类尺寸 | 根字号变化时可缩放 CSS 一致，数值 API 保持原语义 |
| 3 | Token 生成链、组件构建、声明和包验证 | 原公共入口产出一致的新单位，无额外运行时依赖 |
| 4 | Showcase 视觉/行为测试；`scripts/verify-packages.mjs`、`scripts/verify-react-browser.mjs` | 默认基线、缩放及独立 tarball 验收通过 |
| 5 | README、`TESTING.md`、消费者使用说明与公共包 Changeset | 迁移边界和运行命令可被使用者正确执行 |

一个发布单元内按以上依赖顺序落地。无需为本次迁移修改导出路径；只有确实受新类型或新测试影响时才修改复制/打包脚本。

公共说明位置优先使用 `packages/components/README.md`、`packages/tokens/README.md` 以及 `skills/exui-usage/references/token-usage.md` / `react-setup.md`；在 Sonner、Chart 相关说明记录第三方限制。生成目录只通过现有 updater 更新，避免复制全部 Token 值到手写文档。

## 7. 测试与验收

### 7.1 16px 基线

保留现有 `ComponentRecipeContract.vrt.test.tsx` 三主题、1280×900 与 390×844 两视口的几何和视觉断言。测试明确设置根字号 16px，并逐例恢复原 inline 值和 priority。现有像素计算值应继续成立，不能把预期盲目改成 rem 字符串。

不以重录全部截图代替排查。任何 16px 外观偏差必须证明属于环境差异或解决迁移缺陷后消失。

### 7.2 缩放矩阵

建议新增 `packages/showcase/src/showcase/RemSizing.vrt.test.tsx`，复用现有 Vitest Browser / Chromium 配置，不引入另一套浏览器工具。

| 根字号 | 比例 | 检查 |
| --- | --- | --- |
| 16px | 1 | 原计算尺寸、固定效果、主题与交互 |
| 21.328px | 1.333 | 小数尺寸、文字/图标同步、浮层定位 |
| 32px | 2 | 控件两倍几何、Switch 位移、Tooltip 箭头与可达性 |

六套 Recipe 都测代表性字号、间距、几何；期望来自固定的迁移前基准乘比例，容差不大于 0.1 CSS px。尺寸上限、百分比布局、border-box 内容宽度不套用简单等比推断；逐属性验证可缩放部分和固定边框。

独立断言分隔线、边框、阴影和胶囊圆角维持固定效果。Tabs 指示条和 Dialog 模糊半径则按转换策略缩放。

### 7.3 浮层与交互

- Dialog、Menu、Tooltip 打开后调整根字号，验证内容尺寸更新、触发器相对位置和边缘碰撞处理。
- 验证 Escape、键盘导航、焦点恢复和表单提交保持正常。
- 验证 Switch 在两种状态下均正确落位，Tooltip 箭头四个方向的必要位移仍对齐。
- 在两种既有视口检查放大后的代表性内容仍可通过合理滚动访问；不承诺任意业务内容无溢出。
- 不用组件渲染次数作为验收指标；不为覆盖这些用例加入根字号监听运行时。
- 用例恢复根字号、主题和注入样式，避免污染其他视觉测试。

### 7.4 公共包

在既有打包消费者类型 fixture 中验证 `RecipeLength` 接受 rem / px / 0，使用 `@ts-expect-error` 验证无关单位被拒绝；覆盖 Bundler 与 NodeNext 的 ESM/CJS 声明。

在 tokens-only fixture 检查有代表性的新 rem 值与固定像素例外；继续验证无 React 依赖、CSS 独立加载、深冻结和 import/require 等价。

在生产 React 消费者浏览器 gate 中加入 16px → 32px → 16px 的默认 Button 几何及 Portal Dialog 检查，使用 `try/finally` 恢复字号。保留图表、表单、焦点等既有验收，确认工作区之外的制品也支持新契约。

### 7.5 执行命令

遵循仓库要求使用 pnpm 11.9.0、Node.js 24，并准备 Chromium：

```text
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm test:visual
pnpm verify:pack
node skills/exui-usage/scripts/update.mjs --self-test
node skills/exui-usage/scripts/update.mjs --check
node skills/exui-usage/scripts/verify-examples.mjs
git diff --check
```

新增 token 行为测试接入 `tokens:check`，并在 `TESTING.md` 写明路径与命名。如触及发布契约脚本，还需执行 `pnpm test:release` 和 `pnpm release:verify`。只在代码变化、失败或证据不足时补充检查，不把未执行的门禁记为通过。

## 8. 使用方迁移、发布和回退

### 使用方契约

应用可以沿用设计文档中的 `--ui-scale` 和根字号示例。示例不注入公共库。根字号设置为 16px 可保持迁移前大小；希望缩放的应用自行调整该值。

Token 的字符串从 `36px` 变为 `2.25rem` 是公开行为变化。禁止在迁移说明中建议 `parseFloat(token)` 直接取得像素；CSS 消费者保留单位，数值消费者由应用明确换算。现有用户提供的 px className、style 或数值 props 仍按原意生效。

### 发布

为公共 `@exre/exui` 添加一个 minor Changeset，明确当前 0.x 阶段的兼容性变化、16px 基准和 px 例外。实际目标版本由其他待发布 Changeset 共同决定，本 RFC 不直接改版本号或锁文件。

依次完成源码与生成制品、公开使用说明、独立包与视觉验收，再进入既有发布流程。16px 回归、浮层失效、声明错误或 tokens-only 依赖异常均阻止发布。

### 回退

发布前可回退本次迁移的专属提交并重新生成 CSS/声明，保留其他工作区变更。发布后由使用方锁回上一可用包版本，同时评估已添加的应用根字号设置；若需前向修复，发布新版本，不覆盖已发布制品。

没有持久化数据迁移。Token 源码、Recipe、生成 CSS 和组件样式必须一起回退，禁止只恢复其中一层。

## 9. 风险与检测

| 风险 | 处理与检测 |
| --- | --- |
| 根字号不是 16px 的应用默认大小变化 | 已获用户接受；Changeset 与文档明确说明，使用方自行确认根字号 |
| 漏改 CSS，文字放大但几何不匹配 | 精确源值检查、组件清单、1.333/2 倍计算值和交互测试 |
| 误改边框补偿或定位数值 | 固定例外检查，16px 基线和 Portal 定位测试 |
| 浏览器小数舍入造成误报 | 计算值容差 ≤0.1 CSS px，保持同平台视觉基线 |
| 第三方内部尺寸仍固定 | 公开说明适用边界，核查制品与扩展接口，不宣称完全等比缩放 |
| 根字号变更污染测试或消费者页面 | 测试恢复原状态；库不设置根字号；独立消费者检查 |
| 源文件正确但发布 tarball 含旧 CSS / 声明 | 以原公共入口运行 `verify:pack` |

## 10. 决策状态与交付边界

无待用户选择的架构问题。固定长度清单以当前源码为依据；实现时新发现的值按本 RFC 规则分类，若必须改变公开参数单位或引入运行时才能满足验收，应记录具体证据并重新评估该项，不能静默扩大范围。

本次 RFC 编写完成了源码、测试位置、发布约束和设计一致性核对；实现测试尚未执行。源设计保持原文。实施、提交、推送和发布不属于本次文档交付。

## 11. 实现偏差记录

按 §10 的要求，记录实现阶段核对出的偏差与证据。上文原文不改。

### 11.1 `switch.tsx` 的 checked 位移修正

§4.3 建议把 `calc(100% - 8px)` 中的 `8px` 直接改为 `0.5rem`。实测该写法无法满足 §7.2 与 §7.3 的落位要求。

证据：默认尺寸下 track 为 `w-11`（44px）且带固定 `border-2`，thumb 为 `w-6`（24px），位移为 `translate-x: calc(100% - X)`。checked 状态 thumb 与 track 内容区右边缘齐平要求 `translate = (44s - 4) - 24s = 20s - 4`，即 `X = 4s + 4`。其中 `4s` 是可缩放几何（`0.25rem`），另一项 `4px` 是两条固定 2px 边框的补偿——正属于 §4.1 要求区分的固定边框补偿。取 `X = 0.5rem = 8s` 时偏差为 `4(s - 1)px`：16px 为 0，21.328px 约 1.33px，32px 为 4px，均超过 0.1 CSS px 容差。

决策：改为 `calc(100% - 0.25rem - 4px)`，保留百分比语义与运算符，并按 §4.1 拆出固定边框补偿。16px 下值与迁移前完全一致，32px 下精确落位。`packages/showcase/src/showcase/RemSizing.vrt.test.tsx` 在三个根字号下断言两种状态的 thumb 与 track 边缘对齐（容差 0.5px），并在 21.328px 与 32px 覆盖该偏差。

### 11.2 Tooltip 箭头的 `data-[side=*]` 位移

§4.3 要求把箭头 ±1.5px 位移改为 ±0.09375rem，已按此执行。实现阶段确认：Radix 把 `data-side` 放在 `TooltipContent` 上，箭头元素本身没有该属性，因此 `data-[side=left|right]:translate-x-*` 在迁移前后都不匹配，这两个值没有实际视觉效果。本单元保留其 rem 形式以维持既有意图，不修改选择器，因为改动会改变公开视觉表现、超出本 RFC 范围。

真正生效的箭头修正是 `translate-y` 上的 `-0.125rem`（原 `-2px`），已按 rem 迁移并在缩放矩阵中按四边对齐断言验证。

### 11.3 缩放测试的测量前提

`button.tsx` 使用 `transition-all`，根字号变化会让几何属性进入过渡。视觉测试因此注入禁用过渡的样式后再断言；打包消费者浏览器 gate 不注入样式，改为等待计算值收敛后再断言。两者都不是产品行为偏差，但复核这些断言时需要知道该前提。
