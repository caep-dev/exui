# T4 组件参考只读审计报告

日期：2026-09-11。审计人：doc-maintainer。
基线：detached HEAD fa91738（本审计为只读阶段，未修改 skills/exui-usage/ 下任何文件）。

## 1. 审计范围与方法

- 逐一核对 `skills/exui-usage/references/components/` 全部 60 份参考与 `packages/components/src/components/ui/` 的 60 个源文件（一一对应）。
- 机器比对：每份参考的 `## Exports` 清单和 Import 代码块符号 vs 源文件真实导出（脚本提取 `export {}` 块比对）。结果：**60/60 份参考的 Exports 清单与源码导出一致；60/60 份 Import 代码块只引用真实存在的导出符号**（唯一例外：Button.md 没有 `## Exports` 段，其 Import 段正确列出 Button/ActionButton；`buttonVariants` 导出未被提及，见处置表）。
- 人工深读：8 个优先组件（Sonner、Sidebar、Dialog、Combobox、MessageScroller、Calendar、Tabs、Tooltip）全文对照源码与底层依赖类型（@base-ui/react 1.6.0 combobox 类型、@shadcn/react 0.2.0 message-scroller 类型、react-day-picker 10.0.1）；另深读 Select、Field、Command、AlertDialog、Sheet、Accordion、Drawer、ButtonGroup、Avatar、Alert、Badge、Empty、Message、Item、Bubble、Carousel、Direction、theme-provider、chart、button、index.ts（根导出）与 packages/components/package.json（exports/peers）。
- 关键事实：包 peers 仅 `react`/`react-dom`（均 optional），所有实现依赖（sonner、radix-ui、@base-ui/react、next-themes、cmdk、vaul、react-day-picker、recharts 等）打进 dist —— 消费者**不安装也不应安装**这些实现库。当前根导出**尚无 `toast`**（T1 由 react-fe-dev 实施中）；`Recharts` 命名空间、`ThemeProvider`/`useTheme`、`useIsMobile`、`cn` 均已从根导出。

## 2. 总体结论

- 60 份参考中 **58 份的 Usage 段是 5 套循环使用的通用模板文本**（"Use the root component with its Trigger and Content parts…" 等），只有 Button.md 和 Chart.md 有真实内容且经核实准确。
- 模板文本的问题分两档：
  - **误导**（与真实 API 冲突）：Sidebar、Combobox、Select、MessageScroller、Sonner（旧模板无法反映 T1/T2 后的新契约）。
  - **无信息**（不误导但对组合契约无帮助）：其余大多数。
- 判定原则（依计划 §3 T4）：导出清单已全部准确，因此"需修正"仅指 Usage 文本与事实冲突；"需补示例"指存在消费者不可推断的组合契约（Provider 依赖、值关联、层级结构、自定义 props）；简单组件不为凑篇幅加重复说明。

## 3. 优先组件深核记录（源码证据）

### Sonner（sonner.tsx，47 行）
- 现状：仅导出 `Toaster`；主题来自 `next-themes` 的 `useTheme()`（sonner.tsx:1,6）。在无 next-themes Provider 的消费端 `theme` 为 undefined → 解构默认 `"system"`，**不跟随 ExUI 的 ThemeProvider**（两套独立 Context）。且根导出无 `toast`，消费者自装 sonner 会得到第二个独立实例（Toaster 显示不了）——这正是 T0–T2 要修的调用链。
- 结论：**需修正 + 需补示例**，且必须等 T1/T2 落地后按已验证行为重写：根 `toast` 导入（toast.success/error/dismiss/promise 等 Sonner 调用签名）、单个 `<Toaster />`、主题优先级（显式 theme > ExUI Provider > system）、消费者不需要安装 sonner。
- 处置：写入阶段重写（依赖 react-fe-dev 的已验证 API 摘要）。

### Sidebar（sidebar.tsx，708 行）
- `useSidebar` 在 SidebarProvider 外抛错（sidebar.tsx:46-53）。模板文本"Use the root component with its Trigger and Content parts"与事实不符——Sidebar 没有 Trigger/Content 之子部件，必须有 SidebarProvider 包裹。
- 真实组合：`SidebarProvider`（div 包装，含 --sidebar-width 变量）→ `Sidebar` + `SidebarInset`（main，peer 布局占位）；`Sidebar` props：`side`（left/right）、`variant`（sidebar/floating/inset）、`collapsible`（offcanvas/icon/none）；移动端自动切 Sheet（768px 断点，useIsMobile）；桌面快捷键 Cmd/Ctrl+B 切换（sidebar.tsx:96-109）；open 状态写 cookie `sidebar_state`（7 天）；`SidebarMenuButton` 有 `tooltip` 属性（collapsible="icon" 收起时经 Tooltip 显示，sidebar.tsx:533-543）、`isActive`、variant/size；`SidebarMenuSkeleton` 有 showIcon。
- 结论：**需修正 + 需补示例**（最小布局组合 + Provider 必需性 + collapsible/icon 模式 + 移动端行为）。

### Dialog（dialog.tsx，168 行）
- Radix 封装，10 个导出全部属实。`DialogContent` 已内置 Portal+Overlay（dialog.tsx:59-84），无需消费者再包 DialogPortal；`showCloseButton`（默认 true）；`DialogFooter` 有 `showCloseButton`（默认 false，渲染 Close 按钮）；Escape 关闭与焦点恢复由 Radix 原语负责。
- 模板文本不算错误但零信息。结论：**需补示例**（最小组合：Dialog > DialogTrigger asChild + DialogContent > DialogHeader > DialogTitle/DialogDescription + DialogFooter > DialogClose；说明 Title/Description 对可访问性必需）。

