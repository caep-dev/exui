# 源码监听与生成物循环

最后更新：2026-10-05

根目录的 `pnpm watch` 监听 Token 与组件源码，并按依赖顺序构建。Token 构建会写回被监听目录内的生成 CSS，因此该文件的监听事件必须被忽略，否则构建本身会持续排队下一轮构建。

Windows `fs.watch` 的 `filename` 是相对被监听目录的路径，不能把它当成绝对路径传入 `path.relative`。路径忽略条件需要与回调的相对路径语义一致。

回归测试在临时工作区使用真实监听进程和替代构建程序：替代程序保留生成 CSS 写入这一副作用，先证明初始构建不自激，再证明一次源修改只新增一轮 Token 与组件构建。此证据验证监听与排队行为，不代替真实工作区的完整构建门禁。

证据：`scripts/watch.mjs`、`packages/tokens/scripts/generate-css.mjs`、`scripts/watch.test.mjs`。测试命令见根 `TESTING.md`。
