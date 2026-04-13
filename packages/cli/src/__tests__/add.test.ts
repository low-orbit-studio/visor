import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

// Mock packages to prevent actual npm install
vi.mock("../utils/packages.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/packages.js")>()
  return {
    ...actual,
    installPackages: vi.fn(),
    getUninstalledDeps: vi.fn(() => []),
    hasVisorTokens: vi.fn(() => true),
  }
})

// Mock the registry loader
vi.mock("../registry/resolve.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry/resolve.js")>()
  return {
    ...actual,
    loadRegistry: vi.fn(() => ({
      items: [
        {
          name: "utils",
          type: "registry:lib",
          dependencies: ["clsx"],
          files: [
            {
              path: "lib/utils.ts",
              type: "registry:lib",
              content: 'import { clsx } from "clsx"\nexport { clsx }',
            },
          ],
        },
        {
          name: "button",
          type: "registry:ui",
          dependencies: ["class-variance-authority"],
          registryDependencies: ["utils"],
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: 'import { cn } from "../../../lib/utils"\nexport function Button() {}',
            },
            {
              path: "components/ui/button/button.module.css",
              type: "registry:ui",
              content: ".base { display: inline-flex; }",
            },
          ],
        },
        {
          name: "login-form",
          type: "registry:block",
          category: "authentication",
          dependencies: ["@loworbitstudio/visor-core"],
          registryDependencies: ["utils"],
          files: [
            {
              path: "blocks/login-form/login-form.tsx",
              type: "registry:block",
              content: 'export function LoginForm() { return <div /> }',
            },
            {
              path: "blocks/login-form/login-form.module.css",
              type: "registry:block",
              content: ".root { display: flex; }",
            },
          ],
        },
      ],
    })),
  }
})