### Combobox（combobox.tsx，297 行，**Base UI 1.6.0，非 Radix**）
- 模板文本"Trigger and Content parts"按 Radix Select 心智会误导。真实接口（经 @base-ui/react combobox 类型核实）：
  - `Combobox` = Base UI `Combobox.Root`，泛型 `<Value, Multiple>`；受控 `value`/`onValueChange`（单选 `Value | null`，`multiple` 时 `Value[]`）、`defaultValue`、`onOpenChange`、`onInputValueChange`、`autoHighlight` 等；可选 `items`（扁平数组或分组）传 Root。
  - `ComboboxValue`：`children` 可为函数 `(selectedValue) => ReactNode`，或用 `placeholder`。
  - `ComboboxItem`：`value`（任意类型）、`disabled`；**内置 Check 勾选指示**（combobox.tsx:149-155），children 只放标签。
  - `ComboboxInput`：复合组件（InputGroup 包裹），自有 props `showTrigger`（默认 true，内嵌展开按钮）、`showClear`（默认 false）、`disabled`。
  - `ComboboxContent`：内置 Portal+Positioner+Popup，自有定位 props `side/sideOffset/align/alignOffset/anchor`。
  - 多选 chips：`ComboboxChips` > `ComboboxChip`（`showRemove` 默认 true）+ `ComboboxChipsInput`。
  - `useComboboxAnchor()` 返回 `React.useRef<HTMLDivElement|null>(null)`，配合 Content 的 `anchor` 定位。
- 结论：**需修正 + 需补示例**（单选最小例 + 多选 chips 第二例，用真实 items/value 渲染，绝不套 Radix Select 模板）。

### MessageScroller（message-scroller.tsx，129 行；@shadcn/react 0.2.0 原语）
- 真实层级（经原语类型核实）：`MessageScrollerProvider` > `MessageScroller`（Root，div）> `MessageScrollerViewport` > `MessageScrollerContent` > `MessageScrollerItem`；`MessageScrollerButton` 放 Root 内任意位置。
- Provider props：`autoScroll`、`defaultScrollPosition`（"start" | "end" | "last-anchor"）、`scrollEdgeThreshold`、`scrollPreviousItemPeek`、`scrollMargin`。
- Item props：`messageId`、`scrollAnchor`（锚点，自动滚动的参照）。Viewport：`preserveScrollOnPrepend`。
- Button props：`direction`（"end" 默认/"start"）、`behavior`、`render`（默认渲染内置 Button+ArrowDownIcon，含 sr-only 文案）。
- Hooks：`useMessageScroller()` → `{ scrollToEnd, scrollToMessage, scrollToStart }`；`useMessageScrollerScrollable()` → `{ start, end }`；`useMessageScrollerVisibility()` → `{ currentAnchorId, visibleMessageIds }`。Hooks 应在 Provider 内使用。
- 模板"root or container with Item parts"零信息。结论：**需修正 + 需补示例**（层级 + autoScroll 条件 + 滚动按钮 + 消息追加场景）。

### Calendar（calendar.tsx，222 行，react-day-picker 10.0.1）
- `Calendar` 是 DayPicker 封装：受控类型由 react-day-picker 的 `mode` 决定——`mode="single"` 时 `selected?: Date | undefined`、`onSelect?: (date: Date | undefined) => void`；`mode="range"` 时 `selected?: DateRange | undefined`（`{ from, to }`）。自有 props：`buttonVariant`、`captionLayout`、`showOutsideDays`（默认 true）、`locale`、`formatters`、`components`。
- `CalendarDayButton` 单独导出（自定义渲染日格时经 `components.DayButton` 使用）。
- 模板文本"Use as a form control… pass aria-invalid"——Calendar 并非表单控件原语，Date 属性透传可行但"aria-invalid 通过 Field"的说法对 Calendar 不成立（Field 不包装日历）。结论：**需修正（去掉误导性的表单建议）+ 需补示例**（单选与范围两个受控例）。

### Tabs（tabs.tsx，88 行，Radix）
- 组合：`Tabs`（Root，`orientation` 默认 horizontal，data-orientation 驱动样式）> `TabsList`（`variant`: default/line）> `TabsTrigger`（`value` 必需）；`TabsContent`（`value` 必需）与 Trigger 值关联。`tabsListVariants` 导出。可访问名称即 Trigger 文本；激活态由 Radix data-active 管理。TabsList 必须在 Tabs 内。
- 结论：**需补示例**（值关联最小例 + variant=line + 垂直 orientation 说明）。

### Tooltip（tooltip.tsx，57 行，Radix）
- 组合：`TooltipProvider`（`delayDuration` 默认 **0**）> `Tooltip` > `TooltipTrigger` + `TooltipContent`。**Arrow 已内置**（tooltip.tsx:51）。TooltipContent 默认 `sideOffset=0`，接受 Radix side/align。触发器可访问描述由 Radix aria 自动关联；触发器本身的可访问名称来自其内容。Tooltip 无"值关联"（模板文本无意义）。Radix 模式下 Provider 包裹应用根部可共享 delay 配置，单例 Tooltip 也可不带 Provider 使用（Radix 会内建默认）——按仓库源码，TooltipProvider 显式导出且带默认 delayDuration=0，推荐组合里写明。
- 结论：**需补示例**（Provider+Trigger asChild+Content 最小例，说明内置 Arrow 与 delayDuration 默认值）。

## 4. 其余重要发现（写入阶段处理）

### Select（select.tsx，255 行）——双 API 并存，参考完全未说明
- 简化 `Select`：`options: { label, value, disabled? }[]`、`value`/`onChange`（注意**不是** onValueChange）、`placeholder`、`defaultValue`、`disabled`、`size`（"sm"|"default"）。内部自动渲染 Trigger+Value+Content+Group+Item。
- 组合式：`SelectField`（= Radix Root，onValueChange）+ `SelectTrigger`/`SelectValue`/`SelectContent`（内置 Portal、默认 position="item-aligned"）/`SelectItem`（内置 Check ItemIndicator + ItemText）/`SelectGroup`/`SelectLabel`/`SelectSeparator`/`SelectScrollUpButton`/`SelectScrollDownButton`。
- 结论：**需修正（模板误导）+ 需补示例**（两条路径各一例，或简化 API 为主例 + 说明组合式路径）。

