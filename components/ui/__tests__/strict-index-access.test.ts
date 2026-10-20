import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"
import { ui, hooks, lib, deck, blocks, visual, devtools } from "../../../registry"

/**
 * VI-628 — checked-index regression gate.
 *
 * The Golden Ticket docs-host scaffold enables `noUncheckedIndexedAccess`, and
 * a scaffolded host type-checks the copy-in components it vendors from this
 * registry. An unguarded `arr[0]` / `match[1]` in a vendored component
 * therefore surfaces as an error in the *consumer's* `next build`, in code the
 * consumer must not edit — so it has to be caught here.
 *
 * `tsconfig.strict-index.json` reproduces that consumer compiler over the
 * affected components. Errors are filtered to the guarded files so an
 * unrelated transitively-imported module cannot redden this gate.
 */

// Vitest's threads pool does not give `import.meta.url` a `file://` URL, so
// anchor on the vitest root (the repo root) instead.
const REPO_ROOT = process.cwd()

// VI-716 — the design-system-deck block is guarded by its whole install set
// (every file `npx visor add --block design-system-deck` writes), computed from
// the registry, so a file newly pulled into the deck is checked automatically.
const GUARDED_INSTALLS = ["design-system-deck"]

const registryItems = [...ui, ...hooks, ...lib, ...deck, ...blocks, ...visual, ...devtools]

function installedFiles(name: string): string[] {
  const files = new Set<string>()
  const seen = new Set<string>()
  const queue = [name]
  while (queue.length > 0) {
    const name = queue.shift()
    const item = registryItems.find((entry) => entry.name === name)
    if (!item || seen.has(item.name)) continue
    seen.add(item.name)
    for (const file of item.files) files.add(file.path)
    queue.push(...(item.registryDependencies ?? []))
  }
  return [...files].filter((file) => /\.tsx?$/.test(file))
}

const GUARDED_FILES = [
  "components/ui/doc-frame/doc-frame.tsx",
  "components/ui/doc-nav/doc-nav.tsx",
  ...GUARDED_INSTALLS.flatMap(installedFiles),
]

function typecheckStrictIndex(): string[] {
  // Same compiler as tsconfig.strict-index.json, over every guarded file. The
  // config must live inside the repo: `types` entries resolve from its folder.
  const dir = path.join(REPO_ROOT, "node_modules", ".cache", "strict-index")
  mkdirSync(dir, { recursive: true })
  const config = path.join(dir, "tsconfig.json")
  writeFileSync(
    config,
    JSON.stringify({
      extends: path.join(REPO_ROOT, "tsconfig.strict-index.json"),
      include: [],
      files: [...GUARDED_FILES, "css-modules.d.ts", "culori.d.ts"].map((file) =>
        path.join(REPO_ROOT, file)
      ),
    })
  )
  let output = ""
  try {
    execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, "node_modules", "typescript", "bin", "tsc"),
        "--noEmit",
        "-p",
        config,
      ],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    )
  } catch (error) {
    // tsc exits non-zero on diagnostics and writes them to stdout.
    const shaped = error as { stdout?: string; stderr?: string }
    output = `${shaped.stdout ?? ""}${shaped.stderr ?? ""}`
  }

  return output
    .split("\n")
    // A config-level error (`error TS…` with no file) means nothing was checked.
    .filter(
      (line) => line.startsWith("error TS") || GUARDED_FILES.some((file) => line.startsWith(file))
    )
}

describe("checked-index safety (VI-628)", () => {
  it("compiles doc-frame, doc-nav and the design-system-deck install clean under noUncheckedIndexedAccess", () => {
    expect(typecheckStrictIndex()).toEqual([])
  }, 120_000)
})
