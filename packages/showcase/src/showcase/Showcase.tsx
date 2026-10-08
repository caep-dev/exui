import * as React from "react"
import {
  ActionButton,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Bubble,
  BubbleContent,
  BubbleGroup,
  Button,
  ButtonGroup,
  ButtonGroupText,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ExMessage,
  ExMessageContext,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  GlassSeed,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  SelectContent,
  SelectField,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type ExMessageLoadingHandle,
} from "@exre/exui"
import {
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  LayersIcon,
  MoonIcon,
  PanelRightOpenIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react"

import { GlassSample } from "./GlassSample"
import { FormExamples } from "./FormExamples"
import { ModalSamples } from "./ModalSamples"
import { ShowcaseLanguageProvider } from "./ShowcaseLanguageProvider"
import { useShowcaseLanguage } from "./language"
import { translate, useT } from "./translations"
import "./Showcase.css"

const catalogCategories = [
  {
    id: "overview",
    label: "Overview",
    description: "Browse every public Exre UI module in one place.",
  },
  {
    id: "foundation",
    label: "Foundation",
    description: "Theme, direction, geometry, and shared visual building blocks.",
  },
  {
    id: "actions",
    label: "Actions",
    description: "Buttons, toggles, and menus that start an interaction.",
  },
  {
    id: "form-controls",
    label: "Form controls",
    description: "Inputs and choice controls for collecting structured data.",
  },
  {
    id: "data-display",
    label: "Data display",
    description: "Content, status, conversation, and visualization surfaces.",
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Progress, alerts, loading states, and notifications.",
  },
  {
    id: "overlays",
    label: "Overlays",
    description: "Focused, contextual, and transient layers.",
  },
  {
    id: "navigation-layout",
    label: "Navigation & layout",
    description: "Wayfinding, panes, and adaptable page structure.",
  },
  {
    id: "quality-recipes",
    label: "Quality recipes",
    description: "Deterministic states used by visual regression checks.",
  },
] as const

type CatalogCategoryId = (typeof catalogCategories)[number]["id"]

interface CatalogItem {
  category: Exclude<CatalogCategoryId, "overview" | "quality-recipes">
  description: string
  name: string
}

const catalogItems: CatalogItem[] = [
  { category: "foundation", name: "ThemeProvider", description: "Coordinates the active brand theme." },
  { category: "foundation", name: "useTheme", description: "Reads and updates the active theme." },
  { category: "foundation", name: "GlassSeed", description: "Enables the optional glass enhancement once per document." },
  { category: "foundation", name: "DirectionProvider", description: "Sets shared text direction for composed controls." },
  { category: "foundation", name: "Aspect Ratio", description: "Preserves a declared media ratio." },
  { category: "foundation", name: "Kbd", description: "Displays keyboard shortcuts consistently." },
  { category: "foundation", name: "Label", description: "Labels form controls accessibly." },
  { category: "foundation", name: "Separator", description: "Separates related content without adding hierarchy." },
  { category: "foundation", name: "Scroll Area", description: "Adds styled overflow regions." },
  { category: "foundation", name: "useMobile", description: "Reports the compact layout breakpoint." },
  { category: "foundation", name: "cn", description: "Merges conditional class names." },
  { category: "actions", name: "Button", description: "Starts a primary or secondary action." },
  { category: "actions", name: "ActionButton", description: "Provides an action-oriented button treatment." },
  { category: "actions", name: "Button Group", description: "Keeps adjacent actions visually connected." },
  { category: "actions", name: "Toggle", description: "Switches a pressed state on or off." },
  { category: "actions", name: "Toggle Group", description: "Coordinates a related set of toggles." },
  { category: "actions", name: "Dropdown Menu", description: "Reveals a compact action menu." },
  { category: "actions", name: "Context Menu", description: "Offers actions at the current pointer context." },
  { category: "actions", name: "Menubar", description: "Organizes application-level commands." },
  { category: "form-controls", name: "Calendar", description: "Selects dates in a visual calendar." },
  { category: "form-controls", name: "Checkbox", description: "Collects independent boolean choices." },
  { category: "form-controls", name: "Combobox", description: "Combines text search with option selection." },
  { category: "form-controls", name: "Field", description: "Composes labels, descriptions, and validation states." },
  { category: "form-controls", name: "ExForm", description: "Builds typed forms from a schema and field configuration." },
  { category: "form-controls", name: "Form", description: "Connects a shared draft to validation and submission." },
  { category: "form-controls", name: "FormItem", description: "Binds a typed field, label, help, and errors." },
  { category: "form-controls", name: "FormList", description: "Adds, removes, and reorders object-array rows." },
  { category: "form-controls", name: "Input", description: "Collects a single line of text." },
  { category: "form-controls", name: "Input Group", description: "Adds actions or context around an input." },
  { category: "form-controls", name: "Input OTP", description: "Captures one-time passcodes in discrete slots." },
  { category: "form-controls", name: "Native Select", description: "Uses the browser's native option picker." },
  { category: "form-controls", name: "Radio Group", description: "Collects one choice from a small set." },
  { category: "form-controls", name: "Select", description: "Selects from a styled list of options." },
  { category: "form-controls", name: "Slider", description: "Chooses a value from a continuous range." },
  { category: "form-controls", name: "Switch", description: "Turns a setting on or off immediately." },
  { category: "form-controls", name: "Textarea", description: "Collects multi-line text." },
  { category: "data-display", name: "Accordion", description: "Expands and collapses grouped content." },
  { category: "data-display", name: "Attachment", description: "Displays file metadata and attachment actions." },
  { category: "data-display", name: "Avatar", description: "Represents a person or entity visually." },
  { category: "data-display", name: "Badge", description: "Communicates compact status or metadata." },
  { category: "data-display", name: "Bubble", description: "Displays message-like content and reactions." },
  { category: "data-display", name: "Card", description: "Groups related content into a surface." },
  { category: "data-display", name: "Carousel", description: "Paginates through related visual items." },
  { category: "data-display", name: "Chart", description: "Styles Recharts data visualizations." },
  { category: "data-display", name: "Empty", description: "Explains a collection with no content." },
  { category: "data-display", name: "Item", description: "Presents a compact row of structured content." },
  { category: "data-display", name: "Marker", description: "Highlights a location or notable item." },
  { category: "data-display", name: "Message", description: "Composes conversation content and metadata." },
  { category: "data-display", name: "Message Scroller", description: "Keeps long conversations scrollable." },
  { category: "data-display", name: "Table", description: "Displays tabular information with shared styling." },
  { category: "feedback", name: "Alert", description: "Communicates an important static message." },
  { category: "feedback", name: "Progress", description: "Shows completion toward a known goal." },
  { category: "feedback", name: "Skeleton", description: "Reserves space while content loads." },
  { category: "feedback", name: "Spinner", description: "Signals indeterminate work in progress." },
  { category: "feedback", name: "Toaster", description: "Publishes transient toast notifications." },
  { category: "feedback", name: "ExMessage", description: "Manages application-wide notifications and loading results." },
  { category: "overlays", name: "Alert Dialog", description: "Confirms a consequential decision." },
  { category: "overlays", name: "Command", description: "Searches and runs available commands." },
  { category: "overlays", name: "Dialog", description: "Focuses attention on a modal task." },
  { category: "overlays", name: "Drawer", description: "Opens contextual content from the viewport edge." },
  { category: "overlays", name: "Hover Card", description: "Reveals rich context on hover or focus." },
  { category: "overlays", name: "Modal", description: "A titled dialog that sizes itself and fills a phone screen." },
  { category: "overlays", name: "Popover", description: "Anchors contextual content to a trigger." },
  { category: "overlays", name: "Sheet", description: "Presents a modal panel from an edge." },
  { category: "overlays", name: "Tooltip", description: "Explains an unfamiliar control on hover or focus." },
  { category: "navigation-layout", name: "Breadcrumb", description: "Shows the current place in a hierarchy." },
  { category: "navigation-layout", name: "Collapsible", description: "Shows or hides optional content in place." },
  { category: "navigation-layout", name: "Navigation Menu", description: "Organizes high-level destinations." },
  { category: "navigation-layout", name: "Pagination", description: "Moves through pages of a collection." },
  { category: "navigation-layout", name: "Resizable", description: "Lets users adjust adjacent panel sizes." },
  { category: "navigation-layout", name: "Sidebar", description: "Builds responsive application navigation." },
  { category: "navigation-layout", name: "Tabs", description: "Switches between peer views in place." },
]

const invoices = [
  { id: "EX-2401", owner: "Design Ops", status: "Paid", amount: "$2,400" },
  { id: "EX-2402", owner: "Platform", status: "Pending", amount: "$890" },
  { id: "EX-2403", owner: "Growth", status: "Draft", amount: "$1,260" },
]

function Showcase() {
  return <ShowcaseLanguageProvider><ShowcaseContent /></ShowcaseLanguageProvider>
}

function ShowcaseContent() {
  const { language, setLanguage } = useShowcaseLanguage()
  const t = (english: string) => translate(language, english)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [activeCategory, setActiveCategory] = React.useState<CatalogCategoryId>(readCatalogHash)
  const [query, setQuery] = React.useState("")
  const [showCompactNavigation, setShowCompactNavigation] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  React.useEffect(() => {
    const syncCategory = () => setActiveCategory(readCatalogHash())
    window.addEventListener("hashchange", syncCategory)
    return () => window.removeEventListener("hashchange", syncCategory)
  }, [])

  const selectCategory = (category: CatalogCategoryId) => {
    window.history.replaceState(null, "", `#${category}`)
    setActiveCategory(category)
    setShowCompactNavigation(false)
  }

  return (
    <TooltipProvider>
      {/* Mounted once for the whole application; the material still works
          without it, just without the refraction. */}
      <GlassSeed />
      <ExMessageContext />
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayersIcon aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">{t("Exre UI")}</h1>
                <p className="truncate text-sm text-muted-foreground">{t("Component directory")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 showcase-header-search">
              <div className="relative flex-1 showcase-search-desktop">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("Search components")}
                  className="showcase-search-input"
                  data-testid="catalog-search-desktop"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Search components")}
                  value={query}
                />
              </div>
              <Button
                aria-label={t("Toggle theme")}
                size="icon"
                variant="outline"
                onClick={() =>
                  setTheme((current) =>
                    current === "light" ? "dark" : "light"
                  )
                }
              >
                {theme === "light" ? (
                  <MoonIcon data-icon="inline-start" />
                ) : (
                  <SunIcon data-icon="inline-start" />
                )}
              </Button>
              <Button
                aria-label={language === "en" ? "Switch to Chinese" : "切换为英文"}
                onClick={() => setLanguage(language === "en" ? "zh-CN" : "en")}
                size="sm"
                type="button"
                variant="outline"
              >
                {language === "en" ? "中文" : "EN"}
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="mb-4 flex gap-2 showcase-mobile-controls">
            <Button
              aria-expanded={showCompactNavigation}
              onClick={() => setShowCompactNavigation((open) => !open)}
              variant="outline"
            >
              <LayersIcon data-icon="inline-start" />
              {t("Browse categories")}
            </Button>
          </div>
          <div className="relative mb-4 showcase-search-mobile">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("Search components")}
              className="showcase-search-input"
              data-testid="catalog-search-mobile"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Search components")}
              value={query}
            />
          </div>
          <div className="showcase-layout">
            <aside className={`showcase-navigation ${showCompactNavigation ? "is-open" : ""}`}>
              <CatalogNavigation activeCategory={activeCategory} onSelect={selectCategory} />
            </aside>

            <main className="flex min-w-0 flex-col gap-6">
              <CatalogContent activeCategory={activeCategory} onSelect={selectCategory} query={query} />
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function readCatalogHash(): CatalogCategoryId {
  const value = window.location.hash.slice(1)
  return catalogCategories.some((category) => category.id === value)
    ? (value as CatalogCategoryId)
    : "overview"
}

function CatalogNavigation({
  activeCategory,
  onSelect,
}: {
  activeCategory: CatalogCategoryId
  onSelect: (category: CatalogCategoryId) => void
}) {
  const { language } = useShowcaseLanguage()
  const t = (english: string) => translate(language, english)
  return (
    <nav aria-label={t("Component categories")} className="rounded-lg border bg-card p-2">
      <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("Browse")}
      </p>
      <div className="grid gap-1">
        {catalogCategories.map((category) => (
          <Button
            aria-pressed={activeCategory === category.id}
            className="justify-start"
            data-testid={`catalog-category-${category.id}`}
            key={category.id}
            onClick={() => onSelect(category.id)}
            size="sm"
            variant={activeCategory === category.id ? "secondary" : "ghost"}
          >
            {t(category.label)}
          </Button>
        ))}
      </div>
    </nav>
  )
}

function CatalogContent({
  activeCategory,
  onSelect,
  query,
}: {
  activeCategory: CatalogCategoryId
  onSelect: (category: CatalogCategoryId) => void
  query: string
}) {
  const { language } = useShowcaseLanguage()
  const t = (english: string) => translate(language, english)
  const category = catalogCategories.find((entry) => entry.id === activeCategory)!
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const searchableText = (item: CatalogItem) => {
    const label = catalogCategories.find((entry) => entry.id === item.category)?.label ?? ""
    return `${item.name} ${item.description} ${t(item.description)} ${label} ${t(label)}`.toLocaleLowerCase()
  }
  const items = catalogItems.filter(
    (item) =>
      (activeCategory === "overview" || item.category === activeCategory) &&
      (normalizedQuery === "" ||
        searchableText(item).includes(normalizedQuery))
  )

  if (activeCategory === "quality-recipes") {
    return <ComponentRecipeContract />
  }

  return (
    <>
      {activeCategory === "overview" ? <IntroPanel componentCount={catalogItems.length} /> : null}
      <section className="scroll-mt-24" data-testid="catalog-content">
        <div className="mb-5 flex flex-col gap-2 showcase-catalog-heading">
          <div>
            <p className="text-sm font-medium text-primary">{t(activeCategory === "overview" ? "Public surface" : "Category")}</p>
            <h2
              className="text-2xl font-semibold tracking-normal"
              data-testid={activeCategory === "overview" ? "catalog-heading" : "catalog-section-title"}
            >
              {t(activeCategory === "overview" ? "Component directory" : category.label)}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(category.description)}
            </p>
          </div>
          <Badge data-testid="catalog-result-count" variant="secondary">
            {items.length} {t("catalogue entries")}
          </Badge>
        </div>

        {activeCategory === "overview" && normalizedQuery === "" ? (
          <div className="mb-6 showcase-category-grid">
            {catalogCategories
              .filter((entry) => entry.id !== "overview" && entry.id !== "quality-recipes")
              .map((entry) => (
                <button
                  className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  key={entry.id}
                  onClick={() => onSelect(entry.id)}
                  type="button"
                >
                  <p className="text-sm font-medium">{t(entry.label)}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{t(entry.description)}</p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    {catalogItems.filter((item) => item.category === entry.id).length} {t("entries")}
                  </p>
                </button>
              ))}
          </div>
        ) : null}

        <div className="showcase-item-grid">
          {items.map((item) => (
            <article className="rounded-lg border bg-card p-4" key={item.name}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <Badge className="shrink-0" variant="outline">
                  {t(catalogCategories.find((entry) => entry.id === item.category)?.label ?? "")}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{t(item.description)}</p>
            </article>
          ))}
        </div>

        {items.length === 0 ? (
          <Empty className="border py-10">
            <EmptyHeader>
              <EmptyTitle>{t("No matching public modules")}</EmptyTitle>
              <EmptyDescription>{t("Try a component name or a broader term.")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </section>
      <CategoryPreview category={activeCategory} />
    </>
  )
}

function CategoryPreview({ category }: { category: CatalogCategoryId }) {
  switch (category) {
    case "foundation":
      return (
        <>
          <FoundationSection />
          <GlassSection />
        </>
      )
    case "actions":
      return <ActionsSection />
    case "form-controls":
      return <><FormsSection /><FormExamples /></>
    case "data-display":
      return <DataSection />
    case "feedback":
      return <MessagingSection />
    case "overlays":
      return <OverlaysSection />
    case "navigation-layout":
      return <NavigationSection />
    default:
      return null
  }
}

export function ComponentRecipeContract() {
  const t = useT()
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <ShowcaseSection
      id="recipes"
      title={t("Component recipe contract")}
      description={t("Deterministic reference states generated from the public component recipes.")}
    >
      <div data-testid="recipe-contract" className="grid gap-4">
        <PreviewPanel title={t("Button sizes and variants")}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button data-testid="recipe-button-small" size="sm"><LayersIcon />{t("Small")}</Button>
              <Button data-testid="recipe-button-default"><LayersIcon />{t("Default")}</Button>
              <Button data-testid="recipe-button-large" size="lg"><LayersIcon />{t("Large")}</Button>
              <Button data-testid="recipe-button-icon" size="icon" aria-label={t("Icon recipe")}><SettingsIcon /></Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button data-testid="recipe-primary">{t("Primary")}</Button>
              <Button data-testid="recipe-button-secondary" variant="secondary">{t("Secondary")}</Button>
              <Button data-testid="recipe-button-ghost" variant="ghost">{t("Ghost")}</Button>
              <Button data-testid="recipe-button-danger" variant="danger">{t("Danger")}</Button>
              <Button data-testid="recipe-button-disabled" disabled>{t("Disabled")}</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton data-testid="recipe-action-button-default">{t("Action")}</ActionButton>
              <ActionButton data-testid="recipe-action-button-secondary" variant="secondary">{t("Secondary action")}</ActionButton>
              <ActionButton data-testid="recipe-action-button-danger" variant="danger">{t("Danger action")}</ActionButton>
              <ActionButton data-testid="recipe-action-button-small" size="sm">{t("Small action")}</ActionButton>
              <ActionButton data-testid="recipe-action-button-large" size="lg">{t("Large action")}</ActionButton>
            </div>
          </div>
        </PreviewPanel>

        <PreviewPanel title={t("Form Control states")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input data-testid="recipe-input-default" aria-label={t("Default name")} placeholder={t("Default")} />
            <Input data-testid="recipe-input-focus" aria-label={t("Focused name")} defaultValue={t("Focused")} />
            <Input data-testid="recipe-input-invalid" aria-label={t("Invalid name")} aria-invalid="true" defaultValue={t("Invalid")} />
            <Input data-testid="recipe-input-disabled" aria-label={t("Disabled name")} disabled defaultValue={t("Disabled")} />
            <SelectField>
              <SelectTrigger data-testid="recipe-select-trigger" aria-label={t("Recipe select")}>
                <SelectValue placeholder={t("Select an option")} />
              </SelectTrigger>
              <SelectContent data-testid="recipe-select-content">
                <SelectGroup>
                  <SelectItem data-testid="recipe-select-first" value="first">{t("First option")}</SelectItem>
                  <SelectItem data-testid="recipe-select-second" value="second">{t("Second option")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </SelectField>
          </div>
        </PreviewPanel>

        <PreviewPanel title={t("Sidebar Item states")}>
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="h-auto w-full">
              <SidebarContent className="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-default">
                      <LayersIcon />
                      <span>{t("Default destination")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-active" isActive>
                      <CheckIcon />
                      <span>{t("Active destination")}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton data-testid="recipe-sidebar-nested" href="#recipes">{t("Nested destination")}</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-disabled" disabled>
                      <SettingsIcon />
                      <span>{t("Disabled destination")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group" data-collapsible="icon">
                    <SidebarMenuButton data-testid="recipe-sidebar-icon-only" aria-label={t("Icon-only destination")}>
                      <SettingsIcon />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </PreviewPanel>

        <PreviewPanel title={t("Menu surface and items")}>
          <div
            data-testid="recipe-menu-surface"
            className="grid max-w-sm"
            style={{
              padding: "var(--exui-component-menu-surface-padding)",
              borderRadius: "var(--exui-component-menu-surface-radius)",
              background: "var(--exui-component-menu-surface-background)",
              color: "var(--exui-component-menu-surface-foreground)",
              border: "1px solid var(--exui-component-menu-surface-border)",
              boxShadow: "var(--exui-component-menu-surface-shadow)",
            }}
          >
            <div className="rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)]">{t("Standard item")}</div>
            <div className="flex items-center gap-[var(--exui-component-menu-item-gap)] rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)]">
              <CheckIcon className="size-4" />{t("Checked item")}</div>
            <div className="rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)] [color:var(--exui-component-menu-item-destructive-foreground)]">{t("Destructive item")}</div>
          </div>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button className="mt-3" variant="outline">{t("Test real menu")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="recipe-menu-content" align="start">
              <DropdownMenuItem data-testid="recipe-menu-item">{t("Standard item")}</DropdownMenuItem>
              <DropdownMenuCheckboxItem data-testid="recipe-menu-checked" checked>{t("Checked item")}</DropdownMenuCheckboxItem>
              <DropdownMenuItem data-testid="recipe-menu-destructive" variant="destructive">{t("Destructive item")}</DropdownMenuItem>
              <DropdownMenuItem data-testid="recipe-menu-disabled" disabled>{t("Disabled item")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PreviewPanel>

        <PreviewPanel title={t("Dialog surface")}>
          <Dialog>
          <div
            data-testid="recipe-dialog-surface"
            className="grid max-w-md"
            style={{
              gap: "var(--exui-component-dialog-surface-gap)",
              padding: "var(--exui-component-dialog-surface-padding)",
              borderRadius: "var(--exui-component-dialog-surface-radius)",
              background: "var(--exui-component-dialog-surface-background)",
              color: "var(--exui-component-dialog-surface-foreground)",
              border: "1px solid var(--exui-component-dialog-surface-border)",
              boxShadow: "var(--exui-component-dialog-surface-shadow)",
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("Recipe preview")}</DialogTitle>
              <DialogDescription>{t("A deterministic dialog surface using the public contract.")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">{t("Cancel")}</Button>
              <Button>{t("Confirm")}</Button>
            </DialogFooter>
          </div>
            <DialogTrigger asChild>
              <Button data-testid="recipe-dialog-trigger" className="mt-3" variant="outline">{t("Test real dialog")}</Button>
            </DialogTrigger>
            <DialogContent data-testid="recipe-dialog-content" closeLabel={t("Close")}>
              <DialogHeader>
                <DialogTitle data-testid="recipe-dialog-title">{t("Recipe contract dialog")}</DialogTitle>
                <DialogDescription data-testid="recipe-dialog-description">{t("This dialog verifies the real portal and focus behavior.")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>{t("Confirm")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PreviewPanel>

        <PreviewPanel title={t("Tabs variants")}>
          <div data-testid="recipe-tabs" className="grid gap-4">
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-default-list">
                <TabsTrigger data-testid="recipe-tab-default-overview" value="overview">{t("Overview")}</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-default-details" value="details">{t("Details")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-line-list" variant="line">
                <TabsTrigger data-testid="recipe-tab-line-overview" value="overview">{t("Overview")}</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-line-details" value="details">{t("Details")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-primary-list" variant="primary">
                <TabsTrigger data-testid="recipe-tab-primary-overview" value="overview">{t("Overview")}</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-primary-details" value="details">{t("Details")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </PreviewPanel>
      </div>
    </ShowcaseSection>
  )
}

function IntroPanel({ componentCount }: { componentCount: number }) {
  const t = useT()
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="showcase-intro-grid">
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{t("Preview")}</Badge>
              <Badge variant="outline">{t("Tailwind v4")}</Badge>
              <Badge variant="secondary">{t("shadcn/ui")}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold tracking-normal">{t("Exre component system")}</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t("A local preview surface for the core controls, data displays, overlays, navigation, and messaging primitives in this package.")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t("Package status")}</p>
                <p className="text-sm text-muted-foreground">{t("@exre/exui")}</p>
              </div>
              <Badge variant="secondary">{t("Ready")}</Badge>
            </div>
            <Separator />
            <div className="showcase-metric-grid" data-testid="catalog-summary-metrics">
              <Metric label={t("Catalogue entries")} value={String(componentCount)} />
              <Metric label={t("Surface")} value={t("Public")} />
              <Metric label={t("Base")} value="Radix" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function FoundationSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="foundation"
      title={t("Foundation")}
      description={t("Tokens, surfaces, status colors, and spacing rhythm.")}
    >
      <PreviewPanel title={t("Color tokens")}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TokenSwatch label={t("Primary")} className="bg-primary" />
          <TokenSwatch label={t("Secondary")} className="bg-secondary" />
          <TokenSwatch label={t("Muted")} className="bg-muted" />
          <TokenSwatch label={t("Accent")} className="bg-accent" />
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Type and badges")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-semibold">{t("Operational clarity")}</p>
            <p className="text-sm leading-6 text-muted-foreground">{t("Compact hierarchy, quiet surfaces, and strong interactive states.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{t("Default")}</Badge>
            <Badge variant="secondary">{t("Secondary")}</Badge>
            <Badge variant="outline">{t("Outline")}</Badge>
            <Badge variant="destructive">{t("Destructive")}</Badge>
          </div>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function GlassSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="glass"
      title={t("Glass")}
      description={t("One shared translucent material, with an optional refraction enhancement.")}
    >
      <PreviewPanel title={t("Material on the surfaces that opt in")}>
        <GlassSample />
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function ActionsSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="actions"
      title={t("Actions")}
      description={t("Buttons, grouped commands, and binary controls.")}
    >
      <PreviewPanel title={t("Buttons")}>
        <div className="flex flex-wrap gap-2">
          <Button>
            <CheckIcon data-icon="inline-start" />{t("Save")}</Button>
          <Button variant="secondary">{t("Secondary")}</Button>
          <Button variant="outline">{t("Outline")}</Button>
          <Button variant="danger">{t("Danger")}</Button>
          <Button variant="ghost">{t("Ghost")}</Button>
          <Button disabled>
            <BellIcon data-icon="inline-start" />{t("Disabled")}</Button>
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Action button")}>
        <div className="flex flex-wrap gap-2">
          <ActionButton>{t("Action")}</ActionButton>
          <ActionButton variant="secondary">{t("Secondary action")}</ActionButton>
          <ActionButton variant="danger">{t("Danger action")}</ActionButton>
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Command groups")}>
        <div className="flex flex-col gap-4">
          <ButtonGroup>
            <Button variant="outline">
              <ClipboardListIcon data-icon="inline-start" />{t("Review")}</Button>
            <Button variant="outline">{t("Assign")}</Button>
            <Button variant="outline">{t("Archive")}</Button>
          </ButtonGroup>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <ButtonGroupText>{t("Mode")}</ButtonGroupText>
              <Toggle aria-label={t("Toggle review mode")} pressed>{t("Review")}</Toggle>
            </ButtonGroup>
            <Switch id="action-switch" defaultChecked />
            <FieldLabel htmlFor="action-switch">{t("Enabled")}</FieldLabel>
          </div>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function FormsSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="forms"
      title={t("Forms")}
      description={t("Fields, inputs, option controls, and composed input groups.")}
    >
      <PreviewPanel title={t("Profile form")}>
        <FieldSet>
          <FieldLegend>{t("Workspace profile")}</FieldLegend>
          <FieldDescription>{t("Core form controls using field composition.")}</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="workspace-name">{t("Workspace name")}</FieldLabel>
              <Input id="workspace-name" placeholder={t("Exre Design")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-type">{t("Workspace type")}</FieldLabel>
              <Select
                defaultValue="product"
                options={[
                  { label: t("Product"), value: "product" },
                  { label: t("Platform"), value: "platform" },
                  { label: t("Internal tools"), value: "internal" },
                ]}
                placeholder={t("Select type")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-notes">{t("Notes")}</FieldLabel>
              <Textarea
                id="workspace-notes"
                placeholder={t("Describe the intended UI surface.")}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </PreviewPanel>

      <PreviewPanel title={t("Preferences")}>
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox id="compact-nav" defaultChecked />
            <FieldContent>
              <FieldLabel htmlFor="compact-nav">{t("Compact navigation")}</FieldLabel>
              <FieldDescription>{t("Keep repeated workflows dense and scannable.")}</FieldDescription>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{t("Density")}</FieldLabel>
            <Slider defaultValue={[64]} max={100} step={1} />
          </Field>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput placeholder={t("Search components")} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>
                <SendIcon data-icon="inline-start" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </FieldGroup>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function DataSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="data"
      title={t("Data")}
      description={t("Cards, tables, progress, and loading states.")}
    >
      <PreviewPanel title={t("Summary cards")}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Adoption", "82%", "Core surfaces"],
            ["Latency", "128ms", "Preview route"],
            ["Issues", "4", "Open review items"],
          ].map(([title, value, description]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{t(title)}</CardTitle>
                <CardDescription>{t(description)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
              </CardContent>
              <CardFooter>
                <Progress value={Number.parseInt(value, 10) || 40} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Table")}>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ID")}</TableHead>
                <TableHead>{t("Owner")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{t(invoice.owner)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(invoice.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Loading state")}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function OverlaysSection() {
  const t = useT()
  return (
    <ShowcaseSection
      id="overlays"
      title={t("Overlays")}
      description={t("Dialogs, sheets, popovers, and tooltips.")}
    >
      <PreviewPanel title={t("Modal and sheet")}>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>{t("Open dialog")}</Button>
            </DialogTrigger>
            <DialogContent closeLabel={t("Close")}>
              <DialogHeader>
                <DialogTitle>{t("Publish component update")}</DialogTitle>
                <DialogDescription>{t("Review the package entry and generated stylesheet before publishing.")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">{t("Cancel")}</Button>
                <Button>{t("Publish")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <PanelRightOpenIcon data-icon="inline-start" />{t("Open sheet")}</Button>
            </SheetTrigger>
            <SheetContent closeLabel={t("Close")}>
              <SheetHeader>
                <SheetTitle>{t("Component review")}</SheetTitle>
                <SheetDescription>{t("Inspect interaction states without leaving the preview route.")}</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Responsive modal")}>
        <ModalSamples />
      </PreviewPanel>

      <PreviewPanel title={t("Inline overlays")}>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{t("Open popover")}</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{t("Preset")}</p>
                <p className="text-sm text-muted-foreground">{t("Luma, olive base, sky chart tokens, Outfit font.")}</p>
              </div>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label={t("Settings")}>
                <SettingsIcon data-icon="inline-start" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Settings")}</TooltipContent>
          </Tooltip>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function NavigationSection() {
  const { language } = useShowcaseLanguage()
  const t = useT()
  return (
    <ShowcaseSection
      id="navigation"
      title={t("Navigation")}
      description={t("Tabs, breadcrumbs, and pagination patterns.")}
    >
      <PreviewPanel title={t("Tabs")}>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="tokens">{t("Tokens")}</TabsTrigger>
            <TabsTrigger value="exports">{t("Exports")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-muted-foreground">{t("Core components are rendered from local source files.")}</p>
          </TabsContent>
          <TabsContent value="tokens">
            <p className="text-sm text-muted-foreground">{t("CSS variables are sourced from the active shadcn preset.")}</p>
          </TabsContent>
          <TabsContent value="exports">
            <p className="text-sm text-muted-foreground">{t("The package entry remains separate from this preview route.")}</p>
          </TabsContent>
        </Tabs>
      </PreviewPanel>

      <PreviewPanel title={t("Route controls")}>
        <div className="flex flex-col gap-5">
          <Breadcrumb aria-label={t("Breadcrumb")}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">{t("Library")}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{t("Showcase")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination aria-label={t("Pagination")}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" text={t("Previous")} aria-label={t("Go to previous page")} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" text={language === "zh-CN" ? "下一页" : "Next"} aria-label={t("Go to next page")} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function MessagingSection() {
  const t = useT()
  const pending = React.useRef<ExMessageLoadingHandle | null>(null)
  const [hasPending, setHasPending] = React.useState(false)

  React.useEffect(() => () => {
    pending.current?.dismiss()
    pending.current = null
  }, [])

  const startLoading = () => {
    pending.current?.dismiss()
    pending.current = ExMessage.loading(t("Saving changes"))
    setHasPending(true)
  }

  const completeLoading = () => {
    pending.current?.onSuccess(t("Changes saved"))
    pending.current = null
    setHasPending(false)
  }

  const dismissLoading = () => {
    pending.current?.dismiss()
    pending.current = null
    setHasPending(false)
  }

  return (
    <ShowcaseSection
      id="messaging"
      title={t("Messaging")}
      description={t("Alerts, empty states, and conversation primitives.")}
    >
      <PreviewPanel title={t("Feedback")}>
        <div className="flex flex-col gap-4">
          <Alert>
            <BellIcon />
            <AlertTitle>{t("Build ready")}</AlertTitle>
            <AlertDescription>{t("The local preview is using the same source components as the package build.")}</AlertDescription>
          </Alert>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardListIcon />
              </EmptyMedia>
              <EmptyTitle>{t("No review items")}</EmptyTitle>
              <EmptyDescription>{t("Component states are ready for visual QA.")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline">{t("Create item")}</Button>
            </EmptyContent>
          </Empty>
        </div>
      </PreviewPanel>

      <PreviewPanel title="ExMessage">
        <div className="flex flex-col gap-3" data-testid="ex-message-demo">
          <p className="text-sm text-muted-foreground">
            {t("Try global notifications and complete a loading message using its handle.")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => ExMessage.info(t("New information"))} variant="outline">{t("Show info message")}</Button>
            <Button onClick={() => ExMessage.warn(t("Review this warning"))} variant="outline">{t("Show warning message")}</Button>
            <Button onClick={() => ExMessage.error(t("Something went wrong"))} variant="outline">{t("Show error message")}</Button>
            <Button onClick={() => ExMessage.success(t("Changes saved"))} variant="outline">{t("Show success message")}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startLoading}>{t("Start loading message")}</Button>
            <Button disabled={!hasPending} onClick={completeLoading} variant="secondary">{t("Complete loading message")}</Button>
            <Button disabled={!hasPending} onClick={dismissLoading} variant="outline">{t("Dismiss loading message")}</Button>
          </div>
        </div>
      </PreviewPanel>

      <PreviewPanel title={t("Conversation")}>
        <MessageGroup>
          <Message>
            <MessageAvatar>{t("EX")}</MessageAvatar>
            <MessageContent>
              <MessageHeader>{t("Exre UI")}</MessageHeader>
              <BubbleGroup>
                <Bubble variant="secondary">
                  <BubbleContent>{t("Core components are now visible in one preview surface.")}</BubbleContent>
                </Bubble>
              </BubbleGroup>
              <MessageFooter>{t("Just now")}</MessageFooter>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageContent>
              <BubbleGroup>
                <Bubble align="end">
                  <BubbleContent>{t("Ship the showcase.")}</BubbleContent>
                </Bubble>
              </BubbleGroup>
            </MessageContent>
          </Message>
        </MessageGroup>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function PreviewPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const t = useT()
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{t("Core")}</Badge>
      </div>
      {children}
    </div>
  )
}

function TokenSwatch({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className={`h-16 ${className}`} />
      <div className="p-3">
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}

export default Showcase
