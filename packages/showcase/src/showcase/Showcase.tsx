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
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
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
  CommandIcon,
  DownloadIcon,
  LayersIcon,
  MoonIcon,
  PanelRightOpenIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react"

const sections = [
  "Foundation",
  "Actions",
  "Forms",
  "Data",
  "Overlays",
  "Navigation",
  "Messaging",
]

const invoices = [
  { id: "EX-2401", owner: "Design Ops", status: "Paid", amount: "$2,400" },
  { id: "EX-2402", owner: "Platform", status: "Pending", amount: "$890" },
  { id: "EX-2403", owner: "Growth", status: "Draft", amount: "$1,260" },
]

function Showcase() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayersIcon aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Exre UI</h1>
                <p className="truncate text-sm text-muted-foreground">
                  Brand component preview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Radix</Badge>
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

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 lg:flex-col lg:overflow-visible">
              {sections.map((section) => (
                <a
                  key={section}
                  className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  href={`#${section.toLowerCase()}`}
                >
                  {section}
                </a>
              ))}
            </nav>
          </aside>

          <main className="flex min-w-0 flex-col gap-6">
            <IntroPanel />
            <FoundationSection />
            <ActionsSection />
            <FormsSection />
            <DataSection />
            <OverlaysSection />
            <NavigationSection />
            <MessagingSection />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

function IntroPanel() {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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
          <div className="flex flex-wrap gap-2">
            <Button>
              <DownloadIcon data-icon="inline-start" />
              Export build
            </Button>
            <Button variant="outline">
              <CommandIcon data-icon="inline-start" />
              Registry
            </Button>
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
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Components" value="60" />
              <Metric label="Preset" value="Luma" />
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
