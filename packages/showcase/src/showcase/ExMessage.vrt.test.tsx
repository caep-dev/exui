import "@exre/exui/style.css"

import { StrictMode, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ExMessage, ExMessageContext, ThemeProvider, toast } from "@exre/exui"

let container: HTMLDivElement
let root: Root

type ActiveToast = Exclude<ReturnType<typeof toast.getToasts>[number], { dismiss: boolean }>

function activeToasts(): ActiveToast[] {
  return toast.getToasts().filter((item): item is ActiveToast => !("dismiss" in item))
}

beforeEach(async () => {
  container = document.createElement("div")
  document.body.replaceChildren(container)
  root = createRoot(container)
  root.render(<ThemeProvider><ExMessageContext /></ThemeProvider>)
  await expect.poll(() => document.querySelector("section[aria-live='polite']")).not.toBeNull()
})

afterEach(() => {
  vi.useRealTimers()
  root.unmount()
  document.body.replaceChildren()
})

describe("ExMessage public notifications", () => {
  it("renders an imperative info message in the mounted host", async () => {
    ExMessage.info("Profile saved")

    await expect.poll(() => document.body.textContent).toContain("Profile saved")
    expect(document.querySelector("[data-sonner-toaster]")?.getAttribute("data-y-position"))
      .toBe("top")
    expect(document.querySelector("[data-sonner-toaster]")?.getAttribute("data-x-position"))
      .toBe("right")
  })

  it("offers success messages and dismisses a managed message by ID", async () => {
    const id = ExMessage.success("Upload complete")
    await expect.poll(() => document.body.textContent).toContain("Upload complete")

    ExMessage.dismiss(id)
    expect(activeToasts().some((item) => item.id === id)).toBe(false)
  })

  it("evicts the oldest managed message when capacity is reached", () => {
    const first = ExMessage.info("First")
    const second = ExMessage.warn("Second")
    const third = ExMessage.error("Third")
    const fourth = ExMessage.success("Fourth")

    const activeIds = activeToasts().map((item) => item.id)
    expect(activeIds).not.toContain(first)
    expect(activeIds).toContain(second)
    expect(activeIds).toContain(third)
    expect(activeIds).toContain(fourth)
  })

  it("updates a loading message in place with a completion duration", () => {
    const handle = ExMessage.loading("Saving")
    const before = activeToasts().find((item) => item.title === "Saving")
    expect(before).toBeDefined()

    handle.onSuccess("Saved", { duration: 6500 })
    const after = activeToasts().find((item) => item.id === before?.id)
    expect(after).toMatchObject({ title: "Saved", type: "success", duration: 6500 })
    handle.onError("Late failure")
    expect(activeToasts().find((item) => item.id === before?.id)?.title).toBe("Saved")
  })

  it("does not resurrect a loading message after its explicit deadline", () => {
    vi.useFakeTimers()
    const handle = ExMessage.loading("Syncing", { duration: 100 })
    const id = activeToasts().find((item) => item.title === "Syncing")?.id
    expect(id).toBeDefined()

    vi.advanceTimersByTime(100)
    expect(activeToasts().some((item) => item.id === id)).toBe(false)
    handle.onSuccess("Too late")
    expect(activeToasts().some((item) => item.id === id)).toBe(false)
  })

  it("keeps raw toast calls outside managed capacity", () => {
    const raw = toast.info("Raw notification")
    ExMessage.info("Managed one")
    ExMessage.info("Managed two")
    ExMessage.info("Managed three")
    ExMessage.info("Managed four")

    expect(activeToasts().some((item) => item.id === raw)).toBe(true)
    toast.dismiss(raw)
  })

  it("uses the host duration by default and allows a per-message override", () => {
    const defaultId = ExMessage.info("Default duration")
    const overrideId = ExMessage.warn("Longer duration", { duration: 6000 })

    expect(activeToasts().find((item) => item.id === defaultId)?.duration).toBe(3000)
    expect(activeToasts().find((item) => item.id === overrideId)?.duration).toBe(6000)
    expect(() => ExMessage.error("Invalid", { duration: 0 })).toThrow(RangeError)
  })

  it("closes excess messages when the host capacity decreases", async () => {
    const first = ExMessage.info("First")
    const second = ExMessage.info("Second")
    const third = ExMessage.info("Third")

    root.render(<ThemeProvider><ExMessageContext maxCount={1} /></ThemeProvider>)
    await expect.poll(() => activeToasts().length).toBe(1)
    expect(activeToasts().some((item) => item.id === first || item.id === second)).toBe(false)
    expect(activeToasts()[0]?.id).toBe(third)
  })

  it("keeps loading active without a deadline and clears it on dismissal", () => {
    vi.useFakeTimers()
    const handle = ExMessage.loading("Working")
    const id = activeToasts().find((item) => item.title === "Working")?.id
    vi.advanceTimersByTime(10_000)
    expect(activeToasts().some((item) => item.id === id)).toBe(true)

    handle.dismiss()
    handle.onError("Late error")
    expect(activeToasts().some((item) => item.id === id)).toBe(false)
  })

  it("rejects calls after its host unmounts", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()
    expect(() => ExMessage.info("Too late")).toThrow("mounted ExMessageContext host")
  })

  it("accepts a sibling effect even when the host follows that sibling", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()

    function Caller() {
      useEffect(() => { ExMessage.info("From sibling effect") }, [])
      return null
    }

    root.render(<><Caller /><ExMessageContext /></>)
    await expect.poll(() => document.body.textContent).toContain("From sibling effect")
  })

  it("publishes an early loading completion only once after the host subscribes", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()

    function Caller() {
      useEffect(() => {
        const pending = ExMessage.loading("Starting")
        pending.onSuccess("Finished early")
      }, [])
      return null
    }

    root.render(<><Caller /><ExMessageContext /></>)
    await expect.poll(() => document.body.textContent).toContain("Finished early")
    expect(activeToasts().filter((item) => item.title === "Finished early")).toHaveLength(1)
    expect(activeToasts().some((item) => item.title === "Starting")).toBe(false)
  })

  it("does not publish an early message dismissed before subscription", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()

    function Caller() {
      useEffect(() => {
        const id = ExMessage.info("Dismissed early")
        ExMessage.dismiss(id)
      }, [])
      return null
    }

    root.render(<><Caller /><ExMessageContext /></>)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).not.toBeNull()
    expect(activeToasts().some((item) => item.title === "Dismissed early")).toBe(false)
  })

  it("forwards a custom placement to the bundled toaster", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()
    root.render(<ExMessageContext placement="bottom-left" />)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).not.toBeNull()
    ExMessage.info("Placed")
    await expect.poll(() => document.body.textContent).toContain("Placed")
    expect(document.querySelector("[data-sonner-toaster]")?.getAttribute("data-y-position"))
      .toBe("bottom")
    expect(document.querySelector("[data-sonner-toaster]")?.getAttribute("data-x-position"))
      .toBe("left")
  })

  it("cleans up its host across StrictMode remounts", async () => {
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()
    root.render(<StrictMode><ExMessageContext /></StrictMode>)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).not.toBeNull()

    const id = ExMessage.info("Strict notification")
    await expect.poll(() => document.body.textContent).toContain("Strict notification")
    root.render(null)
    await expect.poll(() => document.querySelector("section[aria-live='polite']")).toBeNull()
    expect(activeToasts().some((item) => item.id === id)).toBe(false)
    expect(() => ExMessage.info("After StrictMode")).toThrow("mounted ExMessageContext host")
  })
})
