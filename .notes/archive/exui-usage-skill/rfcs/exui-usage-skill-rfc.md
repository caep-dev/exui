# RFC：统一的 ExUI 外部消费 Skill

## 状态

- 状态：待评审
- 日期：2026-08-31
- 来源设计：[ExUI Usage Skill Design](../specs/2026-08-31-exui-usage-skill-design.md)
- 实施范围：仅 `skills/exui-usage/`、删除被替代的 `skills/exui-components/`

## 决策摘要

用一个名为 `exui-usage` 的 skill 替换现有 `exui-components`。新 skill 面向外部消费项目，以 `@exre/exui-tokens` 和 `@exre/exui` 的公开构建入口为事实来源，采用“人工决策指南 + 自动生成公开 API 清单”的混合结构。

Token 清单覆盖 `exuiTokens` 路径、`componentRecipes` 路径以及公开 Token CSS 自定义属性名，但不记录任何具体值。React 图标默认使用 `lucide-react`；只有品牌图形、产品专属图形或 Lucide 缺失对应概念时允许例外。

## 背景与证据

当前仓库事实：

- `skills/exui-components/` 仅说明 React 组件，未覆盖 Token 消费决策。
- `packages/tokens/package.json` 公开根 JavaScript 入口、`./style.css` 和 `./font.css`。
- `packages/tokens/src/index.ts` 从根入口导出 `exuiTokens`、`componentRecipes` 及相关类型。
- `packages/components/package.json` 仅公开根组件入口和 `./style.css`。
- `packages/components/src/index.css` 已引入 Token 的 `font.css` 与 `style.css`。
- `packages/components/src/index.ts` 是 React 包的显式公共导出聚合入口。
- `packages/showcase/package.json` 标记为 `private: true`，不能作为外部消费 API。
- `lucide-react` 已是组件包的正式依赖，Showcase 也直接使用它。

当前 skill 的组件参考仍包含 `Source: src/...` 等仓库内部路径，并有使用 Lucide 组件但未展示其导入的示例。这些内容不能构成稳定的外部消费契约。

## 目标

1. 仓库中只保留一个 ExUI 使用 skill，名称和目录均为 `exui-usage`。
2. 外部消费者可以判断应使用 React 组件、CSS Token、JavaScript Token 还是组件 recipe。
3. 自动生成的清单与两个所选 package 的当前公开构建入口一致。
4. Token 清单只暴露名称和路径，不复制会随版本变化的具体值。
5. 组件参考保留有价值的用法、组合和无障碍说明，并移除私有路径依赖。
6. 明确 Lucide-first 图标策略及例外和无障碍约束。
7. 更新过程确定、幂等，并在生成失败时保留上一版完整清单。

## 非目标

- 不修改 `packages/` 下的产品源码、公共导出或构建产物。
- 不改变 Token 值、CSS 语义、组件行为或 React 版本要求。
- 不面向 ExUI 仓库内部组件开发者编写贡献指南。
- 不增加新的通用图标库、图标封装组件或品牌图标资产。
- 不保留 `exui-components` 兼容别名；用户已选择只保留一个 skill。
- 不发布 package，不创建 Changeset，不提交或推送 Git 变更。

## 约束

- skill 必须位于仓库的 `skills/` 下。
- 支持文档使用当前 Codex skill 规范的 `references/` 目录，而不是旧 skill 的 `refs/`。
- `SKILL.md` 使用渐进披露，只保留选择规则和引用路由，不内嵌完整导出清单。
- 生成器不得编辑人工维护的说明文件。
- 所有 package 路径必须解析到仓库根目录内；不得接受路径穿越或任意外部 package。
- Windows 与非 Windows 环境都必须使用参数数组调用 pnpm，不能通过拼接 shell 命令执行配置内容。
- 没有 `TESTING.md`，因此至少执行仓库规定的 `pnpm typecheck`、`pnpm lint` 和 `pnpm build`。

## 文件结构

```text
skills/exui-usage/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── package-selection.json
├── scripts/
│   └── update.mjs
└── references/
    ├── token-usage.md
    ├── icon-usage.md
    ├── generated/
    │   ├── token-paths.md
    │   └── component-exports.md
    └── components/
        ├── Accordion.md
        ├── Button.md
        └── ...
```

不创建 skill 自有的 `README.md`、变更日志、安装指南、占位文件或与任务无关的资源。

