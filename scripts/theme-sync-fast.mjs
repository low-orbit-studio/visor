#!/usr/bin/env node
/**
 * theme-sync-fast.mjs
 *
 * Fast variant of `theme:sync` for warm dev caches. Rebuilds
 * `packages/theme-engine/` and `packages/cli/` when their `dist/` is missing or
 * stale relative to `src/`; otherwise skips straight to running the CLI. This
 * avoids the silent-drift trap where stale dist artifacts cause the sync to
 * produce different output from the canonical `npm run theme:sync` (the
 * scenario that broke the byte-for-byte parity test in VI-343).
 *
 * Invokes the workspace CLI directly via `node packages/cli/dist/index.js` so
 * the script does not depend on `node_modules/.bin/visor` — that symlink is
 * only created by `npm install` after `dist/` exists, so a fresh-clone start
 * cannot rely on it.
 */
import { existsSync, statSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const cliDist = resolve(repoRoot, "packages/cli/dist/index.js");
const engineDist = resolve(repoRoot, "packages/theme-engine/dist/index.js");
const cliSrc = resolve(repoRoot, "packages/cli/src");
const engineSrc = resolve(repoRoot, "packages/theme-engine/src");

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

function latestMtimeMs(dir) {
  let latest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      latest = Math.max(latest, latestMtimeMs(full));
    } else if (entry.isFile()) {
      latest = Math.max(latest, statSync(full).mtimeMs);
    }
  }
  return latest;
}

function isStale(distPath, srcDir) {
  if (!existsSync(distPath)) return true;
  return latestMtimeMs(srcDir) > statSync(distPath).mtimeMs;
}

const engineStale = isStale(engineDist, engineSrc);
const cliStale = isStale(cliDist, cliSrc);

if (engineStale) {
  console.log("[theme-sync-fast] theme-engine src newer than dist — rebuilding");
  run("npm", ["run", "build", "-w", "packages/theme-engine"]);
}
if (cliStale) {
  console.log("[theme-sync-fast] cli src newer than dist — rebuilding");
  run("npm", ["run", "build", "-w", "packages/cli"]);
}

run("node", [cliDist, "theme", "sync"]);
