import assert from "node:assert/strict"
import test from "node:test"
import {
  assertPublishableManifest,
  COMPONENT_PACKAGE_NAME,
  EXUI_REPOSITORY_URL,
  findWorkspaceDependencies,
  OFFICIAL_NPM_REGISTRY,
} from "../package-contract.mjs"

function manifest(name, version = "0.1.0") {
  return {
    name,
    version,
    repository: { type: "git", url: EXUI_REPOSITORY_URL },
    publishConfig: { access: "public", registry: OFFICIAL_NPM_REGISTRY },
    dependencies: name === COMPONENT_PACKAGE_NAME ? { "@fontsource-variable/outfit": "^5.2.8" } : {},
  }
}

function publicManifest() {
  return {
    ...manifest(COMPONENT_PACKAGE_NAME),
    exports: {
      ".": { types: "./types/index.d.ts", import: "./dist/exui.js" },
      "./style.css": { types: "./types/index.css.d.ts", default: "./dist/index.css" },
      "./tokens": {
        import: { types: "./dist/tokens/index.d.ts", default: "./dist/tokens/index.js" },
        require: { types: "./dist/tokens/cjs/index.d.ts", default: "./dist/tokens/cjs/index.js" },
      },
      "./tokens/style.css": { types: "./dist/tokens/style.css.d.ts", default: "./dist/tokens/style.css" },
      "./tokens/font.css": { types: "./dist/tokens/font.css.d.ts", default: "./dist/tokens/font.css" },
    },
    peerDependencies: { react: ">=19.0.0 <20", "react-dom": ">=19.0.0 <20" },
    peerDependenciesMeta: { react: { optional: true }, "react-dom": { optional: true } },
  }
}

test("a valid single-package tarball manifest satisfies the shared contract", () => {
  assert.doesNotThrow(() =>
    assertPublishableManifest(publicManifest(), {
      expectedName: COMPONENT_PACKAGE_NAME,
      expectedVersion: "0.1.0",
    })
  )
})

test("private, mirrored, and mismatched manifests fail closed", () => {
  assert.throws(() => assertPublishableManifest({ ...publicManifest(), private: true }), /private/u)
  assert.throws(
    () =>
      assertPublishableManifest({
        ...publicManifest(),
        publishConfig: { access: "public", registry: "https://example.test/" },
      }),
    /registry/u
  )
  assert.throws(
    () =>
      assertPublishableManifest({
        ...publicManifest(),
        repository: { type: "git", url: "https://example.test/repo.git" },
      }),
    /identify/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...publicManifest(), version: "0.2.0" }, { expectedVersion: "0.1.0" }),
    /expected version/u
  )
})

test("tokens exports, peer, and dependency boundaries are enforced", () => {
  const complete = publicManifest()
  const withoutTokens = { ...complete, exports: { ...complete.exports } }
  delete withoutTokens.exports["./tokens"]
  assert.throws(() => assertPublishableManifest(withoutTokens), /must expose \.\/tokens/u)
  assert.throws(
    () =>
      assertPublishableManifest({
        ...complete,
        exports: { ...complete.exports, "./tokens": "./dist/tokens/index.js" },
      }),
    /must expose \.\/tokens/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...complete, dependencies: { "@exre/exui-tokens": "0.1.0" } }),
    /private tokens workspace/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...complete, peerDependencies: { ...complete.peerDependencies, "@exre/exui-tokens": "*" } }),
    /private tokens workspace/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...complete, peerDependenciesMeta: {} }),
    /optional/u
  )
  assert.throws(
    () => assertPublishableManifest({ ...complete, peerDependencies: { react: "^19", "react-dom": ">=19.0.0 <20" } }),
    /peer contract/u
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
