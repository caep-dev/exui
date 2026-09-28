import * as React from "react"
import { useT } from "./translations"

import {
  ActionButton,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Bubble,
  BubbleContent,
  BubbleGroup,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  InputGroup,
  InputGroupInput,
  NativeSelect,
  NativeSelectOption,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@exre/exui"

/**
 * A backdrop with hard edges and fine detail, so a refractive material has
 * something to displace. Every value is inline: the Showcase has no Tailwind
 * build of its own and can only use the utility classes the component bundle
 * already ships.
 */
const texturedBackdrop: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, #1d4ed8 0 14px, #0f172a 14px 28px, #e11d48 28px 42px, #f8fafc 42px 56px)",
  backgroundRepeat: "repeat",
}

const sampleGrid: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
  alignItems: "start",
}

const sampleLabel: React.CSSProperties = {
  fontSize: "0.75rem",
  opacity: 0.85,
  marginBottom: "0.5rem",
}

const transparentSurface: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "0.75rem",
}

/**
 * Exercises every entry point the glass material supports: the plain class on a
 * `div`, the `glass` prop on a representative surface from each category, the
 * delegated surface, and the nested case.
 *
 * The seed is deliberately not part of this fixture so a caller decides whether
 * the enhancement is available; mounting the sample with and without
 * `<GlassSeed />` is what separates the base material from the refracted one.
 */
