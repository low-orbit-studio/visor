import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { initCommand } from "../commands/init.js"
import { loadConfig, configExists } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

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
      expect.stringContaining("@loworbitstudio/visor-core")
    )
  })

  it("does not warn about tokens when they are installed", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: { "@loworbitstudio/visor-core": "^0.1.0" },
      }),
      "utf-8"
    )

    initCommand(testDir)

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const tokenWarnings = calls.filter((call: unknown[]) =>
      String(call[0]).includes("@loworbitstudio/visor-core is not installed")
    )
    expect(tokenWarnings).toHaveLength(0)
  })

  it("--template nextjs creates .visor.yaml and globals.css", () => {
    initCommand(testDir, { template: "nextjs" })

    expect(existsSync(join(testDir, ".visor.yaml"))).toBe(true)
    expect(existsSync(join(testDir, "app/globals.css"))).toBe(true)

    const yaml = readFileSync(join(testDir, ".visor.yaml"), "utf-8")
    expect(yaml).toContain("name: my-app")
    expect(yaml).toContain("primary:")

    const css = readFileSync(join(testDir, "app/globals.css"), "utf-8")
    expect(css).toContain("@layer visor-primitives")
  })

  it("--template nextjs does not overwrite existing .visor.yaml", () => {
    writeFileSync(join(testDir, ".visor.yaml"), "name: existing\nversion: 1\ncolors:\n  primary: '#ff0000'\n", "utf-8")

    initCommand(testDir, { template: "nextjs" })

    const yaml = readFileSync(join(testDir, ".visor.yaml"), "utf-8")
    expect(yaml).toContain("name: existing")
  })

  it("--template invalid exits with error", () => {
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { template: "flutter" })
    }).toThrow("process.exit(1)")
  })
})
