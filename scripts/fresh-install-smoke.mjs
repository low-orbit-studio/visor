#!/usr/bin/env node
/**
 * Fresh-install smoke (VI-751): `visor add` the given items into an empty
 * project with the locally built CLI, let it install their npm dependencies
 * from the live registry, then type-check the result.
 *
 * Catches the failure mode where an unpinned registry dependency resolves to a
 * new major the component was not written for (data-table vs
 * @tanstack/react-table v9). The repo's own lockfile can't see that drift.
 *
 * Usage: node scripts/fresh-install-smoke.mjs <item> [item...]
 * Requires: packages/cli built (`npm run build -w packages/cli`).
 */

import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import path from "node:path"

const items = process.argv.slice(2)
if (items.length === 0) {
  console.error("usage: node scripts/fresh-install-smoke.mjs <item> [item...]")
  process.exit(2)
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CLI = path.join(REPO_ROOT, "packages/cli/dist/index.js")
const dir = mkdtempSync(path.join(tmpdir(), "visor-fresh-install-"))

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`)
  const result = spawnSync(cmd, args, { cwd: dir, stdio: "inherit" })
  if (result.status !== 0) throw new Error(`failed at: ${cmd} ${args.join(" ")}`)
}

try {
  writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "visor-fresh-install", private: true }, null, 2)
  )
  writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          module: "esnext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          esModuleInterop: true,
        },
        include: ["**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      },
      null,
      2
    )
  )
  // Next.js supplies this ambient type in a real app.
  writeFileSync(
    path.join(dir, "css-modules.d.ts"),
    'declare module "*.module.css" {\n  const classes: Record<string, string>\n  export default classes\n}\n'
  )

  // The app foundation every consumer already has (registry peer-dep convention).
  run("npm", [
    "install", "--no-audit", "--no-fund",
    "react@^19", "react-dom@^19", "@types/react@^19", "@types/react-dom@^19", "@types/node", "typescript@^5",
  ])
  run("node", [CLI, "add", ...items])
  run("npx", ["--no-install", "tsc", "-p", "."])
  console.log(`\nfresh-install smoke passed: ${items.join(", ")}`)
} catch (err) {
  console.error(`\nfresh-install smoke ${err.message}`)
  process.exitCode = 1
} finally {
  rmSync(dir, { recursive: true, force: true })
}
