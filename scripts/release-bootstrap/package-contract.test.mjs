import assert from "node:assert/strict"
import test from "node:test"
import {
  assertPublishableManifest,
  COMPONENT_PACKAGE_NAME,
  EXUI_REPOSITORY_URL,
  findWorkspaceDependencies,
  OFFICIAL_NPM_REGISTRY,
  TOKEN_PACKAGE_NAME,
} from "../package-contract.mjs"

function manifest(name, version = "0.1.0") {
  return {
    name,
    version,
    repository: { type: "git", url: EXUI_REPOSITORY_URL },
    publishConfig: { access: "public", registry: OFFICIAL_NPM_REGISTRY },
    dependencies: name === COMPONENT_PACKAGE_NAME ? { [TOKEN_PACKAGE_NAME]: "0.1.0" } : {},
  }
}

test("valid public tarball manifests satisfy the shared contract", () => {
  assert.doesNotThrow(() =>
    assertPublishableManifest(manifest(TOKEN_PACKAGE_NAME), {
      expectedName: TOKEN_PACKAGE_NAME,
      expectedVersion: "0.1.0",
    })
  )
  assert.doesNotThrow(() =>
    assertPublishableManifest(manifest(COMPONENT_PACKAGE_NAME), {
      expectedName: COMPONENT_PACKAGE_NAME,
      expectedVersion: "0.1.0",
      tokenVersion: "0.1.0",
    })
  )
})

test("private, mirrored, mismatched, and workspace manifests fail closed", () => {
  assert.throws(() => assertPublishableManifest({ ...manifest(TOKEN_PACKAGE_NAME), private: true }), /private/u)
  assert.throws(
    () => assertPublishableManifest({ ...manifest(TOKEN_PACKAGE_NAME), publishConfig: { access: "public", registry: "https://example.test/" } }),
    /registry/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...manifest(TOKEN_PACKAGE_NAME), repository: { type: "git", url: "https://example.test/repo.git" } }),
    /identify/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...manifest(COMPONENT_PACKAGE_NAME), dependencies: { [TOKEN_PACKAGE_NAME]: "workspace:*" } }, { tokenVersion: "0.1.0" }),
    /workspace/u
  )
  assert.throws(
    () => assertPublishableManifest(manifest(COMPONENT_PACKAGE_NAME), { tokenVersion: "0.2.0" }),
    /must depend/u
  )
})

test("workspace dependency detection covers every publishable dependency field", () => {
  assert.deepEqual(
    findWorkspaceDependencies({
      dependencies: { a: "workspace:*" },
      devDependencies: { b: "workspace:^" },
      optionalDependencies: { c: "workspace:~" },
      peerDependencies: { d: "workspace:1.0.0" },
    }),
    ["dependencies.a", "devDependencies.b", "optionalDependencies.c", "peerDependencies.d"]
  )
})
