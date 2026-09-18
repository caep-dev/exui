import "@exre/exui/style.css"

import { createRoot, type Root } from "react-dom/client"
import { page, userEvent } from "vitest/browser"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exre/exui"

const TRANSPARENT = "rgba(0, 0, 0, 0)"
const themes = ["light", "dark"] as const

let container: HTMLDivElement
let root: Root

function backgroundOf(testId: string): string {
  return getComputedStyle(page.getByTestId(testId).element()).backgroundColor
}

function boxShadowOf(testId: string): string {
  return getComputedStyle(page.getByTestId(testId).element()).boxShadow
}

function borderColorOf(testId: string): string {
  return getComputedStyle(page.getByTestId(testId).element()).borderTopColor
}

/** Resolve a token through the browser so it is compared in computed form. */
function resolvedProperty(property: string, variable: string): string {
  const probe = document.createElement("span")
  probe.style.setProperty(property, `var(${variable})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property).trim()
  probe.remove()
  return value
}

function searchField(testIdPrefix: string, invalid = false) {
  return (
    <InputGroup data-testid={testIdPrefix}>
      <InputGroupAddon data-testid={`${testIdPrefix}-start`}>
        <span>S</span>
      </InputGroupAddon>
      <InputGroupInput
        data-testid={`${testIdPrefix}-control`}
        aria-invalid={invalid || undefined}
        placeholder="Search components"
      />
      <InputGroupAddon data-testid={`${testIdPrefix}-end`} align="inline-end">
        <InputGroupButton data-testid={`${testIdPrefix}-button`}>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

describe.each(themes)("%s input group", (theme) => {
  beforeEach(() => {
    document.documentElement.classList.remove("light", "dark", "pitch-black")
    document.documentElement.classList.add(theme)
    container = document.createElement("div")
    document.body.replaceChildren(container)
    // State chrome is read as an exact computed value, so kill the transitions
    // that would otherwise be caught mid-flight.
    const style = document.createElement("style")
    style.textContent =
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
    document.head.append(style)
    root = createRoot(container)
  })

  afterEach(() => {
    root.unmount()
  })

  test("lets one group background show through the addons and the control", async () => {
    root.render(
      <InputGroup data-testid="input-group">
        <InputGroupAddon data-testid="input-group-start">
          <span>S</span>
        </InputGroupAddon>
        <InputGroupInput data-testid="input-group-control" placeholder="Search components" />
        <InputGroupAddon data-testid="input-group-end" align="inline-end">
          <InputGroupButton data-testid="input-group-button">Send</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
    await expect.element(page.getByTestId("input-group")).toBeVisible()

    // The group paints the band. If the addons or the control painted their own
    // background, the three regions would read as three different surfaces.
    expect(backgroundOf("input-group"), "the group must paint the band").not.toBe(TRANSPARENT)
    expect(backgroundOf("input-group-start")).toBe(TRANSPARENT)
    expect(backgroundOf("input-group-control")).toBe(TRANSPARENT)
    expect(backgroundOf("input-group-end")).toBe(TRANSPARENT)
    expect(backgroundOf("input-group-button")).toBe(TRANSPARENT)

    // The control also has to stay transparent across its states.
    await userEvent.hover(page.getByTestId("input-group-control"))
    expect(backgroundOf("input-group-control")).toBe(TRANSPARENT)
  })

  test("paints one focus ring, on the group rather than the control", async () => {
    root.render(searchField("focus-group"))
    const group = page.getByTestId("focus-group")
    await expect.element(group).toBeVisible()
    expect(boxShadowOf("focus-group"), "the group rests without a ring").toBe("none")

    await userEvent.click(page.getByTestId("focus-group-control"))
    expect(document.activeElement).toBe(page.getByTestId("focus-group-control").element())

    // The recipe's focus state is a 3px ring and a transparent border. The
    // group is the form control here, so it has to carry that ring itself: a
    // ring on the control would be a rectangle around the middle segment, and
    // the group's own border plus ring would stack on top of it.
    expect(boxShadowOf("focus-group")).toBe(
      resolvedProperty("box-shadow", "--exui-component-form-control-focus-shadow")
    )
    expect(borderColorOf("focus-group")).toBe(TRANSPARENT)
    expect(boxShadowOf("focus-group-control")).toBe("none")
  })

  test("paints one invalid ring, on the group rather than the control", async () => {
    root.render(searchField("invalid-group", true))
    const group = page.getByTestId("invalid-group")
    await expect.element(group).toBeVisible()

    expect(boxShadowOf("invalid-group")).toBe(
      resolvedProperty("box-shadow", "--exui-component-form-control-invalid-shadow")
    )
    expect(borderColorOf("invalid-group")).toBe(TRANSPARENT)
    expect(boxShadowOf("invalid-group-control")).toBe("none")
  })
})
