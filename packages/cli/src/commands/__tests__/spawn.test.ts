import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import * as childProcess from "child_process"
import {
  runSpawn,
  spawnCommand,
  parseBlessedIdentifier,
  discoverBlessedRoot,
  BLESSED_ROOT_DIRNAME,
  type SpawnOptions,
} from "../spawn.js"
import { discoverBlessedBuilds } from "../../lib/blessed-discovery.js"
import { parseBlessedManifest } from "../../lib/blessed-manifest.js"

// Mock npm install so --install never shells out during tests.
vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>()
  return { ...actual, spawnSync: vi.fn(() => ({ status: 0, error: undefined })) }
})

const VALID_THEME = `
name: test-theme
version: 1
colors:
  primary: "#6366f1"
`

const INVALID_THEME = `
name: bad-theme
version: 1
colors: {}
`

let baseDir: string
let blessedRoot: string

function manifest(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    shape: "admin-ui",
    pattern: "test-pattern",
    base_theme: "reference-app",
    requires_visor: ">=1.14.0",
    captures_baseline: "captures/approved/",
    three_gates_status: "passing",
    ...overrides,
  })
}

/** Build a fixture blessed build tree; returns its root dir (holds the manifest). */
function makeBlessedBuild(
  root: string,
  shape: string,
  pattern: string,
  manifestJson?: string
): string {
  const buildDir = join(root, shape, pattern, "reference-build")
  mkdirSync(join(buildDir, "app"), { recursive: true })
  mkdirSync(join(buildDir, "node_modules", "left-pad"), { recursive: true })
  writeFileSync(join(buildDir, "blessed-manifest.json"), manifestJson ?? manifest({ shape, pattern }))
  writeFileSync(join(buildDir, "app", "globals.css"), "/* placeholder globals */\n")
  writeFileSync(join(buildDir, "app", "page.tsx"), "export default function Page() { return null }\n")
  writeFileSync(join(buildDir, "package.json"), JSON.stringify({ name: pattern }))
  writeFileSync(join(buildDir, "node_modules", "left-pad", "index.js"), "module.exports = {}\n")
  return buildDir
}

function writeTheme(content = VALID_THEME): string {
  const themePath = join(baseDir, "theme.visor.yaml")
  writeFileSync(themePath, content, "utf-8")
  return themePath
}

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

