import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

// Mock the flutter utility to control flutter binary resolution
vi.mock("../src/utils/flutter.js", () => ({
  findFlutterBin: vi.fn(),
}))

// Mock child_process.spawnSync to avoid actually running dart analyze
vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}))

import { themeVerifyCommand } from "../src/commands/theme-verify.js"
import { findFlutterBin } from "../src/utils/flutter.js"
import { spawnSync } from "child_process"

const mockFindFlutterBin = vi.mocked(findFlutterBin)
const mockSpawnSync = vi.mocked(spawnSync)

describe("themeVerifyCommand", () => {
  let tmpDir: string
  let exitSpy: ReturnType<typeof vi.spyOn>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = join(tmpdir(), `visor-verify-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })

    exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
      throw new Error(`process.exit(${_code})`)
    })
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it("exits 0 when dart analyze succeeds", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: "No issues found!",
      stderr: "",
      pid: 1,
      output: [],
      signal: null,
    })

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "flutter", json: false })
    ).toThrow("process.exit(0)")

    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it("exits 1 when dart analyze fails", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: "",
      stderr: "error: undefined class 'VisorColors'",
      pid: 1,
      output: [],
      signal: null,
    })

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "flutter", json: false })
    ).toThrow("process.exit(1)")

    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it("outputs JSON on success when --json flag is set", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: "No issues found!",
      stderr: "",
      pid: 1,
      output: [],
      signal: null,
    })

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "flutter", json: true })
    ).toThrow("process.exit(0)")

    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.valid).toBe(true)
    expect(output.target).toBe("flutter")
    expect(output.errors).toHaveLength(0)
  })

  it("outputs JSON with errors on failure when --json flag is set", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: "",
      stderr: "error: undefined class",
      pid: 1,
      output: [],
      signal: null,
    })

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "flutter", json: true })
    ).toThrow("process.exit(1)")

    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.valid).toBe(false)
    expect(output.target).toBe("flutter")
    expect(output.errors.length).toBeGreaterThan(0)
    expect(output.errors[0].code).toBe("DART_ANALYZE_FAILED")
  })

  it("exits 1 when flutter binary is not found", () => {
    mockFindFlutterBin.mockReturnValue(null)

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "flutter", json: false })
    ).toThrow("process.exit(1)")

    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it("exits 1 when directory does not exist", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")

    expect(() =>
      themeVerifyCommand("/nonexistent-dir-xyz", "/", { target: "flutter", json: false })
    ).toThrow("process.exit(1)")

    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it("exits 1 with JSON error for unsupported target", () => {
    mockFindFlutterBin.mockReturnValue("/usr/bin/flutter")

    expect(() =>
      themeVerifyCommand(tmpDir, "/", { target: "css", json: true })
    ).toThrow("process.exit(1)")

    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.valid).toBe(false)
    expect(output.errors[0].code).toBe("UNSUPPORTED_TARGET")
  })
})
