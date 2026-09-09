---
"@exre/exui": minor
---

Add a CommonJS entry to the tokens subpath `@exre/exui/tokens` for runtimes that cannot load ESM.

The tokens previously published only an ESM entry, and their `exports` map declared neither a `require` nor a `default` condition. Any CommonJS consumer therefore failed at resolution with `ERR_PACKAGE_PATH_NOT_EXPORTED`, on every Node version. This affected server builds compiled to CommonJS, where theme or token modules are imported at module scope and a resolution failure takes down process startup or request handling rather than degrading gracefully.

The same source now builds twice: ESM into `dist/tokens/` and CommonJS into `dist/tokens/cjs/`. `import` and bundlers continue to resolve the ESM entry; `require()` resolves the CommonJS entry. Both entries export the same deeply frozen token tree, and each module kind binds to declarations of its own kind.

Two release gates cover the new entry. `pnpm tokens:check` compares the CommonJS output against the ESM output and asserts deep freeze. `pnpm verify:pack` requires the CommonJS files in a packed consumer, imports the same subpath as ESM, and asserts both trees are identical, plus a NodeNext `.cts` consumer type-check.

The CommonJS entry is a compatibility entry. It is supported and gated, but it is scheduled for re-evaluation at the next major version once no supported consumer needs it. Downstream release gates that cannot rely on a bundler should verify the entry loads:

```bash
node -e "const { exuiTokens } = require('@exre/exui/tokens'); if (!exuiTokens) process.exit(1)"
```