## Skill 接口契约

### `SKILL.md`

YAML frontmatter：

```yaml
---
name: exui-usage
description: Guide external projects in choosing and using ExUI Tokens, component recipes, React components, and Lucide icons from the public @exre/exui-tokens and @exre/exui packages.
---
```

正文只承担以下职责：

1. 判断请求属于 Token、recipe、React 组件或 icon 使用。
2. React 组件请求读取生成的组件导出清单，并仅在需要具体组件用法时读取对应 `references/components/<Component>.md`。
3. Token 请求读取 `references/token-usage.md`；只有需要查具体路径或 CSS 变量名时再读取 `references/generated/token-paths.md`。
4. Icon 请求读取 `references/icon-usage.md`。
5. 要求消费者只从 package 根入口或已声明的 CSS 子路径导入。
6. 明确“语义 Token 优先、已有 React 组件优先、Lucide 优先”。

skill 保持默认的隐式发现能力，不写 `policy.allow_implicit_invocation: false`。

### `agents/openai.yaml`

保留并更新旧 skill 已存在的三个 interface 字段，不增加图标、品牌色、依赖或策略字段：

```yaml
interface:
  display_name: "ExUI Usage"
  short_description: "Use ExUI Tokens and React components correctly."
  default_prompt: "Use $exui-usage to choose and apply ExUI Tokens, React components, and Lucide icons."
```

### `package-selection.json`

文件格式固定为：

```json
{
  "packages": [
    {
      "role": "tokens",
      "workspace": "packages/tokens",
      "name": "@exre/exui-tokens"
    },
    {
      "role": "components",
      "workspace": "packages/components",
      "name": "@exre/exui"
    }
  ]
}
```

校验规则：

- `packages` 必须恰好包含 `tokens` 与 `components` 两个唯一 role。
- role、workspace 和 name 必须与上面的批准值完全一致。
- workspace 经规范化后的绝对路径必须位于仓库根目录内。
- 对应 `package.json` 必须存在，`name` 必须匹配，且不得设置 `private: true`。
- package manifest 必须公开所需的根入口；Tokens 还必须公开 `./style.css` 与 `./font.css`。
- 任何指向 `packages/showcase` 或其他 package 的配置立即失败。

该文件表达事实来源，不提供任意 package 插件机制。

## 外部消费规则

### React 路径

React 消费者使用：

```tsx
import "@exre/exui/style.css"
import { Button } from "@exre/exui"
```

`@exre/exui/style.css` 已包含 Token CSS 和字体。skill 不得要求同一 React 消费者再次导入 `@exre/exui-tokens/style.css` 或 `font.css`。

当 `@exre/exui` 已有对应组件时，优先组合其公开 API，不通过 `componentRecipes` 重写一份 React 组件。

### Framework-neutral Token 路径

不使用 React 组件的消费者可以独立导入：

```ts
import { componentRecipes, exuiTokens } from "@exre/exui-tokens"
import "@exre/exui-tokens/style.css"
```

仅在需要 ExUI 字体时额外导入 `@exre/exui-tokens/font.css`。

Token 选择顺序：

1. 主题语义层：`surface`、`text`、`control`、`border`、`feedback`、`editor`、`chart`、`sidebar`、主题 `shadow`。
2. 非 React 组件视觉复现：`componentRecipes.button`、`formControl`、`sidebarItem`、`menu`、`dialog`、`tabs`。
3. 基础层：仅在前两层不能表达需求时直接使用 `density`、`typography`、`radii`、`shadows`。

### Icon 路径

外部 React 项目直接使用 Lucide 时，应把 `lucide-react` 声明为该项目的直接依赖，不能依赖 `@exre/exui` 的传递依赖可见性。

规范示例必须包含：

- `import { RefreshCwIcon } from "lucide-react"`。
- icon-only 交互控件使用 `aria-label`。
- 纯装饰图标使用 `aria-hidden="true"`。
- 意义不明确的图标配合可见文本使用。

品牌 Logo、产品专属图形或 Lucide 没有对应概念时可以例外；例外不能引入第二个默认通用图标系统。

## 更新器设计

### 命令行接口

```text
node skills/exui-usage/scripts/update.mjs --write
node skills/exui-usage/scripts/update.mjs --check
node skills/exui-usage/scripts/update.mjs --self-test
```

