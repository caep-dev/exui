import { playwright } from "@vitest/browser-playwright"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    name: "visual",
    include: ["src/**/*.vrt.test.tsx"],
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: {
          deviceScaleFactor: 1,
          locale: "en-US",
          reducedMotion: "reduce",
          timezoneId: "UTC",
        },
      }),
      instances: [
        {
          browser: "chromium",
          name: "chromium-desktop",
          viewport: { width: 1280, height: 900 },
        },
        {
          browser: "chromium",
          name: "chromium-mobile",
          viewport: { width: 390, height: 844 },
        },
      ],
    },
  },
})
