import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Mock the manifest loader
vi.mock("../registry/resolve.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry/resolve.js")>()
  return {
    ...actual,
    loadManifest: vi.fn(() => ({
      version: "0.3.0",
      generated_at: "2026-01-01T00:00:00.000Z",
      components: {
        button: {
          category: "form",
          description: "A versatile button component.",
          when_to_use: ["Primary actions", "Form submissions"],
          when_not_to_use: ["Navigation (use a link)"],
          variants: { variant: ["default", "outline", "ghost"] },
          props: [
            { name: "variant", type: "string", default: "default", description: "Button variant" },
          ],
          dependencies: [],
          tokens_used: ["--color-primary", "--spacing-2"],
          example: '<Button variant="default">Click me</Button>',
        },
      },
      hooks: {
        "use-debounce": {
          description: "Debounces a value by a given delay.",
          params: [
            { name: "value", type: "T", required: true, description: "The value to debounce" },
            { name: "delay", type: "number", required: true, description: "Delay in ms" },
          ],
          returns: [
            { name: "debouncedValue", type: "T", description: "The debounced value" },
          ],
        },
      },
      blocks: {},
      patterns: {},
      categories: {},
    })),
  }
})

import { infoCommand } from "../commands/info.js"

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("info command", () => {
  describe("--json flag", () => {
    function mockProcessExit() {
      return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
    }

    it("returns success:true and kind:component for a known component", () => {
      mockProcessExit()
      expect(() => {
        infoCommand("button", "/tmp", { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(true)
      expect(result.name).toBe("button")
      expect(result.kind).toBe("component")
      expect(result.data).toBeDefined()
      expect(result.data.description).toBe("A versatile button component.")
      expect(result.data.tokens_used).toContain("--color-primary")
    })

    it("returns success:true and kind:hook for a known hook", () => {
      mockProcessExit()
      expect(() => {
        infoCommand("use-debounce", "/tmp", { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(true)
      expect(result.name).toBe("use-debounce")
      expect(result.kind).toBe("hook")
      expect(result.data.params).toHaveLength(2)
      expect(result.data.returns).toHaveLength(1)
    })

    it("exits with code 1 and success:false for unknown name", () => {
      const exitSpy = mockProcessExit()
      expect(() => {
        infoCommand("nonexistent", "/tmp", { json: true })
      }).toThrow("process.exit(1)")

      const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      expect(jsonOutput).toBeDefined()
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(false)
      expect(result.error).toContain("nonexistent")
      expect(result.error).toContain("visor list --json")
      exitSpy.mockRestore()
    })
  })

  describe("plain text mode", () => {
    it("prints name and description for a known component", () => {
      infoCommand("button", "/tmp")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const output = calls.map((c: unknown[]) => String(c[0])).join("\n")
      expect(output).toContain("button")
      expect(output).toContain("A versatile button component.")
    })

    it("prints when_to_use items", () => {
      infoCommand("button", "/tmp")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const output = calls.map((c: unknown[]) => String(c[0])).join("\n")
      expect(output).toContain("Primary actions")
    })
  })
})
