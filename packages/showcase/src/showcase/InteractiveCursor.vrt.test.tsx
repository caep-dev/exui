import "@exre/exui/style.css"
import * as React from "react"

import { createRoot, type Root } from "react-dom/client"
import { page, userEvent } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActionButton,
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Command,
  CommandItem,
  CommandList,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NativeSelect,
  NativeSelectOption,
  RadioGroup,
  RadioGroupItem,
  SelectContent,
  SelectField,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@exre/exui"

import { ComponentRecipeContract } from "./Showcase"

let container: HTMLDivElement
let root: Root

function cursorOf(testId: string): string {
  return getComputedStyle(page.getByTestId(testId).element()).cursor
}

function pointerEventsOf(testId: string): string {
  return getComputedStyle(page.getByTestId(testId).element()).pointerEvents
}

/** Every branch of the interactive-cursor rule, in one tree. */
function CursorFixture() {
  return (
    <div style={{ display: "grid", gap: "8px", width: "420px" }}>
      <Button data-testid="button">Button</Button>
      <ActionButton data-testid="action-button">Action</ActionButton>
      <Button data-testid="button-disabled" disabled>
        Disabled
      </Button>
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger data-testid="tab" value="a">
            Tab
          </TabsTrigger>
          <TabsTrigger value="b">Other</TabsTrigger>
        </TabsList>
      </Tabs>
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="accordion-trigger">Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
      <label style={{ display: "flex", gap: "8px" }}>
        <Checkbox data-testid="checkbox" />
        Checkbox
      </label>
      <label style={{ display: "flex", gap: "8px" }}>
        <Checkbox data-testid="checkbox-disabled" disabled />
        Disabled checkbox
      </label>
      <RadioGroup defaultValue="a" style={{ display: "flex", gap: "8px" }}>
        <RadioGroupItem data-testid="radio" value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
      <Switch data-testid="switch" />
      <NativeSelect data-testid="native-select">
        <NativeSelectOption value="a">Option</NativeSelectOption>
      </NativeSelect>
      <NativeSelect data-testid="native-select-disabled" disabled>
        <NativeSelectOption value="a">Option</NativeSelectOption>
      </NativeSelect>
      <SelectField defaultValue="a">
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="a">First</SelectItem>
          </SelectGroup>
        </SelectContent>
      </SelectField>
      <SelectField disabled>
        <SelectTrigger data-testid="select-trigger-disabled">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="a">First</SelectItem>
          </SelectGroup>
        </SelectContent>
      </SelectField>
      <InputGroup data-testid="input-group">
        <InputGroupAddon data-testid="input-group-addon">
          <span>A</span>
        </InputGroupAddon>
        <InputGroupInput placeholder="Type here" />
      </InputGroup>

      {/* The rule is role-based, so each role is exercised on its own. */}
      <div data-testid="role-button" role="button" tabIndex={0}>
        Custom button
      </div>
      <div data-testid="role-option" role="option">
        Custom option
      </div>
      <div data-testid="role-option-disabled" role="option" aria-disabled="true">
        Disabled custom option
      </div>
      <div data-testid="role-menuitem" role="menuitem">
        Custom menu item
      </div>
      <div data-testid="role-menuitemcheckbox" role="menuitemcheckbox">
        Custom checkable item
      </div>
      <div data-testid="role-menuitemradio" role="menuitemradio">
        Custom radio item
      </div>
    </div>
  )
}

/** Options that only exist inside an open popup, one fixture per menu family. */
function CommandFixture() {
  return (
    <Command>
      <CommandList>
        <CommandItem data-testid="command-item">Command item</CommandItem>
      </CommandList>
    </Command>
  )
}

