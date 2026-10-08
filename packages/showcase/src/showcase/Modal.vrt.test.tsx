import "@exre/exui/style.css"

import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { page, userEvent } from "vitest/browser"

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Modal,
  ThemeProvider,
  type ModalProps,
  type ModalSize,
} from "@exre/exui"

import { ModalSamples } from "./ModalSamples"
import { ShowcaseLanguageProvider } from "./ShowcaseLanguageProvider"

let container: HTMLDivElement
let root: Root
let calls: boolean[]
let viewport: { width: number; height: number }

interface SampleProps {
  size?: ModalSize
  width?: string | number
  height?: string | number
  padding?: string | number
  mobileFullscreen?: boolean
  dismissible?: boolean
  description?: string
  footer?: boolean
  longFooter?: boolean
  longTitle?: boolean
}

const LONG_TITLE =
  "Responsive modal with a deliberately long title / UnbrokenTitleWithoutSpaces0123456789 ".repeat(12) +
  "[title end]"

function Sample({
  size,
  width,
  height,
  padding,
  mobileFullscreen,
  dismissible,
  description,
  footer = true,
  longFooter = false,
  longTitle = false,
}: SampleProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        calls.push(next)
        setOpen(next)
      }}
      trigger={<Button>Open modal</Button>}
      title={longTitle ? LONG_TITLE : "Edit project profile"}
      description={description}
      size={size}
      width={width}
      height={height}
      padding={padding}
      mobileFullscreen={mobileFullscreen}
      dismissible={dismissible}
      closeLabel="Close modal"
      footer={
        footer ? (
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            {longFooter
              ? Array.from({ length: 18 }, (_, index) => (
                  <Button key={index} variant="secondary">
                    Extra {index + 1}
                  </Button>
                ))
              : null}
            <Button>Save</Button>
          </>
        ) : undefined
      }
    >
      <label>
        Draft
        <input id="modal-draft" defaultValue="" />
      </label>
      <input id="modal-file" type="file" />
    </Modal>
  )
}

function mount(props: SampleProps = {}) {
  root.render(
    <ThemeProvider>
      <Sample {...props} />
    </ThemeProvider>
  )
}

function frame(): HTMLElement {
  const element = document.querySelector<HTMLElement>(".ex-modal[data-slot='dialog-content']")
  if (!element) throw new Error("the modal frame is not mounted")
  return element
}

function style(element: Element, property: string): string {
  return getComputedStyle(element).getPropertyValue(property)
}

/** The corner close button. A footer `DialogClose` carries the same slot. */
function cornerClose(): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(
    ".ex-modal > [data-slot='dialog-close']"
  )
  if (!element) throw new Error("the corner close button is not mounted")
  return element
}

/** Waits for the dialog to leave the DOM: a removed node has no locator. */
async function closed(): Promise<void> {
  await expect
    .poll(() => document.querySelector(".ex-modal[data-slot='dialog-content']"))
    .toBeNull()
}

function numberStyle(element: Element, property: string): number {
  return Number.parseFloat(style(element, property))
}

async function open(): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: "Open modal" }))
  await expect.element(page.getByRole("dialog")).toBeVisible()
  await document.fonts.ready
}

function closeCount(): number {
  return calls.filter((value) => value === false).length
}

beforeEach(async () => {
  container = document.createElement("div")
  document.body.replaceChildren(container)
  root = createRoot(container)
  calls = []
  viewport = { width: window.innerWidth, height: window.innerHeight }
})

afterEach(async () => {
  root.unmount()
  document.body.replaceChildren()
  await page.viewport(viewport.width, viewport.height)
})

