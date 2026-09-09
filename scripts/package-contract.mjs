export const OFFICIAL_NPM_REGISTRY = "https://registry.npmjs.org/"
export const EXUI_REPOSITORY_URL = "https://github.com/caep-dev/exui.git"
export const TOKEN_PACKAGE_NAME = "@exre/exui-tokens"
export const COMPONENT_PACKAGE_NAME = "@exre/exui"
export const PUBLIC_PACKAGE_NAMES = Object.freeze([
  TOKEN_PACKAGE_NAME,
  COMPONENT_PACKAGE_NAME,
])

const DEPENDENCY_FIELDS = [
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

export function findWorkspaceDependencies(manifest) {
  const matches = []

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (String(version).startsWith("workspace:")) {
        matches.push(`${field}.${name}`)
      }
    }
  }

  return matches
}

export function assertPublishableManifest(
  manifest,
  { expectedName, expectedVersion, tokenVersion } = {}
) {
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

  if (manifest.name === COMPONENT_PACKAGE_NAME && tokenVersion !== undefined) {
    requireCondition(
      manifest.dependencies?.[TOKEN_PACKAGE_NAME] === tokenVersion,
      `${COMPONENT_PACKAGE_NAME} must depend on ${TOKEN_PACKAGE_NAME}@${tokenVersion}`
    )
  }

  return manifest
}
