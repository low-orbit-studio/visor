import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

// Mock the registry loader
vi.mock("../registry/resolve.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry/resolve.js")>()
  return {
    ...actual,
    loadRegistry: vi.fn(() => ({
      items: [
        {
          name: "button",
          type: "registry:ui",
          description: "A button component",
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: "<Button />",
            },
          ],
        },
        {
          name: "use-debounce",
          type: "registry:hook",
          description: "Debounce hook",
          files: [
            {
              path: "hooks/use-debounce.ts",
              type: "registry:hook",
              content: "export {}",
            },
          ],
        },
        {
          name: "utils",
          type: "registry:lib",
          description: "Utility functions",
          files: [
            {
              path: "lib/utils.ts",
              type: "registry:lib",
              content: "export {}",
            },
          ],
        },
        {
          name: "login-form",
          type: "registry:block",
          category: "authentication",
          description: "A placeholder login form block",
          files: [
            {
              path: "blocks/login-form/login-form.tsx",
              type: "registry:block",
              content: "export {}",
            },
          ],
        },
      ],
    })),
  }
})

import { listCommand } from "../commands/list.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-list-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("list command", () => {
  it("lists all registry items grouped by type", () => {
    listCommand(testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("Components")
    expect(output).toContain("button")
    expect(output).toContain("Hooks")
    expect(output).toContain("use-debounce")
    expect(output).toContain("Utilities")
    expect(output).toContain("utils")
  })

  it("lists blocks in a separate group", () => {
    listCommand(testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("Authentication Blocks")
    expect(output).toContain("login-form")
  })

  it("marks installed items when visor.json exists", () => {
    // Create visor.json
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({
        paths: { components: "components/ui", deckComponents: "components/deck", blocks: "blocks", hooks: "hooks", lib: "lib" },
      }),
      "utf-8"
    )

    // Create the button file
    mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
    writeFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      "<Button />",
      "utf-8"
    )

    listCommand(testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("(installed)")
  })

  describe("--json flag", () => {
    function mockProcessExit() {
      return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
    }

    it("outputs valid JSON with success field", () => {
      mockProcessExit()
      expect(() => {
        listCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(true)
    })

    it("outputs items array with required fields", () => {
      mockProcessExit()
      expect(() => {
        listCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBe(4) // 4 mock items
      const button = result.items.find((i: { name: string }) => i.name === "button")
      expect(button).toBeDefined()
      expect(button.type).toBe("registry:ui")
      expect(button.installed).toBe(false)
      expect("description" in button).toBe(true)
    })

    it("outputs summary with total, installed, and byType", () => {
      mockProcessExit()
      expect(() => {
        listCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.summary).toBeDefined()
      expect(result.summary.total).toBe(4)
      expect(typeof result.summary.installed).toBe("number")
      expect(result.summary.byType).toBeDefined()
    })

    it("marks installed items in JSON output", () => {
      // Create visor.json
      writeFileSync(
        join(testDir, "visor.json"),
        JSON.stringify({
          paths: { components: "components/ui", deckComponents: "components/deck", blocks: "blocks", hooks: "hooks", lib: "lib" },
        }),
        "utf-8"
      )

      // Create the button file
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        "<Button />",
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        listCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      const button = result.items.find((i: { name: string }) => i.name === "button")
      expect(button.installed).toBe(true)
      expect(result.summary.installed).toBe(1)
    })
  })
})
