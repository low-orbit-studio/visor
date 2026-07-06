import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  blessedManifestSchema,
  type BlessedManifest,
} from "../blessed-manifest.js"
import { applyThemeToBuild } from "../theme-apply-targets/index.js"
import { applyGlobalsCss } from "../theme-apply-targets/globals-css.js"
import { applyThemesCssDir } from "../theme-apply-targets/themes-css-dir.js"

const CSS = "/* generated */\n:root { --x: 1; }\n"

const BASE_MANIFEST: Omit<BlessedManifest, "theme_apply_target"> = {
  shape: "admin-ui",
  pattern: "test-pattern",
  base_theme: "reference-app",
  requires_visor: ">=1.15.0",
  captures_baseline: "captures/approved/",
  three_gates_status: "passing",
}

let baseDir: string

beforeEach(() => {
  baseDir = join(
    tmpdir(),
    `visor-tat-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  mkdirSync(baseDir, { recursive: true })
})

afterEach(() => {
  rmSync(baseDir, { recursive: true, force: true })
})

describe("blessedManifestSchema (theme_apply_target, VI-601)", () => {
  it("accepts a manifest without theme_apply_target (backward compat)", () => {
    const result = blessedManifestSchema.safeParse(BASE_MANIFEST)
    expect(result.success).toBe(true)
  })

  it("accepts globals-css with no path", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: { kind: "globals-css" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts globals-css with a path override", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: { kind: "globals-css", path: "app/styles/root.css" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts themes-css-dir with a required path", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: {
        kind: "themes-css-dir",
        path: "app/styles/themes/",
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects themes-css-dir with a missing path", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: { kind: "themes-css-dir" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects an unknown kind", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: { kind: "palette-module", path: "lib/palette.ts" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects an extra field inside a target", () => {
    const result = blessedManifestSchema.safeParse({
      ...BASE_MANIFEST,
      theme_apply_target: {
        kind: "globals-css",
        path: "app/globals.css",
        bogus: true,
      },
    })
    expect(result.success).toBe(false)
  })
})

describe("applyGlobalsCss", () => {
  it("prefers an existing app/globals.css when no path is provided", () => {
    const buildDir = join(baseDir, "build-app")
    mkdirSync(join(buildDir, "app"), { recursive: true })
    writeFileSync(join(buildDir, "app", "globals.css"), "/* old */")

    const written = applyGlobalsCss({ buildDir, adapterCss: CSS })

    expect(written).toBe(join(buildDir, "app", "globals.css"))
    expect(readFileSync(written, "utf-8")).toBe(CSS)
  })

  it("prefers src/app/globals.css when only that variant exists", () => {
    const buildDir = join(baseDir, "build-src")
    mkdirSync(join(buildDir, "src", "app"), { recursive: true })
    writeFileSync(join(buildDir, "src", "app", "globals.css"), "/* old */")

    const written = applyGlobalsCss({ buildDir, adapterCss: CSS })

    expect(written).toBe(join(buildDir, "src", "app", "globals.css"))
    expect(readFileSync(written, "utf-8")).toBe(CSS)
  })

  it("falls back to app/globals.css when neither variant exists", () => {
    const buildDir = join(baseDir, "build-empty")
    mkdirSync(buildDir, { recursive: true })

    const written = applyGlobalsCss({ buildDir, adapterCss: CSS })

    expect(written).toBe(join(buildDir, "app", "globals.css"))
    expect(existsSync(written)).toBe(true)
  })

  it("honors an explicit relative path", () => {
    const buildDir = join(baseDir, "build-override")
    mkdirSync(buildDir, { recursive: true })

    const written = applyGlobalsCss({
      buildDir,
      adapterCss: CSS,
      path: "app/styles/root.css",
    })

    expect(written).toBe(join(buildDir, "app", "styles", "root.css"))
    expect(readFileSync(written, "utf-8")).toBe(CSS)
  })
})

describe("applyThemesCssDir", () => {
  it("writes <path>/<themeId>.css inside the build root", () => {
    const buildDir = join(baseDir, "build")
    mkdirSync(buildDir, { recursive: true })

    const written = applyThemesCssDir({
      buildDir,
      adapterCss: CSS,
      themeId: "entr",
      path: "app/styles/themes",
    })

    expect(written).toBe(
      join(buildDir, "app", "styles", "themes", "entr.css")
    )
    expect(readFileSync(written, "utf-8")).toBe(CSS)
  })

  it("creates the target directory when it does not exist", () => {
    const buildDir = join(baseDir, "build2")
    mkdirSync(buildDir, { recursive: true })

    const written = applyThemesCssDir({
      buildDir,
      adapterCss: CSS,
      themeId: "kaiah",
      path: "app/styles/themes",
    })

    expect(existsSync(join(buildDir, "app", "styles", "themes"))).toBe(true)
    expect(existsSync(written)).toBe(true)
  })
})

describe("applyThemeToBuild dispatcher", () => {
  it("falls back to globals-css when theme_apply_target is absent (backward compat)", () => {
    const buildDir = join(baseDir, "no-target")
    mkdirSync(join(buildDir, "app"), { recursive: true })
    writeFileSync(join(buildDir, "app", "globals.css"), "/* old */")

    const { writtenPath, target } = applyThemeToBuild({
      manifest: BASE_MANIFEST as BlessedManifest,
      buildDir,
      themeId: "entr",
      adapterCss: CSS,
    })

    expect(target).toEqual({ kind: "globals-css" })
    expect(writtenPath).toBe(join(buildDir, "app", "globals.css"))
    expect(readFileSync(writtenPath, "utf-8")).toBe(CSS)
  })

  it("dispatches themes-css-dir to <path>/<themeId>.css", () => {
    const buildDir = join(baseDir, "themes-dir")
    mkdirSync(buildDir, { recursive: true })

    const { writtenPath } = applyThemeToBuild({
      manifest: {
        ...BASE_MANIFEST,
        theme_apply_target: {
          kind: "themes-css-dir",
          path: "app/styles/themes",
        },
      },
      buildDir,
      themeId: "entr",
      adapterCss: CSS,
    })

    expect(writtenPath).toBe(
      join(buildDir, "app", "styles", "themes", "entr.css")
    )
    expect(readFileSync(writtenPath, "utf-8")).toBe(CSS)
  })

  it("errors clearly with a docs hint when themes-css-dir has no theme id", () => {
    const buildDir = join(baseDir, "themes-dir-no-id")
    mkdirSync(buildDir, { recursive: true })

    expect(() =>
      applyThemeToBuild({
        manifest: {
          ...BASE_MANIFEST,
          theme_apply_target: {
            kind: "themes-css-dir",
            path: "app/styles/themes",
          },
        },
        buildDir,
        themeId: "",
        adapterCss: CSS,
      })
    ).toThrow(/themes-css-dir.*theme id.*docs\/blessed-builds\.md/)
  })

  it("errors clearly with a docs hint on an unknown kind", () => {
    const buildDir = join(baseDir, "unknown")
    mkdirSync(buildDir, { recursive: true })

    expect(() =>
      applyThemeToBuild({
        manifest: {
          ...BASE_MANIFEST,
          theme_apply_target: {
            kind: "palette-module",
          } as unknown as BlessedManifest["theme_apply_target"],
        },
        buildDir,
        themeId: "entr",
        adapterCss: CSS,
      })
    ).toThrow(/Unknown theme_apply_target kind.*docs\/blessed-builds\.md/)
  })
})
