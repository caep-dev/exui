import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { relative, resolve } from "node:path";

const root = process.cwd();
const pnpmPath = process.env.npm_execpath;

if (!pnpmPath) {
  throw new Error("Run this command through pnpm: pnpm watch");
}

const targets = {
  tokens: false,
  components: false,
};

let building = false;
let debounceTimer;

function runPnpm(args) {
  return new Promise((resolveBuild, rejectBuild) => {
    const child = spawn(process.execPath, [pnpmPath, ...args], {
      cwd: root,
      stdio: "inherit",
    });

    child.on("error", rejectBuild);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolveBuild();
        return;
      }

      rejectBuild(new Error(`pnpm ${args.join(" ")} exited with ${signal ?? code}`));
    });
  });
}

async function buildPendingTargets() {
  if (building || (!targets.tokens && !targets.components)) {
    return;
  }

  building = true;
  const shouldBuildTokens = targets.tokens;
  const shouldBuildComponents = targets.components;
  targets.tokens = false;
  targets.components = false;

  try {
    if (shouldBuildTokens) {
      await runPnpm(["--filter", "@exre/exui-tokens", "build"]);
    }

    if (shouldBuildComponents) {
      await runPnpm(["--filter", "@exre/exui", "build"]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    building = false;
    if (targets.tokens || targets.components) {
      void buildPendingTargets();
    }
  }
}

function scheduleBuild(target) {
  targets[target] = true;
  if (target === "tokens") {
    targets.components = true;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void buildPendingTargets();
  }, 150);
}

function watchDirectory(directory, target, shouldIgnore = () => false) {
  const absoluteDirectory = resolve(root, directory);
  watch(absoluteDirectory, { recursive: true }, (_eventType, filename) => {
    const changedPath = filename && relative(absoluteDirectory, filename);
    if (!shouldIgnore(changedPath)) {
      scheduleBuild(target);
    }
  });
}

watchDirectory("packages/tokens/src", "tokens", (path) => path === "style.css");
watchDirectory("packages/tokens/scripts", "tokens");
watchDirectory("packages/components/src", "components");
watchDirectory("packages/components/scripts", "components");

console.log("Watching Token and component sources for rebuilds. Press Ctrl+C to stop.");
scheduleBuild("tokens");