- 三个模式互斥，缺少模式或出现未知参数时退出非零并打印简短用法。
- `--write`：构建所需公开入口、生成和校验全部输出，然后事务式替换 `references/generated/`。
- `--check`：执行同样的构建与生成，但只与当前生成目录进行逐字节比较；不一致时退出非零。
- `--self-test`：只使用临时目录和内存 fixture 验证确定性、配置拒绝、纯路径渲染和失败回滚，不修改工作树。

### 构建公开入口

`--write` 与 `--check` 在读取 API 前按顺序调用：

```text
pnpm --filter @exre/exui-tokens build
pnpm --filter @exre/exui build:types
```

实现使用 `spawnSync` 的参数数组：Windows 调用 `pnpm.cmd`，其他平台调用 `pnpm`，`shell` 保持关闭。任一命令失败时立即退出，且不触碰当前生成目录。

构建只更新已被仓库声明为生成物的 `dist/` 和 `types/`，不得编辑这些目录中的文件。

### Token JavaScript 路径枚举

1. 从 Tokens manifest 的 `exports["."].import` 解析并动态导入已构建的公开 ESM 根入口。
2. 要求运行时导出至少包含 `exuiTokens` 和 `componentRecipes`。
3. 递归遍历两个对象的 own enumerable properties。
4. 标量值构成叶路径。
5. key 恰好为 `scope` 与 `path` 的 recipe 引用描述对象被视为一个叶节点，只输出其外层 recipe 路径；不输出引用描述对象的值。
6. 空对象、数组、循环引用、非普通对象或无法识别的叶类型视为生成错误，避免静默漏项。
7. 输出路径分别以 `exuiTokens.` 和 `componentRecipes.` 开头，去重后按字典序稳定排序。

例：输出 `exuiTokens.themes.light.surface.canvas` 这一名称，但不输出它对应的颜色；输出 recipe 属性路径，但不输出其解析目标和值。

### CSS 自定义属性枚举

1. 从 Tokens manifest 的 `exports["./style.css"]` 解析已构建 CSS 文件。
2. 只收集声明位置的自定义属性名称，即匹配 `--<name>:` 的名称；`var(--name)` 引用不产生重复来源。
3. 去重并按字典序排序。
4. 输出 `--background`、`--exui-*`、`--exui-component-*` 等实际公开名称，但不输出冒号后的值。

`references/generated/token-paths.md` 由固定说明、三个有序区段组成：`exuiTokens`、`componentRecipes`、CSS custom properties。每个清单行只能包含一个反引号包裹的路径或属性名；渲染器没有接收 Token 值的参数，从结构上阻止值泄漏。

### 组件导出枚举

1. 运行 `build:types` 后，从 Components manifest 的 `exports["."].types` 解析声明入口。
2. 从 `packages/components` 的依赖解析上下文加载其已声明的 TypeScript 编译器，不增加新依赖。
3. 使用 TypeScript program 与 type checker 获取根声明模块的所有导出，包含运行时值和 type-only 导出。
4. 依据 symbol declaration 所属声明文件分组：组件文件、`theme-provider`、hooks、utils；同一 symbol 多声明时使用稳定排序后的首个仓库内声明。
5. 使用 TypeScript `SymbolFlags` 标记 `value`、`type` 或 `value + type`，不通过命名大小写猜测。
6. 组名与 symbol 名均稳定排序。无法解析、仓库外声明或冲突分组时失败，不静默归入“其他”。

`references/generated/component-exports.md` 为完整公开导出清单。若同名 `references/components/<PascalCase>.md` 存在，生成清单为该组件族添加相对链接；没有人工参考的导出仍保留在清单中。

### 人工文档校验

更新器在写入前验证：

- `SKILL.md` frontmatter 的 `name` 为 `exui-usage`，description 可区分 Token、组件和 icon 请求。
- `agents/openai.yaml` 的 default prompt 明确包含 `$exui-usage`。
- `SKILL.md` 中路由到的所有相对链接存在并保持在 skill 目录内。
- 组件参考不包含 `Source: src/`，也不建议从 `@exre/exui` 或 `@exre/exui-tokens` 的 `src`、`dist`、`types` 子路径导入。
- `token-usage.md` 明确说明 React 样式入口包含 Token CSS/font、三层 Token 选择顺序和 recipe 边界。
- `icon-usage.md` 包含 Lucide-first、直接依赖、例外条件、`aria-label` 和 `aria-hidden` 规则。
- 所有生成文件符合仅名称/路径的行格式，不含序列化 Token 值。
- 新 skill 内不残留 `$exui-components` 或旧 display name。

