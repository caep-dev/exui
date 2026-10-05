import type { FormSnapshot } from "./types"

const unsafe = new Set(["__proto__", "prototype", "constructor"])
export function assertId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id) || unsafe.has(id)) throw new Error(`ExForm: unsafe identifier "${id}".`)
}
export function parsePath(path: string): string[] {
  if (typeof path !== "string" || !path || path.startsWith("root.") || path === "root") throw new Error(`ExForm: unsafe field path "${path}".`)
  const parts = path.split(".")
  for (const part of parts) {
    if (!part || unsafe.has(part) || (/^[+-]?\d/.test(part) && Number.isFinite(Number(part)) && !/^(0|[1-9]\d*)$/.test(part))) throw new Error(`ExForm: unsafe field path "${path}".`)
  }
  return parts
}
export function rootKey(path: string): string | undefined {
  if (path === "root") return "manual"
  if (!path.startsWith("root.")) return undefined
  const key = path.slice(5)
  for (const part of key.split(".")) assertId(part)
  if (key === "__exui" || key.startsWith("__exui.")) throw new Error("ExForm: root.__exui is a private error namespace.")
  return key
}
export function within(path: string, parent: string): boolean { return path === parent || path.startsWith(`${parent}.`) }
export function overlaps(left: string, right: string): boolean { return within(left, right) || within(right, left) }
export function normalizePaths(paths: readonly string[]): string[] {
  paths.forEach(parsePath)
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b, "en", { numeric: true })).filter((path, index, all) => !all.some((p, n) => n !== index && within(path, p)))
}
export function readPath(value: unknown, path: string): unknown {
  let current = value
  for (const part of parsePath(path)) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, part)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}
export function isPlain(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
export function snapshot<T>(value: T): FormSnapshot<T> {
  const seen = new WeakMap<object, unknown>()
  function copy(current: unknown): unknown {
    if (!Array.isArray(current) && !isPlain(current)) return current
    const prior = seen.get(current)
    if (prior) return prior
    const result: unknown[] | Record<string, unknown> = Array.isArray(current) ? new Array(current.length) : Object.create(null) as Record<string, unknown>
    seen.set(current, result)
    for (const key of Object.keys(current)) Object.defineProperty(result, key, { value: copy((current as Record<string, unknown>)[key]), enumerable: true, configurable: false, writable: false })
    return Object.freeze(result)
  }
  return copy(value) as FormSnapshot<T>
}
export function equalValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => Object.hasOwn(right, key) && equalValue((left as unknown as Record<string, unknown>)[key], (right as unknown as Record<string, unknown>)[key]))
  if (isPlain(left) && isPlain(right)) return Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => Object.hasOwn(right, key) && equalValue(left[key], right[key]))
  return false
}
export function project(value: unknown, paths: readonly string[]): Record<string, unknown> {
  const result = Object.create(null) as Record<string, unknown>
  for (const path of normalizePaths(paths)) {
    const parts = parsePath(path)
    let from: unknown = value
    let to: Record<string, unknown> | unknown[] = result
    for (let n = 0; n < parts.length; n++) {
      const key = parts[n]
      if (!from || typeof from !== "object" || !Object.hasOwn(from, key)) break
      const child = (from as Record<string, unknown>)[key]
      if (n === parts.length - 1) Object.defineProperty(to, key, { value: snapshot(child), writable: true, configurable: true, enumerable: true })
      else {
        if (!Object.hasOwn(to, key)) Object.defineProperty(to, key, { value: Array.isArray(child) ? new Array(child.length) : Object.create(null), writable: true, configurable: true, enumerable: true })
        to = (to as Record<string, unknown>)[key] as Record<string, unknown> | unknown[]
      }
      from = child
    }
  }
  return snapshot(result) as Record<string, unknown>
}
export function declaredFromValues(value: unknown, base = "", target = new Set<string>()): Set<string> {
  if (!Array.isArray(value) && !isPlain(value)) return target
  for (const key of Object.keys(value)) {
    const path = base ? `${base}.${key}` : key
    try { parsePath(path) } catch { continue }
    target.add(path)
    declaredFromValues((value as Record<string, unknown>)[key], path, target)
  }
  return target
}
export function hasMarked(value: unknown): boolean {
  if (value === true) return true
  return !!value && typeof value === "object" && Object.values(value).some(hasMarked)
}
