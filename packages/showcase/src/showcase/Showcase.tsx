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
  { category: "overlays", name: "Alert Dialog", description: "Confirms a consequential decision." },
  { category: "overlays", name: "Command", description: "Searches and runs available commands." },
  { category: "overlays", name: "Dialog", description: "Focuses attention on a modal task." },
  { category: "overlays", name: "Drawer", description: "Opens contextual content from the viewport edge." },
  { category: "overlays", name: "Hover Card", description: "Reveals rich context on hover or focus." },
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
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayersIcon aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Exre UI</h1>
                <p className="truncate text-sm text-muted-foreground">Component directory</p>
              </div>
            </div>
            <div className="flex items-center gap-2 showcase-header-search">
              <div className="relative flex-1 showcase-search-desktop">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search components"
                  className="showcase-search-input"
                  data-testid="catalog-search-desktop"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search components"
                  value={query}
                />
              </div>
              <Button
                aria-label="Toggle theme"
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
              Browse categories
            </Button>
          </div>
          <div className="relative mb-4 showcase-search-mobile">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search components"
              className="showcase-search-input"
              data-testid="catalog-search-mobile"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components"
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
  return (
    <nav aria-label="Component categories" className="rounded-lg border bg-card p-2">
      <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Browse
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
            {category.label}
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
  const category = catalogCategories.find((entry) => entry.id === activeCategory)!
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const items = catalogItems.filter(
    (item) =>
      (activeCategory === "overview" || item.category === activeCategory) &&
      (normalizedQuery === "" ||
        `${item.name} ${item.description}`.toLocaleLowerCase().includes(normalizedQuery))
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
            <p className="text-sm font-medium text-primary">{activeCategory === "overview" ? "Public surface" : "Category"}</p>
            <h2
              className="text-2xl font-semibold tracking-normal"
              data-testid={activeCategory === "overview" ? "catalog-heading" : "catalog-section-title"}
            >
              {activeCategory === "overview" ? "Component directory" : category.label}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {category.description}
            </p>
          </div>
          <Badge data-testid="catalog-result-count" variant="secondary">
            {items.length} catalogue entries
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
                  <p className="text-sm font-medium">{entry.label}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{entry.description}</p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    {catalogItems.filter((item) => item.category === entry.id).length} entries
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
                  {catalogCategories.find((entry) => entry.id === item.category)?.label}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>

        {items.length === 0 ? (
          <Empty className="border py-10">
            <EmptyHeader>
              <EmptyTitle>No matching public modules</EmptyTitle>
              <EmptyDescription>Try a component name or a broader term.</EmptyDescription>
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
      return <FormsSection />
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
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <ShowcaseSection
      id="recipes"
      title="Component recipe contract"
      description="Deterministic reference states generated from the public component recipes."
    >
      <div data-testid="recipe-contract" className="grid gap-4">
        <PreviewPanel title="Button sizes and variants">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button data-testid="recipe-button-small" size="sm"><LayersIcon />Small</Button>
              <Button data-testid="recipe-button-default"><LayersIcon />Default</Button>
              <Button data-testid="recipe-button-large" size="lg"><LayersIcon />Large</Button>
              <Button data-testid="recipe-button-icon" size="icon" aria-label="Icon recipe"><SettingsIcon /></Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button data-testid="recipe-primary">Primary</Button>
              <Button data-testid="recipe-button-secondary" variant="secondary">Secondary</Button>
              <Button data-testid="recipe-button-ghost" variant="ghost">Ghost</Button>
              <Button data-testid="recipe-button-danger" variant="danger">Danger</Button>
              <Button data-testid="recipe-button-disabled" disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton data-testid="recipe-action-button-default">Action</ActionButton>
              <ActionButton data-testid="recipe-action-button-secondary" variant="secondary">Secondary action</ActionButton>
              <ActionButton data-testid="recipe-action-button-danger" variant="danger">Danger action</ActionButton>
              <ActionButton data-testid="recipe-action-button-small" size="sm">Small action</ActionButton>
              <ActionButton data-testid="recipe-action-button-large" size="lg">Large action</ActionButton>
            </div>
          </div>
        </PreviewPanel>

        <PreviewPanel title="Form Control states">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input data-testid="recipe-input-default" aria-label="Default name" placeholder="Default" />
            <Input data-testid="recipe-input-focus" aria-label="Focused name" defaultValue="Focused" />
            <Input data-testid="recipe-input-invalid" aria-label="Invalid name" aria-invalid="true" defaultValue="Invalid" />
            <Input data-testid="recipe-input-disabled" aria-label="Disabled name" disabled defaultValue="Disabled" />
            <SelectField>
              <SelectTrigger data-testid="recipe-select-trigger" aria-label="Recipe select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent data-testid="recipe-select-content">
                <SelectGroup>
                  <SelectItem data-testid="recipe-select-first" value="first">First option</SelectItem>
                  <SelectItem data-testid="recipe-select-second" value="second">Second option</SelectItem>
                </SelectGroup>
              </SelectContent>
            </SelectField>
          </div>
        </PreviewPanel>

        <PreviewPanel title="Sidebar Item states">
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="h-auto w-full">
              <SidebarContent className="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-default">
                      <LayersIcon />
                      <span>Default destination</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-active" isActive>
                      <CheckIcon />
                      <span>Active destination</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton data-testid="recipe-sidebar-nested" href="#recipes">
                          Nested destination
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="recipe-sidebar-disabled" disabled>
                      <SettingsIcon />
                      <span>Disabled destination</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="group" data-collapsible="icon">
                    <SidebarMenuButton data-testid="recipe-sidebar-icon-only" aria-label="Icon-only destination">
                      <SettingsIcon />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </PreviewPanel>

        <PreviewPanel title="Menu surface and items">
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
            <div className="rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)]">
              Standard item
            </div>
            <div className="flex items-center gap-[var(--exui-component-menu-item-gap)] rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)]">
              <CheckIcon className="size-4" /> Checked item
            </div>
            <div className="rounded-[var(--exui-component-menu-item-radius)] px-[var(--exui-component-menu-item-padding-inline)] py-[var(--exui-component-menu-item-padding-block)] [color:var(--exui-component-menu-item-destructive-foreground)]">
              Destructive item
            </div>
          </div>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button className="mt-3" variant="outline">Test real menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="recipe-menu-content" align="start">
              <DropdownMenuItem data-testid="recipe-menu-item">Standard item</DropdownMenuItem>
              <DropdownMenuCheckboxItem data-testid="recipe-menu-checked" checked>Checked item</DropdownMenuCheckboxItem>
              <DropdownMenuItem data-testid="recipe-menu-destructive" variant="destructive">Destructive item</DropdownMenuItem>
              <DropdownMenuItem data-testid="recipe-menu-disabled" disabled>Disabled item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PreviewPanel>

        <PreviewPanel title="Dialog surface">
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
              <DialogTitle>Recipe preview</DialogTitle>
              <DialogDescription>
                A deterministic dialog surface using the public contract.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </div>
            <DialogTrigger asChild>
              <Button data-testid="recipe-dialog-trigger" className="mt-3" variant="outline">
                Test real dialog
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="recipe-dialog-content">
              <DialogHeader>
                <DialogTitle data-testid="recipe-dialog-title">Recipe contract dialog</DialogTitle>
                <DialogDescription data-testid="recipe-dialog-description">
                  This dialog verifies the real portal and focus behavior.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PreviewPanel>

        <PreviewPanel title="Tabs variants">
          <div data-testid="recipe-tabs" className="grid gap-4">
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-default-list">
                <TabsTrigger data-testid="recipe-tab-default-overview" value="overview">Overview</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-default-details" value="details">Details</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-line-list" variant="line">
                <TabsTrigger data-testid="recipe-tab-line-overview" value="overview">Overview</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-line-details" value="details">Details</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="overview">
              <TabsList data-testid="recipe-tabs-primary-list" variant="primary">
                <TabsTrigger data-testid="recipe-tab-primary-overview" value="overview">Overview</TabsTrigger>
                <TabsTrigger data-testid="recipe-tab-primary-details" value="details">Details</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </PreviewPanel>
      </div>
    </ShowcaseSection>
  )
}

function IntroPanel({ componentCount }: { componentCount: number }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="showcase-intro-grid">
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Preview</Badge>
              <Badge variant="outline">Tailwind v4</Badge>
              <Badge variant="secondary">shadcn/ui</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold tracking-normal">
                Exre component system
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                A local preview surface for the core controls, data displays,
                overlays, navigation, and messaging primitives in this package.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Package status</p>
                <p className="text-sm text-muted-foreground">@exre/exui</p>
              </div>
              <Badge variant="secondary">Ready</Badge>
            </div>
            <Separator />
            <div className="showcase-metric-grid" data-testid="catalog-summary-metrics">
              <Metric label="Catalogue entries" value={String(componentCount)} />
              <Metric label="Surface" value="Public" />
              <Metric label="Base" value="Radix" />
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
  return (
    <ShowcaseSection
      id="foundation"
      title="Foundation"
      description="Tokens, surfaces, status colors, and spacing rhythm."
    >
      <PreviewPanel title="Color tokens">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TokenSwatch label="Primary" className="bg-primary" />
          <TokenSwatch label="Secondary" className="bg-secondary" />
          <TokenSwatch label="Muted" className="bg-muted" />
          <TokenSwatch label="Accent" className="bg-accent" />
        </div>
      </PreviewPanel>

      <PreviewPanel title="Type and badges">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-semibold">Operational clarity</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Compact hierarchy, quiet surfaces, and strong interactive states.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function GlassSection() {
  return (
    <ShowcaseSection
      id="glass"
      title="Glass"
      description="One shared translucent material, with an optional refraction enhancement."
    >
      <PreviewPanel title="Material on the surfaces that opt in">
        <GlassSample />
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function ActionsSection() {
  return (
    <ShowcaseSection
      id="actions"
      title="Actions"
      description="Buttons, grouped commands, and binary controls."
    >
      <PreviewPanel title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>
            <CheckIcon data-icon="inline-start" />
            Save
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>
            <BellIcon data-icon="inline-start" />
            Disabled
          </Button>
        </div>
      </PreviewPanel>

      <PreviewPanel title="Action button">
        <div className="flex flex-wrap gap-2">
          <ActionButton>Action</ActionButton>
          <ActionButton variant="secondary">Secondary action</ActionButton>
          <ActionButton variant="danger">Danger action</ActionButton>
        </div>
      </PreviewPanel>

      <PreviewPanel title="Command groups">
        <div className="flex flex-col gap-4">
          <ButtonGroup>
            <Button variant="outline">
              <ClipboardListIcon data-icon="inline-start" />
              Review
            </Button>
            <Button variant="outline">Assign</Button>
            <Button variant="outline">Archive</Button>
          </ButtonGroup>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <ButtonGroupText>Mode</ButtonGroupText>
              <Toggle aria-label="Toggle review mode" pressed>
                Review
              </Toggle>
            </ButtonGroup>
            <Switch id="action-switch" defaultChecked />
            <FieldLabel htmlFor="action-switch">Enabled</FieldLabel>
          </div>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function FormsSection() {
  return (
    <ShowcaseSection
      id="forms"
      title="Forms"
      description="Fields, inputs, option controls, and composed input groups."
    >
      <PreviewPanel title="Profile form">
        <FieldSet>
          <FieldLegend>Workspace profile</FieldLegend>
          <FieldDescription>
            Core form controls using field composition.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input id="workspace-name" placeholder="Exre Design" />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-type">Workspace type</FieldLabel>
              <Select
                defaultValue="product"
                options={[
                  { label: "Product", value: "product" },
                  { label: "Platform", value: "platform" },
                  { label: "Internal tools", value: "internal" },
                ]}
                placeholder="Select type"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-notes">Notes</FieldLabel>
              <Textarea
                id="workspace-notes"
                placeholder="Describe the intended UI surface."
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </PreviewPanel>

      <PreviewPanel title="Preferences">
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox id="compact-nav" defaultChecked />
            <FieldContent>
              <FieldLabel htmlFor="compact-nav">Compact navigation</FieldLabel>
              <FieldDescription>
                Keep repeated workflows dense and scannable.
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Density</FieldLabel>
            <Slider defaultValue={[64]} max={100} step={1} />
          </Field>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search components" />
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
  return (
    <ShowcaseSection
      id="data"
      title="Data"
      description="Cards, tables, progress, and loading states."
    >
      <PreviewPanel title="Summary cards">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Adoption", "82%", "Core surfaces"],
            ["Latency", "128ms", "Preview route"],
            ["Issues", "4", "Open review items"],
          ].map(([title, value, description]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
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

      <PreviewPanel title="Table">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.owner}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PreviewPanel>

      <PreviewPanel title="Loading state">
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
  return (
    <ShowcaseSection
      id="overlays"
      title="Overlays"
      description="Dialogs, sheets, popovers, and tooltips."
    >
      <PreviewPanel title="Modal and sheet">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish component update</DialogTitle>
                <DialogDescription>
                  Review the package entry and generated stylesheet before
                  publishing.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <PanelRightOpenIcon data-icon="inline-start" />
                Open sheet
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Component review</SheetTitle>
                <SheetDescription>
                  Inspect interaction states without leaving the preview route.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </PreviewPanel>

      <PreviewPanel title="Inline overlays">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Preset</p>
                <p className="text-sm text-muted-foreground">
                  Luma, olive base, sky chart tokens, Outfit font.
                </p>
              </div>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label="Settings">
                <SettingsIcon data-icon="inline-start" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function NavigationSection() {
  return (
    <ShowcaseSection
      id="navigation"
      title="Navigation"
      description="Tabs, breadcrumbs, and pagination patterns."
    >
      <PreviewPanel title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-muted-foreground">
              Core components are rendered from local source files.
            </p>
          </TabsContent>
          <TabsContent value="tokens">
            <p className="text-sm text-muted-foreground">
              CSS variables are sourced from the active shadcn preset.
            </p>
          </TabsContent>
          <TabsContent value="exports">
            <p className="text-sm text-muted-foreground">
              The package entry remains separate from this preview route.
            </p>
          </TabsContent>
        </Tabs>
      </PreviewPanel>

      <PreviewPanel title="Route controls">
        <div className="flex flex-col gap-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Showcase</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
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
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </PreviewPanel>
    </ShowcaseSection>
  )
}

function MessagingSection() {
  return (
    <ShowcaseSection
      id="messaging"
      title="Messaging"
      description="Alerts, empty states, and conversation primitives."
    >
      <PreviewPanel title="Feedback">
        <div className="flex flex-col gap-4">
          <Alert>
            <BellIcon />
            <AlertTitle>Build ready</AlertTitle>
            <AlertDescription>
              The local preview is using the same source components as the
              package build.
            </AlertDescription>
          </Alert>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardListIcon />
              </EmptyMedia>
              <EmptyTitle>No review items</EmptyTitle>
              <EmptyDescription>
                Component states are ready for visual QA.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline">Create item</Button>
            </EmptyContent>
          </Empty>
        </div>
      </PreviewPanel>

      <PreviewPanel title="Conversation">
        <MessageGroup>
          <Message>
            <MessageAvatar>EX</MessageAvatar>
            <MessageContent>
              <MessageHeader>Exre UI</MessageHeader>
              <BubbleGroup>
                <Bubble variant="secondary">
                  <BubbleContent>
                    Core components are now visible in one preview surface.
                  </BubbleContent>
                </Bubble>
              </BubbleGroup>
              <MessageFooter>Just now</MessageFooter>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageContent>
              <BubbleGroup>
                <Bubble align="end">
                  <BubbleContent>Ship the showcase.</BubbleContent>
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
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">Core</Badge>
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
