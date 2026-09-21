# ExUI Glass 材质设计

日期：2026-09-20  
模块：`glass-effects`  
模块根目录：`.notes/glass-effects/`  
状态：交互设计方向已确认；本书面设计待用户审阅。尚未进入 RFC 或实现。

## 1. 目标与已确认决策

参考 `D:\CAEP\ex-framework\src\Framework\Glass`，为 ExUI 增加可复用的玻璃背景材质：

1. 从 `@exre/exui` 根入口导出 `<GlassSeed />`，在应用根部挂载一次，注册共享 SVG 折射滤镜。
2. 有背景表面的指定 ExUI 组件增加可选布尔属性 `glass`。
3. 任意原生 `div`、以及能够把 `className` 传到可见元素的组件，均可通过 `ex-glass` 使用同一种材质。
4. 采用 CSS 基础毛玻璃与 SVG 折射增强，适配 light、dark、pitch-black 三套主题。
5. 保留原有布局、尺寸、圆角和交互语义。默认玻璃采用主题中性色；危险变体保留危险色调，交互状态仍可辨认。
6. 普通后代不会自动开启玻璃；组合组件仅对自己拥有的内部背景表面做定向适配。

这是新增公共视觉能力的架构级设计。本文覆盖一个完整 Glass 模块，不包含独立的全库阴影重构、主题重构或新布局系统。

## 2. 现有实现证据

| 位置 | 与本设计相关的事实 |
| --- | --- |
| 参考项目 `src/Framework/Glass/index.tsx` | `ExGlass` 包装 Ant Design Flex；`ExGlassSeed` 声明固定 ID 的 SVG 滤镜。`feDisplacementMap` 引用了未定义的 `blurred`，后续模糊引用了未定义的 `output`，不能逐字复制滤镜链 |
| 参考项目 `src/Framework/Glass/index.scss` | `.ex-glass` 同时包含背景、模糊与滤镜 URL，也包含 flex、padding、固定圆角、overflow 和 pointer-events；后面这些不适合直接施加到所有 ExUI 组件 |
| [公共包边界](../../../.ai/architectures/components/public-surface.md) | React 组件通过唯一公开包导出；`@exre/exui/style.css` 已内含 Token 样式，无需新建包或样式入口 |
| [Token 管线](../../../.ai/architectures/tokens/token-pipeline.md) | Token 源在 `packages/tokens/src`，CSS 必须由生成器生成；三套主题通过现有变量块输出 |
| [Button](../../../packages/components/src/components/ui/button.tsx) | 背景、前景、边框、阴影、透明度按变体和状态配套；同时存在 `Button` 与 `ActionButton` |
| [InputGroup](../../../packages/components/src/components/ui/input-group.tsx) | 组合外层拥有背景、焦点与错误状态，内部输入控件主动清除对应样式 |
| [Bubble](../../../packages/components/src/components/ui/bubble.tsx) | Bubble 在父层选择变体，实际背景和圆角位于 BubbleContent，不能只给外层增加滤镜 |
| [Sidebar](../../../packages/components/src/components/ui/sidebar.tsx) | 桌面固定面板、不可折叠面板和移动端 Sheet 的 DOM 落点不同，需要分别接入 |
| [Combobox](../../../packages/components/src/components/ui/combobox.tsx) | ComboboxInput 的 className 落在 InputGroup；ComboboxContent 已带局部背景模糊，启用 Glass 时不能叠加两套材质 |
| [NativeSelect](../../../packages/components/src/components/ui/native-select.tsx) | className 落在 wrapper，实际背景位于内部 select；需要组件内映射 |
| [测试约定](../../../TESTING.md) | Showcase 消费公共产物；视觉测试使用 Windows Chromium；真实 tarball 通过隔离消费者验证 |

以上是源码与项目文档证据，不代表已经验证参考效果在任意浏览器中的实际渲染。

## 3. 使用契约

```tsx
import {
  Button,
  Card,
  CardContent,
  DialogContent,
  GlassSeed,
} from "@exre/exui"
import "@exre/exui/style.css"

function App() {
  return (
    <>
      <GlassSeed />
      <Card glass>
        <CardContent>
          <div className="ex-glass rounded-xl p-4">自定义玻璃区域</div>
          <Button glass>操作</Button>
        </CardContent>
      </Card>
    </>
  )
}

// 位于正常的 Dialog 组合中，Portal 内容独立开启：
// <DialogContent glass>弹窗内容</DialogContent>
```

