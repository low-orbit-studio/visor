/**
 * VI-631 — exit-code plumbing for the `visor check` subcommands.
 *
 * These tests drive the real Commander tree (not the action functions directly),
 * because the defect they guard lives in the *mapping* Commander performs:
 * `--no-fail` is a negatable boolean, so it sets `fail: false` and never sets
 * `noFail`. Reading `options.noFail` therefore made `--no-fail` a silent no-op
 * on `check design` — advisory mode was unreachable and the exit-1 always fired.
 *
 * A unit test that calls the action with `{ fail: false }` would not have caught
 * it; only parsing the flag the way a shell does does.
 */
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest"
import { join } from "path"
import { mkdirSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { checkCommand } from "../src/commands/check.js"

const FIXTURES = join(import.meta.dirname, "fixtures")
const SEEDED = join(FIXTURES, "design/composition-seeded")
const BLESSED = join(FIXTURES, "design/composition-blessed")
const TAXONOMY = join(FIXTURES, "taxonomy/taxonomy.json")
const THEME_MISMATCH = join(FIXTURES, "theme-mode/dark-only-light.visor.yaml")
const THEME_MATCH = join(FIXTURES, "theme-mode/dark-only-dark.visor.yaml")

interface Run {
  exitCode: number
  stdout: string
  stderr: string
}

/**
 * Parse `argv` through the real `check` command tree and capture the exit code.
 *
 * Both exit channels are observed: `process.exit()` (human paths) and
 * `process.exitCode` (JSON paths, which must not truncate a piped payload).
 */
async function run(argv: string[]): Promise<Run> {
  const stdout: string[] = []
  const stderr: string[] = []
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdout.push(args.join(" "))
  })
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    stderr.push(args.join(" "))
  })

  const previousExitCode = process.exitCode
  process.exitCode = undefined

  let exited: number | undefined
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    exited = code ?? 0
    throw new Error(`__visor_exit__${exited}`)
  }) as never)

  try {
    await checkCommand().parseAsync(argv, { from: "user" })
  } catch (err) {
    if (!(err instanceof Error) || !err.message.startsWith("__visor_exit__")) throw err
  }

  const settled = typeof process.exitCode === "number" ? process.exitCode : 0
  process.exitCode = previousExitCode
  vi.restoreAllMocks()

  return { exitCode: exited ?? settled, stdout: stdout.join("\n"), stderr: stderr.join("\n") }
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── check design — the --no-fail regression ─────────────────────────────────

describe("check design — --no-fail suppresses the exit code (human output)", () => {
  it("exits 1 on errors without --no-fail", async () => {
    const { exitCode } = await run(["design", SEEDED, "--taxonomy", TAXONOMY])
    expect(exitCode).toBe(1)
  })

  it("exits 0 on the same errors with --no-fail", async () => {
    const { exitCode } = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--no-fail"])
    expect(exitCode).toBe(0)
  })

  it("still reports the findings — --no-fail is advisory, not silent", async () => {
    const { stdout, stderr } = await run([
      "design", SEEDED, "--taxonomy", TAXONOMY, "--no-fail",
    ])
    const output = `${stdout}\n${stderr}`
    expect(output).toContain("hardcoded-hex")
    expect(output).toContain("inline-style-object")
    expect(output).toContain("kit-element-redeclared")
    expect(output).toMatch(/[1-9]\d* error\(s\), \d+ warning\(s\)/)
  })

  it("prints byte-identical findings with and without --no-fail", async () => {
    const failing = await run(["design", SEEDED, "--taxonomy", TAXONOMY])
    const advisory = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--no-fail"])
    expect(advisory.stdout).toBe(failing.stdout)
    expect(advisory.stderr).toBe(failing.stderr)
  })
})

