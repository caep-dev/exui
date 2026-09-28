import type { ReactNode } from "react"
import { toast } from "@/components/ui/sonner"

export type ExMessagePlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type ExMessageContextProps = {
  duration?: number
  placement?: ExMessagePlacement
  maxCount?: number
}

export type ExMessageOptions = { duration?: number }

export type ExMessageLoadingHandle = {
  onSuccess(content: ReactNode, options?: ExMessageOptions): void
  onError(content: ReactNode, options?: ExMessageOptions): void
  dismiss(): void
}

type MessageId = string | number
type Entry = {
  id: MessageId
  phase: "ordinary" | "loading" | "completed"
  shown: boolean
  pending?: () => void
  timer?: ReturnType<typeof setTimeout>
}
type MessageKind = "info" | "warning" | "error" | "success"
type Config = { duration: number; maxCount: number }

const entries = new Map<MessageId, Entry>()
let owner: symbol | undefined
let ready = false
let nextId = 0
let config: Config = { duration: 3000, maxCount: 3 }

function positiveDuration(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError("ExMessage duration must be a positive finite number of milliseconds.")
  }
  return value
}

function positiveCount(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError("ExMessage maxCount must be a positive integer.")
  }
  return value
}

export function resolveExMessageConfig(props: ExMessageContextProps): Config {
  return {
    duration: positiveDuration(props.duration ?? 3000),
    maxCount: positiveCount(props.maxCount ?? 3),
  }
}

function requireHost(): void {
  if (!owner) throw new Error("ExMessage requires a mounted ExMessageContext host.")
}

function forget(id: MessageId): Entry | undefined {
  const entry = entries.get(id)
  if (!entry) return undefined
  if (entry.timer) clearTimeout(entry.timer)
  entries.delete(id)
  return entry
}

export function dismissExMessage(id: MessageId): void {
  const entry = forget(id)
  if (entry?.shown) toast.dismiss(id)
}

function trimTo(limit: number): void {
  while (entries.size > limit) {
    const oldest = entries.keys().next().value
    if (oldest === undefined) break
    dismissExMessage(oldest)
  }
}

function closeCallbacks() {
  return {
    onDismiss: (closed: { id: MessageId }) => { forget(closed.id) },
    onAutoClose: (closed: { id: MessageId }) => { forget(closed.id) },
  }
}

export function mountExMessageHost(token: symbol, next: Config): void {
  if (owner && owner !== token) throw new Error("Only one ExMessageContext host may be mounted.")
  owner = token
  ready = false
  updateExMessageHost(token, next)
}

export function activateExMessageHost(token: symbol): void {
  if (owner !== token) return
  ready = true
  for (const entry of entries.values()) {
    const publish = entry.pending
    entry.pending = undefined
    if (entries.get(entry.id) === entry) publish?.()
  }
}

export function deactivateExMessageHost(token: symbol): void {
  if (owner === token) ready = false
}

export function updateExMessageHost(token: symbol, next: Config): void {
  if (owner !== token) return
  config = next
  trimTo(config.maxCount)
}

export function unmountExMessageHost(token: symbol): void {
  if (owner !== token) return
  for (const id of [...entries.keys()]) dismissExMessage(id)
  ready = false
  owner = undefined
  config = { duration: 3000, maxCount: 3 }
}

export function showExMessage(kind: MessageKind, content: ReactNode, options?: ExMessageOptions): MessageId {
  requireHost()
  const duration = positiveDuration(options?.duration ?? config.duration)
  trimTo(config.maxCount - 1)
  const id = `ex-message-${++nextId}`
  const entry: Entry = {
    id,
    phase: "ordinary",
    shown: false,
    pending: () => {
      entry.shown = true
      toast[kind](content, { id, duration, ...closeCallbacks() })
    },
  }
  entries.set(id, entry)
  if (ready) {
    entry.pending?.()
    entry.pending = undefined
  }
  return id
}

export function showExMessageLoading(content: ReactNode, options?: ExMessageOptions): ExMessageLoadingHandle {
  requireHost()
  const timeout = options?.duration === undefined ? undefined : positiveDuration(options.duration)
  trimTo(config.maxCount - 1)
  const id = `ex-message-${++nextId}`
  const entry: Entry = {
    id,
    phase: "loading",
    shown: false,
    pending: () => {
      entry.shown = true
      toast.loading(content, { id, ...closeCallbacks() })
    },
  }
  entries.set(id, entry)
  if (ready) {
    entry.pending?.()
    entry.pending = undefined
  }
  if (timeout !== undefined) entry.timer = setTimeout(() => dismissExMessage(id), timeout)

  function complete(kind: "success" | "error", nextContent: ReactNode, nextOptions?: ExMessageOptions): void {
    if (entries.get(id) !== entry || entry.phase !== "loading") return
    const duration = positiveDuration(nextOptions?.duration ?? config.duration)
    if (entry.timer) clearTimeout(entry.timer)
    entry.timer = undefined
    entry.phase = "completed"
    const publish = () => {
      entry.shown = true
      toast[kind](nextContent, { id, duration, ...closeCallbacks() })
    }
    if (entry.pending) entry.pending = publish
    else publish()
  }

  return {
    onSuccess: (nextContent, nextOptions) => complete("success", nextContent, nextOptions),
    onError: (nextContent, nextOptions) => complete("error", nextContent, nextOptions),
    dismiss: () => dismissExMessage(id),
  }
}

export const ExMessage = {
  info: (content: ReactNode, options?: ExMessageOptions) => showExMessage("info", content, options),
  warn: (content: ReactNode, options?: ExMessageOptions) => showExMessage("warning", content, options),
  error: (content: ReactNode, options?: ExMessageOptions) => showExMessage("error", content, options),
  success: (content: ReactNode, options?: ExMessageOptions) => showExMessage("success", content, options),
  loading: showExMessageLoading,
  dismiss: dismissExMessage,
}
