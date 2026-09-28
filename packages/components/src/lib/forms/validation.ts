import type { ErrorOption, FieldPath, UseFormReturn } from "react-hook-form"
import type { FormErrorInput, FormErrors, FormIssue, FormSchema, FormValues } from "./types"
import type { StandardSchemaV1 } from "./standard-schema"
import { assertId, parsePath, rootKey, snapshot, within } from "./paths"

export const ERROR_LEAF = "root.__exui"
export type IssueTarget = { readonly kind: "field"; readonly path: string } | { readonly kind: "root"; readonly key: string }
export interface StoredIssue { readonly target: IssueTarget; readonly owner: string; readonly issue: FormIssue }
interface ErrorLeaf extends ErrorOption { records: readonly StoredIssue[] }
export function createErrorBridge<I extends FormValues>(rhf: UseFormReturn<I>) {
  function read(): readonly StoredIssue[] {
    const error = rhf.getFieldState(ERROR_LEAF as FieldPath<I>).error as unknown as Partial<ErrorLeaf> | undefined
    return error?.records ?? []
  }
  function write(records: readonly StoredIssue[]): void {
    if (records.length) rhf.setError(ERROR_LEAF, { type: "exui", message: records[0].issue.message, records: snapshot(records) } as ErrorLeaf, { shouldFocus: false })
    else rhf.clearErrors(ERROR_LEAF)
  }
  function update(replace: (record: StoredIssue) => boolean, additions: readonly StoredIssue[] = []): void { write([...read().filter(record => !replace(record)), ...additions]) }
  function clear(names?: readonly string[]): void {
    if (!names) { write([]); return }
    const targets = names.map(name => { const key = rootKey(name); if (key === undefined) parsePath(name); return { name, key } })
    update(record => targets.some(({ name, key }) => key === undefined ? record.target.kind === "field" && within(record.target.path, name) : record.target.kind === "root" && (name === "root" || within(record.target.key, key))))
  }
  function add(name: string, input: FormErrorInput, source: "manual" | "server" | "execution", owner: string): void {
    const key = rootKey(name)
    if (key === undefined) parsePath(name)
    const target: IssueTarget = key === undefined ? { kind: "field", path: name } : { kind: "root", key }
    const additions = (input.issues ?? [{ message: input.message }]).map(issue => ({ target, owner, issue: snapshot({ ...issue, source }) }))
    update(record => record.owner === owner && sameTarget(record.target, target), additions)
  }
  function derive(): FormErrors<I> {
    const fields: Record<string, { issues: FormIssue[] }> = Object.create(null) as Record<string, { issues: FormIssue[] }>
    const root: Record<string, { issues: FormIssue[] }> = Object.create(null) as Record<string, { issues: FormIssue[] }>
    for (const record of read()) {
      const map = record.target.kind === "field" ? fields : root
      const key = record.target.kind === "field" ? record.target.path : record.target.key
      if (!Object.hasOwn(map, key)) map[key] = { issues: [] }
      map[key].issues.push(record.issue)
    }
    return snapshot({ fields, root }) as FormErrors<I>
  }
  return { read, write, update, clear, add, derive }
}
export type ErrorBridge<I extends FormValues> = ReturnType<typeof createErrorBridge<I>>
export function sameTarget(left: IssueTarget, right: IssueTarget): boolean { return left.kind === right.kind && (left.kind === "field" ? left.path === (right as { path: string }).path : left.key === (right as { key: string }).key) }
export function issuePath(issue: StandardSchemaV1.Issue): string | undefined {
  if (!issue.path?.length) return undefined
  const parts: string[] = []
  for (const segment of issue.path) {
    const key = typeof segment === "object" && segment !== null ? segment.key : segment
    if (typeof key === "symbol" || (typeof key === "number" && (!Number.isSafeInteger(key) || key < 0))) return undefined
    if (typeof key !== "string" && typeof key !== "number") return undefined
    const part = String(key)
    if (part.includes(".")) return undefined
    parts.push(part)
  }
  const path = parts.join(".")
  try { parsePath(path); return path } catch { return undefined }
}
export function schemaRecords(issues: readonly StandardSchemaV1.Issue[], declared: ReadonlySet<string>, scope?: { id: string; projection: readonly string[] }): StoredIssue[] {
  if (scope) assertId(scope.id)
  return issues.map(original => {
    const path = issuePath(original)
    const available = !!path && declared.has(path) && (!scope || scope.projection.some(parent => within(path, parent)))
    return {
      owner: scope ? `scope:${scope.id}` : "full",
      target: available ? { kind: "field", path } : { kind: "root", key: scope ? `validation.scope.${scope.id}` : "validation.full" },
      issue: snapshot({ ...original, source: "schema", ...(scope ? { scopeId: scope.id } : {}) }),
    } as StoredIssue
  })
}
export async function runSchema(schema: FormSchema, input: unknown): Promise<StandardSchemaV1.Result<unknown>> {
  if (schema["~standard"].version !== 1) throw new Error("ExForm: schema must implement Standard Schema V1.")
  return await Promise.resolve(schema["~standard"].validate(input))
}
