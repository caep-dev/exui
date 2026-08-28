---
name: exui-components
description: Exre UI component usage guide. Use when choosing, importing, composing, or explaining components from the @exre/exui React component library, including Button, Dialog, Form controls, layout primitives, feedback components, navigation components, and shadcn/Radix-based compound components.
---

# Exre UI Components

Use this skill to choose and use components from `@exre/exui` in a consuming React app.

## Package Setup

Import the stylesheet once at the application entry point:

```tsx
import "@exre/exui/style.css"
```

Import components from the package root:

```tsx
import { Button, Dialog, DialogContent } from "@exre/exui"
```

Do not import from `src/`, `dist/`, or `types/` in consuming apps.

## How To Use This Skill

1. Pick the component from the catalog below.
2. Read the matching `refs/<Component>.md` file for imports, exports, and usage notes.
3. For compound components, import all required parts from `@exre/exui` and compose them together.
4. Keep accessibility props such as labels, descriptions, `aria-label`, and validation state explicit.

## Component Catalog

- [Accordion](refs/Accordion.md): `Accordion, AccordionItem, AccordionTrigger, AccordionContent`
- [AlertDialog](refs/AlertDialog.md): `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, ...`
- [Alert](refs/Alert.md): `Alert, AlertTitle, AlertDescription, AlertAction`
- [AspectRatio](refs/AspectRatio.md): `AspectRatio`
- [Attachment](refs/Attachment.md): `Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, ...`
- [Avatar](refs/Avatar.md): `Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge`
- [Badge](refs/Badge.md): `Badge, badgeVariants`
- [Breadcrumb](refs/Breadcrumb.md): `Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, ...`
- [Bubble](refs/Bubble.md): `BubbleGroup, Bubble, BubbleContent, BubbleReactions`
- [ButtonGroup](refs/ButtonGroup.md): `ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants`
- [Button](refs/Button.md): `Button, ActionButton, buttonVariants`
- [Calendar](refs/Calendar.md): `Calendar, CalendarDayButton`
- [Card](refs/Card.md): `Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, ...`
- [Carousel](refs/Carousel.md): `type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, ...`
- [Chart](refs/Chart.md): `ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle`
- [Checkbox](refs/Checkbox.md): `Checkbox`
- [Collapsible](refs/Collapsible.md): `Collapsible, CollapsibleTrigger, CollapsibleContent`
- [Combobox](refs/Combobox.md): `Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ...`
- [Command](refs/Command.md): `Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, ...`
- [ContextMenu](refs/ContextMenu.md): `ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ...`
- [Dialog](refs/Dialog.md): `Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, ...`
- [Direction](refs/Direction.md): `DirectionProvider, useDirection`
- [Drawer](refs/Drawer.md): `Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, ...`
- [DropdownMenu](refs/DropdownMenu.md): `DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, ...`
- [Empty](refs/Empty.md): `Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia`
- [Field](refs/Field.md): `Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldLegend, ...`
- [HoverCard](refs/HoverCard.md): `HoverCard, HoverCardTrigger, HoverCardContent`
- [InputGroup](refs/InputGroup.md): `InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea`
- [InputOTP](refs/InputOTP.md): `InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator`
- [Input](refs/Input.md): `Input`
- [Item](refs/Item.md): `Item, ItemMedia, ItemContent, ItemActions, ItemGroup, ItemSeparator, ...`
- [Kbd](refs/Kbd.md): `Kbd, KbdGroup`
- [Label](refs/Label.md): `Label`
- [Marker](refs/Marker.md): `Marker, MarkerIcon, MarkerContent, markerVariants`
- [Menubar](refs/Menubar.md): `Menubar, MenubarPortal, MenubarMenu, MenubarTrigger, MenubarContent, MenubarGroup, ...`
- [MessageScroller](refs/MessageScroller.md): `MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton, ...`
- [Message](refs/Message.md): `MessageGroup, Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader`
- [NativeSelect](refs/NativeSelect.md): `NativeSelect, NativeSelectOptGroup, NativeSelectOption`
- [NavigationMenu](refs/NavigationMenu.md): `NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, ...`
- [Pagination](refs/Pagination.md): `Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, ...`
- [Popover](refs/Popover.md): `Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, ...`
- [Progress](refs/Progress.md): `Progress`
- [RadioGroup](refs/RadioGroup.md): `RadioGroup, RadioGroupItem`
- [Resizable](refs/Resizable.md): `ResizableHandle, ResizablePanel, ResizablePanelGroup`
- [ScrollArea](refs/ScrollArea.md): `ScrollArea, ScrollBar`
- [Select](refs/Select.md): `Select, SelectField, SelectContent, SelectGroup, SelectItem, SelectLabel, ...`
- [Separator](refs/Separator.md): `Separator`
- [Sheet](refs/Sheet.md): `Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, ...`
- [Sidebar](refs/Sidebar.md): `Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, ...`
- [Skeleton](refs/Skeleton.md): `Skeleton`
- [Slider](refs/Slider.md): `Slider`
- [Sonner](refs/Sonner.md): `Toaster`
- [Spinner](refs/Spinner.md): `Spinner`
- [Switch](refs/Switch.md): `Switch`
- [Table](refs/Table.md): `Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, ...`
- [Tabs](refs/Tabs.md): `Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants`
- [Textarea](refs/Textarea.md): `Textarea`
- [ToggleGroup](refs/ToggleGroup.md): `ToggleGroup, ToggleGroupItem`
- [Toggle](refs/Toggle.md): `Toggle, toggleVariants`
- [Tooltip](refs/Tooltip.md): `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger`

## Common Patterns

Use `Button` for actions, form controls such as `Input`, `Select`, `Checkbox`, `Switch`, and `RadioGroup` for data entry, and compound overlays such as `Dialog`, `Popover`, `Tooltip`, `Sheet`, and `Drawer` for disclosure surfaces.

Most components accept `className` and forward native or Radix primitive props. Prefer the documented exported parts over private source imports.