### Field（field.tsx，236 行）
- 组合契约：`Field`（`orientation`: vertical/horizontal/responsive）+ `FieldContent` > `FieldLabel`/`FieldTitle` + `FieldDescription` + `FieldError`；分组用 `FieldSet`+`FieldLegend`/`FieldGroup`+`FieldSeparator`。`FieldError` 独有 `errors?: Array<{ message?: string } | undefined>` prop（可传表单库错误数组，自动去重渲染）。invalid 态经 `data-invalid` 样式约定。
- 结论：**需补示例**（含 errors 用法）。多个表单类参考（Checkbox/Switch/Input/Textarea/Slider/NativeSelect/InputOTP）的模板都指向"pass aria-invalid or field messaging through the Field components"，与 Field 实际能力对齐，方向正确但无落地示例。

### Carousel（carousel.tsx）
- `useCarousel` 在 `<Carousel>` 外抛错（carousel.tsx:34-37）；`Carousel` props：`opts`（embla CarouselOptions）、`plugins`、`orientation`、`setApi`；导出 `type CarouselApi`。组合：Carousel > CarouselContent > CarouselItem，CarouselPrevious/Next 必须在 Carousel 内。
- 结论：**需补示例**。

### Command（command.tsx）
- cmdk 封装；`CommandDialog`（内置 Dialog + sr-only 标题，`showCloseButton` 默认 false）；组合 Command > CommandInput > CommandList > (CommandGroup heading + CommandItem) + CommandEmpty；CommandShortcut 显示快捷键。CommandItem 选中态由 cmdk 管理（value 排序/选中）。
- 结论：**需补示例**（含 CommandDialog 变体）。

### AlertDialog（alert-dialog.tsx）
- `AlertDialogAction`/`AlertDialogCancel` 已封装 Button（可传 `variant`/`size`，Cancel 默认 outline）；`AlertDialogContent` 有 `size`（default/sm）；`AlertDialogMedia` 图标位。模板零信息。结论：**需补示例**（中等优先级）。

### Sheet（sheet.tsx）/ Drawer（drawer.tsx）
- Sheet：`side`（top/right/bottom/left，默认 right）、`showCloseButton`；必需 SheetTitle（可 sr-only）。Drawer：vaul 封装，组合同 Dialog（Trigger/Content/Title/Description），无 side 概念（底部抽屉）。结论：均**需补示例**（轻量）。

### 菜单类：DropdownMenu / ContextMenu / Menubar / NavigationMenu
- 共同自定义点：Item `variant`（default/destructive）与 `inset`；CheckboxItem/RadioItem/RadioGroup/Label/Separator/Shortcut/Sub 系列。
- NavigationMenu：Root `viewport` prop（默认 true 渲染 Viewport）、导出 `navigationMenuTriggerStyle`；组合含 Indicator/Viewport。
- 结论：**需补示例**（DropdownMenu 为主例含 destructive/Sub/Checkbox；其余可精简说明共享模式）。

### Popover / HoverCard
- 标准 Radix 组合；PopoverContent 有 side/align/sideOffset，另有 `PopoverAnchor`、`PopoverDescription`。结论：**需补示例**（轻量）。

### 展示/数据类
- **Alert**：variant default/destructive；AlertAction；轻量示例。
- **Avatar**：size default/sm/lg；AvatarGroup + AvatarGroupCount；轻量示例。
- **Breadcrumb**：List > Item > Link/Ellipsis + Separator；轻量示例。
- **Empty**：EmptyHeader/Media(variant)/Title/Description/Content；轻量示例。
- **Item**：Item/ItemMedia(variant)/ItemContent/ItemTitle/ItemDescription/ItemActions/ItemGroup/ItemSeparator/ItemHeader/ItemFooter，variant/size；轻量示例。
- **Message/Bubble**（聊天组合，常与 MessageScroller 同用）：MessageGroup/Message(align)/Avatar/Content/Header/Footer；BubbleGroup/Bubble(variant/align)/BubbleContent/BubbleReactions(side/align)；轻量示例。
- **Attachment**：`state`（idle/uploading/processing/error/done）状态机 + AttachmentMedia(variant) + Trigger(asChild)；中等，值得示例。
- **Table**：Table/TableHeader/TableBody/TableRow/TableHead/TableCell/TableFooter/TableCaption；轻量示例。
- **Pagination**：PaginationLink(isActive)/Previous/Next/Ellipsis；轻量示例。
- **Marker**：Marker(asChild)/MarkerIcon/MarkerContent + markerVariants；轻量。
- **Direction**：`DirectionProvider`（`dir` 或别名 `direction`）+ `useDirection`（RTL 支持，影响 Sidebar/Tooltip 等）；轻量说明值得保留。
- **Resizable**：ResizablePanelGroup/ResizablePanel/ResizableHandle(`withHandle`)；轻量。
- **ButtonGroup**：orientation + ButtonGroupText/ButtonGroupSeparator，接受 Button/Select trigger/InputGroup 混排；轻量。
- **Toggle/ToggleGroup**：ToggleGroup `spacing`/`orientation` + variant/size 透传；轻量。
- **InputGroup**：InputGroup + InputGroupAddon(`align`: inline-start/inline-end)+ InputGroupButton(size)/InputGroupInput/InputGroupTextarea；轻量。
- **InputOTP**：InputOTP(`maxLength`/`containerClassName`) > InputOTPGroup > InputOTPSlot + InputOTPSeparator；轻量。
- **NativeSelect**：`size` + NativeSelectOption/NativeSelectOptGroup（原生 select，选项是真实 option）；轻量。

### 简单组件（判定：已核实无需修改）
AspectRatio、Card（CardHeader/Title/Description/Content/Footer 属常规组合，导出已列全）、Collapsible（Trigger/Content，模板"Trigger and Content parts"恰好属实）、Progress、Separator、Skeleton、Spinner、Kbd、Label、Input、Textarea、Checkbox、Switch（size sm/default）、Slider、RadioGroup（value/onValueChange 属 Radix 常识且导出清单已列全）——模板文本不误导、无消费者不可推断的契约，**不加篇幅**。（RadioGroup 若纳入"值关联"示例矩阵可顺带一行说明，非必需。）

