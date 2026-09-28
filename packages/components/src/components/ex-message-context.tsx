import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import {
  activateExMessageHost,
  deactivateExMessageHost,
  mountExMessageHost,
  resolveExMessageConfig,
  unmountExMessageHost,
  updateExMessageHost,
} from "@/lib/ex-message-controller"
import type { ExMessageContextProps } from "@/lib/ex-message-controller"

const placements = new Set([
  "top-left", "top-center", "top-right",
  "bottom-left", "bottom-center", "bottom-right",
])

export function ExMessageContext({ duration, placement = "top-right", maxCount }: ExMessageContextProps) {
  const [token] = useState(() => Symbol("ExMessage host"))
  const config = useMemo(() => resolveExMessageConfig({ duration, maxCount }), [duration, maxCount])
  const initialConfig = useRef(config)
  if (!placements.has(placement)) throw new RangeError("ExMessage placement is invalid.")

  useLayoutEffect(() => {
    mountExMessageHost(token, initialConfig.current)
    return () => unmountExMessageHost(token)
  }, [token])

  useLayoutEffect(() => { updateExMessageHost(token, config) }, [token, config])

  useEffect(() => {
    // Sonner subscribes in its own child effect before this parent effect runs.
    activateExMessageHost(token)
    return () => deactivateExMessageHost(token)
  }, [token])

  return <Toaster position={placement} visibleToasts={config.maxCount} />
}