describe("Modal geometry", () => {
  it("uses the size preset, never the inherited sm:max-w-md clamp", async () => {
    await page.viewport(1440, 1000)
    mount()
    await open()
    const expected: Record<ModalSize, number> = { sm: 384, md: 512, lg: 768, xl: 1024 }

    for (const size of ["sm", "md", "lg", "xl"] as const) {
      root.render(
        <ThemeProvider>
          <Sample size={size} />
        </ThemeProvider>
      )
      await expect.poll(() => frame().getBoundingClientRect().width).toBe(expected[size])
      const element = frame()
      expect(numberStyle(element, "width"), `${size} computed width`).toBeCloseTo(expected[size], 1)
      expect(numberStyle(element, "max-width"), `${size} max-width`).toBeCloseTo(1408, 1)
      expect(numberStyle(element, "max-height"), `${size} max-height`).toBeCloseTo(968, 1)
    }
  })

  it("lets an explicit width win and keeps both inside the viewport", async () => {
    await page.viewport(900, 600)
    mount({ width: "70rem", height: "80rem" })
    await open()

    const element = frame()
    expect(element.getBoundingClientRect().width).toBeCloseTo(868, 1)
    expect(numberStyle(element, "width")).toBeCloseTo(868, 1)
    expect(numberStyle(element, "max-width")).toBeCloseTo(868, 1)
    expect(numberStyle(element, "max-height")).toBeCloseTo(568, 1)
  })

  it("fills a narrow viewport and drops the floating frame", async () => {
    await page.viewport(390, 844)
    mount({ size: "xl", width: "40rem" })
    await open()

    const element = frame()
    expect(element.getBoundingClientRect().width).toBeCloseTo(390, 1)
    expect(style(element, "max-width")).toBe("100%")
    expect(element.getBoundingClientRect().height).toBeCloseTo(844, 1)
    expect(style(element, "translate")).toBe("none")
    expect(numberStyle(element, "border-top-width")).toBe(0)
    expect(numberStyle(element, "border-top-left-radius")).toBe(0)
    expect(style(element, "box-shadow")).toBe("none")
  })

  it("keeps the desktop layout when fullscreen is turned off", async () => {
    await page.viewport(390, 844)
    mount({ size: "md", mobileFullscreen: false })
    await open()

    const element = frame()
    expect(element.getBoundingClientRect().width).toBeCloseTo(358, 1)
    expect(numberStyle(element, "max-width")).toBeCloseTo(358, 1)
    expect(style(element, "translate")).toBe("-50% -50%")
  })

  it("switches at 768px only, on one content tree", async () => {
    await page.viewport(767, 900)
    mount()
    await open()

    const element = frame()
    const draft = document.querySelector<HTMLInputElement>("#modal-draft")!
    draft.value = "kept draft"
    draft.dispatchEvent(new Event("input", { bubbles: true }))
    expect(element.getBoundingClientRect().width).toBeCloseTo(767, 1)

    await page.viewport(768, 900)
    expect(document.querySelector(".ex-modal[data-slot='dialog-content']")).toBe(element)
    expect(element.getBoundingClientRect().width).toBeCloseTo(512, 1)
    expect(document.querySelector<HTMLInputElement>("#modal-draft")!.value).toBe("kept draft")

    await page.viewport(769, 900)
    expect(document.querySelector(".ex-modal[data-slot='dialog-content']")).toBe(element)
    expect(element.getBoundingClientRect().width).toBeCloseTo(512, 1)
    expect(closeCount(), "a resize must never request a close").toBe(0)
  })

  it("stacks the footer below 768px and never clamps at 640px", async () => {
    mount()
    for (const width of [639, 640, 641, 767]) {
      await page.viewport(width, 900)
      if (width === 639) await open()
      const footer = document.querySelector<HTMLElement>(".ex-modal-footer")!
      expect(style(footer, "flex-direction"), `footer at ${width}px`).toBe("column-reverse")
      expect(frame().getBoundingClientRect().width).toBeCloseTo(width, 1)
    }

    await page.viewport(768, 900)
    const footer = document.querySelector<HTMLElement>(".ex-modal-footer")!
    expect(style(footer, "flex-direction")).toBe("row")
    expect(style(footer, "justify-content")).toBe("flex-end")
    expect(frame().getBoundingClientRect().width).toBeCloseTo(512, 1)
  })

  it("reserves room for the close button and honours body padding", async () => {
    await page.viewport(1280, 900)
    mount()
    await open()

    const header = document.querySelector<HTMLElement>(".ex-modal-header")!
    expect(numberStyle(header, "padding-right"), "right reservation").toBeCloseTo(56, 1)
    expect(numberStyle(header, "min-height"), "normal chrome minimum").toBeCloseTo(68, 1)

    const body = () => document.querySelector<HTMLElement>(".ex-modal-body > div")!
    expect(numberStyle(body(), "padding-top"), "default padding").toBeCloseTo(24, 1)

    root.render(
      <ThemeProvider>
        <Sample padding={0} />
      </ThemeProvider>
    )
    await expect.poll(() => numberStyle(body(), "padding-top")).toBe(0)
    expect(numberStyle(header, "padding-right"), "padding never touches the header").toBeCloseTo(56, 1)

    root.render(
      <ThemeProvider>
        <Sample padding="1rem 2rem" />
      </ThemeProvider>
    )
    await expect.poll(() => numberStyle(body(), "padding-top")).toBe(16)
    expect(numberStyle(body(), "padding-left")).toBeCloseTo(32, 1)
  })

  it("keeps chrome reachable when the requested height is too small", async () => {
    await page.viewport(1024, 900)
    mount({ height: "2rem" })
    await open()

    // 4P + L + 2D + G = 4 * 24 + 20 + 2 * 36 + 8 = 196px
    expect(frame().getBoundingClientRect().height).toBeCloseTo(196, 1)
    const closeButton = cornerClose()
    expect(closeButton.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      frame().getBoundingClientRect().bottom
    )
  })

  it("scrolls a long footer in the normal direction", async () => {
    await page.viewport(1024, 900)
    // A 20rem request caps the chrome at min(max(320, 196), 868) / 3 = 106.67px.
    mount({ longFooter: true, height: "20rem" })
    await open()

    const scroller = document.querySelector<HTMLElement>(".ex-modal-footer-scroll")!
    const footer = document.querySelector<HTMLElement>(".ex-modal-footer")!
    expect(style(scroller, "overflow-y")).toBe("auto")
    expect(style(footer, "overflow-y")).toBe("visible")
    expect(scroller.scrollHeight, "the long footer must overflow").toBeGreaterThan(scroller.clientHeight)
    expect(scroller.getBoundingClientRect().height, "chrome cap").toBeLessThanOrEqual(107)

    scroller.scrollTop = scroller.scrollHeight
    const last = scroller.querySelectorAll("button")[scroller.querySelectorAll("button").length - 1]
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(scroller.getBoundingClientRect().bottom + 1)
    scroller.scrollTop = 0
    const first = scroller.querySelector("button")!
    expect(first.getBoundingClientRect().top).toBeGreaterThanOrEqual(scroller.getBoundingClientRect().top - 1)
  })

  it("keeps a long title fully readable without truncation", async () => {
    await page.viewport(1280, 900)
    mount({ longTitle: true })
    await open()

    const title = document.querySelector<HTMLElement>("[data-slot='dialog-title']")!
    expect(style(title, "white-space")).toBe("normal")
    expect(style(title, "-webkit-line-clamp")).toBe("none")
    expect(style(title, "text-overflow")).toBe("clip")

    const header = document.querySelector<HTMLElement>(".ex-modal-header")!
    expect(header.scrollHeight, "the header text area must scroll").toBeGreaterThan(header.clientHeight)
    const closeButton = cornerClose()
    expect(header.getBoundingClientRect().top).toBeLessThan(closeButton.getBoundingClientRect().top)
  })
})

