import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  findModuleSpecifierOccurrences,
  isBareSpecifier,
} from "./module-specifiers.mjs"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const typesRoot = path.join(packageRoot, "types")
const vendorRoot = path.join(typesRoot, "vendor")
const requireFromPackage = createRequire(path.join(packageRoot, "package.json"))

// The host runtime keeps its published types: React and React DOM stay
// external peers, so their declarations (and only theirs) may remain bare
// module references in the shipped declarations.
function isHostRuntimeTypes(specifier) {
  return (
    specifier === "react" ||
    specifier === "react-dom" ||
    specifier.startsWith("react/") ||
    specifier.startsWith("react-dom/")
  )
}

function splitPackageSpecifier(specifier) {
  const parts = specifier.split("/")
  if (specifier.startsWith("@")) {
    if (parts.length < 2) {
      throw new Error(`Invalid scoped specifier: ${specifier}`)
    }
    return { name: `${parts[0]}/${parts[1]}`, subpath: parts.slice(2).join("/") }
  }
  return { name: parts[0], subpath: parts.slice(1).join("/") }
}

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function pathExists(candidate) {
  try {
    await stat(candidate)
    return true
  } catch {
    return false
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"))
}

// Import/export specifier pattern for emitted declarations. The negative
// lookbehind keeps quoted data strings such as "from", "fx" inside
// declaration arrays from being parsed as import clauses.
const REFERENCE_TYPES_PATTERN = /\/\/\/\s*<reference\s+types\s*=\s*["']([^"']+)["']\s*\/>/g
const REFERENCE_PATH_PATTERN = /\/\/\/\s*<reference\s+path\s*=\s*["']([^"']+)["']\s*\/>/g

function extractSpecifiers(text) {
  const specifiers = new Set()
  for (const occurrence of findModuleSpecifierOccurrences(text)) {
    specifiers.add(occurrence.specifier)
  }
  let match
  REFERENCE_TYPES_PATTERN.lastIndex = 0
  while ((match = REFERENCE_TYPES_PATTERN.exec(text)) !== null) {
    specifiers.add(match[1])
  }
  REFERENCE_PATH_PATTERN.lastIndex = 0
  while ((match = REFERENCE_PATH_PATTERN.exec(text)) !== null) {
    specifiers.add(match[1])
  }
  return specifiers
}

function findReferenceTypesDirectives(text) {
  const directives = new Set()
  let match
  REFERENCE_TYPES_PATTERN.lastIndex = 0
  while ((match = REFERENCE_TYPES_PATTERN.exec(text)) !== null) {
    directives.add(match[1])
  }
  return directives
}

function findReferencePathDirectives(text) {
  const paths = new Set()
  let match
  REFERENCE_PATH_PATTERN.lastIndex = 0
  while ((match = REFERENCE_PATH_PATTERN.exec(text)) !== null) {
    paths.add(match[1])
  }
  return paths
}

function rewriteBareSpecifier(text, from, to) {
  const occurrences = findModuleSpecifierOccurrences(text).filter(
    (occurrence) => occurrence.specifier === from
  )
  if (occurrences.length === 0) {
    return text
  }
  let result = ""
  let cursor = 0
  for (const occurrence of occurrences) {
    result += text.slice(cursor, occurrence.valueStart) + to
    cursor = occurrence.valueStart + from.length
  }
  return result + text.slice(cursor)
}

function toPosix(value) {
  return value.split(path.sep).join("/")
}

// The import specifier that points a consumer at a vendored declaration
// file, honouring TypeScript's module-kind extension mapping.
function specifierForDeclaration(declarationFile, fromFile) {
  const relative = toPosix(path.relative(path.dirname(fromFile), declarationFile))
  const withoutExtension = relative.replace(/\.(d\.ts|d\.mts|d\.cts)$/, "")
  let suffix = ""
  if (declarationFile.endsWith(".d.mts")) {
    suffix = ".mts"
  } else if (declarationFile.endsWith(".d.cts")) {
    suffix = ".cjs"
  }
  const specifier = `${withoutExtension}${suffix}`
  return specifier.startsWith(".") ? specifier : `./${specifier}`
}

function resolveTypesCondition(exportsNode) {
  if (typeof exportsNode === "string") {
    return exportsNode
  }
  if (!exportsNode || typeof exportsNode !== "object") {
    return null
  }
  for (const condition of ["types", "import", "require", "default"]) {
    if (condition in exportsNode) {
      const resolved = resolveTypesCondition(exportsNode[condition])
      if (resolved !== null) {
        return resolved
      }
    }
  }
  return null
}

// Resolves an exports-map lookup including subpath patterns such as
// "./d3-*". Exact keys win; longer patterns take precedence, matching
// Node's subpath pattern semantics for the single-star case.
function matchExportsEntry(exportsMap, requested) {
  if (requested in exportsMap) {
    return { node: exportsMap[requested], captured: null }
  }
  const patterns = Object.keys(exportsMap)
    .filter((key) => key.includes("*"))
    .sort((left, right) => right.length - left.length)
  for (const key of patterns) {
    const [prefix, suffix = ""] = key.split("*")
    if (
      requested.startsWith(prefix) &&
      requested.endsWith(suffix) &&
      requested.length >= prefix.length + suffix.length
    ) {
      const captured = requested.slice(prefix.length, requested.length - suffix.length)
      return { node: exportsMap[key], captured }
    }
  }
  return null
}

function typesCandidatesFor(target) {
  const resolved = path.resolve(target)
  if (/\.(d\.ts|d\.mts|d\.cts)$/.test(target)) {
    return [resolved]
  }
  if (/\.(ts|mts|cts)$/.test(target)) {
    // Explicit TypeScript extensions: the literal file, then the sibling
    // declaration (date-fns imports "./add.ts" but ships add.d.ts).
    const declaration = resolved.replace(/\.(ts|mts|cts)$/, (extension) => `.d${extension}`)
    return [resolved, declaration]
  }
  if (target.endsWith(".js")) {
    const base = resolved.slice(0, -3)
    // Declaration siblings first; some packages (e.g. @reduxjs/toolkit)
    // resolve runtime specifiers to shipped TypeScript sources instead.
    return [
      `${base}.d.ts`,
      `${base}.d.mts`,
      `${base}.d.cts`,
      `${base}.ts`,
      `${base}.mts`,
      `${base}.cts`,
    ]
  }
  if (target.endsWith(".mjs")) {
    const base = resolved.slice(0, -4)
    return [`${base}.d.mts`, `${base}.mts`]
  }
  if (target.endsWith(".cjs")) {
    const base = resolved.slice(0, -4)
    return [`${base}.d.cts`, `${base}.cts`]
  }
  // Extensionless: try declaration siblings first, then an index file.
  return [
    `${resolved}.d.ts`,
    `${resolved}.d.mts`,
    `${resolved}.d.cts`,
    path.join(resolved, "index.d.ts"),
    path.join(resolved, "index.d.mts"),
    path.join(resolved, "index.d.cts"),
  ]
}

async function firstExistingDeclaration(candidates) {
  for (const candidate of candidates) {
    if (/\.(d\.ts|d\.mts|d\.cts|ts|mts|cts)$/.test(candidate) && (await pathExists(candidate))) {
      return candidate
    }
  }
  return null
}

async function resolvePackageRoot(name, specifier, resolutionBase) {
  const requireFromContext = createRequire(path.join(resolutionBase, "package.json"))
  // Prefer the package manifest when the exports map exposes it.
  try {
    return path.dirname(requireFromContext.resolve(`${name}/package.json`))
  } catch {
    // Some packages do not export ./package.json.
  }
  // Otherwise resolve an entry (the full specifier first for packages
  // without a root export) and walk up to the nearest manifest.
  for (const candidate of [specifier, name]) {
    try {
      const entry = requireFromContext.resolve(candidate)
      let directory = path.dirname(entry)
      while (true) {
        if (await pathExists(path.join(directory, "package.json"))) {
          return directory
        }
        const parent = path.dirname(directory)
        if (parent === directory) {
          break
        }
        directory = parent
      }
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    `Cannot resolve package ${name} (specifier ${JSON.stringify(specifier)}) from ${resolutionBase}`
  )
}

async function resolvePackageTypesEntry(packageDirectory, manifest, subpath, resolutionBase) {
  const requireFromContext = createRequire(path.join(resolutionBase, "package.json"))
  const requested = subpath ? `./${subpath}` : "."
  if (manifest.exports) {
    const matched = matchExportsEntry(manifest.exports, requested)
    if (matched) {
      let target = resolveTypesCondition(matched.node)
      if (target && matched.captured !== null) {
        target = target.split("*").join(matched.captured)
      }
      if (target) {
        const resolved = await firstExistingDeclaration(typesCandidatesFor(path.join(packageDirectory, target)))
        if (resolved) {
          return resolved
        }
      }
    }
  }
  if (!subpath) {
    for (const field of ["types", "typings", "module", "main"]) {
      const declared = manifest[field]
      if (typeof declared === "string") {
        const resolved = await firstExistingDeclaration(typesCandidatesFor(path.join(packageDirectory, declared)))
        if (resolved) {
          return resolved
        }
      }
    }
  }
  const specifier = subpath ? `${manifest.name}/${subpath}` : manifest.name
  try {
    const resolved = requireFromContext.resolve(specifier)
    const adjacent = await firstExistingDeclaration(typesCandidatesFor(resolved))
    if (adjacent) {
      return adjacent
    }
  } catch {
    // no runtime entry either
  }
  throw new Error(`Cannot resolve types entry for ${manifest.name}${subpath ? `/${subpath}` : ""}`)
}

async function collectDeclarationFiles(directory) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectDeclarationFiles(entryPath)))
    } else if (/\.(?:d\.)?(?:ts|mts|cts)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }
  return files
}

