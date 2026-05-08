#!/usr/bin/env node
/**
 * theme-sync-fast.mjs
 *
 * Fast variant of `theme:sync` for warm dev caches. Skips the package rebuild
 * step when both `packages/cli/dist/` and `packages/theme-engine/dist/` exist;
 * falls back to a full build + sync when either is missing (cold clone, fresh
 * `git clean`, etc.).
 *
 * Invokes the workspace CLI directly via `node packages/cli/dist/index.js` so
 * the script does not depend on `node_modules/.bin/visor` — that symlink is
 * only created by `npm install` after `dist/` exists, so a fresh-clone start
 * cannot rely on it.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const cliDist = resolve(repoRoot, "packages/cli/dist/index.js");
const engineDist = resolve(repoRoot, "packages/theme-engine/dist/index.js");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: repoRoot,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const distMissing = !existsSync(cliDist) || !existsSync(engineDist);

if (distMissing) {
  console.log(
    "[theme-sync-fast] cold cache — building theme-engine and cli before sync",
  );
  run("npm", ["run", "build", "-w", "packages/theme-engine"]);
  run("npm", ["run", "build", "-w", "packages/cli"]);
}

run("node", [cliDist, "theme", "sync"]);