describe("Modal closing", () => {
  it("reports exactly one close per channel and restores focus", async () => {
    await page.viewport(1280, 900)
    mount()
    await open()

    await userEvent.click(page.getByRole("button", { name: "Close modal" }))
    await closed()
    expect(closeCount()).toBe(1)
    await expect.poll(() => document.activeElement?.textContent).toBe("Open modal")

    await open()
    await userEvent.keyboard("{Escape}")
    await closed()
    expect(closeCount()).toBe(2)

    await open()
    await userEvent.click(page.getByRole("button", { name: "Cancel" }))
    await closed()
    expect(closeCount()).toBe(3)
    await expect.poll(() => document.activeElement?.textContent).toBe("Open modal")
  })

  it("blocks every channel while not dismissible and reads the live policy", async () => {
    await page.viewport(1280, 900)
    mount({ dismissible: false })
    await open()

    const closeButton = cornerClose()
    expect(closeButton.disabled, "the corner button is disabled").toBe(true)
    expect(closeButton.getBoundingClientRect().width, "and still visible").toBeGreaterThan(0)

    await userEvent.keyboard("{Escape}")
    expect(document.querySelector(".ex-modal[data-slot='dialog-content']")).not.toBeNull()
    expect(closeCount()).toBe(0)

    await userEvent.click(page.getByRole("button", { name: "Cancel" }))
    expect(document.querySelector(".ex-modal[data-slot='dialog-content']")).not.toBeNull()
    expect(closeCount()).toBe(0)

    // Flipping the policy while the modal is open must take effect at once.
    root.render(
      <ThemeProvider>
        <Sample dismissible={true} />
      </ThemeProvider>
    )
    await expect.poll(() =>
      cornerClose().disabled
    ).toBe(false)
    await userEvent.keyboard("{Escape}")
    await closed()
    expect(closeCount()).toBe(1)
  })

  it("omits the description association when there is no description", async () => {
    await page.viewport(1280, 900)
    mount({ description: undefined, footer: false })
    await open()

    const element = frame()
    expect(element.getAttribute("aria-describedby")).toBeNull()
    expect(document.querySelector("[data-slot='dialog-description']")).toBeNull()
    expect(document.querySelector(".ex-modal-footer-scroll"), "no empty footer row").toBeNull()
    expect(element.getAttribute("aria-labelledby")).toBe(
      document.querySelector("[data-slot='dialog-title']")!.id
    )
  })

  it("renders no footer region for a falsy footer", async () => {
    await page.viewport(1280, 900)
    // The footer region carries a separator, so a falsy value must not leave
    // an empty row with a stray line behind it. `Modal` is driven directly
    // here because the harness resolves its own footer prop first.
    for (const footer of [false, 0, ""] as const) {
      root.render(
        <ThemeProvider>
          <Modal title="Edit project profile" trigger={<Button>Open modal</Button>} footer={footer}>
            <p>body</p>
          </Modal>
        </ThemeProvider>
      )
      await open()
      expect(document.querySelector(".ex-modal-footer-scroll"), String(footer)).toBeNull()
      expect(document.querySelector("[data-slot='dialog-footer']"), String(footer)).toBeNull()
      await userEvent.keyboard("{Escape}")
      await closed()
    }
  })

  it("lands focus on the readable header first", async () => {
    await page.viewport(1280, 900)
    mount()
    await open()

    // The known cost of a fully readable title: one extra Tab to reach the form.
    expect(document.activeElement?.classList.contains("ex-modal-header")).toBe(true)
    await userEvent.keyboard("{Tab}")
    expect(document.activeElement).toBe(document.querySelector("#modal-draft"))
  })
})