describe("check design — --no-fail suppresses the exit code (JSON output)", () => {
  it("sets exitCode 1 on errors without --no-fail", async () => {
    const { exitCode } = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--json"])
    expect(exitCode).toBe(1)
  })

  it("leaves exitCode 0 with --no-fail", async () => {
    const { exitCode } = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--json", "--no-fail"])
    expect(exitCode).toBe(0)
  })

  it("emits the same findings payload either way", async () => {
    const failing = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--json"])
    const advisory = await run(["design", SEEDED, "--taxonomy", TAXONOMY, "--json", "--no-fail"])
    expect(advisory.stdout).toBe(failing.stdout)
    expect(JSON.parse(advisory.stdout).summary.errorCount).toBeGreaterThan(0)
  })
})

describe("check design — the rest of the exit-code table is unchanged", () => {
  it("exits 0 on the blessed fixture with an asserted taxonomy", async () => {
    const { exitCode } = await run(["design", BLESSED, "--taxonomy", TAXONOMY, "--composition"])
    expect(exitCode).toBe(0)
  })

  it("exits 0 with no flags — legacy invocations do not newly fail", async () => {
    const { exitCode } = await run(["design", BLESSED])
    expect(exitCode).toBe(0)
  })

  it("fails closed when --composition is requested and no taxonomy resolves", async () => {
    const { exitCode } = await run(["design", BLESSED, "--composition"])
    expect(exitCode).toBe(1)
  })

  it("--no-fail also downgrades the fail-closed exit, so a pilot can adopt it advisory-first", async () => {
    const { exitCode, stdout, stderr } = await run(["design", BLESSED, "--composition", "--no-fail"])
    expect(exitCode).toBe(0)
    expect(`${stdout}\n${stderr}`).toContain("kit-taxonomy-missing")
  })
})

// ─── check theme-mode — the reference implementation, locked in ───────────────

describe("check theme-mode — --no-fail (unchanged reference implementation)", () => {
  it("exits 1 on a mode mismatch", async () => {
    const { exitCode } = await run(["theme-mode", THEME_MISMATCH])
    expect(exitCode).toBe(1)
  })

  it("exits 0 on the same mismatch with --no-fail", async () => {
    const { exitCode } = await run(["theme-mode", THEME_MISMATCH, "--no-fail"])
    expect(exitCode).toBe(0)
  })

  it("still reports the mismatch under --no-fail", async () => {
    const { stdout, stderr } = await run(["theme-mode", THEME_MISMATCH, "--no-fail"])
    expect(`${stdout}\n${stderr}`).toContain("expected dark")
  })

  it("exits 1 in JSON mode and 0 with --no-fail", async () => {
    expect((await run(["theme-mode", THEME_MISMATCH, "--json"])).exitCode).toBe(1)
    expect((await run(["theme-mode", THEME_MISMATCH, "--json", "--no-fail"])).exitCode).toBe(0)
  })

  it("exits 0 on a passing theme", async () => {
    const { exitCode } = await run(["theme-mode", THEME_MATCH])
    expect(exitCode).toBe(0)
  })
})

// ─── check diff — --fail-on-hits is a positive flag, not a negatable one ──────

describe("check diff — --fail-on-hits opt-in exit (audited, no defect)", () => {
  let dir: string

  beforeAll(() => {
    dir = join(tmpdir(), `visor-diff-exit-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "c.tsx"), "export function P() { return <button>hi</button> }\n")
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("exits 0 on hits without the flag — the exit is opt-in", async () => {
    const { exitCode, stdout } = await run(["diff", dir])
    expect(exitCode).toBe(0)
    expect(stdout).toContain("native HTML usage")
  })

  it("exits 1 on hits with --fail-on-hits", async () => {
    const { exitCode } = await run(["diff", dir, "--fail-on-hits"])
    expect(exitCode).toBe(1)
  })

  it("sets exitCode 1 on the JSON path with --fail-on-hits", async () => {
    const { exitCode } = await run(["diff", dir, "--json", "--fail-on-hits"])
    expect(exitCode).toBe(1)
  })

  it("exits 0 on the JSON path without the flag", async () => {
    const { exitCode } = await run(["diff", dir, "--json"])
    expect(exitCode).toBe(0)
  })
})
