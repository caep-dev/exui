import { readFile, readdir, stat, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const requireFromPackage = createRequire(path.join(packageRoot, "package.json"))
const bundledModulesReport = path.join(packageRoot, "dist", "bundled-modules.json")
const vendoredPackagesReport = path.join(packageRoot, "types", "vendor", "vendor-packages.json")
const noticesTarget = path.join(packageRoot, "dist", "third-party-notices.md")

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"))
}

// Locates the license text actually shipped with the installed package
// rather than reconstructing it from SPDX identifiers.
async function findLicenseFile(packageDirectory) {
  const preferred = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "COPYING.md", "COPYING.txt"]
  const entries = await readdir(packageDirectory)
  const lowerCased = new Map(entries.map((name) => [name.toLowerCase(), name]))
  for (const candidate of [...preferred, ...preferred.map((name) => name.toLowerCase())]) {
    const actual = lowerCased.get(candidate.toLowerCase())
    if (!actual) {
      continue
    }
    const filePath = path.join(packageDirectory, actual)
    const info = await stat(filePath)
    if (info.isFile()) {
      return filePath
    }
  }
  return null
}

async function resolvePackageDirectory(name, version, recordedDirectory) {
  // The build reports carry the resolved install location for every package
  // that was actually bundled or vendored; prefer them because transitive
  // packages are not resolvable from this package's context under pnpm
  // isolation.
  if (recordedDirectory) {
    const candidate = path.resolve(packageRoot, recordedDirectory)
    try {
      const parsed = JSON.parse(await readFile(path.join(candidate, "package.json"), "utf8"))
      if (parsed.name === name && String(parsed.version) === String(version)) {
        return candidate
      }
    } catch {
      // fall through to the resolution strategies below
    }
  }
  for (const candidate of [`${name}/package.json`, name]) {
    try {
      return path.dirname(requireFromPackage.resolve(candidate))
    } catch {
      // try the next candidate
    }
  }
  // Locate transitive packages through the content-addressed store.
  const storeDirectory = path.resolve(packageRoot, "..", "..", "node_modules", ".pnpm")
  const entries = await readdir(storeDirectory, { withFileTypes: true }).catch(() => [])
  const storeKey = `${name.replace(/\//g, "+")}@${version}`
  const hashedPrefix = `${name.replace(/\//g, "+")}`
  const candidates = []
  for (const entry of entries) {
    // Store keys are usually "<name>@<version>[_peer-suffix]", but pnpm may
    // replace long peer suffixes with a hash on Windows.
    if (entry.isDirectory() && (entry.name.startsWith(storeKey) || entry.name.startsWith(hashedPrefix))) {
      candidates.push(path.join(storeDirectory, entry.name, "node_modules", name))
    }
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(await readFile(path.join(candidate, "package.json"), "utf8"))
      if (parsed.name === name && String(parsed.version) === String(version)) {
        return candidate
      }
    } catch {
      // not a match; keep scanning
    }
  }
  throw new Error(`Cannot resolve installed package ${name}@${version} for license discovery`)
}

function renderSection(entry) {
  const lines = [
    `## ${entry.name} ${entry.version}`,
    "",
    `Included as: ${entry.origin}`,
    "",
    `Declared license: ${entry.license}`,
  ]
  if (entry.licenseText) {
    lines.push("", "```text", entry.licenseText.trimEnd(), "```")
  } else {
    lines.push("", "No license text file was present in the installed package; only the declared license identifier is recorded.")
  }
  lines.push("")
  return lines.join("\n")
}

async function run() {
  const bundled = await readJson(bundledModulesReport)
  requireCondition(Array.isArray(bundled.packages), "dist/bundled-modules.json has no packages array")
  const vendored = await readJson(vendoredPackagesReport)
  requireCondition(Array.isArray(vendored.packages), "types/vendor/vendor-packages.json has no packages array")

  // The same package name may legitimately appear at different versions when
  // different bundled libraries depend on different releases; each resolved
  // version is reported separately.
  const packages = new Map()
  for (const [source, list] of [
    ["bundled JavaScript", bundled.packages],
    ["vendored declarations", vendored.packages],
  ]) {
    for (const entry of list) {
      const key = `${entry.name}@${entry.version}`
      if (!packages.has(key)) {
        packages.set(key, {
          name: entry.name,
          version: entry.version,
          license: entry.license ?? "UNDECLARED",
          directory: entry.directory ?? null,
          origins: new Set(),
        })
      }
      packages.get(key).origins.add(source)
    }
  }

  const sections = []
  for (const key of [...packages.keys()].sort((left, right) => left.localeCompare(right, "en"))) {
    const record = packages.get(key)
    const directory = await resolvePackageDirectory(record.name, record.version, record.directory)
    const licenseFile = await findLicenseFile(directory)
    const licenseText = licenseFile ? await readFile(licenseFile, "utf8") : null
    sections.push(
      renderSection({
        name: record.name,
        version: record.version,
        license: record.license,
        licenseText,
        origin: [...record.origins].sort().join(", "),
      })
    )
  }

  const header = [
    "# Third-party notices",
    "",
    "This file is generated by scripts/generate-notices.mjs at build time. Do not edit by hand.",
    "",
    "The ExUI package bundles compiled code and declaration files from the",
    "third-party packages listed below. Versions are the actually resolved",
    "build inputs, not the declared dependency ranges. React and React DOM",
    "remain external peer dependencies and are not bundled.",
    "",
  ].join("\n")

  await writeFile(noticesTarget, `${header}${sections.join("\n")}`, "utf8")
  console.log(`Generated third-party notices for ${packages.size} packages`)
}

await run()