async function run() {
  requireCondition(
    await pathExists(path.join(typesRoot, "index.d.ts")),
    "types/index.d.ts is missing. Run the declaration build steps first."
  )

  const ownFiles = (await collectDeclarationFiles(typesRoot)).filter(
    (file) => !file.startsWith(vendorRoot + path.sep)
  )
  requireCondition(ownFiles.length > 0, "no declaration files found under types/")

  const packageCache = new Map()
  const vendoredEntries = new Map()
  const vendoredPackages = new Map()

  async function loadPackage(name, specifier, resolutionBase) {
    if (packageCache.has(name)) {
      const existing = packageCache.get(name)
      // pnpm may expose the same package name through different peer
      // contexts. Reuse the first resolution unless a conflicting version
      // appears, which would make vendoring ambiguous.
      try {
        const directory = await resolvePackageRoot(name, specifier, resolutionBase)
        if (directory !== existing.directory) {
          const manifest = await readJson(path.join(directory, "package.json"))
          requireCondition(
            manifest.version === existing.manifest.version,
            `Package ${name} resolves to conflicting versions ` +
              `${existing.manifest.version} and ${String(manifest.version)} in different dependency contexts`
          )
        }
      } catch (error) {
        if (!/Cannot resolve package/.test(String(error.message))) {
          throw error
        }
        // Not resolvable from this context; the first resolution stands.
      }
      return existing
    }
    const packageDirectory = await resolvePackageRoot(name, specifier, resolutionBase)
    const manifest = await readJson(path.join(packageDirectory, "package.json"))
    requireCondition(
      manifest.name === name,
      `resolved package name mismatch for ${name}: ${String(manifest.name)}`
    )
    const entry = { directory: packageDirectory, manifest }
    packageCache.set(name, entry)
    return entry
  }

  async function vendor(specifier, resolutionBase) {
    if (vendoredEntries.has(specifier)) {
      return vendoredEntries.get(specifier)
    }
    const { name, subpath } = splitPackageSpecifier(specifier)
    let entry = await loadPackage(name, specifier, resolutionBase)
    let typesEntry
    try {
      typesEntry = await resolvePackageTypesEntry(entry.directory, entry.manifest, subpath, resolutionBase)
    } catch (error) {
      // Packages without their own declarations may resolve types through
      // the DefinitelyTyped fallback (@types/<name>).
      typesEntry = null
      if (!subpath) {
        const mangled = name.startsWith("@")
          ? name.replace(/^@([^/]+)\//, "@types/$1__")
          : `@types/${name}`
        try {
          const typesPackage = await loadPackage(mangled, mangled, resolutionBase)
          typesEntry = await resolvePackageTypesEntry(
            typesPackage.directory,
            typesPackage.manifest,
            "",
            resolutionBase
          )
          entry = typesPackage
        } catch {
          // propagate the original failure below
        }
      }
      if (!typesEntry) {
        throw error
      }
    }
    const relativeToPackage = path.relative(entry.directory, typesEntry)
    requireCondition(
      !relativeToPackage.startsWith(".."),
      `Resolved types entry for ${specifier} escapes its package directory`
    )
    const destination = path.join(vendorRoot, entry.manifest.name, relativeToPackage)
    const record = {
      name: entry.manifest.name,
      specifier,
      typesEntry,
      destination,
      packageDirectory: entry.directory,
    }
    vendoredEntries.set(specifier, record)
    if (!vendoredPackages.has(record.name)) {
      vendoredPackages.set(record.name, {
        name: record.name,
        version: String(entry.manifest.version ?? "unknown"),
        license: typeof entry.manifest.license === "string" ? entry.manifest.license : "UNDECLARED",
        directory: toPosix(path.relative(packageRoot, entry.directory)),
      })
    }
    return record
  }

  // Each work item is a declaration file plus the package context needed to
  // map it into the vendor tree. Own files carry no package context.
  const queue = ownFiles.map((file) => ({ source: file, record: null }))
  const processed = new Set()
  const outputs = []

  while (queue.length > 0) {
    const item = queue.shift()
    const key = `${item.record ? `${item.record.name}:` : ""}${item.source}`
    if (processed.has(key)) {
      continue
    }
    processed.add(key)

    const destination = item.record
      ? path.join(vendorRoot, item.record.name, path.relative(item.record.packageDirectory, item.source))
      : item.source
    let text = await readFile(item.source, "utf8")
    const referenceTypes = findReferenceTypesDirectives(text)

    for (const specifier of extractSpecifiers(text)) {
      if (!isBareSpecifier(specifier)) {
        const base = path.resolve(path.dirname(item.source), specifier)
        const target = await firstExistingDeclaration(typesCandidatesFor(base))
        if (target) {
          if (item.record) {
            requireCondition(
              target.startsWith(item.record.packageDirectory + path.sep),
              `vendored declaration ${item.source} reaches outside its package via ${specifier}`
            )
            queue.push({ source: target, record: item.record })
          } else {
            queue.push({ source: target, record: null })
          }
        }
        continue
      }
      if (isHostRuntimeTypes(specifier)) {
        continue
      }
      if (referenceTypes.has(specifier)) {
        // A reference-types directive cannot be pointed at a vendored path.
        // Stop and report the conflict instead of weakening the boundary.
        throw new Error(
          `${item.source} uses a reference-types directive for ${specifier}. ` +
            "Vendoring cannot rewrite this directive; report the conflict for review."
        )
      }
      const resolutionBase = item.record ? item.record.packageDirectory : packageRoot
      const vendored = await vendor(specifier, resolutionBase)
      const replacement = specifierForDeclaration(vendored.destination, destination)
      text = rewriteBareSpecifier(text, specifier, replacement)
      queue.push({ source: vendored.typesEntry, record: vendored })
    }

    outputs.push({ source: item.source, destination, text })
  }

  for (const output of outputs.sort((left, right) => left.destination.localeCompare(right.destination))) {
    if (output.source === output.destination) {
      await writeFile(output.destination, output.text, "utf8")
    } else {
      await mkdir(path.dirname(output.destination), { recursive: true })
      await writeFile(output.destination, output.text, "utf8")
    }
  }

  const vendorReport = {
    generatedBy: "scripts/bundle-types.mjs",
    packages: [...vendoredPackages.values()].sort((left, right) => left.name.localeCompare(right.name, "en")),
  }
  await mkdir(vendorRoot, { recursive: true })
  await writeFile(
    path.join(vendorRoot, "vendor-packages.json"),
    `${JSON.stringify(vendorReport, null, 2)}\n`,
    "utf8"
  )

  // Final boundary check: no bare third-party module references may remain.
  const allDeclarations = await collectDeclarationFiles(typesRoot)
  const offenders = new Set()
  for (const file of allDeclarations) {
    const text = await readFile(file, "utf8")
    const label = toPosix(path.relative(packageRoot, file))
    for (const specifier of extractSpecifiers(text)) {
      if (isBareSpecifier(specifier) && !isHostRuntimeTypes(specifier)) {
        offenders.add(`${specifier} (via ${label})`)
      }
    }
  }
  requireCondition(
    offenders.size === 0,
    `Third-party module references remain in shipped declarations:\n${[...offenders].sort().join("\n")}`
  )

  const vendoredFileCount = outputs.filter((output) => output.source !== output.destination).length
  console.log(
    `Internalized declarations: rewrote ${ownFiles.length} package declarations and vendored ${vendoredPackages.size} packages (${vendoredFileCount} declaration files)`
  )
}

await run()