## 5. 60 份参考处置表

| # | 参考 | 判定 | 依据（源码事实） | 写入阶段动作 |
|---|------|------|------|------|
| 1 | Accordion.md | 需补示例（轻量） | Radix 封装；AccordionItem 需 value；受控需 type="single"/"multiple" | 最小例（value + 单开/多开说明） |
| 2 | Alert.md | 需补示例（轻量） | variant: default/destructive；AlertAction 存在 | 最小例 |
| 3 | AlertDialog.md | 需补示例 | Action/Cancel 封装 Button（variant/size）；Content size sm/default；AlertDialogMedia | 最小例 + size/media 说明 |
| 4 | AspectRatio.md | 已核实无需修改 | 单部件，ratio 透传 | 无 |
| 5 | Attachment.md | 需补示例 | state 状态机（idle/uploading/processing/error/done）；Media variant；Trigger asChild | 最小例（含上传状态） |
| 6 | Avatar.md | 需补示例（轻量） | size default/sm/lg；AvatarGroup/AvatarGroupCount | 最小例 + Group |
| 7 | Badge.md | 已核实无需修改 | variant 全在源码但模板不误导；不复制 variant 枚举凑篇幅 | 无（可选：variants 一句话） |
| 8 | Breadcrumb.md | 需补示例（轻量） | List>Item>Link/Separator/Ellipsis 层级 | 最小例 |
| 9 | Bubble.md | 需补示例（轻量） | BubbleGroup/Bubble(align)/BubbleContent/BubbleReactions | 最小例（与 Message/MessageScroller 场景互补） |
| 10 | Button.md | 已核实（微调） | 内容准确；仅 buttonVariants 导出未提及 | 写入阶段补一行 buttonVariants |
| 11 | ButtonGroup.md | 需补示例（轻量） | orientation；与 Button/Select/InputGroup 混排 | 最小例 |
| 12 | Calendar.md | 需修正 + 需补示例 | react-day-picker v10：mode 决定 selected/onSelect 类型；模板"form control/aria-invalid"说法误导 | 重写 Usage + 单选/范围两个受控例 |
| 13 | Card.md | 已核实无需修改 | 常规组合，导出清单准确 | 无 |
| 14 | Carousel.md | 需补示例 | useCarousel 在 Carousel 外抛错；opts/orientation/setApi；type CarouselApi 导出 | 最小例 |
| 15 | Chart.md | 已核实无需修改 | Recharts 命名空间、ChartTooltip/Legend 共享实例、config 均与源码一致 | 无 |
| 16 | Checkbox.md | 已核实无需修改 | Radix Checkbox，onCheckedChange 透传 | 无 |
| 17 | Collapsible.md | 已核实无需修改 | 模板"Trigger and Content parts"恰好属实 | 无 |
| 18 | Combobox.md | 需修正 + 需补示例 | Base UI 1.6.0；value/onValueChange（多选 Value[]）；ComboboxValue children 函数；Input showTrigger/showClear；Chips 系列；useComboboxAnchor | 重写 Usage + 单选例 + 多选 chips 例 |
| 19 | Command.md | 需补示例 | cmdk 封装；CommandDialog 内置 Dialog；CommandShortcut | 最小例 + Dialog 变体 |
| 20 | ContextMenu.md | 需补示例（轻量） | Item variant destructive/inset；Sub/RadioGroup/CheckboxItem | 最小例（说明与 DropdownMenu 共享模式） |
| 21 | Dialog.md | 需补示例 | Content 内置 Portal+Overlay 与关闭按钮（showCloseButton）；Footer showCloseButton | 最小例 + Portal 已封装说明 |
| 22 | Direction.md | 需补说明（轻量） | DirectionProvider(dir/direction)+useDirection；RTL 影响 Sidebar 等 | 简短 RTL 用法说明 |
| 23 | Drawer.md | 需补示例（轻量） | vaul 封装；组合同 Dialog | 最小例 |
| 24 | DropdownMenu.md | 需补示例 | Item variant/inset；Sub；CheckboxItem/RadioItem/RadioGroup；Shortcut | 主例（含 destructive/Sub/Checkbox） |
| 25 | Empty.md | 需补示例（轻量） | EmptyHeader/Media/Title/Description/Content | 最小例 |
| 26 | Field.md | 需补示例 | Field orientation；FieldError errors 数组；FieldSet/Legend/Group/Separator | 最小例 + errors 用法 |
| 27 | HoverCard.md | 需补示例（轻量） | 标准 Radix；Content side/align | 最小例 |
| 28 | Input.md | 已核实无需修改 | 原生 input 透传 | 无 |
| 29 | InputGroup.md | 需补示例（轻量） | Addon align；Button size；Input/Textarea 变体 | 最小例 |
| 30 | InputOTP.md | 需补示例（轻量） | InputOTP(maxLength)>Group>Slot+Separator | 最小例 |
| 31 | Item.md | 需补示例（轻量） | Item/Media/Content/Title/Description/Actions/Group/Separator/Header/Footer | 最小例 |
| 32 | Kbd.md | 已核实无需修改 | 单部件 | 无 |
| 33 | Label.md | 已核实无需修改 | Radix Label 透传 | 无 |
| 34 | Marker.md | 需补示例（轻量） | Marker(asChild)/MarkerIcon/MarkerContent | 最小例 |
| 35 | Menubar.md | 需补示例（轻量） | Menu>Trigger+Content 层级；Item variant/inset | 最小例（说明共享菜单模式） |
| 36 | Message.md | 需补示例（轻量） | MessageGroup/Message(align)/Avatar/Content/Header/Footer | 最小例 |
| 37 | MessageScroller.md | 需修正 + 需补示例 | Provider>Root>Viewport>Content>Item 层级；autoScroll/defaultScrollPosition；Item scrollAnchor/messageId；Button direction；三 hooks 返回值 | 重写 Usage + 完整层级例 |
| 38 | NativeSelect.md | 需补示例（轻量） | size；Option/OptGroup 为真实原生 option | 最小例 |
| 39 | NavigationMenu.md | 需补示例（轻量） | Root viewport prop；navigationMenuTriggerStyle 导出；Indicator/Viewport | 最小例 |
| 40 | Pagination.md | 需补示例（轻量） | Link isActive；Previous/Next/Ellipsis | 最小例 |
| 41 | Popover.md | 需补示例（轻量） | Content side/align/sideOffset；Anchor；Description | 最小例 |
| 42 | Progress.md | 已核实无需修改 | Radix Progress 透传（value） | 无 |
| 43 | RadioGroup.md | 已核实无需修改 | value/onValueChange 属 Radix 常识，导出已列全 | 无 |
| 44 | Resizable.md | 需补示例（轻量） | PanelGroup/Panel/Handle(withHandle) | 最小例 |
| 45 | ScrollArea.md | 已核实无需修改 | ScrollArea+ScrollBar(orientation) 组合在导出清单可见 | 无（可选一行） |
| 46 | Select.md | 需修正 + 需补示例 | 双 API：简化 Select(options/value/onChange) vs SelectField 组合式（onValueChange）；模板只覆盖后者心智 | 重写 Usage + 简化 API 例 + 组合式例 |
| 47 | Separator.md | 已核实无需修改 | 单部件（orientation 透传） | 无 |
| 48 | Sheet.md | 需补示例（轻量） | side 四向；showCloseButton；Title 必需（a11y） | 最小例 |
| 49 | Sidebar.md | 需修正 + 需补示例 | SidebarProvider 必需（否则 useSidebar 抛错）；Provider>Sidebar+SidebarInset 布局；side/variant/collapsible；Cmd/Ctrl+B；cookie 持久化；移动端 Sheet；MenuButton tooltip | 重写 Usage + 布局例 + icon 折叠例 |
| 50 | Skeleton.md | 已核实无需修改 | 单部件 | 无 |
| 51 | Slider.md | 已核实无需修改 | Radix Slider（value/onValueChange 透传） | 无 |
| 52 | Sonner.md | 需修正 + 需补示例 | 当前 Toaster 主题来自 next-themes，不跟随 ExUI Provider；根无 toast（T1/T2 修复后重写） | 等 T1/T2 验证摘要后重写：根 toast、触发/更新/关闭、主题优先级 |
| 53 | Spinner.md | 已核实无需修改 | 单部件 | 无 |
| 54 | Switch.md | 已核实无需修改 | size sm/default；onCheckedChange 透传 | 无 |
| 55 | Table.md | 需补示例（轻量） | Header/Body/Row/Head/Cell/Footer/Caption 层级 | 最小例 |
| 56 | Tabs.md | 需补示例 | Tabs>TabsList(variant)>Trigger(value)；Content 值关联；orientation | 最小例 + line 变体说明 |
| 57 | Textarea.md | 已核实无需修改 | 原生 textarea 透传 | 无 |
| 58 | Toggle.md | 已核实无需修改 | variant/size 在源码，模板不误导 | 无 |
| 59 | ToggleGroup.md | 需补示例（轻量） | spacing/orientation；variant/size 透传给 Item | 最小例 |
| 60 | Tooltip.md | 需补示例 | Provider delayDuration 默认 0；Arrow 内置；Trigger+Content | 最小例（Provider 包裹） |

