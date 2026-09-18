# ExUI 单包发布与框架中立 tokens 子路径

状态：待实施评审。单包、组件依赖内置和 tokens 隔离的设计方向已由维护者确认；本文不代表实现或线上发布验收。

设计依据：[单包设计](../specs/2026-09-09-single-package-exui-design.md)。保留原设计文件，其审批状态以本 RFC 的交接说明和会话确认为准。

## 决策

只发布 `@exre/exui`。组件继续从根入口导入，tokens 从 `@exre/exui/tokens` 导入。组件实现依赖编译进组件产物，React 和 React DOM 保持外部可选 peer。接受下载整个包及组件依赖可能重复的代价，不接受通过关闭 peer 安装或隐藏类型错误来实现 tokens 隔离。

本次完成源码、构建、发布校验和消费文档迁移，不执行版本更新、提交、推送、npm 发布或打开发布开关。首次公开版本仍计划为 0.1.0。

## 已核实的现状

- `packages/components` 发布 `@exre/exui`，当前为 0.0.0；Vite 将 Radix、Recharts、Base UI 等作为外部依赖。
- 这些库存在必需的 React peer，因此仅修改顶层 `peerDependenciesMeta` 不能保证安装时没有 React。
- `packages/tokens` 独立生成 ESM、CommonJS、类型及 CSS，适合保留为私有工作区。
- `build:types` 当前使用 tsc、tsc-alias 和 CSS 声明修复脚本，第三方类型仍可能是外部引用。
- 发布契约、npm hook、Changesets 和 exui-usage 技能都包含双包假设。
- 先前通过的 CI 验证的是双包状态，不能作为本次迁移的验收证据。

## 公开入口与安装契约

| 入口 | 产物 | 保证 |
| --- | --- | --- |
| `@exre/exui` | `dist/exui.js`、`types/index.d.ts` | 保持现有 React 19 组件 API；ESM |
| `@exre/exui/style.css` | `dist/index.css`、对应 CSS 声明 | 完整组件样式，包含 tokens 和字体 |
| `@exre/exui/tokens` | `dist/tokens/index.js`、`dist/tokens/cjs/index.js`、各自类型入口 | ESM/CJS、无 React 运行时或类型依赖 |
| `@exre/exui/tokens/style.css` | `dist/tokens/style.css`、对应 CSS 声明 | 仅 token 变量，保留三主题 |
| `@exre/exui/tokens/font.css` | `dist/tokens/font.css`、对应 CSS 声明 | 可选字体，资源可解析 |

`exports` 必须显式列出上述入口，不添加通配符。根入口仍仅支持 ESM。tokens 的 import/require 条件各自绑定正确模块种类的声明：ESM 使用 ESM 声明，CommonJS 使用 CommonJS 目录中的声明并保留该目录 `type: commonjs` 标记。NodeNext 的 `.mts` 与 `.cts` 消费用例共同验证条件解析。

React、React DOM 的 peer 范围保持 `>=19.0.0 <20`，两者 `peerDependenciesMeta.optional=true`。组件用户显式安装 React 和 React DOM；TypeScript 组件用户安装其类型。tokens 用户只安装 ExUI 即可，不要求 React、React DOM 或其类型。

缺少 React 时导入组件入口可以正常报模块缺失，文档必须说明安装前提；不得从 tokens 入口执行组件依赖探测或导入组件根入口。

## 源码与构建边界

### 私有 tokens 工作区

保留现有工作区名称 `@exre/exui-tokens` 作为内部标识，添加 `private: true`，移除公开发布配置。保留生成器、CommonJS 校验、深冻结校验和 CSS 内容检查。内部版本不随公共版本发布，不再创建其发布标签。

组件构建对 tokens 的依赖改为开发期工作区依赖。现有源 CSS 可以继续通过内部工作区解析 tokens；构建时复制完整 tokens 产物到公共包 `dist/tokens/`。打包后的运行时和类型不允许引用内部包名。移除私有 tokens 的 `pack:check` 发布用途，并调整根校验命令。