这些检查验证不易人工保持的契约，不以匹配整段固定文案代替行为校验。

### 确定性与事务式写入

- Markdown 使用 UTF-8、LF 和固定尾部换行。
- 所有集合在渲染前去重并显式排序。
- `--write` 先在 `references/` 下创建同卷临时生成目录，写入两个文件并完成全部校验。
- 当前 `generated/` 先重命名为备份目录，再把临时目录重命名为 `generated/`；成功后删除备份。
- 第二次重命名或后续校验失败时恢复备份并删除临时目录。
- 启动时若检测到上次中断留下的备份，只在目标目录缺失且备份结构通过校验时恢复；其他不一致状态必须失败并要求人工检查，不能猜测覆盖。

该契约保证普通构建、解析、校验和文件系统错误不会留下仅更新一个清单的状态。进程被强制终止时，下一次运行能够恢复或明确停止。

## 组件参考迁移

1. 将 `skills/exui-components/refs/*.md` 迁移到 `skills/exui-usage/references/components/`。
2. 保持组件文件名和有效的导入、组合、variant、size、状态及无障碍说明。
3. 删除 `Source: src/...` 行及“阅读上方源码获取高级 props”等内部路径指导；改为以 package 暴露的 TypeScript 类型为准。
4. 修正示例中的未声明标识符。以 `Button.md` 为例，`RefreshCwIcon` 示例必须同时展示 `lucide-react` 导入。
5. 组件导入仍只来自 `@exre/exui` 根入口，样式仍只来自 `@exre/exui/style.css`。
6. 新 skill 全部校验通过后才删除旧目录。

## 实施顺序

1. 使用当前 `skill-creator` initializer 创建 `exui-usage` 的 `scripts`、`references` 和 `agents` 基础结构，不生成示例占位内容。
2. 写入 package selection、skill 入口、Token 指南、icon 指南和更新器。
3. 迁移并修订组件参考。
4. 执行 `--write` 生成两个公开 API 清单。
5. 执行 skill 校验、更新器自检、幂等检查和仓库验证。
6. 搜索仓库中的旧名称和私有导入建议，确认只剩迁移说明等历史记录后删除 `skills/exui-components/`。
7. 再次执行完整验证并检查 Git diff；不创建 Changeset，不提交。

每一步都必须保留用户已有且与本范围无关的工作树内容。

## 验证方案

### Skill 包验证

- 使用当前 Codex `skill-creator/scripts/quick_validate.py skills/exui-usage` 验证 frontmatter、目录名和未完成占位符。
- 人工确认 description 的触发边界只面向外部 ExUI 消费请求。
- 确认 `SKILL.md` 按需链接 `references/`，不会要求一次加载全部组件文档。

### 更新器行为验证

```text
node skills/exui-usage/scripts/update.mjs --self-test
node skills/exui-usage/scripts/update.mjs --write
node skills/exui-usage/scripts/update.mjs --check
pnpm exec oxlint skills/exui-usage/scripts/update.mjs
```

`--self-test` 至少验证：

- 乱序输入产生相同输出。
- `private: true`、Showcase、role 重复、名称不匹配和越界路径被拒绝。
- Token renderer 只接收并输出路径/属性名。
- 人工文档坏链接和私有 import 被拒绝。
- 注入目录切换失败后原有两个生成文件均恢复。

执行两次 `--write` 后，第二次不得产生 Git diff；随后 `--check` 必须成功。

### 仓库验证

```text
pnpm tokens:check
pnpm typecheck
pnpm lint
pnpm build
pnpm verify:pack
git diff --check
```

`tokens:check` 与 `verify:pack` 用于确认生成器所依赖的 Token 和 package 公开入口仍有效；它们不表示 skill 行为已经验证，因此不能替代前两组检查。

### 验收搜索

在非历史设计材料的活动 skill 范围内确认：

- 不存在 `skills/exui-components/`。
- 不存在 `$exui-components`、旧 display name 或旧默认 prompt。
- 不存在面向消费者的 `src/`、`dist/`、`types/` 导入建议。
- 所有使用 Lucide JSX 标识符的示例都展示或明确继承同一代码块中的 `lucide-react` 导入。

