import * as React from "react"
import { z } from "zod"
import {
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, ExForm, Form, FormErrorSummary, FormItem, FormList, Input, useForm,
} from "@exre/exui"

const profileSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  age: z.string().regex(/^\d+$/, "Enter your age in years.").transform(Number),
})
const preferencesSchema = z.object({
  workspace: z.string().trim().min(1, "Name your workspace."),
  role: z.enum(["member", "admin"]),
  notifications: z.boolean(),
})
const teamSchema = z.object({
  hasTeam: z.boolean(),
  teamName: z.string().optional(),
  members: z.array(z.object({ name: z.string().min(1, "Enter a member name.") }))
    .min(1, "Add at least one member."),
}).refine((values) => !values.hasTeam || Boolean(values.teamName?.trim()), {
  path: ["teamName"], message: "Name your team when team mode is enabled.",
})
const emailRule = z.string().email("Please enter a valid email.")
const contactSchema = z.object({ email: emailRule })
const confirmationSchema = z.object({ accepted: z.boolean().refine(Boolean, "Confirm the notice.") })
const applicationSchema = contactSchema.extend({ accepted: confirmationSchema.shape.accepted })
const attachmentSchema = z.object({
  title: z.string().trim().min(1, "Enter a report title."),
  attachments: z.array(z.custom<File>((value) => typeof File !== "undefined" && value instanceof File,
    "Select a local file."))
    .min(1, "Attach at least one file.").max(5, "Attach no more than five files.")
    .refine((files) => files.every((file) => file.size <= 2 * 1024 * 1024), "Each file must be at most 2 MiB.")
    .refine((files) => files.every((file) => ["image/png", "image/jpeg", "text/plain"].includes(file.type)),
      "Use PNG, JPEG, or plain text files."),
})

function Example({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return <article className="form-example">
    <header><h3>{title}</h3><p>{description}</p></header>
    {children}
  </article>
}

function ConfiguredProfile() {
  const [output, setOutput] = React.useState<string>("")
  return <Example title="Configured profile" description="One schema binds the fields. Age stays text while editing and becomes a number on submit.">
    <ExForm schema={profileSchema} defaultValues={{ name: "", email: "", age: "" }}
      fields={[
        { name: "name", label: "Name", control: "text", required: true },
        { name: "email", label: "Email", control: "email", required: true },
        { name: "age", label: "Age", control: "number", description: "Whole years", required: true },
      ]} columns={{ base: 1, md: 2 }} resetLabel="Reset" submitLabel="Save profile"
      onSubmit={(values) => { setOutput(JSON.stringify(values, null, 2)) }} />
    {output && <pre className="form-example-output" aria-live="polite">{output}</pre>}
  </Example>
}

function ComposedPreferences() {
  const form = useForm({ schema: preferencesSchema,
    defaultValues: { workspace: "Exre Design", role: "member", notifications: true }, mode: "onBlur" })
  const [saved, setSaved] = React.useState(false)
  return <Example title="Composed preferences" description="Custom rendering uses the same typed field, errors, and focus target as built-in controls.">
    <Form form={form} layout="horizontal" onSubmit={() => { setSaved(true) }}>
      <FormErrorSummary form={form} />
      <FormItem form={form} name="workspace" label="Workspace" description="This field uses a custom Input render."
        render={({ field, state, accessibility }) => <Input {...accessibility} ref={field.ref}
          value={field.value} onChange={(event) => field.onChange(event.target.value)}
          onBlur={field.onBlur} disabled={state.disabled} />} />
      <FormItem form={form} name="role" label="Role" control="select" controlProps={{ options: [
        { value: "member", label: "Member" }, { value: "admin", label: "Administrator" },
      ] }} />
      <FormItem form={form} name="notifications" label="Email notifications" control="checkbox" />
      <div className="form-example-actions">
        <Button type="submit" disabled={form.state.isSubmitting}>Save preferences</Button>
        <Button type="button" variant="secondary" onClick={() => form.setFocus("workspace")}>Focus workspace</Button>
        <Button type="button" variant="ghost" onClick={() => { form.reset(); setSaved(false) }}>Reset</Button>
      </div>
    </Form>
    {saved && <p role="status">Preferences saved locally.</p>}
  </Example>
}

function TeamList() {
  const form = useForm({ schema: teamSchema,
    defaultValues: { hasTeam: false, teamName: "", members: [{ name: "" }] } })
  const [saved, setSaved] = React.useState<string>("")
  return <Example title="Dependencies and member list" description="A conditional team name preserves its draft. Member rows support adding, moving, and removing.">
    <Form form={form} onSubmit={(values) => { setSaved(JSON.stringify(values, null, 2)) }}>
      <FormErrorSummary form={form} />
      <FormItem form={form} name="hasTeam" label="Enable team mode" control="switch" />
      <FormItem form={form} name="teamName" label="Team name" control="text" dependencies={["hasTeam"]}
        visibleWhen={(values) => values.hasTeam} />
      <FormList form={form} name="members" label="Members" defaultItem={{ name: "" }}
        render={({ items, append, remove, move }) => <div className="form-example-list">
          {items.map(({ key, index }) => <div key={key} className="form-example-row">
            <FormItem form={form} name={`members.${index}.name`} label={`Member ${index + 1}`} control="text" />
            <div className="form-example-actions">
              <Button type="button" variant="secondary" disabled={index === 0 || form.state.isSubmitting}
                onClick={() => move(index, index - 1)}>Move up</Button>
              <Button type="button" variant="ghost" disabled={form.state.isSubmitting}
                onClick={() => remove(index)}>Remove</Button>
            </div>
          </div>)}
          <Button type="button" variant="secondary" disabled={form.state.isSubmitting}
            onClick={() => append({ name: "" })}>Add member</Button>
        </div>} />
      <Button type="submit" disabled={form.state.isSubmitting}>Save team</Button>
    </Form>
    {saved && <pre className="form-example-output" aria-live="polite">{saved}</pre>}
  </Example>
}

function ApplicationDialog() {
  const [open, setOpen] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const form = useForm({ schema: applicationSchema, defaultValues: { email: "", accepted: false } })
  return <Example title="Application steps in a Dialog" description="The contact step checks only contact details. Closing resets the draft; the last step checks the full schema.">
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) form.reset()
      setOpen(next)
    }}>
      <DialogTrigger asChild><Button type="button">Open application</Button></DialogTrigger>
      <DialogContent className="form-example-dialog">
        <DialogHeader><DialogTitle>Local application preview</DialogTitle>
          <DialogDescription>No application is sent. Use Back to revisit the contact draft.</DialogDescription></DialogHeader>
        <ExForm form={form} clearOnDestroy fields={[
          { name: "email", label: "Contact email", control: "email" },
          { name: "accepted", label: "I understand this is a local preview", control: "checkbox" },
        ]} steps={[
          { id: "contact", title: "Contact", fields: ["email"], validationSchema: contactSchema },
          { id: "confirm", title: "Confirm", fields: ["accepted"], validationSchema: confirmationSchema },
          { id: "review", title: "Review", kind: "review", render: (values) =>
            <p>Contact: {values.email}. Notice: {values.accepted ? "confirmed" : "not confirmed"}.</p> },
        ]} submitLabel="Confirm preview" onSubmit={() => { setSaved(true); setOpen(false); form.reset() }} />
      </DialogContent>
    </Dialog>
    {saved && <p role="status">Application preview confirmed locally.</p>}
  </Example>
}

