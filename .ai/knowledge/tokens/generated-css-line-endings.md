# 生成的样式表与换行符约束

最后更新：2026-09-18

`packages/tokens/src/style.css` 是**已提交的生成物**，同时又被 `tokens:check` 逐字节比对。这两件事同时成立，产生了一个只会在 CI 上暴露的失效模式。

## 逐字节比对的含义

`packages/tokens/scripts/generate-css.mjs --check` 读取磁盘上的 `src/style.css`，与当场重新生成的字符串做严格相等比较，不相等就报 stale 并让 `tokens:check` 失败。因此该文件同时受两条限制：

- 不能手工编辑：任何手改都会在下一个 `tokens:check` 中被判为 stale。要改它只能改 `src/tokens.ts` / `src/recipes.ts` 并重新生成。
- 换行符必须是生成器写出的那一种（LF）。生成器用 `writeFile(..., "utf8")` 写出，不转换换行。

## 为什么这会在 Windows 上出问题

CI 运行在 `windows-latest` 上，Windows 上的 Git 默认会把文本文件在工作区转成 CRLF。一旦 `src/style.css` 以 CRLF 出现在工作区，Generator 的 LF 输出与磁盘内容就不再相等，`tokens:check` 会以"stale"报告，而本地 `git status` 可能完全看不出差异——看上去文件没有被修改。

仓库用 `.gitattributes` 显式钉死这一点：

```text
/packages/tokens/src/style.css text eol=lf
```

同一份清单还钉住了 `scripts/release-bootstrap/*.mjs`、两个发布工作流、`.release-bootstrap.yaml` 与 `skills/exui-usage/references/generated/*.md`——都是会被逐字节或结构化比对的文本。

## 操作约束

- **新增任何"生成后提交、再逐字节比对"的文件，必须同时在 `.gitattributes` 里加上 `text eol=lf`。** 漏掉这一条不会在本地报错，只会在 Windows CI 上报 stale，而症状看起来像是生成器坏了。
- 看到风格化的 "stale" 报错时，先确认不是换行符问题，再怀疑生成器：直接重新运行生成器并检查 `git diff` 是否为空，可以区分这两种情况。
- `tokens:check` 的顺序是先 `build:js` / `build:cjs` 再 `generate-css --check`，所以比对的是刚构建出的值，不会因为 `dist/` 陈旧而误报。

## 相关

生成流程与校验清单见 `../../architectures/tokens/token-pipeline.md`；缩放取值的决策见 [[tokens/01-rem-scalable-lengths]]。