构建顺序固定为：tokens 生成及检查 → 组件 JS/CSS → tokens 产物复制 → 组件声明内置与 tokens 声明复制 → 公共产物检查 → Showcase 构建。Vite 清理 dist 必须发生在复制之前，声明清理不能删除最终 tokens 声明。

### 组件运行时

修改 Vite external 判定：只保留 React、React DOM 及其所有子路径为宿主外部运行时；组件实现库及其辅助依赖由构建器内置。不可漏掉 `react/jsx-runtime`、`react-dom/client` 等，也不可因前缀判断误排除 `react-is` 等不同包。

将组件实现库移入开发依赖并锁定实际构建依赖树。公共 manifest 不保留能传递安装 React 的 dependencies 或 optionalDependencies。不得用 npm `bundledDependencies` 携带第三方 node_modules 代替编译打包。

Outfit 字体包保留为公共框架中立 dependency，以支持独立 `tokens/font.css` 的现有 CSS import；从私有 tokens 的依赖配置同步受支持范围并通过 tarball 消费验证。其他实现依赖默认全部内置。

保留现有源码分发文件用于参考及既有技能，但支持的直接消费边界是 exports。源码复制消费者自行承担第三方源码依赖，文档不得宣称拷贝源码也无需依赖。

### 类型产物

在现有 tsc 声明输出后增加声明整合阶段，内部化第三方类型图，重写相对引用，使根声明仅依赖包内声明、标准 TypeScript 类型及 React/React DOM 类型。可以输出多个私有声明文件，不要求压成单文件。

不得保留 `radix-ui`、`recharts` 等裸模块类型引用，也不得通过 any、删减 props、ambient module 空壳或 skipLibCheck 绕过检查。若声明工具不能保持某个公开类型，停止该阶段并提交具体冲突供评审，不能恢复组件库的必需安装依赖。

tokens 声明从其独立编译结果生成，不能通过根组件声明重导出。为两个 token CSS 子路径提供独立声明，不依赖 Vite 全局类型。声明整合工具的具体版本由实施时的兼容性检查与锁文件确定，不构成改变公开契约的授权。

### 第三方代码与上下文

随 tarball 提供第三方 notices，覆盖实际内置代码和保留的声明，包含所需版权及许可证文本；构建记录实际版本，避免仅列直接依赖。字体继续由其独立依赖携带资源与许可。

同一包内的组件共享同一份内置库实例。消费项目外部的 Radix、Base UI 等 provider 与 ExUI 内置实例之间不承诺共享 context。实施需检查当前公开 API 是否依赖这种组合；发现已有必需用法受损时报告具体用例，不静默改变组件行为。

## 发布与版本迁移

| 文件/区域 | 变更 |
| --- | --- |
| `scripts/package-contract.mjs` | PUBLIC_PACKAGE_NAMES 仅包含 ExUI；禁止私有 tokens 运行时依赖；校验 tokens exports 和可选 React peers |
| `scripts/verify-packages.mjs` | 只 pack ExUI，消费 fixture 移除 tokens tgz 及覆盖配置；保留 BSD/GNU tar 兼容处理 |
| `.release-bootstrap.yaml` | npm hook 仅声明 ExUI |
| `.github/workflows/tag-npm.yml` | 只匹配 `@exre/exui@*` |
| `scripts/release-bootstrap/npm.mjs` | 移除 tokens 注册表等待；保留目标包版本检查、存在即跳过及错误中止 |
| release 计划/标签/测试 | 排除私有工作区；拒绝旧 tokens 发布标签；保留注解标签、版本提交和主分支祖先校验 |
| `.changeset/*.md` | 将已存在的 tokens bump 转为 ExUI bump，保留说明；同一文件同一包只出现一次并取较高 bump |

仓库仍是 workspace，因此发布标签继续使用 `@exre/exui@0.1.0`，不切换为 `v0.1.0`。私有 tokens 的 workspace 开发依赖允许被包管理器正常转换，但发布后的生产依赖图不得含该包；发布契约仍拒绝未解析 workspace 协议。

