import * as React from "react"
import {
  Button,
  DialogClose,
  Input,
  Modal,
  Switch,
  type ModalSize,
} from "@exre/exui"

import { useT } from "./translations"

const sizes: ModalSize[] = ["sm", "md", "lg", "xl"]

type PaddingChoice = "default" | "none" | "loose"

const paddingValue: Record<PaddingChoice, number | undefined> = {
  default: undefined,
  none: 0,
  loose: 32,
}

/**
 * Consumes the public `@exre/exui` entry only. The controls sit outside the
 * modal so the sample stays a usage example rather than a diagnostic panel.
 */
export function ModalSamples() {
  const t = useT()
  const [size, setSize] = React.useState<ModalSize>("md")
  const [padding, setPadding] = React.useState<PaddingChoice>("default")
  const [blockClosing, setBlockClosing] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("Modal size")}>
          <span className="text-sm text-muted-foreground">{t("Size")}</span>
          {sizes.map((candidate) => (
            <Button
              key={candidate}
              size="sm"
              variant={candidate === size ? "default" : "outline"}
              aria-pressed={candidate === size}
              onClick={() => setSize(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("Modal padding")}>
          <span className="text-sm text-muted-foreground">{t("Padding")}</span>
          {(["default", "none", "loose"] as const).map((candidate) => (
            <Button
              key={candidate}
              size="sm"
              variant={candidate === padding ? "default" : "outline"}
              aria-pressed={candidate === padding}
              onClick={() => setPadding(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={blockClosing} onCheckedChange={setBlockClosing} />
          {t("Block closing")}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button data-testid="modal-sample-open" onClick={() => setOpen(true)}>
          {t("Open modal")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("Narrow the window below 768px to see the full-screen layout.")}
        </span>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t("Edit project profile")}
        description={t("Sizes, body padding, and the phone layout come from one component.")}
        size={size}
        padding={paddingValue[padding]}
        dismissible={!blockClosing}
        closeLabel={t("Close")}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">{t("Cancel")}</Button>
            </DialogClose>
            <Button type="submit" form="modal-sample-form">
              {t("Save")}
            </Button>
          </>
        }
      >
        <form
          id="modal-sample-form"
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
        >
          {["Display name", "Team", "Region", "Time zone", "Notes"].map((label) => (
            <label key={label} className="flex flex-col gap-1 text-sm">
              {label}
              <Input name={label} defaultValue="" />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm">
            {t("Attachment")}
            <input type="file" name="attachment" />
          </label>
          <p className="text-xs text-muted-foreground">
            {t("Resize the window while this modal is open: the draft and file choice stay put.")}
          </p>
        </form>
      </Modal>
    </div>
  )
}