function FilesAndAsync() {
  const [failNext, setFailNext] = React.useState(true)
  const [saved, setSaved] = React.useState<string>("")
  return <Example title="Local files and async submission" description="Choose, drop, or paste 1–5 PNG, JPEG, or text files, at most 2 MiB each. Files stay in memory and are never uploaded.">
    <div className="form-example-actions"><Button type="button" variant="secondary"
      aria-pressed={failNext} onClick={() => setFailNext((value) => !value)}>
      {failNext ? "Next submit simulates a failure" : "Next submit succeeds"}
    </Button></div>
    <ExForm schema={attachmentSchema} defaultValues={{ title: "", attachments: [] }} fields={[
      { name: "title", label: "Report title", control: "text" },
      { name: "attachments", label: "Attachments", control: "files", controlProps: {
        accept: "image/png,image/jpeg,text/plain",
      } },
    ]} resetLabel="Clear files" submitLabel="Save local report" onSubmit={async (values, context) => {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => { context.signal.removeEventListener("abort", cancel); resolve() }, 650)
        function cancel() { clearTimeout(timer); resolve() }
        context.signal.addEventListener("abort", cancel, { once: true })
      })
      if (context.signal.aborted) return
      if (failNext) {
        context.setFormError("Simulated save failure. Your draft and files are preserved; switch to success and retry.")
      } else {
        setSaved(`${values.title}: ${values.attachments.length} local file(s).`)
      }
    }} />
    {saved && <p role="status">{saved}</p>}
  </Example>
}

export function FormExamples() {
  return <section className="form-examples" aria-labelledby="form-examples-heading">
    <header><h2 id="form-examples-heading">Complete forms</h2>
      <p>Configured and composed forms share one schema and one draft.</p></header>
    <ConfiguredProfile /><ComposedPreferences /><TeamList /><ApplicationDialog /><FilesAndAsync />
  </section>
}
