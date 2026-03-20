import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, readFileSync } from "fs"
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
