# Token 提供 CommonJS 兼容入口

最后更新：2026-09-18

状态：已接受
模块：tokens
日期：2026-08-28
来源：`packages/tokens/tsconfig.cjs.json`、`packages/tokens/scripts/write-cjs-package.mjs`、`packages/tokens/scripts/verify-cjs.mjs`

背景：Token 的消费者既有打包器，也有被编译成 CommonJS 的服务端构建，后者无法加载 ESM 入口。同时 Token 必须保持框架中立：任何为兼容性付出的代价都不能引入 React 或运行时依赖。

决策：从同一份源码额外生成一套 CommonJS 产物到 `dist/cjs`，并在该目录写入 `{ "type": "commonjs" }` 标记，使 NodeNext 的 `require` 条件解析到 CommonJS 目录及其对应种类的声明。公共包 `@exre/exui/tokens` 同时声明 `import` 与 `require` 两个条件，各自绑定 ESM 或 CJS 的类型入口；`tsconfig.cjs.json` 与 ESM 侧共享源码，不复制实现。

理由：条件导出让每条模块系统的路径都解析到模块种类一致的 JavaScript 与声明，避免"运行时按 CommonJS 加载、类型却按 ESM 解析"的错配。CommonJS 入口只增加一层编译输出，不引入任何运行时依赖，而且可以和 ESM 入口接受同样的冻结与逐值相等断言。

影响：`tokens:check` 与打包消费者门禁都必须在两种模块系统下验证逐值相等、深度冻结以及键名集合完整，构建与验证成本增加。该入口的定位是兼容层，需要在下一个主版本重新评估其必要性。`dist/cjs` 的 `type` 标记是让解析正确的前提，清理或复制产物时必须保留。

重新审视条件：确认不再有受支持的消费者需要 CommonJS 入口时，在下一次主版本移除。

证据：`packages/tokens/package.json` 的 `main` / `module` / `exports` 双条件；`scripts/write-cjs-package.mjs` 写入的目录标记；`verify-cjs.mjs` 的 require/import 等值断言、深度冻结断言，以及"防止产物为空或截断被两边都空掩盖"的键名集合断言；`scripts/package-contract.mjs` 的 `requireExportsEntry` 对两个条件目标路径的精确锁定；`scripts/verify-packages.mjs` 中 `.cts` 消费者使用 `import = require` 并以 `tsc --listFiles` 断言加载了 `dist/tokens/cjs/index.d.ts`；`packages/tokens/README.md` 的 Module formats 段。
