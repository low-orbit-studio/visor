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
      ],
    })),
  }
})

import { addCommand } from "../commands/add.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-add-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })

  // Write visor.json
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
})
