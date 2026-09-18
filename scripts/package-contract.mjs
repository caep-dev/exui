export const OFFICIAL_NPM_REGISTRY = "https://registry.npmjs.org/"
export const EXUI_REPOSITORY_URL = "https://github.com/caep-dev/exui.git"
export const TOKEN_PACKAGE_NAME = "@exre/exui-tokens"
export const COMPONENT_PACKAGE_NAME = "@exre/exui"
export const PUBLIC_PACKAGE_NAMES = Object.freeze([COMPONENT_PACKAGE_NAME])

// Dependency fields that end up in a consumer's production dependency graph.
// devDependencies never install for consumers, so the internal tokens
// workspace link may stay there after the packer converts the protocol.
const PRODUCTION_DEPENDENCY_FIELDS = ["dependencies", "optionalDependencies", "peerDependencies"]
const ALL_DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function findWorkspaceDependencies(manifest, fields = ALL_DEPENDENCY_FIELDS) {
  const matches = []

  for (const field of fields) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (String(version).startsWith("workspace:")) {
        matches.push(`${field}.${name}`)
      }
    }
  }

  return matches
}

function requireExportsEntry(manifest, entry, expected) {
  const exported = manifest.exports?.[entry]
  requireCondition(
    exported !== undefined && JSON.stringify(exported) === JSON.stringify(expected),
    `${manifest.name} must expose ${entry} as ${JSON.stringify(expected)}, received ${JSON.stringify(exported)}`
  )
}

export function assertPublishableManifest(manifest, { expectedName, expectedVersion } = {}) {
  requireCondition(manifest && typeof manifest === "object", "packed manifest must be an object")
  requireCondition(
    PUBLIC_PACKAGE_NAMES.includes(manifest.name),
    `unexpected public package name: ${manifest.name ?? "<missing>"}`
  )

  if (expectedName !== undefined) {
    requireCondition(manifest.name === expectedName, `expected ${expectedName}, received ${manifest.name}`)
  }

  if (expectedVersion !== undefined) {
    requireCondition(
      manifest.version === expectedVersion,
      `${manifest.name} expected version ${expectedVersion}, received ${manifest.version}`
    )
  }

  requireCondition(manifest.private !== true, `${manifest.name} must not be private`)
  requireCondition(
    manifest.repository?.type === "git" && manifest.repository?.url === EXUI_REPOSITORY_URL,
    `${manifest.name} must identify ${EXUI_REPOSITORY_URL}`
  )
  requireCondition(
    manifest.publishConfig?.access === "public",
    `${manifest.name} publishConfig.access must be public`
  )
  requireCondition(
    manifest.publishConfig?.registry === OFFICIAL_NPM_REGISTRY,
    `${manifest.name} publishConfig.registry must be ${OFFICIAL_NPM_REGISTRY}`
  )

  const workspaceDependencies = findWorkspaceDependencies(manifest)
  requireCondition(
    workspaceDependencies.length === 0,
    `${manifest.name} contains workspace dependencies: ${workspaceDependencies.join(", ")}`
  )

  if (manifest.name !== COMPONENT_PACKAGE_NAME) {
    return manifest
  }

  // The single public package owns the tokens subpaths and the optional
  // React host peers. The internal tokens workspace must never leak into a
  // consumer's production dependency graph.
  for (const field of PRODUCTION_DEPENDENCY_FIELDS) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      requireCondition(
        name !== TOKEN_PACKAGE_NAME,
        `${COMPONENT_PACKAGE_NAME} ${field} must not reference the private tokens workspace`
      )
    }
  }

  requireExportsEntry(manifest, ".", {
    types: "./types/index.d.ts",
    import: "./dist/exui.js",
  })
  requireExportsEntry(manifest, "./style.css", {
    types: "./types/index.css.d.ts",
    default: "./dist/index.css",
  })
  requireExportsEntry(manifest, "./tokens", {
    import: {
      types: "./dist/tokens/index.d.ts",
      default: "./dist/tokens/index.js",
    },
    require: {
      types: "./dist/tokens/cjs/index.d.ts",
      default: "./dist/tokens/cjs/index.js",
    },
  })
  requireExportsEntry(manifest, "./tokens/style.css", {
    types: "./dist/tokens/style.css.d.ts",
    default: "./dist/tokens/style.css",
  })
  requireExportsEntry(manifest, "./tokens/font.css", {
    types: "./dist/tokens/font.css.d.ts",
    default: "./dist/tokens/font.css",
  })
  requireExportsEntry(manifest, "./docs/theme.css", {
    types: "./types/docs/theme.css.d.ts",
    default: "./dist/docs/theme.css",
  })

  requireCondition(
    manifest.peerDependencies?.react === ">=19.0.0 <20" &&
      manifest.peerDependencies?.["react-dom"] === ">=19.0.0 <20",
    `${COMPONENT_PACKAGE_NAME} changed the React peer contract`
  )
  requireCondition(
    manifest.peerDependenciesMeta?.react?.optional === true &&
      manifest.peerDependenciesMeta?.["react-dom"]?.optional === true,
    `${COMPONENT_PACKAGE_NAME} React peers must stay optional`
  )

  // The docs theme sheet is a theme contract for a Fumadocs UI installation
  // the consumer owns, not a wrapper around it. The package therefore names
  // Fumadocs in no dependency field at all: npm and pnpm would otherwise pull
  // the Fumadocs tree, and its React implementation libraries, into every
  // consumer's production graph — including the tokens-only tree that must
  // stay free of React.
  //
  // The compatible range is not declared in the manifest. It is pinned by the
  // docs theme fixture in scripts/verify-packages.mjs and stated in the
  // package README instead.
  for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    requireCondition(
      manifest[field]?.["fumadocs-ui"] === undefined,
      `${COMPONENT_PACKAGE_NAME} ${field} must not add fumadocs-ui to a consumer dependency graph`
    )
  }

  return manifest
}
