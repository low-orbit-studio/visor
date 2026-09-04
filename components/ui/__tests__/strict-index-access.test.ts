import { execFileSync } from "node:child_process"
import path from "node:path"
import { describe, it, expect } from "vitest"

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

const GUARDED_FILES = [
  "components/ui/doc-frame/doc-frame.tsx",
  "components/ui/doc-nav/doc-nav.tsx",
] as const

function typecheckStrictIndex(): string[] {
  let output = ""
  try {
    execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, "node_modules", "typescript", "bin", "tsc"),
        "--noEmit",
        "-p",
        "tsconfig.strict-index.json",
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
    .filter((line) => GUARDED_FILES.some((file) => line.startsWith(file)))
}

describe("checked-index safety (VI-628)", () => {
  it("compiles doc-frame and doc-nav clean under noUncheckedIndexedAccess", () => {
    expect(typecheckStrictIndex()).toEqual([])
  }, 120_000)
})
