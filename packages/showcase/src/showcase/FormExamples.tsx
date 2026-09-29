import * as React from "react"
import { z } from "zod"
import { useShowcaseLanguage } from "./language"
import { useIssueSeparator, useT } from "./translations"
import {
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, ExForm, ExItem, Form, FormErrorSummary, FormItem, FormList, Input, useForm,
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

const itemLayoutSchema = z.object({ handle: z.string() })

const schemas = { profileSchema, preferencesSchema, teamSchema, contactSchema, confirmationSchema, applicationSchema, attachmentSchema }

function Example({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return <article className="form-example">
    <header><h3>{title}</h3><p>{description}</p></header>
    {children}
  </article>
}

function ConfiguredProfile() {
  const t = useT()
  const issueSeparator = useIssueSeparator()
  const [output, setOutput] = React.useState<string>("")
  return <Example title={t("Configured profile")} description={t("One schema binds the fields. Age stays text while editing and becomes a number on submit.")}>
    <ExForm schema={schemas.profileSchema} defaultValues={{ name: "", email: "", age: "" }}
      fields={[
        { name: "name", label: t("Name"), control: "text", required: true },
        { name: "email", label: t("Email"), control: "email", required: true },
        { name: "age", label: t("Age"), control: "number", description: t("Whole years"), required: true },
      ]} columns={{ base: 1, md: 2 }} resetLabel={t("Reset")} submitLabel={t("Save profile")}
      errorSummaryTitle={t("Please check the following issues")} formatIssue={t}
      issueSeparator={issueSeparator}
      onSubmit={(values) => { setOutput(JSON.stringify(values, null, 2)) }} />
    {output && <pre className="form-example-output" aria-live="polite">{output}</pre>}
  </Example>
}

function ItemLayoutPreview() {
  const t = useT()
  const form = useForm({ schema: itemLayoutSchema, defaultValues: { handle: "" } })
  return <Example title={t("Item layouts")} description={t("A standalone input and a form field share the same title and control layout.")}>
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "28rem" }}>
      <ExItem title={t("Standalone input")} desc={t("This input is not registered with a form.")} layout="horizontal">
        <Input placeholder={t("Try an independent input")} />
      </ExItem>
      <Form form={form} onSubmit={() => {}} layout="horizontal">
        <FormItem form={form} name="handle" label={t("Form handle")} description={t("This field overrides the form layout.")}
          control="text" layout="vertical" />
      </Form>
    </div>
  </Example>
}

function ComposedPreferences() {
  const t = useT()
  const issueSeparator = useIssueSeparator()
  const form = useForm({ schema: schemas.preferencesSchema,
    defaultValues: { workspace: "Exre Design", role: "member", notifications: true }, mode: "onBlur" })
  const [saved, setSaved] = React.useState(false)
  return <Example title={t("Composed preferences")} description={t("Custom rendering uses the same typed field, errors, and focus target as built-in controls.")}>
    <Form form={form} layout="horizontal" formatIssue={t} issueSeparator={issueSeparator} onSubmit={() => { setSaved(true) }}>
      <FormErrorSummary form={form} title={t("Please check the following issues")} />
      <FormItem form={form} name="workspace" label={t("Workspace")} description={t("This field uses a custom Input render.")}
        render={({ field, state, accessibility }) => <Input {...accessibility} ref={field.ref}
          value={field.value} onChange={(event) => field.onChange(event.target.value)}
          onBlur={field.onBlur} disabled={state.disabled} />} />
      <FormItem form={form} name="role" label={t("Role")} control="select" controlProps={{ options: [
        { value: "member", label: t("Member") }, { value: "admin", label: t("Administrator") },
      ] }} />
      <FormItem form={form} name="notifications" label={t("Email notifications")} control="checkbox" />
      <div className="form-example-actions">
        <Button type="submit" disabled={form.state.isSubmitting}>{t("Save preferences")}</Button>
        <Button type="button" variant="secondary" onClick={() => form.setFocus("workspace")}>{t("Focus workspace")}</Button>
        <Button type="button" variant="ghost" onClick={() => { form.reset(); setSaved(false) }}>{t("Reset")}</Button>
      </div>
    </Form>
    {saved && <p role="status">{t("Preferences saved locally.")}</p>}
  </Example>
}

function TeamList() {
  const t = useT()
  const issueSeparator = useIssueSeparator()
  const form = useForm({ schema: schemas.teamSchema,
    defaultValues: { hasTeam: false, teamName: "", members: [{ name: "" }] } })
  const [saved, setSaved] = React.useState<string>("")
  return <Example title={t("Dependencies and member list")} description={t("A conditional team name preserves its draft. Member rows support adding, moving, and removing.")}>
    <Form form={form} formatIssue={t} issueSeparator={issueSeparator} onSubmit={(values) => { setSaved(JSON.stringify(values, null, 2)) }}>
      <FormErrorSummary form={form} title={t("Please check the following issues")} />
      <FormItem form={form} name="hasTeam" label={t("Enable team mode")} control="switch" />
      <FormItem form={form} name="teamName" label={t("Team name")} control="text" dependencies={["hasTeam"]}
        visibleWhen={(values) => values.hasTeam} />
      <FormList form={form} name="members" label={t("Members")} defaultItem={{ name: "" }}
        render={({ items, append, remove, move }) => <div className="form-example-list">
          {items.map(({ key, index }) => <div key={key} className="form-example-row">
            <FormItem form={form} name={`members.${index}.name`} label={`${t("Member")} ${index + 1}`} control="text" />
            <div className="form-example-actions">
              <Button type="button" variant="secondary" disabled={index === 0 || form.state.isSubmitting}
                onClick={() => move(index, index - 1)}>{t("Move up")}</Button>
              <Button type="button" variant="ghost" disabled={form.state.isSubmitting}
                onClick={() => remove(index)}>{t("Remove")}</Button>
            </div>
          </div>)}
          <Button type="button" variant="secondary" disabled={form.state.isSubmitting}
            onClick={() => append({ name: "" })}>{t("Add member")}</Button>
        </div>} />
      <Button type="submit" disabled={form.state.isSubmitting}>{t("Save team")}</Button>
    </Form>
    {saved && <pre className="form-example-output" aria-live="polite">{saved}</pre>}
  </Example>
}