describe("Modal contract", () => {
  // The checks run before any hook, so a rejected configuration throws out of
  // the render instead of leaving a broken dialog on screen.
  const renderInvalid = (props: Record<string, unknown>) =>
    renderToString(<Modal {...(props as ModalProps)}>body</Modal>)

  it("rejects a configuration it cannot honour", () => {
    expect(() => renderInvalid({ title: "   " })).toThrow(/title must be a non-blank string/)
    expect(() => renderInvalid({ title: "T", closeLabel: "  " })).toThrow(
      /closeLabel must be a non-blank string/
    )
    expect(() => renderInvalid({ title: "T", size: "huge" })).toThrow(/unknown size 'huge'/)
    // `in` would walk the prototype chain and let these through, resolving the
    // width to a function instead of a length.
    for (const inherited of ["toString", "constructor", "valueOf"]) {
      expect(() => renderInvalid({ title: "T", size: inherited }), inherited).toThrow(
        /unknown size/
      )
    }
    expect(() => renderInvalid({ title: "T", open: true, defaultOpen: true })).toThrow(/never both/)
    expect(() => renderInvalid({ title: "T", width: 0 })).toThrow(/width must be a finite, positive/)
    expect(() => renderInvalid({ title: "T", width: Number.NaN })).toThrow(/width must be a finite, positive/)
    expect(() => renderInvalid({ title: "T", height: -1 })).toThrow(/height must be a finite, positive/)
    expect(() => renderInvalid({ title: "T", padding: -4 })).toThrow(
      /padding must be a finite, non-negative/
    )

    // Accepted shapes, including the zero padding the design calls for.
    for (const props of [
      { title: "T" },
      { title: "T", padding: 0 },
      { title: "T", width: "70rem", height: 320 },
      { title: "T", defaultOpen: true },
      { title: "T", open: true, onOpenChange: () => {} },
    ]) {
      expect(() => renderInvalid(props), JSON.stringify(props)).not.toThrow()
    }
  })

  it("keeps the dialog extensions off the DOM", async () => {
    await page.viewport(1280, 900)
    mount({ dismissible: false })
    await open()

    // The two Dialog extensions are consumed, not forwarded: an unknown
    // attribute on the content or the button would be a React warning.
    const markup = document.body.innerHTML
    expect(markup).not.toContain("closeButtonDisabled")
    expect(markup).not.toContain("overlayClassName")
    expect(document.querySelector(".ex-modal-overlay"), "the overlay marker lands").not.toBeNull()
    expect(document.querySelector("[glass]"), "and glass stays a prop").toBeNull()
  })

  it("server-renders without a document and promises no description target", () => {
    const html = renderToString(
      <Modal title="Server modal" trigger={<button type="button">Open modal</button>}>
        body
      </Modal>
    )
    expect(html).toContain("Open modal")
    expect(html, "the portal stays empty until a document exists").not.toContain("ex-modal-body")
    expect(html, "no dangling association").not.toContain("aria-describedby")
  })
})