### 3.1 GlassSeed

- 是滤镜定义组件，不是 Provider 或内容容器，不接受 children，不要求使用者包裹玻璃元素。
- 首版不提供调参 props。外观通过材质 CSS 变量定制，不增加每个组件一套参数。
- 一个 Document 挂载一个 Seed；同一文档的多个 React root 由宿主共享该 Seed。跨 iframe 的应用需在各自文档挂载；Shadow DOM 的跨边界滤镜解析不在首版支持契约内。
- 不占正常布局空间，不可聚焦，不进入辅助技术阅读顺序，不截获指针事件。
- 滤镜 ID 由库保留且稳定，使用 ExUI 专属命名，避免直接复用参考项目的通用 ID。
- 正常挂载、卸载、重新挂载及 React Strict Mode 下，增强状态必须随实际 Seed 生命周期恢复或撤销，不遗留失效的滤镜引用。
- 服务端渲染及初次 hydration 必须安全；不得在模块导入或服务端 render 中访问浏览器全局对象。
- 同时挂载多个 Seed 属于不支持的宿主用法；首版不引入跨应用的自动去重服务。

### 3.2 glass 与 className

- 对支持列表内的组件，`glass?: boolean` 默认关闭。它只决定是否添加 Glass 标记，不透传为原生 `glass` 属性。
- `<Card glass />` 与 `<Card className="ex-glass" />` 的背景表面、主题、状态与增强能力相同。
- `glass={false}` 不撤销调用方显式写入的 `ex-glass`；两者同时出现时，显式 class 仍生效。
- `ex-glass` 不依赖父节点是 ExUI 组件，也不依赖 React Context。仅导入现有完整组件样式表，就能在普通 DOM 上获得基础材质。
- 类标记本身不向普通后代传播。嵌套玻璃按实际 DOM 背景进行合成，不承诺所有嵌套层都直接采样页面最底层。
- 普通自定义组件必须把 className 传到实际可见的 HTML 元素；只声明参数却丢弃它不属于可支持的用法。SVG 图形和操作系统原生弹出菜单不是通用 HTML 表面契约的一部分。
- 现有 `asChild` / `render` 组合方式、事件、ref 与可访问性属性继续保留。不要为了 Glass 新增无条件包装节点。

## 4. 首版组件范围

下表是首版新增 `glass` 的显式清单；新增组件以后不自动获得该属性。其他可见子元素仍可使用 `className="ex-glass"`。

| 分类 | 暴露 glass 的组件 |
| --- | --- |
| 按钮与标记 | `Button`、`ActionButton`、`Toggle`、`ToggleGroupItem`、`Badge` |
| 内容表面 | `Card`、`Alert`、`Item`、`Attachment`、`Bubble`、`BubbleContent`、`BubbleReactions` |
| 输入表面 | `Input`、`Textarea`、`InputGroup`、`NativeSelect`、`SelectTrigger`、`ComboboxInput`、`ComboboxChips`、`ComboboxChip` |
| 弹窗与提示 | `DialogContent`、`AlertDialogContent`、`SheetContent`、`DrawerContent`、`PopoverContent`、`HoverCardContent`、`TooltipContent` |
| 选择与菜单面板 | `SelectContent`、`ComboboxContent`、`DropdownMenuContent`、`DropdownMenuSubContent`、`ContextMenuContent`、`ContextMenuSubContent`、`MenubarContent`、`MenubarSubContent` |
| 命令面板 | `Command`、`CommandDialog` |
| 导航表面 | `Sidebar`、`SidebarInset`、`TabsList`、`TabsTrigger`、`Menubar` |

已有直接使用 `React.ComponentProps<typeof Button>` 等类型并透传到基础组件的包装控件，应自然继承该能力，不允许类型上接受 glass 却把它泄漏到 DOM。它们属于已有组件组合的兼容性覆盖，不增加一套独立材质。

`CardContent`、标题、描述、布局容器、菜单项、NavigationMenu 的局部表面，以及未在表中列出的组件，不统一增加布尔属性；需要局部背景时通过现有 className 使用。Checkbox、Switch、Slider 等状态图形也不在本次新增属性的范围内。无可见 DOM 的 Root、Provider、Portal 不接收 glass。

### 4.1 组合表面映射