beforeEach(() => {
  baseDir = join(tmpdir(), `visor-spawn-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  blessedRoot = join(baseDir, "blessed")
  mkdirSync(blessedRoot, { recursive: true })
  vi.mocked(childProcess.spawnSync).mockClear()
})

afterEach(() => {
  rmSync(baseDir, { recursive: true, force: true })
  delete process.env.VISOR_BLESSED_DIR
  vi.restoreAllMocks()
})

describe("parseBlessedIdentifier", () => {
  it("parses a well-formed identifier", () => {
    expect(parseBlessedIdentifier("blessed:admin-ui:organization-management")).toEqual({
      shape: "admin-ui",
      pattern: "organization-management",
    })
  })

  it.each(["admin-ui:foo", "blessed:only-one-part", "blessed::pattern", "blessed:shape:"])(
    "throws on malformed identifier %s",
    (bad) => {
      expect(() => parseBlessedIdentifier(bad)).toThrow(/blessed:\{shape\}:\{pattern\}/)
    }
  )
})

describe("visor spawn", () => {
  it("forks a blessed build, applies the theme, and excludes node_modules", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    const output = join(baseDir, "out")

    const result = runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output,
      blessedDir: blessedRoot,
    })

    expect(result.success).toBe(true)
    expect(result.build.shape).toBe("admin-ui")
    expect(result.build.pattern).toBe("test-pattern")
    // Tree copied over.
    expect(existsSync(join(output, "app", "page.tsx"))).toBe(true)
    expect(existsSync(join(output, "package.json"))).toBe(true)
    // node_modules excluded (D3).
    expect(existsSync(join(output, "node_modules"))).toBe(false)
    // Theme applied — globals.css is no longer the placeholder.
    const globals = readFileSync(join(output, "app", "globals.css"), "utf-8")
    expect(globals).toContain("--color-primary-")
    expect(globals).not.toContain("placeholder globals")
    // No install by default.
    expect(result.installed).toBe(false)
    expect(vi.mocked(childProcess.spawnSync)).not.toHaveBeenCalled()
  })

  it("rolls back (deletes output) when theme apply fails", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme(INVALID_THEME)
    const output = join(baseDir, "out")

    expect(() =>
      runSpawn(baseDir, {
        from: "blessed:admin-ui:test-pattern",
        theme: themeFile,
        output,
        blessedDir: blessedRoot,
      })
    ).toThrow()
    expect(existsSync(output)).toBe(false)
  })

  it("--install runs npm install; default skips it", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()

    const withInstall = runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output: join(baseDir, "out-install"),
      blessedDir: blessedRoot,
      install: true,
      json: true,
    })
    expect(withInstall.installed).toBe(true)
    const call = vi.mocked(childProcess.spawnSync).mock.calls[0]
    expect(call[0]).toBe("npm")
    expect(call[1]).toContain("install")

    vi.mocked(childProcess.spawnSync).mockClear()

    const noInstall = runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output: join(baseDir, "out-noinstall"),
      blessedDir: blessedRoot,
    })
    expect(noInstall.installed).toBe(false)
    expect(vi.mocked(childProcess.spawnSync)).not.toHaveBeenCalled()
  })

  it("validates the applied theme with --validate", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    const result = runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output: join(baseDir, "out"),
      blessedDir: blessedRoot,
      validate: true,
    })
    expect(result.validated).toBe(true)
  })

  it("errors clearly when the blessed build is not found", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    expect(() =>
      runSpawn(baseDir, {
        from: "blessed:admin-ui:does-not-exist",
        theme: themeFile,
        output: join(baseDir, "out"),
        blessedDir: blessedRoot,
      })
    ).toThrow(/No blessed build found/)
  })

  it("refuses to clobber a non-empty output directory", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    const output = join(baseDir, "out")
    mkdirSync(output, { recursive: true })
    writeFileSync(join(output, "existing.txt"), "keep me")
    expect(() =>
      runSpawn(baseDir, {
        from: "blessed:admin-ui:test-pattern",
        theme: themeFile,
        output,
        blessedDir: blessedRoot,
      })
    ).toThrow(/already exists and is not empty/)
  })

  it("honors the VISOR_BLESSED_DIR env override", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    process.env.VISOR_BLESSED_DIR = blessedRoot

    const result = runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output: join(baseDir, "out"),
    })
    expect(result.success).toBe(true)
  })

  it("--list-blessed discovers the fixture builds (JSON)", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    makeBlessedBuild(blessedRoot, "admin-ui", "another-pattern")
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    mockProcessExit()

    spawnCommand(baseDir, { listBlessed: true, blessedDir: blessedRoot, json: true })

    const payload = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect(payload.success).toBe(true)
    expect(payload.builds).toHaveLength(2)
    const froms = payload.builds.map((b: { from: string }) => b.from)
    expect(froms).toContain("blessed:admin-ui:test-pattern")
    expect(froms).toContain("blessed:admin-ui:another-pattern")
  })
})

describe("blessed-root resolution (VI-627)", () => {
  /** Root discovered by walking up from `cwd`; holds a build named `pattern`. */
  function makeDiscoverableRoot(pattern: string): { root: string; cwd: string } {
    const root = join(baseDir, BLESSED_ROOT_DIRNAME)
    makeBlessedBuild(root, "admin-ui", pattern)
    const cwd = join(baseDir, "workspace", "nested", "deep")
    mkdirSync(cwd, { recursive: true })
    return { root, cwd }
  }

  it("discoverBlessedRoot finds the nearest design-prototypes/ walking up", () => {
    const { root, cwd } = makeDiscoverableRoot("discovered-pattern")
    expect(discoverBlessedRoot(cwd)).toBe(root)
  })

  it("discoverBlessedRoot returns undefined when no ancestor has one", () => {
    const cwd = join(baseDir, "no-root", "deep")
    mkdirSync(cwd, { recursive: true })
    expect(discoverBlessedRoot(cwd)).toBeUndefined()
  })

  it("discoverBlessedRoot ignores a design-prototypes *file*", () => {
    const cwd = join(baseDir, "file-not-dir")
    mkdirSync(cwd, { recursive: true })
    writeFileSync(join(cwd, BLESSED_ROOT_DIRNAME), "not a directory")
    expect(discoverBlessedRoot(cwd)).toBeUndefined()
  })

  it("--blessed-dir wins over VISOR_BLESSED_DIR and discovery", () => {
    const { cwd } = makeDiscoverableRoot("discovered-pattern")
    const envRoot = join(baseDir, "env-root")
    makeBlessedBuild(envRoot, "admin-ui", "env-pattern")
    const flagRoot = join(baseDir, "flag-root")
    makeBlessedBuild(flagRoot, "admin-ui", "flag-pattern")
    process.env.VISOR_BLESSED_DIR = envRoot

    const result = runSpawn(cwd, {
      from: "blessed:admin-ui:flag-pattern",
      theme: writeTheme(),
      output: join(baseDir, "out-flag"),
      blessedDir: flagRoot,
    })
    expect(result.build.source.startsWith(flagRoot)).toBe(true)
  })

  it("VISOR_BLESSED_DIR wins over discovery", () => {
    const { cwd } = makeDiscoverableRoot("discovered-pattern")
    const envRoot = join(baseDir, "env-root")
    makeBlessedBuild(envRoot, "admin-ui", "env-pattern")
    process.env.VISOR_BLESSED_DIR = envRoot

    const result = runSpawn(cwd, {
      from: "blessed:admin-ui:env-pattern",
      theme: writeTheme(),
      output: join(baseDir, "out-env"),
    })
    expect(result.build.source.startsWith(envRoot)).toBe(true)
  })

  it("discovers a design-prototypes/ root by walking up from the cwd", () => {
    const { root, cwd } = makeDiscoverableRoot("discovered-pattern")

    const result = runSpawn(cwd, {
      from: "blessed:admin-ui:discovered-pattern",
      theme: writeTheme(),
      output: join(baseDir, "out-discovered"),
    })
    expect(result.success).toBe(true)
    expect(result.build.source.startsWith(root)).toBe(true)
  })

  it("errors with an actionable no-root message when nothing resolves", () => {
    const cwd = join(baseDir, "no-root", "deep")
    mkdirSync(cwd, { recursive: true })

    expect(() =>
      runSpawn(cwd, {
        from: "blessed:admin-ui:test-pattern",
        theme: writeTheme(),
        output: join(baseDir, "out-none"),
      })
    ).toThrow(/No blessed-build root configured/)
  })

  it("never reports '(none found)' against an unconfigured root", () => {
    const cwd = join(baseDir, "no-root", "deep")
    mkdirSync(cwd, { recursive: true })

    let message = ""
    try {
      runSpawn(cwd, {
        from: "blessed:admin-ui:test-pattern",
        theme: writeTheme(),
        output: join(baseDir, "out-none-2"),
      })
    } catch (err) {
      message = err instanceof Error ? err.message : String(err)
    }
    expect(message).not.toContain("(none found)")
    expect(message).toContain("--blessed-dir")
    expect(message).toContain("VISOR_BLESSED_DIR")
  })

  it("--list-blessed reports the no-root error instead of an empty listing", () => {
    const cwd = join(baseDir, "no-root", "deep")
    mkdirSync(cwd, { recursive: true })
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    mockProcessExit()

    expect(() => spawnCommand(cwd, { listBlessed: true, json: true })).toThrow(
      /process\.exit\(1\)/
    )
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect(payload.success).toBe(false)
    expect(payload.error).toMatch(/No blessed-build root configured/)
  })
})

describe("discoverBlessedBuilds", () => {
  it("finds builds and does not descend into build roots", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "p1")
    makeBlessedBuild(blessedRoot, "marketing", "p2")
    const { builds, errors } = discoverBlessedBuilds(blessedRoot)
    expect(errors).toHaveLength(0)
    expect(builds.map((b) => b.manifest.pattern).sort()).toEqual(["p1", "p2"])
  })

  it("returns empty for a missing blessed dir", () => {
    const { builds } = discoverBlessedBuilds(join(baseDir, "nope"))
    expect(builds).toHaveLength(0)
  })
})

describe("visor spawn theme_apply_target dispatch (VI-601)", () => {
  it("uses globals-css at app/globals.css by default (backward compat)", () => {
    makeBlessedBuild(blessedRoot, "admin-ui", "test-pattern")
    const themeFile = writeTheme()
    const output = join(baseDir, "out-default")

    runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output,
      blessedDir: blessedRoot,
    })

    const globals = readFileSync(join(output, "app", "globals.css"), "utf-8")
    expect(globals).toContain("--color-primary-")
  })

  it("dispatches themes-css-dir → <path>/<themeId>.css using theme config.name", () => {
    makeBlessedBuild(
      blessedRoot,
      "admin-ui",
      "test-pattern",
      manifest({
        shape: "admin-ui",
        pattern: "test-pattern",
        theme_apply_target: {
          kind: "themes-css-dir",
          path: "app/styles/themes",
        },
      })
    )
    // VALID_THEME's config.name is "test-theme" — that's the theme id used
    // to name the emitted file, sourced from the theme's authoritative
    // `config.name` (not options.theme, which may be a path).
    const themeFile = writeTheme()
    const output = join(baseDir, "out-themes-dir")

    runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output,
      blessedDir: blessedRoot,
    })

    const themeCss = join(output, "app", "styles", "themes", "test-theme.css")
    expect(existsSync(themeCss)).toBe(true)
    expect(readFileSync(themeCss, "utf-8")).toContain("--color-primary-")

    // globals.css remains the placeholder from the fixture — untouched.
    const untouched = readFileSync(join(output, "app", "globals.css"), "utf-8")
    expect(untouched).toContain("placeholder globals")
  })

  it("a manifest declaring an unknown kind is rejected by discovery and no fork happens", () => {
    // Manifest fails Zod → discovery silently skips it → spawn sees no build.
    // The dispatcher's own unknown-kind path is exercised end-to-end by the
    // lib/__tests__/theme-apply-targets.test.ts suite.
    makeBlessedBuild(
      blessedRoot,
      "admin-ui",
      "bad-target",
      JSON.stringify({
        shape: "admin-ui",
        pattern: "bad-target",
        base_theme: "reference-app",
        requires_visor: ">=1.14.0",
        captures_baseline: "captures/approved/",
        three_gates_status: "passing",
        theme_apply_target: { kind: "not-a-real-kind", path: "x" },
      })
    )
    const themeFile = writeTheme()
    const output = join(baseDir, "out-bad")

    expect(() =>
      runSpawn(baseDir, {
        from: "blessed:admin-ui:bad-target",
        theme: themeFile,
        output,
        blessedDir: blessedRoot,
      })
    ).toThrow(/No blessed build found/)
    expect(existsSync(output)).toBe(false)
  })

  it("honors a globals-css path override", () => {
    makeBlessedBuild(
      blessedRoot,
      "admin-ui",
      "test-pattern",
      manifest({
        shape: "admin-ui",
        pattern: "test-pattern",
        theme_apply_target: {
          kind: "globals-css",
          path: "app/styles/root.css",
        },
      })
    )
    const themeFile = writeTheme()
    const output = join(baseDir, "out-globals-path")

    runSpawn(baseDir, {
      from: "blessed:admin-ui:test-pattern",
      theme: themeFile,
      output,
      blessedDir: blessedRoot,
    })

    const overridden = readFileSync(
      join(output, "app", "styles", "root.css"),
      "utf-8"
    )
    expect(overridden).toContain("--color-primary-")
  })
})

describe("parseBlessedManifest (Zod schema, D9)", () => {
  it("accepts a valid manifest", () => {
    const dir = join(baseDir, "valid")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "blessed-manifest.json"), manifest())
    const result = parseBlessedManifest(dir)
    expect(result.ok).toBe(true)
  })

  it("errors clearly when the manifest is missing", () => {
    const dir = join(baseDir, "empty")
    mkdirSync(dir, { recursive: true })
    const result = parseBlessedManifest(dir)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("not a blessed build")
      expect(result.error).toContain("blessed-manifest.json")
      expect(result.error).toContain("docs/blessed-builds.md")
    }
  })

  it("rejects a manifest with an extra field", () => {
    const dir = join(baseDir, "extra")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "blessed-manifest.json"), manifest({ bogus: "nope" }))
    const result = parseBlessedManifest(dir)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("invalid blessed-manifest.json")
  })

  it("rejects a manifest missing a required field", () => {
    const dir = join(baseDir, "missing")
    mkdirSync(dir, { recursive: true })
    const partial = JSON.stringify({ shape: "admin-ui", pattern: "x" })
    writeFileSync(join(dir, "blessed-manifest.json"), partial)
    const result = parseBlessedManifest(dir)
    expect(result.ok).toBe(false)
  })

  it("rejects invalid JSON", () => {
    const dir = join(baseDir, "badjson")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "blessed-manifest.json"), "{ not json ")
    const result = parseBlessedManifest(dir)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("invalid JSON")
  })
})