describe("Showcase sample", () => {
  it("opens the published sample through the public entry", async () => {
    await page.viewport(1280, 900)
    root.render(
      <ThemeProvider>
        <ShowcaseLanguageProvider>
          <ModalSamples />
        </ShowcaseLanguageProvider>
      </ThemeProvider>
    )
    await document.fonts.ready
    await userEvent.click(page.getByTestId("modal-sample-open"))
    await expect.element(page.getByRole("dialog", { name: "Edit project profile" })).toBeVisible()

    expect(frame().getBoundingClientRect().width, "default md preset").toBeCloseTo(512, 1)
    expect(numberStyle(document.querySelector(".ex-modal-body > div")!, "padding-top")).toBeCloseTo(24, 1)

    // The sample's controls sit behind the modal once it is open, so they are
    // driven first and checked on the next open.
    await userEvent.keyboard("{Escape}")
    await closed()
    await userEvent.click(page.getByRole("button", { name: "xl", exact: true }))
    await userEvent.click(page.getByRole("button", { name: "none", exact: true }))
    await userEvent.click(page.getByTestId("modal-sample-open"))
    await expect.element(page.getByRole("dialog", { name: "Edit project profile" })).toBeVisible()
    expect(frame().getBoundingClientRect().width, "xl preset").toBeCloseTo(1024, 1)
    expect(numberStyle(document.querySelector(".ex-modal-body > div")!, "padding-top"), "zero padding").toBe(0)
  })
})