| 组件 | 材质落点与规则 |
| --- | --- |
| 普通表面 | 标记与材质位于组件现有的可见 DOM 元素 |
| `Bubble` | 标记委托给该 Bubble 自己的直接 BubbleContent 表面；BubbleContent 单独开启也可用。两种入口不重复叠加滤镜，不影响 BubbleReactions 或嵌套 Bubble |
| `InputGroup` / `ComboboxInput` | 外层输入框表面承载材质，内部输入继续透明；内部按钮不自动开启。玻璃焦点与错误状态在外层绘制 |
| `NativeSelect` | 保留 className 在 wrapper 的现有落点，但将 Glass 标记定向映射到内部 select 表面；wrapper 不再额外绘制第二层玻璃。系统选项弹窗保持系统行为 |
| `Sidebar` | 不可折叠分支作用于自身；桌面分支作用于 sidebar-inner；移动端分支作用于 SheetContent。`glass` 与 className 入口在三个分支一致，保留其他 className 的既有布局用途 |
| `CommandDialog` | 材质位于 DialogContent。标准组合下，直属 Command 的默认不透明底色让位于对话框表面；单独的 Command 仍可独立开启。任意业务后代背景不被全局清除 |
| `ComboboxContent` | 开启时切换到共享材质，并停用该表面原有的独立模糊层；关闭时保持现状 |
| `TooltipContent` | 内容和箭头颜色协调，不残留原来的不透明反色箭头；箭头不独立施加第二次折射 |

这些适配只能匹配组件拥有的明确槽位，不使用遍历全部 DOM、克隆任意 children 或清空全部后代背景的办法。

## 5. 材质、主题和交互

### 5.1 基础与增强分层

- 基础材质包含半透明底色、背景模糊、适量饱和度调整，以及不改变盒尺寸的边缘高光或内阴影。
- SVG 增强提供静态噪声驱动的轻度折射。滤镜输入与输出必须显式连接，不复制参考项目中未定义的结果名。
- 不模糊或扭曲元素自身的文字、图标和输入内容；效果作用于背景。
- 不改变 display、padding、gap、宽高、圆角、position、z-index、overflow 或 pointer-events。保留组件原有裁切；不新增全局 `overflow: hidden`。
- 现有外阴影与焦点 ring 不被通用玻璃阴影覆盖。需要增加边缘高光时应与其组合，且不改变非 Glass 组件的阴影设计。
- 默认强度应能让带纹理背景的玻璃表面明显可辨，同时不使按钮标签、菜单项或输入文字失去可读性。静态材质不新增动画循环、Canvas、WebGL 或逐元素截图。

### 5.2 Token 与定制面

- Token 工作区是材质参数的唯一手写来源；新增类型、主题值及生成映射，生成的 CSS 不手改。
- light、dark、pitchBlack 分别提供中性材质底色、前景、边缘、内阴影和状态值；危险色调引用现有语义颜色。
- 材质参数组织为 Glass 专用分组，覆盖背景、前景、边缘、内阴影、模糊和饱和度。公开基础变量采用 `--exui-glass-background`、`--exui-glass-foreground`、`--exui-glass-border`、`--exui-glass-shadow`、`--exui-glass-blur`、`--exui-glass-saturation`。
- `--exui-glass-border` 是边缘颜色，不控制边框宽度；`--exui-glass-shadow` 仅表达材质内阴影，不接管组件外阴影或焦点指示。
- 参数值通过既有 Token JS 和 `@exre/exui/tokens/style.css` 发布；React 组件样式仍由 `@exre/exui/style.css` 提供。仅导入 tokens 样式不附带 `.ex-glass` 行为，也不引入 React。
- 消费者可在目标表面或其祖先覆盖基础变量。语义变体、焦点与错误状态允许使用对应状态值；普通 background 工具类不是保证改变玻璃材质的接口，文档示例优先使用公开材质变量。
- 核心配方和玻璃材质应使用明确的层叠关系，让状态覆盖可测试；不依靠 class 字符串先后顺序，也不全局压制现有状态样式。
- RFC 负责给出精确 Token 类型、默认数值、状态变量和层叠实现。本文确定参数职责与视觉验收标准，不把参考项目的固定黑底、24px 圆角或 scale=60 作为兼容承诺。

### 5.3 颜色与状态

