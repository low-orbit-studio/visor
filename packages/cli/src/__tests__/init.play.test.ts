import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

import { initCommand } from "../commands/init.js"
import { allocatePort } from "../lib/lo-ports-bridge.js"
import { readEntryChecklist } from "../lib/lo-play-checklist.js"

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

/** Extract the last JSON object printed to console.log. */
function lastJsonOutput(): Record<string, unknown> {
  const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
  const jsonOutput = calls
    .map((c: unknown[]) => String(c[0]))
    .reverse()
    .find((s) => s.startsWith("{"))
  return JSON.parse(jsonOutput!)
}

let testDir: string

beforeEach(() => {
  testDir = join(
    tmpdir(),
    `visor-test-init-play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("visor init --for {play-type}", () => {
  it("bootstraps pattern-build: .lo/pattern-builds/{name}/state.json at phase 0", () => {
    initCommand(testDir, { for: "pattern-build", playName: "test-pattern", theme: "entr" })

    const statePath = join(testDir, ".lo/pattern-builds/test-pattern/state.json")
    expect(existsSync(statePath)).toBe(true)

    const state = JSON.parse(readFileSync(statePath, "utf-8"))
    expect(state.play).toBe("pattern-build")
    expect(state.name).toBe("test-pattern")
    expect(state.phase).toBe(0)
    expect(state.theme).toBe("entr")
    expect(typeof state.devPort).toBe("number")
    expect(state.createdWith).toContain("@loworbitstudio/visor@")
    expect(state.createdAt).toBe(new Date(state.createdAt).toISOString())
  })

  it("bootstraps new-web-app: .lo/new-web-apps/{name}/state.json", () => {
    initCommand(testDir, { for: "new-web-app", playName: "my-app" })

    const statePath = join(testDir, ".lo/new-web-apps/my-app/state.json")
    expect(existsSync(statePath)).toBe(true)
    const state = JSON.parse(readFileSync(statePath, "utf-8"))
    expect(state.play).toBe("new-web-app")
    expect(state.phase).toBe(0)
  })

  it("bootstraps feature-addition: .lo/feature-additions/{name}/state.json", () => {
    initCommand(testDir, { for: "feature-addition", playName: "onboard-me" })

    const statePath = join(testDir, ".lo/feature-additions/onboard-me/state.json")
    expect(existsSync(statePath)).toBe(true)
    const state = JSON.parse(readFileSync(statePath, "utf-8"))
    expect(state.play).toBe("feature-addition")
  })

  it("defaults --play-name to the current directory name when omitted", () => {
    initCommand(testDir, { for: "pattern-build" })
    const base = testDir.split("/").pop()!
    const statePath = join(testDir, ".lo/pattern-builds", base, "state.json")
    expect(existsSync(statePath)).toBe(true)
  })

  it("errors cleanly on an unknown play-type with the known-plays list", () => {
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { for: "nonsense-play", json: true })
    }).toThrow("process.exit(1)")

    const result = lastJsonOutput()
    expect(result.success).toBe(false)
    expect(String(result.error)).toContain("Unknown play: nonsense-play")
    expect(String(result.error)).toContain("pattern-build")
    expect(String(result.error)).toContain("new-web-app")
    expect(String(result.error)).toContain("feature-addition")
  })

  it("is idempotent: re-running with the same name is a no-op", () => {
    initCommand(testDir, { for: "pattern-build", playName: "dup" })
    const statePath = join(testDir, ".lo/pattern-builds/dup/state.json")
    const first = readFileSync(statePath, "utf-8")

    // Second run: JSON mode so we can assert alreadyInitialized.
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { for: "pattern-build", playName: "dup", json: true })
    }).toThrow("process.exit(0)")

    const result = lastJsonOutput()
    expect((result.play as Record<string, unknown>).alreadyInitialized).toBe(true)

    // State file untouched.
    expect(readFileSync(statePath, "utf-8")).toBe(first)
  })

  it("rejects an invalid play name", () => {
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { for: "pattern-build", playName: "bad name!", json: true })
    }).toThrow("process.exit(1)")
    const result = lastJsonOutput()
    expect(result.success).toBe(false)
    expect(String(result.error)).toContain("Invalid play name")
  })

  it("emits the play block in --json output", () => {
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { for: "new-web-app", playName: "jsonapp", json: true })
    }).toThrow("process.exit(0)")

    const result = lastJsonOutput()
    const play = result.play as Record<string, unknown>
    expect(play.play).toBe("new-web-app")
    expect(play.name).toBe("jsonapp")
    expect(play.phase).toBe(0)
    expect(play.statePath).toContain(".lo/new-web-apps/jsonapp/state.json")
  })
})

describe("lo-ports bridge — allocatePort", () => {
  it("uses /lo-ports when the command returns a port", () => {
    const result = allocatePort("some-play", {
      runCommand: () => JSON.stringify({ port: 4210 }),
    })
    expect(result.source).toBe("lo-ports")
    expect(result.port).toBe(4210)
    expect(result.warning).toBeUndefined()
  })

  it("accepts a bare-number port from /lo-ports", () => {
    const result = allocatePort("some-play", { runCommand: () => "4222" })
    expect(result.source).toBe("lo-ports")
    expect(result.port).toBe(4222)
  })

  it("falls back to a heuristic port + warning when /lo-ports is unavailable", () => {
    const result = allocatePort("some-play", { runCommand: () => null })
    expect(result.source).toBe("fallback")
    expect(result.port).toBeGreaterThanOrEqual(4200)
    expect(result.port).toBeLessThan(4300)
    expect(result.warning).toContain("/lo-ports")
  })

  it("falls back when the /lo-ports command throws", () => {
    const result = allocatePort("some-play", {
      runCommand: () => {
        throw new Error("ENOENT")
      },
    })
    expect(result.source).toBe("fallback")
    expect(result.warning).toBeDefined()
  })

  it("fallback is deterministic per name (stable across re-runs)", () => {
    const a = allocatePort("organization-management", { runCommand: () => null })
    const b = allocatePort("organization-management", { runCommand: () => null })
    expect(a.port).toBe(b.port)
  })
})

describe("lo-play checklist bridge — readEntryChecklist", () => {
  let root: string

  beforeEach(() => {
    root = join(testDir, "skills-root")
  })

  it("reads a checklist when present", () => {
    const playDir = join(root, "pattern-build")
    mkdirSync(playDir, { recursive: true })
    writeFileSync(join(playDir, "entry-checklist.md"), "- [ ] Confirm shape\n", "utf-8")

    const result = readEntryChecklist("pattern-build", { root })
    expect(result.found).toBe(true)
    if (result.found) {
      expect(result.content).toContain("Confirm shape")
      expect(result.path).toContain("pattern-build/entry-checklist.md")
    }
  })

  it("prints the fallback message when the checklist is missing (D6)", () => {
    const result = readEntryChecklist("pattern-build", { root })
    expect(result.found).toBe(false)
    if (!result.found) {
      expect(result.fallbackMessage).toContain("checklist not found".toLowerCase())
      expect(result.fallbackMessage).toContain("/lo-play pattern-build")
    }
  })
})
