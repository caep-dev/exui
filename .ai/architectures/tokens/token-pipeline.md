# Token 生成与消费结构

最后更新：2026-09-18

## 源与产物

`packages/tokens/src` 是唯一手写层，`dist/` 全部由脚本生成。

| 源文件 | 内容 |
| --- | --- |
| `src/tokens.ts` | `exuiTokens`：`themes`（`light` / `dark` / `pitchBlack`）、`density`（`standard` / `compact`）、`typography`、`radii`、`shadows`，以及各主题下的 `surface`、`text`、`control`、`border`、`feedback`、`sidebar`、`chart`、`editor` 分组 |
| `src/recipes.ts` | `componentRecipes`：`button`、`dialog`、`formControl`、`menu`、`sidebarItem`、`tabs` 六类组件配方 |
| `src/types.ts` | Token 契约类型（`ExuiTokenContract`、`ThemeTokens`、各分组类型） |
| `src/recipeTypes.ts` | 配方契约类型；`RecipeLength` 是长度值的公共类型 |
| `src/style.css` | **生成物**，由 `scripts/generate-css.mjs` 写出并被提交 |
| `src/font.css` | 字体资源声明，与 `@fontsource-variable/outfit` 对应 |

## 构建阶段

```text
build:js   tsc -p tsconfig.json          → dist/*.js + dist/*.d.ts      (ESM)
build:cjs  tsc -p tsconfig.cjs.json
           + scripts/write-cjs-package.mjs → dist/cjs/*.js + 类型 + { type: "commonjs" } 标记
generate-css  scripts/generate-css.mjs     → 重写 src/style.css
copy-css      scripts/copy-css.mjs         → dist/style.css、dist/font.css
validate-tokens scripts/validate-tokens.mjs → 结构与取值校验
```

两个 JavaScript 入口来自同一份源码，产物树必须逐值相同且深度冻结。`build:cjs` 额外写一个 `package.json`，把 `dist/cjs` 标记为 CommonJS 目录，使 NodeNext 的 `require` 条件解析到正确的模块种类与声明。

## 样式表生成

`generate-css.mjs` 把 Token 树展平成 CSS 变量，输出四个变量块：

| 块 | 内容 |
| --- | --- |
| `:root` | 主题 `light` 的全部 `--exui-*` 变量、shadcn/ui 语义别名（`--background`、`--primary`、`--border`、`--chart-1`、`--sidebar-*` 等）、density `standard` 的 `--density-*` 变量、`--exui-font-*`、`--radius`，以及全部 `--exui-component-*` 配方变量 |
| `.dark` | 与 `:root` 相比取值不同的变量（`changedVariables` 差集） |
| `.pitch-black` | 同上，第三套主题 |
| `.density-compact` | 只包含五个 `--density-*` 变量 |

配方值在生成期解析：`{ kind: "foundation" }` 引用被替换为字面值，`{ kind: "semantic" }` 引用被替换为 `var(--exui-…)`。因此组件配方既可以被非 React 消费者作为数据读取，也可以在组件样式表里以变量形式生效。`defaultVariant` 与 `defaultSize` 不作为变量输出。相关决策见 [[tokens/01-rem-scalable-lengths]]。

变量命名前缀区分用途：`--exui-*` 为 Token，`--density-*` 为密度，`--exui-component-*` 为配方，`--exui-shadow-*` 为阴影，其余无前缀的短名是 shadcn/ui 语义别名。

## 校验入口

`tokens:check` 是这一层的唯一聚合门禁，顺序为：

```text
typecheck → build:js → build:cjs → verify-cjs → generate-css --check
          → copy-css → validate-tokens → node --test scripts/**/*.test.mjs
```

其中三项承担契约级断言：

- `verify-cjs.mjs`：require/import 两棵 Token 树与配方树逐值相等、深度冻结，且主题、密度、配方键名集合完整（防止产物为空或截断时被"两边都空"掩盖）。
- `generate-css.mjs --check`：已提交的 `src/style.css` 与重新生成的字符串**逐字节相等**，否则报 stale。
- `token-length-policy.mjs` 与 `color-contrast-policy.mjs`：纯策略模块，由 `*.test.mjs` 在内存副本上施加，永不改写真实源文件。

长度策略与对比度策略都区分"内建值"与"公共契约"：内建可缩放长度只接受 `rem` 与 `0`，而公共的 `RecipeLength` 继续接受 px，使消费者已有的自定义配方保持合法。

## 消费面

包内消费者通过 `@exre/exui-tokens` 及其 `style.css`、`font.css` 子路径解析；仓库外消费者只能使用公共包上的等价子路径。两者共享同一份产物，公开侧只是构建期复制的结果，结构见 `architectures/components/public-surface.md`。
