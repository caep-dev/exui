import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Only the host runtime stays external: React, React DOM, and every subpath
// they expose. Prefix tests must not leak into other packages such as
// react-is, react-day-picker, or react-resizable-panels, which are bundled.
function isHostRuntime(id: string): boolean {
  return id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/')
}

const ownPackageName = '@exre/exui'

// Some bundled libraries (for example use-sync-external-store, reached
// through recharts) are CommonJS-only and call require("react") for the
// external host runtime. Rolldown's ESM output would keep those as runtime
// require calls that fail outside CommonJS. This transform converts host
// runtime require calls inside CommonJS modules into injected ESM namespace
// imports before bundling.
const HOST_RUNTIME_REQUIRE_PATTERN = /require\((["'])(react(?:-dom)?(?:\/[^"']+)?)\1\)/g

function externalRequireToImport(): Plugin {
  return {
    name: 'exui-external-require-to-import',
    transform(code, id) {
      if (id.includes('\0') || !/\.[cm]?[jt]sx?$/.test(id)) {
        return null
      }
      HOST_RUNTIME_REQUIRE_PATTERN.lastIndex = 0
      const specifiers = new Set<string>()
      let match: RegExpExecArray | null
      while ((match = HOST_RUNTIME_REQUIRE_PATTERN.exec(code)) !== null) {
        specifiers.add(match[2])
      }
      if (specifiers.size === 0) {
        return null
      }
      // Only rewrite CommonJS modules: ESM files mentioning require inside
      // strings or comments must stay untouched.
      const looksCommonJs =
        /\bmodule\.exports\b|\bexports\./.test(code) &&
        !/^\s*(import|export)\s/m.test(code.replace(HOST_RUNTIME_REQUIRE_PATTERN, ''))
      if (!looksCommonJs) {
        return null
      }
      const imports: string[] = []
      const names = new Map<string, string>()
      let index = 0
      for (const specifier of specifiers) {
        const name = `__exui_host_runtime_${index++}`
        names.set(specifier, name)
        imports.push(`import * as ${name} from ${JSON.stringify(specifier)}`)
      }
      const rewritten = code.replace(HOST_RUNTIME_REQUIRE_PATTERN, (_whole, _quote, specifier: string) =>
        names.get(specifier) ?? ''
      )
      return { code: `${imports.join('\n')}\n${rewritten}`, map: null }
    },
  }
}

// Records the packages whose code is actually bundled into the library
// output so the third-party notices can cover real versions instead of the
// declared dependency tree.
function recordBundledModules(): Plugin {
  return {
    name: 'exui-record-bundled-modules',
    generateBundle(_options, bundle) {
      const moduleIds = new Set<string>()
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') {
          continue
        }
        const modules = (chunk as { modules?: Record<string, unknown> }).modules
        if (modules && Object.keys(modules).length > 0) {
          for (const id of Object.keys(modules)) {
            moduleIds.add(id)
          }
        }
      }
      if (moduleIds.size === 0) {
        // Fall back to the resolved module graph when the bundler does not
        // report per-chunk module maps.
        for (const id of this.getModuleIds()) {
          moduleIds.add(id)
        }
      }

      const packages = new Map<string, { name: string; version: string; directory: string }>()
      for (const id of moduleIds) {
        const info = this.getModuleInfo(id)
        const importers = (info as { importers?: string[] } | null)?.importers ?? []
        if (!info || (!info.isEntry && importers.length === 0)) {
          continue
        }
        const packageDirectory = findOwningPackage(path.dirname(id))
        if (!packageDirectory) {
          continue
        }
        const manifest = readManifest(packageDirectory)
        if (!manifest?.name || manifest.name === ownPackageName) {
          continue
        }
        packages.set(manifest.name, {
          name: manifest.name,
          version: String(manifest.version ?? 'unknown'),
          directory: toPosix(path.relative(__dirname, packageDirectory)),
        })
      }

      const report = {
        generatedBy: 'vite plugin exui-record-bundled-modules',
        packages: [...packages.values()].sort((left, right) => left.name.localeCompare(right.name, 'en')),
      }
      this.emitFile({
        type: 'asset',
        fileName: 'bundled-modules.json',
        source: `${JSON.stringify(report, null, 2)}\n`,
      })
    },
  }
}

function findOwningPackage(directory: string): string | null {
  let current = directory
  while (true) {
    const manifest = path.join(current, 'package.json')
    if (existsSync(manifest)) {
      const parsed = readManifest(current)
      if (parsed?.name && parsed.name !== ownPackageName) {
        return current
      }
      // The first manifest from below is this package's own source tree.
      return null
    }
    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

function readManifest(directory: string): { name?: string; version?: string } | null {
  try {
    return JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), externalRequireToImport(), recordBundledModules()],
  publicDir: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      cssFileName: 'index',
      fileName: () => 'exui.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: (id: string) => isHostRuntime(id),
    },
  },
})