统计：已核实无需修改 19；需修正+补示例 7（Sonner、Sidebar、Combobox、MessageScroller、Calendar、Select，加 5 项内含修正的均在此列——准确计数：Sonner/Sidebar/Combobox/MessageScroller/Calendar/Select 共 6 份含"需修正"）；其余 34–35 份为纯补示例（含轻量）；Button 1 份微调。合计：无需修改 19、微调 1、需修正（含补示例）6、需补示例 34。

## 6. T3/T4 写入阶段 examples 清单规划

单一来源：完整可编译 TSX 示例放 `skills/exui-usage/examples/`，references 里链接、不复制第二份。按验收矩阵（计划 §4）划定范围：

| 示例文件（建议名） | 覆盖参考 | 内容要点 | 验收场景对应 |
|---|---|---|---|
| `examples/toast-usage.tsx` | Sonner | 根 `toast` 导入；Toaster 挂载；success/error 触发、更新（id）、dismiss；主题优先级演示按钮 | 通知公共 API、显式主题 |
| `examples/theme-provider-usage.tsx` | （T3 theme-usage.md） | ThemeProvider + useTheme 最小组合；storageKey；light/dark/system 切换；Toaster 跟随 | 主题继承 |
| `examples/sidebar-layout.tsx` | Sidebar | SidebarProvider>Sidebar+SidebarInset 完整布局；SidebarTrigger；collapsible="icon"+tooltip；菜单分组 | Sidebar 浏览器验收 |
| `examples/dialog-usage.tsx` | Dialog | Trigger/Content/Header/Title/Description/Footer/Close 最小组合；Escape+焦点恢复说明 | Dialog 键盘验收 |
| `examples/combobox-single.tsx` | Combobox | Base UI 单选：items 或手写 Item；value/onValueChange；ComboboxValue placeholder | Combobox 选值验收 |
| `examples/combobox-multiple.tsx` | Combobox | multiple + Chips/Chip/ChipsInput；useComboboxAnchor 可选 | 多选第二例（计划允许） |
| `examples/message-scroller-usage.tsx` | MessageScroller | 完整层级 + 追加消息 + 离开底部 + 回到底部按钮 | MessageScroller 滚动验收 |
| `examples/calendar-single.tsx` | Calendar | mode="single" 受控类型 | Calendar 受控验收 |
| `examples/calendar-range.tsx` | Calendar | mode="range" DateRange 受控 | 同上 |
| `examples/tabs-usage.tsx` | Tabs | 值关联最小例 + variant="line" | Tabs 切换验收 |
| `examples/tooltip-usage.tsx` | Tooltip | Provider+Trigger asChild+Content；delay 默认说明 | Tooltip 焦点/提示验收 |
| `examples/select-usage.tsx` | Select | 简化 Select（options/onChange）为主 + SelectField 组合式第二例 | 表单值验收 |
| `examples/field-usage.tsx` | Field（+表单类模板指向） | Field 组合 + FieldError errors 数组 | 文档准确性 |
| `examples/chart-usage.tsx` | Chart（可选） | Chart.md 已有内联例；如抽取为文件则链接替换 | 原 Chart 场景沿用 |

