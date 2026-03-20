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

  it("marks installed items when visor.json exists", () => {
    // Create visor.json
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify({
        paths: { components: "components/ui", hooks: "hooks", lib: "lib" },
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
})
