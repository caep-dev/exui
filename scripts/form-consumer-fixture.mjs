// Source files for both isolated Zod consumers. Keeping one fixture definition
// makes Zod 3/4 exercise identical public contracts, without workspace aliases.
export function createFormConsumerFiles() {
  return {
    "schema.ts": `import { z } from "zod"

export const schema = z.object({
  age: z.string().min(1, "Enter an age").regex(/^\\d+$/, "Use digits").transform(Number).refine(async (value) => {
    await Promise.resolve()
    return value >= 18
  }, "Adults only"),
  role: z.enum(["admin", "member"]),
  tags: z.array(z.enum(["a", "b"])),
  count: z.number(),
  contacts: z.array(z.object({ email: z.string().email() })),
})
export const defaults: z.input<typeof schema> = {
  age: "", role: "member", tags: [], count: 1, contacts: [],
}
`,
    "app.tsx": `import "@exre/exui/style.css"
import { useState } from "react"
import { ExForm } from "@exre/exui"
import { schema, defaults } from "./schema"

export function App() {
  const [result, setResult] = useState("")
  const [calls, setCalls] = useState(0)
  return <main>
    <ExForm schema={schema} defaultValues={defaults}
      fields={[{ name: "age", label: "Age", control: "number" }]}
      submitLabel="Save parsed form"
      onSubmit={(output) => {
        setCalls((value) => value + 1)
        setResult(JSON.stringify({ age: output.age, type: typeof output.age }))
      }} />
    <output data-testid="parsed-result">{result}</output>
    <output data-testid="submit-count">{calls}</output>
  </main>
}
`,
    "types.tsx": `import { ExForm, Form, FormItem, FormList, useForm, useWatch, useFieldArray } from "@exre/exui"
import type { FormInput, FormOutput, FormInstance, StandardSchemaV1 } from "@exre/exui"
import type { z } from "zod"
import { schema, defaults } from "./schema"

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Assert<T extends true> = T
export type ExactInput = Assert<Equal<FormInput<typeof schema>, z.input<typeof schema>>>
export type ExactOutput = Assert<Equal<FormOutput<typeof schema>, z.output<typeof schema>>>
export type InputAge = Assert<Equal<FormInput<typeof schema>["age"], string>>
export type OutputAge = Assert<Equal<FormOutput<typeof schema>["age"], number>>
type IsAny<T> = 0 extends (1 & T) ? true : false
export type OutputIsNotAny = Assert<Equal<IsAny<FormOutput<typeof schema>>, false>>

type ReadonlyInput = { tags: readonly string[]; contacts: readonly { email: string }[] }
const readonlySchema: StandardSchemaV1<ReadonlyInput, ReadonlyInput> = {
  "~standard": { version: 1, vendor: "fixture", validate(value) { return { value: value as ReadonlyInput } } },
}

// A structural RHF lookalike cannot manufacture the private ExUI brand.
declare const externalRHF: { control: unknown; formState: unknown; getValues(): z.input<typeof schema>; setValue(name: string, value: unknown): void; handleSubmit(callback: (value: unknown) => void): () => Promise<void> }
// @ts-expect-error external RHF is not an ExUI FormInstance.
const foreignInstance: FormInstance<z.input<typeof schema>, z.output<typeof schema>> = externalRHF
void foreignInstance
type Facade = FormInstance<z.input<typeof schema>, z.output<typeof schema>>
declare const structuralClone: Pick<Facade, Extract<keyof Facade, string>>
// @ts-expect-error copying every public method still cannot forge the private brand.
const forgedInstance: Facade = structuralClone
void forgedInstance

export function TypeContracts() {
  const form = useForm({ schema, defaultValues: defaults })
  const age: string = form.getValues("age")
  const tuple: readonly [string, number] = useWatch({ form, name: ["age", "count"] as const })
  const array = useFieldArray({ form, name: "contacts" })
  array.append({ email: "reader@example.com" })
  // @ts-expect-error input controls keep strings even when parsed output is numeric.
  form.setValue("age", 20)
  // @ts-expect-error names are checked against the input model.
  form.setValue("missing", "value")
  // @ts-expect-error primitive arrays are not object lists.
  useFieldArray({ form, name: "tags" })
  // @ts-expect-error list items must contain their complete input shape.
  array.append({})
  // @ts-expect-error full parse output is not the input draft.
  const output: z.output<typeof schema> = form.getValues()
  void output; void age; void tuple
  const readonlyForm = useForm({ schema: readonlySchema, defaultValues: { tags: [], contacts: [] } })
  readonlyForm.setValue("tags", ["a"] as const)
  return <>
    <Form form={form} onSubmit={(parsed) => {
      const parsedAge: number = parsed.age
      // @ts-expect-error the submit handler receives Output, not Input.
      const inputAge: string = parsed.age
      void parsedAge; void inputAge
    }}>
      <FormItem form={form} name="age" control="number" />
      <FormItem form={form} name="role" control="select" controlProps={{ options: [{ value: "admin", label: "Admin" }] }} />
      <FormItem form={form} name="tags" control="multi-select" controlProps={{ options: [{ value: "a", label: "A" }] }} />
      {/* @ts-expect-error invalid field paths cannot widen inference. */}
      <FormItem form={form} name="missing" control="text" />
      {/* @ts-expect-error numeric model values cannot bind to text controls. */}
      <FormItem form={form} name="count" control="text" />
      {/* @ts-expect-error enum choices cannot widen the role model. */}
      <FormItem form={form} name="role" control="select" controlProps={{ options: [{ value: "owner", label: "Owner" }] }} />
      {/* @ts-expect-error enum array choices cannot widen the tag element model. */}
      <FormItem form={form} name="tags" control="multi-select" controlProps={{ options: [{ value: "c", label: "C" }] }} />
      <FormItem form={form} name="age" render={({ field }) => {
        const value: string = field.value
        // @ts-expect-error custom render onChange accepts the input path value.
        field.onChange(20)
        return <span>{value}</span>
      }} />
      {/* @ts-expect-error scalar arrays cannot use FormList. */}
      <FormList form={form} name="tags" defaultItem="a" render={() => null} />
      {/* @ts-expect-error list defaults must use the full object input model. */}
      <FormList form={form} name="contacts" defaultItem={{ email: 1 }} render={() => null} />
      <FormList form={form} name="contacts" defaultItem={{ email: "" }} render={({ append }) => {
        // @ts-expect-error custom list render append stays tied to the input item.
        append({ email: 1 })
        return null
      }} />
    </Form>
    <Form form={readonlyForm} onSubmit={() => {}}>
      {/* @ts-expect-error readonly model arrays cannot use built-in multi-select. */}
      <FormItem form={readonlyForm} name="tags" control="multi-select" controlProps={{ options: [{ value: "a", label: "A" }] }} />
      {/* @ts-expect-error readonly object arrays cannot use mutable FormList. */}
      <FormList form={readonlyForm} name="contacts" defaultItem={{ email: "" }} render={() => null} />
      <FormItem form={readonlyForm} name="tags" render={({ field }) => {
        const tags: readonly string[] = field.value
        // @ts-expect-error render snapshots preserve readonly array types.
        field.value.push("a")
        field.onChange(["a"] as const)
        return <span>{tags.join(",")}</span>
      }} />
    </Form>
    {/* @ts-expect-error externally supplied RHF instances are rejected. */}
    <ExForm form={externalRHF} fields={[]} onSubmit={() => {}} />
    {/* @ts-expect-error a complete structural facade lookalike lacks the private brand. */}
    <ExForm form={structuralClone} fields={[]} onSubmit={() => {}} />
    {/* @ts-expect-error ExForm cannot receive both schema and form. */}
    <ExForm form={form} schema={schema} defaultValues={defaults} fields={[]} onSubmit={() => {}} />
    {/* @ts-expect-error existing instances own their defaultValues and modes. */}
    <ExForm form={form} defaultValues={defaults} fields={[]} onSubmit={() => {}} />
  </>
}
`,
    "server.tsx": `import { renderToString } from "react-dom/server"
import { ExForm, Form, FormItem, useForm } from "@exre/exui"
import type { StandardSchemaV1 } from "@exre/exui"
import { schema, defaults } from "./schema"

// No File constructor or document lookup is available in this SSR fixture.
const fileSchema: StandardSchemaV1<{ files: File[] }, { files: File[] }> = {
  "~standard": { version: 1, vendor: "ssr-fixture", validate() { return { value: { files: [] } } } },
}
function EmptyFiles() {
  const form = useForm({ schema: fileSchema, defaultValues: { files: [] } })
  return <Form form={form} onSubmit={() => {}}><FormItem form={form} name="files" label="Attachments" control="files" /></Form>
}
export function render() {
  return renderToString(<><ExForm schema={schema} defaultValues={defaults}
    fields={[{ name: "age", label: "SSR Age", control: "number" }]} onSubmit={() => {}} /><EmptyFiles /></>)
}
`,
    "smoke.mjs": `import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// Load the bundle in a normal server environment: existing bundled vendors
// check typeof document at initialization. Then make any render-time access
// fail, including a typeof check or Node 24's built-in File constructor.
assert.equal(typeof window, "undefined", "SSR fixture must have no window")
const { render } = await import("./ssr/server.js")
for (const name of ["document", "File"]) {
  Object.defineProperty(globalThis, name, { configurable: true, get() { throw new Error("SSR read browser global: " + name) } })
}
const html = render()
assert.match(html, /SSR Age/, "ExForm must render the schema control on the server")
assert.match(html, /Attachments/, "empty file controls must render without a File constructor")
assert.match(html, /type="number"/, "SSR must include the bound numeric-string input")
const require = createRequire(import.meta.url)
const packageEntry = fileURLToPath(import.meta.resolve("@exre/exui"))
assert.equal(require.resolve("react"), createRequire(join(dirname(packageEntry), "package.json")).resolve("react"), "ExForm must share consumer React")
console.log("ExForm SSR without browser globals passed:", html.length)
`,
    "main.tsx": `import { createRoot } from "react-dom/client"
import { App } from "./app"
const container = document.getElementById("app")
if (container) createRoot(container).render(<App />)
`,
    "index.html": '<!doctype html><html><body><div id="app"></div><script type="module" src="/main.tsx"></script></body></html>\n',
    "vite.config.mjs": 'import { defineConfig } from "vite"\nexport default defineConfig({ build: { minify: false } })\n',
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        strict: true, skipLibCheck: false, noEmit: true, module: "ESNext",
        moduleResolution: "Bundler", jsx: "react-jsx", target: "ES2023",
        lib: ["ES2023", "DOM", "DOM.Iterable"], types: ["node", "vite/client"],
      },
      include: ["*.ts", "*.tsx"],
    }, null, 2) + "\n",
  }
}