import { addCommand } from "../commands/add.js"
import { installPackages, getUninstalledDeps } from "../utils/packages.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-add-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })

  // Write visor.json
  writeFileSync(
    join(testDir, "visor.json"),
    JSON.stringify({
      paths: { components: "components/ui", deckComponents: "components/deck", blocks: "blocks", hooks: "hooks", lib: "lib" },
    }),
    "utf-8"
  )

  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("add command", () => {
  it("writes component files to the correct paths", () => {
    addCommand(["button"], testDir)

    // Button files
    expect(
      existsSync(join(testDir, "components/ui/button/button.tsx"))
    ).toBe(true)
    expect(
      existsSync(join(testDir, "components/ui/button/button.module.css"))
    ).toBe(true)

    // Utils (registry dependency)
    expect(existsSync(join(testDir, "lib/utils.ts"))).toBe(true)
  })

  it("writes correct file contents", () => {
    addCommand(["button"], testDir)

    const content = readFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "utf-8"
    )
    expect(content).toContain("export function Button()")
  })

  it("skips existing files without --overwrite", () => {
    // Create existing file
    mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
    writeFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "// custom",
      "utf-8"
    )

    addCommand(["button"], testDir)

    const content = readFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "utf-8"
    )
    expect(content).toBe("// custom")
  })

  it("overwrites existing files with --overwrite", () => {
    mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
    writeFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "// custom",
      "utf-8"
    )

    addCommand(["button"], testDir, { overwrite: true })

    const content = readFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "utf-8"
    )
    expect(content).toContain("export function Button()")
  })

  it("resolves transitive registry dependencies", () => {
    addCommand(["button"], testDir)

    // utils should be written as a transitive dep
    const utilsContent = readFileSync(
      join(testDir, "lib/utils.ts"),
      "utf-8"
    )
    expect(utilsContent).toContain("clsx")
  })

  it("writes block files to the blocks path with --block flag", () => {
    addCommand(["login-form"], testDir, { block: true })

    expect(
      existsSync(
        join(testDir, "blocks/login-form/login-form.tsx")
      )
    ).toBe(true)
    expect(
      existsSync(
        join(testDir, "blocks/login-form/login-form.module.css")
      )
    ).toBe(true)
  })

  it("writes correct block file contents", () => {
    addCommand(["login-form"], testDir, { block: true })

    const content = readFileSync(
      join(testDir, "blocks/login-form/login-form.tsx"),
      "utf-8"
    )
    expect(content).toContain("LoginForm")
  })

  it("resolves block registry dependencies", () => {
    addCommand(["login-form"], testDir, { block: true })

    // utils should be written as a transitive dep
    expect(existsSync(join(testDir, "lib/utils.ts"))).toBe(true)
  })

  it("auto-creates visor.json when missing", () => {
    // Remove visor.json that beforeEach created
    const { rmSync } = require("fs")
    rmSync(join(testDir, "visor.json"))
    expect(existsSync(join(testDir, "visor.json"))).toBe(false)

    // Should not throw — should auto-init and write the component
    addCommand(["button"], testDir)

    expect(existsSync(join(testDir, "visor.json"))).toBe(true)
    expect(existsSync(join(testDir, "components/ui/button/button.tsx"))).toBe(true)
  })

  describe("--json flag", () => {
    function mockProcessExit() {
      return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
    }

    function getJsonOutput(): unknown {
      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      return JSON.parse(jsonOutput!)
    }

    it("outputs valid JSON with success field", () => {
      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { success: boolean }
      expect(result.success).toBe(true)
    })

    it("outputs requested and resolved arrays", () => {
      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { requested: string[]; resolved: string[] }
      expect(result.requested).toContain("button")
      expect(Array.isArray(result.resolved)).toBe(true)
      // button has utils as a registry dep, so resolved should include both
      expect(result.resolved).toContain("button")
      expect(result.resolved).toContain("utils")
    })

    it("outputs files.written array", () => {
      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { files: { written: string[]; skipped: string[] } }
      expect(Array.isArray(result.files.written)).toBe(true)
      expect(result.files.written.length).toBeGreaterThan(0)
    })

    it("outputs files.skipped when file exists without --overwrite", () => {
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        "// existing",
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { files: { written: string[]; skipped: string[] } }
      expect(result.files.skipped).toContain("components/ui/button/button.tsx")
    })

    it("outputs dependencies object", () => {
      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { dependencies: { installed: string[]; failed: string[] } }
      expect(Array.isArray(result.dependencies.installed)).toBe(true)
      expect(Array.isArray(result.dependencies.failed)).toBe(true)
    })

    it("outputs success:false and exits 1 when no items specified", () => {
      mockProcessExit()
      expect(() => {
        addCommand([], testDir, { json: true })
      }).toThrow("process.exit(1)")

      const result = getJsonOutput() as { success: boolean; error: string }
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("outputs success:false and exits 1 when dependencies fail to install", () => {
      vi.mocked(getUninstalledDeps).mockReturnValue(["class-variance-authority"])
      vi.mocked(installPackages).mockReturnValue(false)

      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true })
      }).toThrow("process.exit(1)")

      const result = getJsonOutput() as { success: boolean; dependencies: { failed: string[] } }
      expect(result.success).toBe(false)
      expect(result.dependencies.failed.length).toBeGreaterThan(0)
    })
  })

  describe("--dry-run flag", () => {
    function mockProcessExit() {
      return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
    }

    function getJsonOutput(): unknown {
      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      return JSON.parse(jsonOutput!)
    }

    it("does not write files when dryRun is true", () => {
      addCommand(["button"], testDir, { dryRun: true })

      expect(
        existsSync(join(testDir, "components/ui/button/button.tsx"))
      ).toBe(false)
    })

    it("includes dryRun:true and files in JSON output", () => {
      mockProcessExit()
      expect(() => {
        addCommand(["button"], testDir, { json: true, dryRun: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as {
        success: boolean
        dryRun: boolean
        files: { written: string[] }
        dependencies: { installed: string[] }
      }
      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.files.written.length).toBeGreaterThan(0)
    })

    it("does not call installPackages when dryRun is true", () => {
      vi.mocked(installPackages).mockClear()

      addCommand(["button"], testDir, { dryRun: true })

      expect(vi.mocked(installPackages)).not.toHaveBeenCalled()
    })
  })

  describe("exit code on dependency failure", () => {
    it("exits 1 when dependencies fail to install (non-JSON mode)", () => {
      vi.mocked(getUninstalledDeps).mockReturnValue(["class-variance-authority"])
      vi.mocked(installPackages).mockReturnValue(false)

      const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)

      expect(() => {
        addCommand(["button"], testDir)
      }).toThrow("process.exit(1)")

      exitSpy.mockRestore()
    })
  })
})
