import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  loadConfig,
  writeConfig,
  configExists,
  getConfigPath,
} from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-config-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

describe("configExists", () => {
  it("returns false when no config exists", () => {
    expect(configExists(testDir)).toBe(false)
  })

  it("returns true when config exists", () => {
    writeConfig(testDir, DEFAULT_CONFIG)
    expect(configExists(testDir)).toBe(true)
  })
})

describe("getConfigPath", () => {
  it("returns path to visor.json in given directory", () => {
    expect(getConfigPath(testDir)).toBe(join(testDir, "visor.json"))
  })
})

describe("writeConfig / loadConfig", () => {
  it("writes and reads config correctly", () => {
    writeConfig(testDir, DEFAULT_CONFIG)
    const loaded = loadConfig(testDir)
    expect(loaded).toEqual(DEFAULT_CONFIG)
  })

  it("writes valid JSON with trailing newline", () => {
    writeConfig(testDir, DEFAULT_CONFIG)
    const raw = readFileSync(join(testDir, "visor.json"), "utf-8")
    expect(raw.endsWith("\n")).toBe(true)
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  it("preserves custom paths", () => {
    const customConfig = {
      paths: {
        components: "src/components",
        deckComponents: "components/deck",
        flutterComponents: "lib/visor/components",
        blocks: "blocks",
        hooks: "src/hooks",
        lib: "src/lib",
      },
    }
    writeConfig(testDir, customConfig)
    const loaded = loadConfig(testDir)
    expect(loaded.paths.components).toBe("src/components")
  })

  it("throws when config does not exist", () => {
    expect(() => loadConfig(testDir)).toThrow(
      'No visor.json found. Run "visor init" first.'
    )
  })
})

describe("config validation", () => {
  it("throws when paths is not an object", () => {
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({ paths: "invalid" }),
      "utf-8"
    )
    expect(() => loadConfig(testDir)).toThrow(
      "Invalid visor.json: paths must be an object, got string"
    )
  })

  it("throws when paths is an array", () => {
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({ paths: ["a", "b"] }),
      "utf-8"
    )
    expect(() => loadConfig(testDir)).toThrow(
      "Invalid visor.json: paths must be an object, got array"
    )
  })

  it("throws when paths is null", () => {
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({ paths: null }),
      "utf-8"
    )
    expect(() => loadConfig(testDir)).toThrow(
      "Invalid visor.json: paths must be an object, got object"
    )
  })

  it("throws when a path value is not a string", () => {
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({ paths: { components: 42 } }),
      "utf-8"
    )
    expect(() => loadConfig(testDir)).toThrow(
      "Invalid visor.json: paths.components must be a string, got number"
    )
  })

  it("warns on unknown top-level keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({ paths: { components: "src/ui" }, unknownKey: true }),
      "utf-8"
    )
    loadConfig(testDir)
    expect(warnSpy).toHaveBeenCalledWith(
      'Warning: unknown key "unknownKey" in visor.json'
    )
    warnSpy.mockRestore()
  })

  it("accepts valid config with no warnings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    writeConfig(testDir, DEFAULT_CONFIG)
    loadConfig(testDir)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
