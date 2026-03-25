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
      paths: { components: "components/ui", deckComponents: "components/deck", hooks: "hooks", lib: "lib" },
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
})
