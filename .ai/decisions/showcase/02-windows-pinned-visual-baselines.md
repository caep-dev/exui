# 视觉基线与 Windows 运行平台绑定并提交进仓库

最后更新：2026-09-18

状态：已接受
模块：showcase
日期：2026-09-18
来源：`.github/workflows/ci.yml`、`TESTING.md`、`packages/showcase/src/showcase/__screenshots__/`

背景：Chromium 的文本栅格化结果与操作系统相关，同一份用例在不同平台上会产生像素级差异。仓库同时使用两类断言：跨平台稳定的计算样式与几何断言，以及 `toMatchScreenshot` 的截图比对。截图比对必须有一个确定的参考点，否则门禁会随运行环境抖动。

决策：截图基线只以 `chromium-win32` 采集并提交进版本控制，CI 的视觉测试固定运行在 `windows-latest` 上，并在工作流中写明该对齐是有意为之。基线文件保持为受跟踪的源文件，不作为构建产物忽略。需要覆盖渲染结果且计算样式无法穷举的场景才使用截图，其余一律用计算样式与几何断言。

理由：把运行平台与基线平台绑定，是让截图比对稳定下来的最低成本做法；反之若基线追求跨平台通用，门禁会因平台差异频繁红掉，最终只能被绕过。把基线提交进仓库，渲染层面的变化会在 PR 上以图片 diff 的形式暴露，评审可以在合并前看到；不提交则变化只能靠人工比对发现。曾尝试停止跟踪基线并随后回退，说明该路径不可行。

影响：在 macOS 或 Linux 上本地运行视觉测试无法复用这些基线，需要自行采集，因此本地结果不能替代 CI 结论。Windows runner 成本较高。任何影响渲染的改动（主题取值、间距、字体、圆角）都需要提交新的 PNG，评审必须查看图片差异。基线缺失或平台不匹配会让门禁失败，没有"首次运行即通过"的路径。

重新审视条件：切换到跨平台一致的渲染方案（例如固定字体与渲染后端的容器化浏览器）时；或截图比对被计算样式断言完全取代时。

证据：`ci.yml` 中 `runs-on: windows-latest` 及其上方的注释（"Visual baselines are intentionally captured on Windows … Chromium text rasterization is platform-specific"）；`TESTING.md` 的 Visual tests 段（基线按平台区分，CI 在 Windows 上运行）；`packages/showcase/src/showcase/__screenshots__/ComponentRecipeContract.vrt.test.tsx/` 下全部 24 个文件均以 `-chromium-win32.png` 结尾，不存在其他平台变体；`ComponentRecipeContract.vrt.test.tsx` 中四处 `toMatchScreenshot` 调用；git 历史中"停止跟踪视觉截图基线"之后紧接"恢复已提交的视觉基线"的提交序列；`RemSizing.vrt.test.tsx` 明确不记录截图以免增加平台基线。