## 失败模式与处理

| 失败 | 行为 | 检测 |
| --- | --- | --- |
| package selection 无效 | 构建前退出，不写生成目录 | `--self-test` 配置用例 |
| pnpm 构建失败 | 透传退出码，不写生成目录 | `--write` / `--check` |
| 公开导出无法解析 | 退出并指出 package、入口和阶段 | `--check` |
| Token 对象出现不支持结构 | 失败，不静默遗漏路径 | `--self-test` + 实际生成 |
| 生成清单与当前文件不同 | `--check` 退出非零并列出文件名 | 幂等检查 |
| 人工 reference 丢失或引用越界 | 写入前失败 | 链接校验 |
| 目录替换中途失败 | 恢复上一版生成目录 | 故障注入自检 |
| 强制终止留下备份 | 下次运行安全恢复或明确停止 | 启动恢复测试 |

错误输出不得打印 Token 值；只报告路径名、package 名、文件名和失败阶段。

## 安全与隐私

更新器只读取当前仓库、执行两个固定 pnpm filter 命令并写入 skill 的生成目录。它不访问网络 API、不读取凭据、不写用户目录，也不执行配置中提供的任意命令。package 名和 workspace 路径先与批准的常量匹配，再作为参数传给不启用 shell 的子进程。

## 兼容性、上线与回滚

### 兼容性

删除 `exui-components` 会使显式 `$exui-components` 调用失效，这是“只保留一个 skill”的已批准结果。仓库内活动提示全部迁移到 `$exui-usage`，不保留第二个别名 skill。

package 消费 API、版本和构建结果不变，因此无需 package 兼容窗口或 Changeset。

### 上线

这是一次本地、无持久数据的仓库迁移：先完整创建和验证新 skill，最后删除旧 skill。停止条件为任一生成、skill 包或仓库验证失败；失败时不得报告迁移完成。

### 回滚

在未提交工作树中，回滚目标仅限本 RFC 路径：恢复 `skills/exui-components/`，删除 `skills/exui-usage/`。不得使用会覆盖无关用户改动的整仓 reset 或 checkout。若之后形成独立提交，则通过对该提交执行常规反向提交完成回滚。

没有数据库、远端状态或不可逆数据迁移。

## 替代方案

### 维持现有 skill，手工补充 Token

优点是改动最小；缺点是清单会随 package 导出漂移，也保留了范围过窄的旧名称。不能满足单一 `exui-usage` 和 package 驱动更新要求。

### 完全从 package 自动生成全部 skill 内容

优点是同步简单；缺点是无法稳定表达 Token 选择层级、React 与 framework-neutral 分流、Lucide 例外和组件组合经验。生成内容也会挤占 skill 入口上下文。

### 保留两个 skill

能减少迁移，但会产生重叠触发和冲突指导，并直接违反只保留一个 skill 的已批准边界。

## 风险

| 风险 | 可能性 | 影响 | 缓解 | 检测 |
| --- | --- | --- | --- | --- |
| 构建产物与源码不一致 | 低 | 高 | 更新器先执行 package 正式构建 | `tokens:check`、`build`、`--check` |
| TypeScript 导出分组随声明布局变化 | 中 | 中 | 无法稳定归组时失败，不生成“其他”桶 | `--check` 错误阶段 |
| Token 值意外进入生成文档 | 低 | 高 | renderer 只接收路径字符串；清单行语法校验 | `--self-test`、生成文档检查 |
| 新组件缺少人工参考 | 中 | 低 | 完整生成导出仍可发现；有人工文档时才链接 | component export inventory |
| 两个生成文件部分更新 | 低 | 中 | 同卷目录切换、备份恢复、启动恢复检查 | 故障注入自检 |
| 旧显式 skill 调用失效 | 高 | 中 | 活动提示统一迁移并明确无别名决策 | 验收搜索 |
| 指南误导 React 用户重复加载 CSS | 低 | 中 | 固定 React 决策规则并校验 Token 指南 | reference 校验 |
| Lucide 被误解为绝对禁止例外 | 低 | 低 | 文档列出三个窄例外 | icon reference 检查 |

## 未决问题

无。实现不需要再决定 package 范围、skill 名称、目标受众、Token 暴露深度、icon 默认策略或目录规范。