- 普通组件玻璃采用当前主题的中性背景和匹配前景。Button 的 primary/default 在 glass 下也采用这套规则，不沿用不适配浅色材质的白色文字。
- `danger` / `destructive` 保留危险语义；其他已带明确反馈语义的内容不得被通用前景规则抹掉。
- hover、active、disabled、focus-visible、invalid，以及已存在的 selected / checked / pressed / expanded 状态仍有可辨反馈。菜单选中标记、键盘高亮、Tabs 活动状态和 Toggle 按下状态保持可用。
- `glass={false}` 且没有 ex-glass 时，原有配方、颜色、状态及既有背景模糊完全保持现状。
- `.ex-glass` 不对任意后代文字强制统一颜色；普通 HTML 表面默认前景可继承，明确的子元素文字样式继续有效。
- 玻璃的可读性受背后内容影响。验收使用明暗实色及高对比纹理背景，不宣称在任意用户背景和任意自定义透明度下都自动满足对比度要求。

## 6. 生命周期、降级与环境边界

| 条件 | 必须得到的结果 |
| --- | --- |
| 无 GlassSeed | 基础半透明与毛玻璃；不生成指向缺失滤镜的活动增强链 |
| 有 Seed，增强可用 | 基础材质加可见的 SVG 折射，内容保持清晰 |
| SVG 背景滤镜不生效 | 仍保留基础模糊，不能因增强声明失效而丢失整条 backdrop-filter |
| 背景模糊本身不可用 | 使用主题中性或危险语义的较实背景作为可读退化，不阻断交互 |
| Seed 卸载或重挂 | 对应退出或恢复增强，不残留异常背景；卸载一个玻璃组件不影响其他组件 |
| SSR / hydration | 服务端可输出安全标记；挂载过程不产生 hydration mismatch 或访问 DOM 的服务端异常 |
| Portal 到同一 Document | 共享该文档 Seed；主题由实际 Portal 容器继承 |

应用在 html/body 上设置主题时，默认 body Portal 按相同主题工作。局部主题包裹的 React 子树若通过 Portal 移出该 DOM 子树，主题不会凭空跟随；需要将主题应用到 Portal 容器或使用现有容器配置。

CSS 语法检测通过、computed style 含有 url、以及 SVG 节点存在，都不能单独证明折射已渲染。RFC 必须选择能维持上述降级保证的分层方法，并以真实浏览器验证后才能称增强可用；不能依赖未经验证的浏览器名称白名单。

首版实测验收沿用项目的 Chromium 环境，不承诺已验证 Firefox、Safari、WebView 或嵌入式宿主的增强一致性。其实际状态必须在交付报告中分别记录；基础降级是设计要求，不是当前已经通过的测试结论。

## 7. 模块职责与交付范围

| 所有者 | 职责 |
| --- | --- |
| `packages/tokens` | 材质 Token、类型、生成映射、主题完整性与变量引用校验 |
| `packages/components` 的 Glass 模块 | Seed、共享标记约定、基础材质和增强的生命周期边界 |
| 各表面组件 | 消费 glass、保留既有 API、槽位映射与变体/状态适配 |
| `packages/components/src/index.ts` / 样式入口 | 显式公开 GlassSeed，并随现有完整样式发布材质；不新增公共包或子路径 |
| `packages/showcase` | 只通过公开入口构建示例和浏览器验收，不直接引用组件源码 |
| 公开使用文档与 ExUI 使用技能 | 说明 Seed 一次挂载、两种开启方式、支持清单、变量定制、Portal 和降级边界 |
| 发布记录 | 实现后为 `@exre/exui` 新增 API 和行为补充 Changeset；设计文档本身不触发发布 |

不引入 Ant Design，不复制参考项目的 Flex 包装。组件共享材质，不共享一个覆盖整页的绘图层，不监听全局 DOM 来发现任意玻璃元素。

## 8. 验收设计

遵守 [TESTING.md](../../../TESTING.md)。以下是未来实现的验收要求，本次设计未执行这些测试。

### 8.1 类型与包契约

- 支持清单内的组件均能从公开包以 glass 使用；错误属性类型被拒绝；普通 div 不被扩展出 glass 类型。
- 包内所有透传包装组件不泄漏原生 glass 属性，asChild / render 保留 ref、事件与类型约束。
- 真实 tarball 中存在 GlassSeed、公开类型、材质样式及三套主题参数；tokens-only 消费者仍不需要 React。
- 服务端渲染包含 Seed、普通玻璃表面和无 Seed 表面；客户端 hydration 验证无不匹配和运行时错误。

### 8.2 行为与几何

