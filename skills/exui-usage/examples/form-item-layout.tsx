import "@exre/exui/style.css"
import { z } from "zod"
import { Button, ExItem, Form, FormItem, Input, useForm } from "@exre/exui"

const schema = z.object({ displayName: z.string().min(1, "Enter a display name") })

export default function ItemLayouts() {
  const form = useForm({ schema, defaultValues: { displayName: "" } })

  return <div style={{ display: "grid", gap: "1.5rem" }}>
    <ExItem title="Search" desc="This input is outside the form." layout="horizontal">
      <Input placeholder="Search the page" />
    </ExItem>
    <Form form={form} onSubmit={(values) => { console.log(values.displayName) }} layout="horizontal">
      <FormItem form={form} name="displayName" label="Display name" description="Shown to other people"
        control="text" layout="vertical" />
      <Button type="submit">Save</Button>
    </Form>
  </div>
}