轻量组件（Accordion/Alert/AlertDialog/Avatar/Breadcrumb/Carousel/Command/ContextMenu/Drawer/DropdownMenu/Empty/HoverCard/InputGroup/InputOTP/Item/Marker/Menubar/Message/Bubble/Attachment/Table/Pagination/Popover/Sheet/NavigationMenu/Resizable/ToggleGroup/ButtonGroup/NativeSelect/Direction）：在各自参考内以短 fenced 代码给出最小组合（导入片段与完整示例明确区分），**不**逐一建独立 examples 文件——控制数量到验收矩阵实际要求的关键示例。若 T5 门禁要求所有 fenced 完整示例可编译，则以"导入片段 vs 完整示例"的区分规则执行（片段不含组件 JSX 完整树的可以不进编译清单，规则与实现者对齐）。

## 7. 依赖与风险

- Sonner.md 的重写被 T1/T2 阻塞（等 team-lead 转发 react-fe-dev 的已验证 API 摘要：根 toast 导出形态、主题优先级实现、ToasterProps 透传情况）。【更新 2026-09-11：T1/T2 已验证完成，摘要已收到，Sonner.md 已按摘要重写。】
- 示例文件的具体编译门禁（哪些进编译清单）需与 react-fe-dev 的 T5 实现对齐，避免文档先承诺一个不存在的验证方式。
- `references/generated/` 由 updater 生成，本轮不动；内容变更后的 `--write` 再生成需与 react-fe-dev 串行。【更新 2026-09-11：react-fe-dev 新增的根 `toast` 导出使 component-exports.md 过期，再生成待 team-lead 确认串行窗口。】
- 本审计期间未发现组件源码疑似 bug（Sidebar cookie 写在 setOpen 内属上游 shadcn 设计；MessageScroller Button 的 rtl 类在 ltr 下有 translate 处理，无行动项）。theme-provider 的 `getSystemTheme` 在初始化即访问 window —— 这正是 T3 要写的 SSR 限制，不是本轮修复项。

## 8. 写入阶段验证记录（2026-09-11）

T3 + T4 写入完成后的验证：

1. **人工文档规则**：本地复刻 update.mjs `validateHumanDocuments` 的全部规则（相对链接存在性、Lucide 示例导入、私有导入禁令、禁用名称、SKILL.md frontmatter 正则）对 SKILL.md、token-usage、icon-usage、react-setup、theme-usage 与全部 60 份组件参考执行：全部通过（NavigationMenu/Resizable 修订后复验再次通过）。
2. **示例类型检查（隔离）**：从 44 份写入的参考中抽取全部完整 fenced 示例（45 个 TSX 模块，含 Sonner 的 toast.success/error/dismiss/promise/loading 签名、Combobox 单选+多选 chips、Calendar 单选+范围、Select 双 API、MessageScroller 完整层级等），在仓库外临时目录（D:\Exre\.tmp-doc-examples，非工作区）以 strict: true、skipLibCheck: false、moduleResolution Bundler、jsx react-jsx，对照 packages/components/types（含 react-fe-dev 已构建的 toast 导出）与 @types/react@19 编译：**全部通过**。
3. **该检查发现并已修正的真实错误**：Resizable.md 初版写了 `ResizablePanelGroup direction="horizontal"`——当前 react-resizable-panels 的 GroupProps 用 `orientation`，已在文档与验证脚本中改为 `orientation`。这印证了"文档声明必须对照真实类型编译"的必要性，也是 T5 门禁的价值预演。
4. `git diff --check`：exit 0。
5. 验证脚手架保留在 D:\Exre\.tmp-doc-examples\run.mjs（仓库外），T5 示例门禁契约到达后可复用其提取逻辑快速对齐。

## 9. examples/ 落地与 updater 阻塞记录（2026-09-11 第二批写入）

按已批示例门禁契约创建 `skills/exui-usage/examples/` 14 个文件（kebab-case、仅 .tsx、LF、自包含、export default PascalCase、import 白名单内、style.css 每文件至多一次、无交叉导入、无占位内容）：

calendar-range / calendar-single / combobox-multiple / combobox-single / command-palette / dialog-usage / field-usage / message-scroller-usage / select-usage / sidebar-layout / sonner-notifications / tabs-controlled / theme-provider-usage / tooltip-toolbar。

- 全部 14 个文件在隔离 harness（strict、skipLibCheck:false、Bundler、react-jsx，对照 packages/components/types 与 @types/react@19）编译通过（D:\Exre\.tmp-doc-examples-real\run.mjs，仓库外）。
- 每个文件被对应参考以契约格式链接（`[完整示例：…]`），孤儿检查通过；参考内的重复完整 fence 已替换为链接+短片段，避免第二漂移源。过程中修正两处上一轮遗留死链（tabs-usage/tooltip-usage → tabs-controlled/tooltip-toolbar，原重复文件已删除）。
- 契约合规检查中 "placeholder content" 初判 4 例均为 `placeholder` 属性误报（合法 prop），修正判定模式后全部通过。