- 对支持清单的可见表面建立参数化检查，验证 glass 与 ex-glass 的落点、计算样式和非泄漏行为。
- 覆盖 Bubble、InputGroup、NativeSelect、Combobox、CommandDialog、Sidebar 三种分支的特殊映射，确保不重复叠加、不透明底色不遮蔽材质。
- 比较开关前后的尺寸、padding、圆角、布局与滚动行为；普通元素不被强行改成 flex，不新增裁切。
- 保留键盘导航、焦点指示、表单输入、禁用/错误状态、菜单选择、弹窗 Escape 关闭及焦点恢复。
- 验证普通嵌套 div 仅标记元素生效、普通业务后代背景不被清除、Portal 使用同文档 Seed。
- 验证无 Seed、Seed 卸载/重挂、Strict Mode、增强禁用和基础模糊禁用的退化路径。

### 8.3 视觉与真实浏览器

- Showcase 提供专门的 Glass 示例：纹理背景、普通 div、卡片与按钮、输入组、嵌套表面、弹窗与菜单、Sidebar；切换三套主题和基础/增强显示。
- 在同一稳定背景下比较无材质、基础毛玻璃和增强折射；使用图像差异或可复查截图判断实际增强，不只检查样式字符串。
- 检查文字与图标未随背景被模糊或扭曲，边缘无裁切、黑边或异常位移；浅色主题、危险按钮、Tooltip 箭头和表单错误状态分别检查。
- 开启和关闭材质的 hover、active、focus-visible、disabled、invalid、selected/pressed 状态均有代表性覆盖。
- 截图固定背景、噪声种子、尺寸及动画状态；沿用项目 Windows Chromium 基线，避免随机纹理导致波动。
- 非 Glass 组件的既有视觉基线保持通过。任何基线更新必须能解释为本设计内的变化。

### 8.4 验证命令与证据

实现阶段运行 `pnpm tokens:check`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm test:visual`、`pnpm verify:pack`，并按 TESTING.md 校验更新后的使用技能示例。

新增 Token 测试沿用现有 Node 测试位置；浏览器行为和视觉测试沿用 Showcase 的 Vitest Browser Mode；打包消费者测试继续验证真实公开产物。若补充新的测试入口，须同步 TESTING.md。

交付报告分别标明静态检查、真实 tarball、浏览器基础材质、浏览器增强、其他引擎的 PASS / FAIL / NOT_EXECUTED。仅构建通过不得宣称视觉或跨浏览器验收通过。

## 9. 选择理由、风险与非目标

选择 CSS 基础加 SVG 增强，是因为它同时满足普通 className 使用、参考效果中的折射特征和无 Seed 可用性。纯 CSS 方案无法满足折射目标；逐字移植会带入固定暗色、布局规则和无效滤镜连接；这些方案不采用。

主要风险及对应约束：

- **SVG 背景滤镜渲染差异**：增强独立验证，基础效果必须能独立保留。若参考算法达不到目标，调整内部滤镜链，不能静默删去已确认的增强目标。
- **状态层叠冲突**：状态与材质统一设计，针对 Button、InputGroup 和弹出菜单的现有规则验证，不用全局覆盖强行抹平。
- **组合表面错误落点**：按明确槽位映射，重点验证 Bubble、Sidebar、NativeSelect；不改普通 className 的布局用途。
- **嵌套合成和性能**：按浏览器真实 backdrop 语义工作，共享滤镜定义不等于零渲染成本；文档不推荐给长列表每一项或全屏多层表面叠加折射。
- **参考效果不能直接复用**：修正滤镜链，适配主题与控件尺度，以新的 Showcase 示例作为最终视觉依据。

首版不包含动画噪声、鼠标跟随高光、每个实例独立滤镜参数、物理真实透镜、跨 iframe 或 Shadow DOM 的自动共享、自动去重服务、全库属性注入，以及对任意业务内容背景的自动改写。

## 10. 后续交接

用户审阅并批准本书面设计后，调用 `technical-design-doc-creator`，以本文件作为需求来源，保持模块根目录 `.notes/glass-effects/`，将实施就绪的 RFC 写入 `.notes/glass-effects/rfcs/`。默认一个 RFC，覆盖 Token、Seed、组件接入、样式层叠、降级机制和验收。

RFC 必须补齐具体 Token 结构/默认数值、滤镜链与增强启用方法、各组件槽位适配及 CSS 层叠方案；这些属于已确定设计目标内的工程细化，不授权改变公共范围或弱化降级要求。

此 brainstorming 流程在 RFC 交接完成后停止，不开始实现。本文不触发提交、发布或 `.ai/` 知识沉淀；后者在设计完成后另按仓库规则征询用户。
