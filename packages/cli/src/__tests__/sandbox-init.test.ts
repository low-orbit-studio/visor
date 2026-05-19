import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"

vi.mock("../commands/add.js", () => ({
  addCommand: vi.fn(() => undefined),
}))

vi.mock("../commands/theme-apply.js", () => ({
  themeApplyCommand: vi.fn(() => undefined),
}))

vi.mock("../registry/resolve.js", async () => {
  const actual = await vi.importActual<typeof import("../registry/resolve.js")>(
    "../registry/resolve.js"
  )
  return {
    ...actual,
    loadRegistry: vi.fn(() => ({
      items: [
        { name: "button", type: "registry:ui", target: "react" },
        { name: "badge", type: "registry:ui", target: "react" },
      ],
    })),
    filterItemsByTarget: (items: Array<{ name: string }>) => items,
  }
})

import { sandboxInitCommand } from "../commands/sandbox/init.js"
import { addCommand } from "../commands/add.js"

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, "fixtures", "sandbox-handoff.md")

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe("sandbox init", () => {
  it("scaffolds a Next.js app at .lo/sandbox/<name>/", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const sandboxDir = join(testDir, ".lo", "sandbox", "test-pattern")
    expect(existsSync(join(sandboxDir, "package.json"))).toBe(true)
    expect(existsSync(join(sandboxDir, "tsconfig.json"))).toBe(true)
    expect(existsSync(join(sandboxDir, "next.config.ts"))).toBe(true)
    expect(existsSync(join(sandboxDir, "app", "layout.tsx"))).toBe(true)
    expect(existsSync(join(sandboxDir, "app", "page.tsx"))).toBe(true)
    expect(existsSync(join(sandboxDir, "app", "primitives", "[name]", "page.tsx"))).toBe(true)
    expect(existsSync(join(sandboxDir, "app", "screens", "[name]", "page.tsx"))).toBe(true)
    expect(existsSync(join(sandboxDir, "lib", "sandbox-manifest.ts"))).toBe(true)
    expect(existsSync(join(sandboxDir, "lib", "sandbox-mocks.ts"))).toBe(true)
    expect(existsSync(join(sandboxDir, "playwright.capture.mjs"))).toBe(true)
  })

  it("writes sandbox.json with handoff path, theme, port and primitives", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const config = JSON.parse(
      readFileSync(join(testDir, ".lo", "sandbox", "test-pattern", "sandbox.json"), "utf-8")
    ) as {
      pattern: string
      handoffPath: string
      theme: string
      port: number
      primitives: Array<{ name: string; status: string; viTicket: string | null }>
      screens: Array<{ name: string }>
    }
    expect(config.pattern).toBe("test-pattern")
    expect(config.theme).toBe("space")
    expect(config.port).not.toBe(3000)
    expect(config.port).toBeGreaterThanOrEqual(4060)
    expect(config.primitives.find((p) => p.name === "button")?.status).toBe("shipped")
    expect(config.primitives.find((p) => p.name === "widget-stack")?.status).toBe("gap-new")
    expect(config.screens.map((s) => s.name)).toEqual(["list-view", "detail-view"])
  })

  it("generates a stub file with GAP marker for every new gap primitive", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const stubPath = join(testDir, ".lo", "sandbox", "test-pattern", "components", "stubs", "status-pill.tsx")
    expect(existsSync(stubPath)).toBe(true)
    const stub = readFileSync(stubPath, "utf-8")
    expect(stub).toContain("GAP: VI-999")
    expect(stub).toContain("status-pill")
    expect(stub).toContain("StatusPill")

    const newGapStubPath = join(testDir, ".lo", "sandbox", "test-pattern", "components", "stubs", "widget-stack.tsx")
    expect(existsSync(newGapStubPath)).toBe(true)
    expect(readFileSync(newGapStubPath, "utf-8")).toContain("GAP")
  })

  it("does not generate stubs for shipped or in-flight primitives", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const stubsDir = join(testDir, ".lo", "sandbox", "test-pattern", "components", "stubs")
    expect(existsSync(join(stubsDir, "button.tsx"))).toBe(false)
    expect(existsSync(join(stubsDir, "badge.tsx"))).toBe(false)
  })

  it("invokes addCommand once per shipped/in-flight primitive", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const called = vi.mocked(addCommand).mock.calls
    const names = called.map((c) => c[0][0])
    expect(names).toContain("button")
    expect(names).toContain("badge")
    expect(names).not.toContain("widget-stack")
    expect(names).not.toContain("status-pill")
  })

  it("refuses to overwrite a non-empty sandbox without --overwrite", async () => {
    const sandboxDir = join(testDir, ".lo", "sandbox", "test-pattern")
    mkdirSync(sandboxDir, { recursive: true })
    const { writeFileSync } = await import("fs")
    writeFileSync(join(sandboxDir, "leftover.txt"), "junk")

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`)
    }) as never)

    await expect(
      sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        skipInstall: true,
      })
    ).rejects.toThrow(/process.exit/)

    exitSpy.mockRestore()
  })

  it("rejects invalid sandbox names", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`)
    }) as never)

    await expect(
      sandboxInitCommand("bad/name", testDir, {
        handoff: FIXTURE,
        theme: "space",
        skipInstall: true,
      })
    ).rejects.toThrow(/process.exit/)

    exitSpy.mockRestore()
  })

  it("captures the manifest module so routes can enumerate primitives at runtime", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })
    const manifestSource = readFileSync(
      join(testDir, ".lo", "sandbox", "test-pattern", "lib", "sandbox-manifest.ts"),
      "utf-8"
    )
    expect(manifestSource).toContain("test-pattern")
    expect(manifestSource).toContain("button")
    expect(manifestSource).toContain("widget-stack")
    expect(manifestSource).toContain("list-view")
  })
})
