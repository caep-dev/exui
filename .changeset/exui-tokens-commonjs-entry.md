---
"@exre/exui-tokens": minor
---

Add a CommonJS entry to `@exre/exui-tokens` for runtimes that cannot load ESM.

The package previously published only an ESM entry, and its `exports` map declared neither a `require` nor a `default` condition. Any CommonJS consumer therefore failed at resolution with `ERR_PACKAGE_PATH_NOT_EXPORTED`, on every Node version. This affected server builds compiled to CommonJS, where theme or token modules are imported at module scope and a resolution failure takes down process startup or request handling rather than degrading gracefully.

The same source now builds twice: ESM into `dist/` and CommonJS into `dist/cjs/`. `import` and bundlers continue to resolve the ESM entry; `require()` resolves the CommonJS entry. Both entries export the same deeply frozen token tree and share a single declaration file.

`main` now points at the CommonJS entry so legacy resolvers that ignore `exports` receive a loadable file. `module` still points at the ESM entry.

Two release gates cover the new entry. `pnpm tokens:check` compares the CommonJS output against the ESM output and asserts deep freeze. `pnpm verify:pack` requires the CommonJS files in a packed consumer, imports the same package as ESM, and asserts both trees are identical.

The CommonJS entry is a compatibility entry. It is supported and gated, but it is scheduled for re-evaluation at the next major version once no supported consumer needs it. Downstream release gates that cannot rely on a bundler should verify the entry loads:

```bash
node -e "const { exuiTokens } = require('@exre/exui-tokens'); if (!exuiTokens) process.exit(1)"
```
