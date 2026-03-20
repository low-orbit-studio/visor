import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, existsSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { initCommand } from "../commands/init.js"
import { loadConfig, configExists } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-init-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("init command", () => {
  it("creates visor.json with default config", () => {
    initCommand(testDir)
    expect(configExists(testDir)).toBe(true)

    const config = loadConfig(testDir)
    expect(config).toEqual(DEFAULT_CONFIG)
  })

  it("does not overwrite existing visor.json", () => {
    const customConfig = {
      paths: { components: "src/ui", hooks: "src/hooks", lib: "src/lib" },
    }
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify(customConfig),
      "utf-8"
    )

    initCommand(testDir)

    const config = loadConfig(testDir)
    expect(config.paths.components).toBe("src/ui")
  })

  it("warns about missing visor-tokens", () => {
    // No package.json → tokens not installed
    initCommand(testDir)
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("@loworbit/visor-tokens")
    )
  })

  it("does not warn about tokens when they are installed", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: { "@loworbit/visor-tokens": "^0.1.0" },
      }),
      "utf-8"
    )

    initCommand(testDir)

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const tokenWarnings = calls.filter((call: unknown[]) =>
      String(call[0]).includes("@loworbit/visor-tokens is not installed")
    )
    expect(tokenWarnings).toHaveLength(0)
  })
})