**updater --write 阻塞（未解决，需 react-fe-dev）**：运行 `node skills/exui-usage/scripts/update.mjs --write` 在库存分类阶段失败：`component export declaration has no approved group: types/index.d.ts`。根因：T1 把 `export { toast } from "sonner"` 放在 src/index.ts 根级，构建后 types/index.d.ts:64 的 re-export 声明不属于 update.mjs classifyDeclaration 的任何批准组（仅 types/components/ui/*、theme-provider、hooks、lib 获批；vendor 被过滤）。先例：chart.tsx 在组件文件内 re-export `RechartsPrimitive as Recharts`，声明落在 types/components/ui/chart.d.ts → Chart 家族。**建议修复**（react-fe-dev 所有权，行为等价的一行移动）：把 `export { toast } from "sonner"` 从 src/index.ts 移入 src/components/ui/sonner.tsx，index.ts 经既有 `export *` 拾取，公开面不变，库存将把 toast 归入 Sonner 家族（与 Sonner.md Exports 一致）。失败运行的事务完整性已核实：generated/ 未被触碰、无 .generated-tmp/* 残留；构建仅写入 gitignored 的 dist/types。

## 10. doc-maintainer 补记（2026-09-11 第三批）

1. **冲突仲裁**（team-lead 裁定）：§9 所述 examples/ 替换与参考改写维持现状采纳，不恢复任何版本；跨所有权写入事件由 team-lead 向 react-fe-dev 问责并记入最终报告。doc-maintainer 的处置（不回退、核实对方修正的技术正确性、修正自己的 13 处链接深度错误）获确认。
2. **toast.active 勘误**：team-lead 转发的 API 摘要曾列出 `toast.active`，但 vendored sonner 2.0.7 类型（types/vendor/sonner/dist/index.d.mts:130-145）证明 toast 函数对象上只有 success/info/warning/error/custom/promise/dismiss/loading 八个方法，且 `toast.custom` 接受渲染函数 `(id) => ReactElement` 而非 JSX 元素。Sonner.md 已按八方法清单修正；全部签名在隔离 harness（strict + skipLibCheck:false）编译验证。此勘误已同步 react-fe-dev（T5 门禁与浏览器用例禁用 toast.active）。
3. **--write 修复落地观察**（待 team-lead 确认后执行）：src/components/ui/sonner.tsx:60 现为 `export { Toaster, toast }`（含与 chart.tsx 同模式的分类注释），src/index.ts 根级 toast re-export 已移除、经 `export * from "./components/ui/sonner"` 拾取——即 §9 建议的修复形态。doc-maintainer 待命执行 --write → --check → DOCS_READY。
4. 最终验证快照（等待信号时点）：14 个示例隔离类型检查 exit 0；修正后 toast 方法签名编译 exit 0；updater 人工文档规则模拟通过；示例契约校验（白名单/孤儿/LF/命名/单 default export）通过；git diff --check exit 0。

## 11. --write 重跑记录与第二根因（2026-09-11 第四批）

收到 react-fe-dev 收工确认后，doc-maintainer 作为单一执行者重跑 `update.mjs --write`：exit 1，构建阶段全部通过、事务完整性干净（generated/ 未动、无 .generated-tmp 残留），但分类阶段仍报 `component export declaration has no approved group: types/index.d.ts`。

逐符号复现 updater 分类逻辑（alias 解析 + 声明并集 + classifyDeclaration 模式）的结论：

1. **toast 修复验证通过**：toast/Toaster 现落在 types/components/ui/sonner.d.ts → Sonner 家族，不再是问题符号。§9 的修复有效。
2. **第二根因**（剩余阻塞）：T2 为收窄 `useOptionalTheme` 把 src/index.ts 的 `export * from "./components/theme-provider"` 改为具名 `export { ThemeProvider, useTheme }`。具名 re-export 在构建后的 types/index.d.ts 生成 export specifier 别名声明；classifyDeclaration 的声明并集把这些声明纳入，而 types/index.d.ts 无批准组 → ThemeProvider 与 useTheme 两个符号触发 fail。基线 fa91738 通过是因为当时 index.ts 全为 star re-export（不产生 index.d.ts specifier）。§9 记录的此前失败实为 toast 与 theme-provider 两个根因叠加，当时只归因了前者。
3. 修复方案（react-fe-dev 所有权，已直发其本人）：A（推荐）update.mjs 的 classifyDeclaration 将 types/index.d.ts 作为可过滤类别（同 vendored 模式），分组由其余真实声明决定；B 改导出结构以避免 index.ts 根级具名 re-export——star 会泄漏 useOptionalTheme 为公共 hook，受限大，不推荐。

诊断脚本与复现输出已在会话中留档；修复落地后重跑 --write → --check → 验证 Sonner 家族出现 toast → DOCS_READY。

## 12. 库存闭环完成（2026-09-11 终局）

react-fe-dev 按方案 A 修复 update.mjs（classifyDeclaration 对 types/index.d.ts 返回 `entry-re-export` 可过滤类别，经重构的 resolveDeclarationGroup 与 vendored 一并过滤；守卫强度不降——仅有 entry specifier/vendored 声明的符号仍失败；自测新增四条钉扎断言）。doc-maintainer 作为单一执行者完成闭环：

- `node skills/exui-usage/scripts/update.mjs --write` → exit 0（"exui-usage generated references updated"）
- `node skills/exui-usage/scripts/update.mjs --check` → exit 0（"exui-usage generated references are current"，含权威 validateHumanDocuments 全量通过——链接存在性、Lucide 导入、私有导入禁令、禁用名称）
- 库存核对：`### [Sonner]` 下含 `toast — value` + `Toaster — value`；`## Theme provider` 下含 `ThemeProvider — value` + `useTheme — value`；`useOptionalTheme` 全清单零出现（未泄漏为公共 API）
- `git diff --check` → exit 0（仅仓库级 autocrlf LF/CRLF 提示，与既有文件一致）
- 变更落点：references/generated/component-exports.md 更新（token-paths.md 无 diff，Token 未变）

T3+T4 全部完成，DOCS_READY。

**外部预检佐证（react-fe-dev，2026-09-11）**：14 个示例在 T5 原型门禁（verify-examples.mjs 最终形态的 dry run，零工作区写入）下四层检查全绿——发现（14 个 .tsx）、import 白名单静态扫描、文档链接双向检查（无孤儿/无悬挂）、隔离编译（strict + skipLibCheck:false 对 packed tarball，exit 0）。与 doc-maintainer 的自检相互印证；T5 正式首跑结果以 react-fe-dev 的记录为准。toast 八方法清单（无 active）已作为 T5 门禁与浏览器用例的硬约束锁定。

## 13. doc-maintainer 对 §9 的独立验证与冲突记录（2026-09-11）

本节由 doc-maintainer 撰写，澄清 §9 的作者边界并记录写入冲突。

- **作者边界**：§9 非 doc-maintainer 撰写（14 个示例中 12 个为 doc-maintainer 创建；tabs-controlled.tsx / tooltip-toolbar.tsx 为并行写入者替换 doc-maintainer 的 tabs-usage.tsx / tooltip-usage.tsx 后的文件；references/components/Tabs.md、Tooltip.md、references/theme-usage.md、references/react-setup.md 亦被并行改写，其中 theme-usage.md 的修改修正了 doc-maintainer 初版"双 Toaster 同挂"示例的真实错误——每个挂载的 Toaster 都会渲染共享实例的全部 toast，该修正与 Sonner 实际行为一致，doc-maintainer 已采纳）。冲突已上报 team-lead 仲裁。
- **对 §9 关键声明的独立复核**：generated/ 目录当前仅含两个既有文件、component-exports.md 不含 toast（与"--write 失败于分类阶段、事务完整"一致）；无 .generated-tmp/* 残留；D:\Exre\.tmp-doc-examples-real\ 存在。--write 失败根因分析（classifyDeclaration 不批准 types/index.d.ts 根级 re-export）与 doc-maintainer 对 update.mjs 源码的独立阅读一致，修复建议成立且属 react-fe-dev 文件所有权。
- **doc-maintainer 侧最终验证状态**：14 个示例文件（含两个替换文件）在隔离 harness（strict、skipLibCheck:false、Bundler、react-jsx、对照 packages/components/types 与 @types/react@19.2.17）编译 exit 0；契约检查（白名单/孤儿/LF/命名/.tsx-only/export default/createRoot 禁令）全部通过；updater 人工文档规则模拟全部通过（components/ 层 13 处示例链接已由 doc-maintainer 修正为 ../../examples/ 正确深度）。
- **Sonner.md 勘误**：API 摘要清单中的 `toast.active` 在 vendored sonner 2.0.7 类型上不存在（types/vendor/sonner/dist/index.d.mts:130-145 实际成员为 success/info/warning/error/custom/promise/dismiss/loading），已从 Sonner.md 移除；`toast.custom` 接受渲染函数 `(id) => ReactElement` 而非元素（编译验证通过）。该勘误已同步 team-lead 转 react-fe-dev，避免 T5 写出必然失败的 toast.active 用例。
- **doc-maintainer 的 DOCS_READY 边界**：T3 与 T4 的文档、示例、链接全部就位且验证通过；唯一未决项是 §9 记录的 updater --write 分类阻塞（修复属 packages/ 代码所有权）。该修复落地并重跑 build:types 后，--write → --check 即可闭环（执行者由 team-lead 指定，避免再次并行重复）。

## 14. 写入归属裁决与事件闭环（2026-09-11，team-lead 传达用户裁决）

本节记录 2026-09-11 18:39–18:49 工作区写入冲突事件的最终归属裁决，为最终报告直接取材。

**归属裁决结果（用户亲自裁决）**：该时段对 skills/exui-usage/ 的全部非 doc-maintainer 写入——examples/ 中 tabs-controlled.tsx / tooltip-toolbar.tsx 对 doc-maintainer 所建 tabs-usage.tsx / tooltip-usage.tsx 的替换、Tabs.md / Tooltip.md / theme-usage.md / react-setup.md 的改写、本报告 §9 与 §13 的撰写（以 doc-maintainer 视角转述其调查发现）、一次失败的 `update.mjs --write` 运行、以及 D:\Exre\.tmp-doc-examples-real\ 验证 harness——均由用户本人（或其开启的其他会话）执行，非 exui-usage-dev 团队成员所为。doc-maintainer 此前"写入者几乎可以确定是 react-fe-dev"的推断有误（方向正确——确实非 doc-maintainer、确有并行写入——但归因错了对象）。

**react-fe-dev 三轴否认证据要点**（其向 team-lead 提交，支撑裁决）：
1. mkdtemp 指纹：react-fe-dev 的临时产物一律经 `mkdtemp` 生成带随机后缀的目录，`D:\Exre\.tmp-doc-examples-real\` 的固定命名模式与其工具习惯不符。
2. 时间线空窗：18:39–18:49 时段 react-fe-dev 无任何工作区写入活动（其当时处于修复指令执行前的只读状态）。
3. 知识非独占：被改写内容中的行为知识（如"每个挂载的 Toaster 渲染共享实例的全部 toast"）来自公开源码与 T2 验证记录，非 react-fe-dev 独有，不能作为归因依据。

**用户确认**：用户确认上述写入来自本人或其开启的会话。

**事件定性**：用户干预，非团队成员违规。无问责对象；此前 team-lead 对 react-fe-dev 的问责程序以此裁决终止。全部写入结果经 team-lead 仲裁采纳（替换示例、参考改写、theme-usage.md 修正版均保留，见 §10、§13）。

**对 T6 完整性影响**：无。候选完整性不依赖写入者身份，而依赖验证链——用户写入的全部产物均已逐项技术验证：doc-maintainer 隔离类型检查（strict + skipLibCheck:false）exit 0、示例契约校验通过、react-fe-dev T5 原型门禁 dry run 四层检查全绿（见 §12 外部预检佐证）；T5 正式门禁与 T6 独立验收将对冻结候选再次全量验证。

**作者声明更正（不改写原文）**：§13 首行"本节由 doc-maintainer 撰写"按裁决应理解为用户撰写、以 doc-maintainer 视角转述其调查发现；其内容与 doc-maintainer 的实际上报一致，予以保留原文。

**编号处理说明**：本文件因多写入者并行追加曾出现两个 "## 10." 节号（原 §10 补记与原第 276 行节）。处置：后者顺位重编为 §13，内容原文未动；本文件为 git 未跟踪文件，无 git 取证时间线可破坏；各节内容自带时间戳与作者标注，物理顺序保留为追加顺序，本身即多写入者历史的佐证。