function ApplicationDialog() {
  const { language } = useShowcaseLanguage()
  const t = useT()
  const issueSeparator = useIssueSeparator()
  const [open, setOpen] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const form = useForm({ schema: schemas.applicationSchema, defaultValues: { email: "", accepted: false } })
  return <Example title={t("Application steps in a Dialog")} description={t("The contact step checks only contact details. Closing resets the draft; the last step checks the full schema.")}>
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) form.reset()
      setOpen(next)
    }}>
      <DialogTrigger asChild><Button type="button">{t("Open application")}</Button></DialogTrigger>
      <DialogContent className="form-example-dialog" closeLabel={t("Close")}>
        <DialogHeader><DialogTitle>{t("Local application preview")}</DialogTitle>
          <DialogDescription>{t("No application is sent. Use Back to revisit the contact draft.")}</DialogDescription></DialogHeader>
        <ExForm form={form} clearOnDestroy fields={[
          { name: "email", label: t("Contact email"), control: "email" },
          { name: "accepted", label: t("I understand this is a local preview"), control: "checkbox" },
        ]} steps={[
          { id: "contact", title: t("Contact"), fields: ["email"], validationSchema: schemas.contactSchema },
          { id: "confirm", title: t("Confirm"), fields: ["accepted"], validationSchema: schemas.confirmationSchema },
          { id: "review", title: t("Review"), kind: "review", render: (values) =>
            <p>{t("Contact: ")}{values.email}{t(". Notice: ")}{t(values.accepted ? "confirmed" : "not confirmed")}{language === "zh-CN" ? "。" : "."}</p> },
        ]} submitLabel={t("Confirm preview")} backLabel={t("Back")} nextLabel={t("Next")}
        stepsAriaLabel={t("Form steps")} errorSummaryTitle={t("Please check the following issues")}
        formatIssue={t} issueSeparator={issueSeparator}
        onSubmit={() => { setSaved(true); setOpen(false); form.reset() }} />
      </DialogContent>
    </Dialog>
    {saved && <p role="status">{t("Application preview confirmed locally.")}</p>}
  </Example>
}

function FilesAndAsync() {
  const { language } = useShowcaseLanguage()
  const t = useT()
  const issueSeparator = useIssueSeparator()
  const [failNext, setFailNext] = React.useState(true)
  const [saved, setSaved] = React.useState<string>("")
  return <Example title={t("Local files and async submission")} description={t("Choose, drop, or paste 1–5 PNG, JPEG, or text files, at most 2 MiB each. Files stay in memory and are never uploaded.")}>
    <div className="form-example-actions"><Button type="button" variant="secondary"
      aria-pressed={failNext} onClick={() => setFailNext((value) => !value)}>
      {t(failNext ? "Next submit simulates a failure" : "Next submit succeeds")}
    </Button></div>
    <ExForm schema={schemas.attachmentSchema} defaultValues={{ title: "", attachments: [] }} fields={[
      { name: "title", label: t("Report title"), control: "text" },
      { name: "attachments", label: t("Attachments"), control: "files", controlProps: {
        accept: "image/png,image/jpeg,text/plain",
        buttonLabel: t("Choose files"),
        formatFileSize: (bytes: number) => `${new Intl.NumberFormat(language).format(bytes)} ${t("bytes")}`,
        removeFileLabel: (file: File) => `${t("Remove")} ${file.name}`,
      } },
    ]} resetLabel={t("Clear files")} submitLabel={t("Save local report")}
    errorSummaryTitle={t("Please check the following issues")} formatIssue={t}
    issueSeparator={issueSeparator}
    onSubmit={async (values, context) => {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => { context.signal.removeEventListener("abort", cancel); resolve() }, 650)
        function cancel() { clearTimeout(timer); resolve() }
        context.signal.addEventListener("abort", cancel, { once: true })
      })
      if (context.signal.aborted) return
      if (failNext) {
        context.setFormError("Simulated save failure. Your draft and files are preserved; switch to success and retry.")
      } else {
        setSaved(`${values.title}: ${values.attachments.length} ${t("local file(s).")}`)
      }
    }} />
    {saved && <p role="status">{saved}</p>}
  </Example>
}

export function FormExamples() {
  const t = useT()
  return <section className="form-examples" aria-labelledby="form-examples-heading">
    <header><h2 id="form-examples-heading">{t("Complete forms")}</h2>
      <p>{t("Configured and composed forms share one schema and one draft.")}</p></header>
    <ConfiguredProfile /><ItemLayoutPreview /><ComposedPreferences /><TeamList /><ApplicationDialog /><FilesAndAsync />
  </section>
}
