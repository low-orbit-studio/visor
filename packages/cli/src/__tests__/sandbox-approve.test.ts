import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

import { sandboxApproveCommand } from "../commands/sandbox/approve.js"

let testDir: string
let sandboxDir: string

function setupSandbox(): void {
  mkdirSync(join(sandboxDir, "captures", "pending"), { recursive: true })
  mkdirSync(join(sandboxDir, "captures", "approved"), { recursive: true })
  writeFileSync(join(sandboxDir, "sandbox.json"), JSON.stringify({ port: 4060 }))
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-sandbox-approve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  sandboxDir = join(testDir, ".lo", "sandbox", "test")
  mkdirSync(sandboxDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe("sandbox approve --approve", () => {
  it("promotes captures/pending/ → captures/approved/ and clears pending + diffs", () => {
    setupSandbox()
    writeFileSync(join(sandboxDir, "captures", "pending", "index.png"), "p1")
    writeFileSync(join(sandboxDir, "captures", "pending", "primitives__button.png"), "p2")
    mkdirSync(join(sandboxDir, "captures", "diffs"), { recursive: true })
    writeFileSync(join(sandboxDir, "captures", "diffs", "index.diff.png"), "d1")

    sandboxApproveCommand(testDir, { name: "test", approve: true, json: true })

    const approved = readdirSync(join(sandboxDir, "captures", "approved"))
    expect(approved.sort()).toEqual(["index.png", "primitives__button.png"])
    expect(existsSync(join(sandboxDir, "captures", "pending"))).toBe(false)
    expect(existsSync(join(sandboxDir, "captures", "diffs"))).toBe(false)
    expect(readFileSync(join(sandboxDir, "captures", "approved", "index.png"), "utf-8")).toBe("p1")
  })

  it("fails with a helpful message when no pending captures exist", () => {
    setupSandbox()

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`)
    }) as never)

    expect(() =>
      sandboxApproveCommand(testDir, { name: "test", approve: true, json: false })
    ).toThrow(/process.exit/)

    exitSpy.mockRestore()
  })

  it("overwrites previously-approved captures with promoted pending files", () => {
    setupSandbox()
    writeFileSync(join(sandboxDir, "captures", "approved", "index.png"), "old")
    writeFileSync(join(sandboxDir, "captures", "pending", "index.png"), "new")

    sandboxApproveCommand(testDir, { name: "test", approve: true, json: true })

    expect(readFileSync(join(sandboxDir, "captures", "approved", "index.png"), "utf-8")).toBe("new")
  })

  it("fails when the sandbox does not exist", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`)
    }) as never)

    expect(() =>
      sandboxApproveCommand(testDir, { name: "missing", approve: true, json: false })
    ).toThrow(/process.exit/)

    exitSpy.mockRestore()
  })
})

describe("captureScriptTemplate", () => {
  it("always writes to captures/pending/ (no --diff branch)", async () => {
    const { captureScriptTemplate } = await import("../commands/sandbox/templates.js")
    const script = captureScriptTemplate()
    // No conditional pending/approved branch — every capture lands in pending.
    expect(script).toContain('"captures", "pending"')
    expect(script).not.toContain("diffMode ? pendingDir : approvedDir")
    // Diffs are always computed when an approved baseline exists.
    expect(script).toContain('"captures", "diffs"')
  })

  it("creates the Playwright context with deviceScaleFactor: 2 so retina captures look crisp", async () => {
    const { captureScriptTemplate } = await import("../commands/sandbox/templates.js")
    const script = captureScriptTemplate()
    expect(script).toContain("deviceScaleFactor: 2")
    // Viewport stays at 1280×800 logical pixels; 2x scale yields 2560×1600 effective pixels.
    expect(script).toContain("width: 1280, height: 800")
  })
})
