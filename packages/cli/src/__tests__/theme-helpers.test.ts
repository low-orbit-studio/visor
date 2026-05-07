import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, symlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  scanNestedThemeDir,
  detectVisorWorkspace,
  isLocalVisorBinary,
  BrokenSymlinkError,
} from "../utils/theme-helpers.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-helpers-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(testDir, { recursive: true })
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("scanNestedThemeDir", () => {
  it("returns slugs from {dir}/{slug}/theme.visor.yaml entries", () => {
    const root = join(testDir, "themes")
    mkdirSync(join(root, "alpha"), { recursive: true })
    mkdirSync(join(root, "beta"), { recursive: true })
    writeFileSync(join(root, "alpha", "theme.visor.yaml"), "name: alpha\n", "utf-8")
    writeFileSync(join(root, "beta", "theme.visor.yaml"), "name: beta\n", "utf-8")

    const result = scanNestedThemeDir(root)
    const slugs = result.map((r) => r.slug).sort()
    expect(slugs).toEqual(["alpha", "beta"])
  })

  it("ignores subdirs without a theme.visor.yaml", () => {
    const root = join(testDir, "themes")
    mkdirSync(join(root, "lonely"), { recursive: true })
    mkdirSync(join(root, "valid"), { recursive: true })
    writeFileSync(join(root, "valid", "theme.visor.yaml"), "name: valid\n", "utf-8")
    writeFileSync(join(root, "lonely", "meta.json"), "{}", "utf-8")

    const result = scanNestedThemeDir(root)
    expect(result.map((r) => r.slug)).toEqual(["valid"])
  })

  it("returns empty array when dir does not exist", () => {
    expect(scanNestedThemeDir(join(testDir, "missing"))).toEqual([])
  })

  it("throws BrokenSymlinkError when a top-level entry is a dangling symlink", () => {
    const root = join(testDir, "themes")
    mkdirSync(root, { recursive: true })
    const linkPath = join(root, "broken")
    const target = join(testDir, "no-such-target")
    symlinkSync(target, linkPath)

    expect(() => scanNestedThemeDir(root)).toThrow(BrokenSymlinkError)
  })
})

describe("detectVisorWorkspace", () => {
  it("returns the workspace root when package.json declares Visor monorepo shape", () => {
    const wsRoot = join(testDir, "fake-visor")
    const sub = join(wsRoot, "apps", "docs")
    mkdirSync(sub, { recursive: true })
    writeFileSync(
      join(wsRoot, "package.json"),
      JSON.stringify({
        name: "visor",
        workspaces: ["packages/cli", "packages/theme-engine", "packages/docs"],
      }),
      "utf-8",
    )

    expect(detectVisorWorkspace(sub)).toBe(wsRoot)
  })

  it("returns null when package.json name is not 'visor'", () => {
    const root = join(testDir, "other-project")
    mkdirSync(root, { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "not-visor", workspaces: ["packages/cli", "packages/theme-engine"] }),
      "utf-8",
    )

    expect(detectVisorWorkspace(root)).toBeNull()
  })

  it("returns null when workspaces array is missing required entries", () => {
    const root = join(testDir, "incomplete")
    mkdirSync(root, { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "visor", workspaces: ["packages/cli"] }),
      "utf-8",
    )

    expect(detectVisorWorkspace(root)).toBeNull()
  })

  it("returns null when no package.json is found walking up", () => {
    const root = join(testDir, "no-pkg")
    mkdirSync(root, { recursive: true })
    expect(detectVisorWorkspace(root)).toBeNull()
  })
})

describe("isLocalVisorBinary", () => {
  it("returns true when scriptPath is inside <workspace>/packages/cli/dist/", () => {
    const ws = join(testDir, "ws")
    const distDir = join(ws, "packages", "cli", "dist")
    mkdirSync(distDir, { recursive: true })
    const scriptPath = join(distDir, "index.js")
    writeFileSync(scriptPath, "// stub", "utf-8")

    expect(isLocalVisorBinary(ws, scriptPath)).toBe(true)
  })

  it("returns false when scriptPath is outside the workspace dist", () => {
    const ws = join(testDir, "ws")
    mkdirSync(join(ws, "packages", "cli", "dist"), { recursive: true })
    const elsewhere = join(testDir, "elsewhere", "visor.js")
    mkdirSync(join(testDir, "elsewhere"), { recursive: true })
    writeFileSync(elsewhere, "// stub", "utf-8")

    expect(isLocalVisorBinary(ws, elsewhere)).toBe(false)
  })

  it("returns false when scriptPath is undefined", () => {
    const ws = join(testDir, "ws")
    mkdirSync(join(ws, "packages", "cli", "dist"), { recursive: true })
    expect(isLocalVisorBinary(ws, undefined)).toBe(false)
  })
})
