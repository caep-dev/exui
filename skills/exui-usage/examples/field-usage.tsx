import * as React from "react"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldContent,
  Input,
} from "@exre/exui"
import "@exre/exui/style.css"

export default function FieldUsage() {
  const [email, setEmail] = React.useState("")
  const invalid = email.length > 0 && !email.includes("@")
  const formErrors = [{ message: "Email is required" }]

  return (
    <div className="flex flex-col gap-6 p-6">
      <Field data-invalid={invalid || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={invalid || undefined}
          />
          <FieldDescription>We only use this to sign you in.</FieldDescription>
          {invalid && <FieldError>Enter a valid email address.</FieldError>}
        </FieldContent>
      </Field>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="newsletter">Newsletter</FieldLabel>
          <Input id="newsletter" />
          <FieldError errors={formErrors} />
        </FieldContent>
      </Field>
    </div>
  )
}
