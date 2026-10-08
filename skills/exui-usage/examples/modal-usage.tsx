import { useState } from "react"
import {
  Button,
  DialogClose,
  Input,
  Label,
  Modal,
  type ModalSize,
} from "@exre/exui"
import "@exre/exui/style.css"

export default function ModalUsage() {
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<ModalSize>("md")
  const [saving, setSaving] = useState(false)

  function save() {
    setSaving(true)
    // While the request is in flight the modal stays open and cannot be
    // dismissed; restore `dismissible` in both outcomes so it can always exit.
    setTimeout(() => {
      setSaving(false)
      setOpen(false)
    }, 400)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit project profile</Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Edit project profile"
        description="Sizes, body padding, and the phone layout come from one component."
        size={size}
        padding={0}
        dismissible={!saving}
        closeLabel="Close profile"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="project-profile" className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="profile-name">Project name</Label>
            <Input id="profile-name" name="name" defaultValue="ExUI" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="profile-owner">Owner</Label>
            <Input id="profile-owner" name="owner" defaultValue="Design Ops" />
          </div>
          <p className="text-sm text-muted-foreground">
            Narrow the window below 768px: the same form fills the screen without
            losing what you typed.
          </p>
        </form>
      </Modal>

      <div className="flex gap-2">
        {(["sm", "md", "lg", "xl"] as const).map((candidate) => (
          <Button
            key={candidate}
            variant={candidate === size ? "default" : "outline"}
            onClick={() => setSize(candidate)}
          >
            {candidate}
          </Button>
        ))}
      </div>
    </>
  )
}