function ContextMenuFixture() {
  return (
    <ContextMenu open>
      <ContextMenuTrigger data-testid="context-trigger">Right click area</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem data-testid="context-item">Context item</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function MenubarFixture() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger data-testid="menubar-trigger">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem data-testid="menubar-item">Menubar item</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

function ComboboxFixture() {
  return (
    <Combobox>
      <ComboboxInput data-testid="combobox-input" placeholder="Search" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem data-testid="combobox-item" value="a">
            Combobox item
          </ComboboxItem>
          <ComboboxEmpty>Nothing</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function mount(node: React.ReactNode) {
  container = document.createElement("div")
  container.id = "visual-root"
  document.body.replaceChildren(container)
  document.body.style.margin = "0"
  document.documentElement.classList.remove("dark", "pitch-black")
  document.documentElement.classList.add("light")
  root = createRoot(container)
  root.render(node)
}

describe("interactive cursor: controls", () => {
  beforeEach(() => {
    mount(<CursorFixture />)
  })

  afterEach(() => {
    root.unmount()
  })

  test("points at every enabled control and leaves the deliberate exceptions alone", async () => {
    await expect.element(page.getByTestId("button")).toBeVisible()

    expect(cursorOf("button")).toBe("pointer")
    expect(cursorOf("action-button")).toBe("pointer")
    expect(cursorOf("tab")).toBe("pointer")
    expect(cursorOf("accordion-trigger")).toBe("pointer")
    expect(cursorOf("checkbox")).toBe("pointer")
    expect(cursorOf("radio")).toBe("pointer")
    expect(cursorOf("switch")).toBe("pointer")
    expect(cursorOf("native-select")).toBe("pointer")
    expect(cursorOf("select-trigger")).toBe("pointer")

    // Roles the rule covers even when the element is not a <button>.
    expect(cursorOf("role-button")).toBe("pointer")
    expect(cursorOf("role-option")).toBe("pointer")
    expect(cursorOf("role-menuitem")).toBe("pointer")
    expect(cursorOf("role-menuitemcheckbox")).toBe("pointer")
    expect(cursorOf("role-menuitemradio")).toBe("pointer")

    // A disabled option is not offered, and a disabled control cannot be hit
    // at all, so neither may claim to be clickable.
    expect(cursorOf("role-option-disabled")).not.toBe("pointer")
    expect(cursorOf("button-disabled")).not.toBe("pointer")
    expect(pointerEventsOf("button-disabled")).toBe("none")

    // The text cursor over an input group's addon, and the not-allowed cursor
    // on a disabled form control, are deliberate.
    expect(cursorOf("input-group-addon")).toBe("text")
    expect(cursorOf("checkbox-disabled")).toBe("not-allowed")
    expect(cursorOf("native-select-disabled")).toBe("not-allowed")
    expect(cursorOf("select-trigger-disabled")).toBe("not-allowed")
  })
})

describe("interactive cursor: options in popups", () => {
  afterEach(() => {
    root.unmount()
  })

  test("points at command items", async () => {
    mount(<CommandFixture />)
    await expect.element(page.getByTestId("command-item")).toBeVisible()
    expect(cursorOf("command-item")).toBe("pointer")
  })

  test("points at context menu items", async () => {
    mount(<ContextMenuFixture />)
    await expect.element(page.getByTestId("context-item")).toBeVisible()
    expect(cursorOf("context-item")).toBe("pointer")
  })

  test("points at menubar items", async () => {
    mount(<MenubarFixture />)
    await expect.element(page.getByTestId("menubar-trigger")).toBeVisible()
    await page.getByTestId("menubar-trigger").click()
    await expect.element(page.getByTestId("menubar-item")).toBeVisible()
    expect(cursorOf("menubar-item")).toBe("pointer")
  })

  test("points at combobox items", async () => {
    mount(<ComboboxFixture />)
    await expect.element(page.getByTestId("combobox-input")).toBeVisible()
    await page.getByTestId("combobox-input").click()
    await expect.element(page.getByTestId("combobox-item")).toBeVisible()
    expect(cursorOf("combobox-item")).toBe("pointer")
  })
})

describe("interactive cursor: showcase", () => {
  beforeEach(async () => {
    mount(<ComponentRecipeContract />)
    await document.fonts.ready
    await expect.element(page.getByTestId("recipe-contract")).toBeVisible()
  })

  afterEach(() => {
    root.unmount()
  })

  test("points at dropdown items, including checkable ones, and at select items", async () => {
    await page.getByRole("button", { name: "Test real menu" }).click()
    await expect.element(page.getByTestId("recipe-menu-item")).toBeVisible()
    expect(cursorOf("recipe-menu-item")).toBe("pointer")
    expect(cursorOf("recipe-menu-checked")).toBe("pointer")
    // A disabled item is inert: Radix marks it with `aria-disabled` and
    // `data-disabled` rather than `:disabled`, which is why the rule tests for
    // those too, and it cannot be hit at all.
    expect(pointerEventsOf("recipe-menu-disabled")).toBe("none")
    expect(cursorOf("recipe-menu-disabled")).not.toBe("pointer")
    await userEvent.keyboard("{Escape}")

    await page.getByTestId("recipe-select-trigger").click()
    await expect.element(page.getByTestId("recipe-select-second")).toBeVisible()
    expect(cursorOf("recipe-select-second")).toBe("pointer")
    await userEvent.keyboard("{Escape}")
  })
})
