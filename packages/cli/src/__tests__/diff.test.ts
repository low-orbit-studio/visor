import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

vi.mock("../registry/resolve.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry/resolve.js")>()
  return {
    ...actual,
    loadRegistry: vi.fn(() => ({
      items: [
        {
          name: "button",
          type: "registry:ui",
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: 'export function Button() { return <button /> }',
            },
          ],
        },
      ],
    })),
    findItem: vi.fn((registry: { items: Array<{ name: string }> }, name: string) =>
      registry.items.find((i: { name: string }) => i.name === name)
    ),
  }
})

import { diffCommand } from "../commands/diff.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-diff-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })

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

describe("diff command", () => {
  it("reports no differences when files match", () => {
    mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
    writeFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      'export function Button() { return <button /> }',
      "utf-8"
    )

    diffCommand("button", testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("No differences found")
  })

  it("shows diff when files differ", () => {
    mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
    writeFileSync(
      join(testDir, "components/ui/button/button.tsx"),
      'export function Button() { return <div /> }',
      "utf-8"
    )

    diffCommand("button", testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("button")
    expect(output).toContain("1 file(s) with differences")
  })

  it("handles not-installed components gracefully", () => {
    // No files created — component not installed
    diffCommand("button", testDir)

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n")

    expect(output).toContain("No installed components found")
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

    it("outputs valid JSON with success field when no diffs", () => {
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        'export function Button() { return <button /> }',
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        diffCommand("button", testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { success: boolean }
      expect(result.success).toBe(true)
    })

    it("outputs diffs array with required fields", () => {
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        'export function Button() { return <button /> }',
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        diffCommand("button", testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { diffs: Array<{ file: string; component: string; hasDifferences: boolean; diff: string }> }
      expect(Array.isArray(result.diffs)).toBe(true)
      expect(result.diffs.length).toBe(1)
      expect(result.diffs[0].file).toBe("components/ui/button/button.tsx")
      expect(result.diffs[0].component).toBe("button")
      expect(result.diffs[0].hasDifferences).toBe(false)
      expect(result.diffs[0].diff).toBe("")
    })

    it("outputs hasDifferences:true and diff text when files differ", () => {
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        'export function Button() { return <div /> }',
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        diffCommand("button", testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as {
        diffs: Array<{ hasDifferences: boolean; diff: string }>
        summary: { totalFiles: number; filesWithDiffs: number }
      }
      expect(result.diffs[0].hasDifferences).toBe(true)
      expect(result.diffs[0].diff.length).toBeGreaterThan(0)
      expect(result.summary.filesWithDiffs).toBe(1)
    })

    it("outputs summary with totalFiles and filesWithDiffs", () => {
      mkdirSync(join(testDir, "components/ui/button"), { recursive: true })
      writeFileSync(
        join(testDir, "components/ui/button/button.tsx"),
        'export function Button() { return <button /> }',
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        diffCommand("button", testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { summary: { totalFiles: number; filesWithDiffs: number } }
      expect(result.summary.totalFiles).toBe(1)
      expect(result.summary.filesWithDiffs).toBe(0)
    })

    it("outputs success:false when component not found", () => {
      mockProcessExit()
      expect(() => {
        diffCommand("nonexistent", testDir, { json: true })
      }).toThrow("process.exit(1)")

      const result = getJsonOutput() as { success: boolean; error: string }
      expect(result.success).toBe(false)
      expect(result.error).toContain("nonexistent")
    })

    it("outputs empty diffs array for not-installed component", () => {
      // Component not installed (no files on disk)
      mockProcessExit()
      expect(() => {
        diffCommand("button", testDir, { json: true })
      }).toThrow("process.exit(0)")

      const result = getJsonOutput() as { diffs: unknown[]; summary: { totalFiles: number } }
      expect(result.diffs).toHaveLength(0)
      expect(result.summary.totalFiles).toBe(0)
    })
  })
})