export function GlassSample() {
  const t = useT()
  const [commandOpen, setCommandOpen] = React.useState(false)

  return (
    <div
      data-testid="glass-sample"
      style={{ ...texturedBackdrop, padding: "1.25rem", display: "grid", gap: "1.25rem" }}
    >
      <div data-testid="glass-plain" className="ex-glass" style={transparentSurface}>{t("Plain div material")}</div>

      <div
        data-testid="glass-plain-untreated"
        style={{ ...transparentSurface, background: "rgba(255, 255, 255, 0.72)" }}
      >{t("Plain div control")}</div>

      <div style={sampleGrid}>
        <div>
          <p style={sampleLabel}>{t("Content surface")}</p>
          <Card data-testid="glass-card" glass>
            <CardHeader>
              <CardTitle>{t("Glass card")}</CardTitle>
              <CardDescription>{t("Neutral material over a textured backdrop.")}</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "grid", gap: "0.75rem" }}>
              <div
                data-testid="glass-nested"
                className="ex-glass"
                style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}
              >{t("Nested surface")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <Button data-testid="glass-button" glass>{t("Neutral")}</Button>
                <Button data-testid="glass-button-danger" glass variant="danger">{t("Danger")}</Button>
                <ActionButton data-testid="glass-action-button" glass variant="secondary">{t("Action")}</ActionButton>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <p style={sampleLabel}>{t("Danger semantics")}</p>
          <Badge data-testid="glass-badge-danger" glass variant="destructive">{t("Destructive badge")}</Badge>
          <div style={{ height: "0.75rem" }} />
          <Alert data-testid="glass-alert" glass variant="destructive">
            <AlertTitle>{t("Danger alert")}</AlertTitle>
            <AlertDescription>{t("Keeps its danger material.")}</AlertDescription>
          </Alert>
        </div>

        <div>
          <p style={sampleLabel}>{t("Input surfaces")}</p>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <InputGroup data-testid="glass-input-group" glass>
              <InputGroupInput placeholder={t("Input group")} aria-label={t("Glass input group")} />
            </InputGroup>
            <Input data-testid="glass-input" glass placeholder={t("Input")} aria-label={t("Glass input")} />
            <Input
              data-testid="glass-input-invalid"
              glass
              aria-invalid="true"
              aria-label={t("Invalid glass input")}
              placeholder={t("Invalid input")}
            />
            <Textarea data-testid="glass-textarea" glass placeholder={t("Textarea")} aria-label={t("Glass textarea")} />
            <NativeSelect data-testid="glass-native-select" glass aria-label={t("Glass native select")}>
              <NativeSelectOption value="first">{t("First")}</NativeSelectOption>
              <NativeSelectOption value="second">{t("Second")}</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div>
          <p style={sampleLabel}>{t("Messaging surfaces")}</p>
          <BubbleGroup>
            <Bubble data-testid="glass-bubble" glass>
              <BubbleContent>{t("Delegated bubble surface")}</BubbleContent>
            </Bubble>
            <Bubble>
              <BubbleContent data-testid="glass-bubble-content" glass>{t("Direct bubble surface")}</BubbleContent>
            </Bubble>
          </BubbleGroup>
        </div>

        <div>
          <p style={sampleLabel}>{t("Navigation surfaces")}</p>
          <Tabs defaultValue="first">
            <TabsList data-testid="glass-tabs-list" glass>
              <TabsTrigger data-testid="glass-tab" glass value="first">{t("First")}</TabsTrigger>
              <TabsTrigger data-testid="glass-tab-plain" value="second">{t("Second")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <p style={sampleLabel}>{t("State feedback")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <Toggle data-testid="glass-toggle-pressed" glass pressed aria-label={t("Pinned")}>{t("Pinned")}</Toggle>
            <Toggle
              data-testid="glass-toggle-disabled-pressed"
              glass
              disabled
              pressed
              aria-label={t("Pinned but disabled")}
            >{t("Pinned")}</Toggle>
          </div>
        </div>

        <div>
          <p style={sampleLabel}>{t("Portal surfaces")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="glass-dialog-trigger" variant="outline">{t("Dialog")}</Button>
              </DialogTrigger>
              <DialogContent data-testid="glass-dialog-content" glass closeLabel={t("Close")}>
                <DialogHeader>
                  <DialogTitle>{t("Glass dialog")}</DialogTitle>
                  <DialogDescription>{t("Portal content shares the document seed.")}</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button data-testid="glass-menu-trigger" variant="outline">{t("Menu")}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-testid="glass-menu-content" glass>
                <DropdownMenuItem>{t("First item")}</DropdownMenuItem>
                <DropdownMenuItem>{t("Second item")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* The class entry point has to behave like the prop, including
                switching off the popup's own backdrop layer. */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button data-testid="glass-menu-class-trigger" variant="outline">{t("Menu by class")}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-testid="glass-menu-class-content" className="ex-glass">
                <DropdownMenuItem>{t("First item")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button data-testid="glass-tooltip-trigger" variant="outline">{t("Tooltip")}</Button>
                </TooltipTrigger>
                <TooltipContent data-testid="glass-tooltip-content" glass>{t("Tip")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div data-testid="glass-command-host">
        <p style={sampleLabel}>{t("Command palette")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Button
            data-testid="glass-command-trigger"
            variant="outline"
            onClick={() => setCommandOpen(true)}
          >{t("Command dialog")}</Button>
        </div>
        <CommandDialog
          open={commandOpen}
          onOpenChange={setCommandOpen}
          glass
          title={t("Command Palette")}
          description={t("Search for a command to run...")}
        >
          <Command data-testid="glass-command-inside">
            <CommandInput placeholder={t("Search")} />
            <CommandList>
              <CommandEmpty>{t("Nothing found.")}</CommandEmpty>
              <CommandGroup heading={t("Actions")}>
                <CommandItem>{t("Run")}</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
        <Command data-testid="glass-command-standalone" glass>
          <CommandInput placeholder={t("Standalone search")} />
        </Command>
      </div>

      <div data-testid="glass-sidebar-host">
        <SidebarProvider style={{ minHeight: "14rem" }}>
          <Sidebar data-testid="glass-sidebar" glass collapsible="none">
            <SidebarContent>
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>{t("Overview")}</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset data-testid="glass-sidebar-inset" glass>
            <SidebarTrigger data-testid="glass-sidebar-trigger" aria-label={t("Toggle Sidebar")} />{t("Inset")}</SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
