import { useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  GlassSeed,
  Input,
  InputGroup,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@exre/exui"
import "@exre/exui/style.css"

/**
 * One seed per document registers the shared refraction filter. It renders no
 * children and is not a provider: the material still works without it, just
 * without the refraction enhancement.
 */
export default function GlassSurfaces() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <TooltipProvider>
      <GlassSeed />

      {/* A real backdrop is what makes a translucent surface worth looking at. */}
      <div
        className="grid gap-4 p-6"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1d4ed8 0 14px, #0f172a 14px 28px, #e11d48 28px 42px, #f8fafc 42px 56px)",
        }}
      >
        <Card glass>
          <CardHeader>
            <CardTitle>Glass card</CardTitle>
            <CardDescription>
              The material replaces the surface colour and keeps the component's own
              radius, padding, shadow, and states.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button glass>Neutral</Button>
            {/* Danger surfaces keep the danger material and its foreground. */}
            <Button glass variant="danger">
              Danger
            </Button>
            <Badge glass variant="destructive">
              Destructive
            </Badge>
          </CardContent>
        </Card>

        {/*
          Any element can use the material through the class, without a React
          component and without a glass prop.
        */}
        <div className="ex-glass rounded-xl p-4">
          A plain div material
        </div>

        <InputGroup glass>
          <InputGroupInput placeholder="Input group" aria-label="Glass input group" />
        </InputGroup>
        <Input glass placeholder="Input" aria-label="Glass input" />

        <div className="flex flex-wrap gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            {/* Portal content shares the seed of the document it renders into. */}
            <DialogContent glass>
              <DialogHeader>
                <DialogTitle>Glass dialog</DialogTitle>
                <DialogDescription>
                  The surface and the backdrop both follow the theme in effect where the
                  portal renders.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent glass>Tip</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