describe("Modal motion and compatibility", () => {
  it("removes its own motion under prefers-reduced-motion", async () => {
    await page.viewport(1280, 900)
    mount()
    await open()

    for (const selector of [".ex-modal[data-slot='dialog-content']", ".ex-modal-overlay"]) {
      const element = document.querySelector(selector)!
      expect(style(element, "animation-name"), selector).toBe("none")
      expect(style(element, "animation-duration"), selector).toBe("0s")
      expect(style(element, "animation-delay"), selector).toBe("0s")
      expect(style(element, "transition-property"), selector).toBe("none")
      expect(style(element, "transition-duration"), selector).toBe("0s")
      expect(style(element, "transition-delay"), selector).toBe("0s")
    }
  })

  it("declares opacity-only keyframes for the normal case", () => {
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules]
      } catch {
        return []
      }
    })
    const opens = rules.filter(
      (rule) =>
        rule instanceof CSSStyleRule &&
        rule.selectorText.includes(".ex-modal") &&
        rule.selectorText.includes('[data-state="open"]')
    ) as CSSStyleRule[]
    expect(opens.length).toBeGreaterThan(0)

    for (const rule of opens) {
      // The shorthand is kept whole because its duration is a variable, so the
      // longhand is empty; the declared value is what has to be checked.
      expect(rule.style.getPropertyValue("animation")).toContain("ex-modal-in")
      expect(rule.style.getPropertyValue("animation")).toContain(
        "var(--exui-component-dialog-overlay-duration)"
      )
    }

    const keyframes = rules.find(
      (rule) => rule instanceof CSSKeyframesRule && rule.name === "ex-modal-in"
    ) as CSSKeyframesRule | undefined
    expect(keyframes).toBeDefined()
    for (const frameRule of [...keyframes!.cssRules] as CSSKeyframeRule[]) {
      expect(frameRule.style.transform, "no zoom may survive").toBe("")
      expect(frameRule.style.scale, "no zoom may survive").toBe("")
      expect(Number.parseFloat(frameRule.style.opacity)).toBeGreaterThanOrEqual(0)
    }
  })

  it("leaves an existing Dialog on the same page untouched", async () => {
    await page.viewport(1280, 900)
    root.render(
      <ThemeProvider>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open legacy</Button>
          </DialogTrigger>
          <DialogContent className="legacy-dialog">
            <DialogHeader>
              <DialogTitle>Legacy dialog</DialogTitle>
              <DialogDescription>The published default layout.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close legacy</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sample />
      </ThemeProvider>
    )

    await userEvent.click(page.getByRole("button", { name: "Open legacy" }))
    await expect.element(page.getByRole("dialog", { name: "Legacy dialog" })).toBeVisible()
    const legacy = document.querySelector<HTMLElement>(".legacy-dialog")!
    expect(legacy.classList.contains("ex-modal")).toBe(false)
    expect(numberStyle(legacy, "padding-top"), "surface padding survives").toBeCloseTo(24, 1)
    expect(numberStyle(legacy, "width"), "sm:max-w-md clamp survives").toBeCloseTo(448, 1)
    expect(numberStyle(legacy, "border-top-width")).toBeCloseTo(1, 1)
    await userEvent.keyboard("{Escape}")

    await userEvent.click(page.getByRole("button", { name: "Open modal" }))
    await expect.element(page.getByRole("dialog", { name: "Edit project profile" })).toBeVisible()
    expect(numberStyle(frame(), "width")).toBeCloseTo(512, 1)
    expect(numberStyle(frame(), "padding-top")).toBe(0)
  })
})