只涉及私有 tokens 的源码变化也会影响公共 ExUI，应给 ExUI 写 Changeset。首次规划须恰好返回 ExUI 0.1.0；迁移过程中不消费 Changesets、不制造版本提交、不发标签。

维护 README、包 README、AGENTS.md、TESTING.md、发布 setup 说明和 `skills/exui-usage` 的生成器、自测、公开入口索引。技能须区分内部工作区位置与公开 npm 入口，不应把两者机械替换为同一个名称。历史 RFC/spec 保留，当前文档标注双包方案已被本 RFC 替代。

## 验证设计

所有安装 fixture 位于仓库之外，不继承工作区 node_modules。使用实际 tarball、Node 24、npm 和 pnpm 默认 peer 安装行为。不得依赖 `--legacy-peer-deps`、`--omit=peer`、peer 自动安装关闭或 workspace overrides 才通过。日志记录工具版本，环境覆盖不得包含凭据。

| 验收 | 必须证明 |
| --- | --- |
| npm 与 pnpm 的 tokens-only 安装 | 安装依赖树没有 React、React DOM、其类型及组件实现包；根目录 require.resolve 失败之外，还检查完整依赖树以排除嵌套安装 |
| tokens JS | 独立 import/require 成功、值与深冻结一致；模块图不连到组件入口或 React |
| tokens 类型 | Bundler 和 NodeNext 下 ESM/CJS 类型检查通过，skipLibCheck=false、没有 React 类型 |
| tokens CSS | 单独变量与字体入口可构建，字体资源解析成功；不包含组件 Tailwind reset/样式 |
| React 消费 | 只补充 React/React DOM 及类型即可通过公开组件类型和构建校验，不额外安装组件实现库 |
| 运行时 | Button、Dialog/Portal、表单、Chart 的打包消费交互通过，React 无重复实例，保留 Windows 视觉基线 |
| tarball | 入口、类型、字体资源、许可完整；无未解析内部包引用和宿主 React 内置代码 |
| release | 单包计划、私有包排除、旧 tokens 标签拒绝、标签冲突、无 Changeset no-op、注册表错误与发布重试测试通过 |
| 技能 | exui-usage 生成和自测通过，安装示例仅公开 ExUI |

保留根命令 `tokens:check`、`typecheck`、`lint`、`build`、`test:visual`、`verify:pack`、`release:verify`、`test:release`。typecheck/build 的前置依赖必须在干净 checkout 中满足，不能靠历史 dist。CI 新增消费 fixture 后记录时长；超时或不稳定先定位，不通过放宽依赖隔离断言解决。

## 落地次序与失败处理

1. 先以消费 fixture 证明当前单包直觉方案无法隔离传递 React peers，建立能捕获目标错误的回归检查。
2. 一并完成私有 tokens、公开 exports、JS/CSS、类型和 manifest 契约，避免留下发布半成品。
3. 迁移发布逻辑、Changesets、技能和文档；检查仅一个公开发布目标。
4. 在干净环境跑完整验收，记录包体积与重复依赖风险；没有预设的任意体积阈值。
5. 评审并经授权交付后，等待同一提交的 CI 通过，再恢复首次 0.1.0 发布准备。

发布前可撤销迁移提交恢复双包实现。发布后不能靠覆盖版本或移动标签回滚；如需修复，以新 ExUI 版本交付，保留已公开 tokens 子路径。实现期间发生失败不发布任何包。npm 登录身份、App 私钥和远端规则不因包边界迁移而修改。

## 风险与结论边界

- 已接受：统一包的下载体积增大，第三方实现可能与消费项目重复。
- 必须验证：声明整合保持所有公开 props、组件上下文行为、树摇效果、许可证覆盖。
- 不接受：安装 tokens 时自动安装 React，或为绕过类型问题要求 token 用户安装 React。
- 当前未执行：新构建、安装 fixture、组件行为和真实 npm 发布。已有双包测试不计为这些检查的通过证据。

没有需要维护者再选择的公开接口问题。声明整合和第三方 context 的具体兼容性是实施阶段的停止条件，由实施者给出复现，评审者判断是否满足本契约；不得据此自行弱化隔离要求。
