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
import { themeApplyCommand } from "../commands/theme-apply.js"

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, "fixtures", "sandbox-handoff.md")
const COMPOSE_FIXTURE = join(HERE, "fixtures", "sandbox-handoff-compose.md")

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

  it("bakes turbopack.root into the generated next.config.ts (VI-440)", async () => {
    await sandboxInitCommand("test-pattern", testDir, {
      handoff: FIXTURE,
      theme: "space",
      skipInstall: true,
    })

    const nextConfigSource = readFileSync(
      join(testDir, ".lo", "sandbox", "test-pattern", "next.config.ts"),
      "utf-8"
    )
    // Anchors turbopack root to the sandbox dir so a parent-repo package-lock.json
    // doesn't pull the workspace root upstream.
    expect(nextConfigSource).toContain('import { fileURLToPath } from "node:url"')
    expect(nextConfigSource).toContain("const __dirname = path.dirname(fileURLToPath(import.meta.url))")
    expect(nextConfigSource).toContain("turbopack: { root: __dirname }")
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

  describe("Gate 3 reclassification — shipped primitives missing from registry", () => {
    it("reclassifies shipped entries absent from the registry as compose-recipe in sandbox.json", async () => {
      await sandboxInitCommand("compose-pattern", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const config = JSON.parse(
        readFileSync(join(testDir, ".lo", "sandbox", "compose-pattern", "sandbox.json"), "utf-8")
      ) as {
        primitives: Array<{ name: string; status: string; viTicket: string | null }>
      }

      const roleCell = config.primitives.find((p) => p.name === "role-cell")
      const inviteChip = config.primitives.find((p) => p.name === "invite-status-chip")
      expect(roleCell?.status).toBe("compose-recipe")
      expect(roleCell?.viTicket).toBeNull()
      expect(inviteChip?.status).toBe("compose-recipe")
      expect(inviteChip?.viTicket).toBeNull()
    })

    it("records reclassified entries in sandbox-manifest.ts", async () => {
      await sandboxInitCommand("compose-pattern", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const manifestSource = readFileSync(
        join(testDir, ".lo", "sandbox", "compose-pattern", "lib", "sandbox-manifest.ts"),
        "utf-8"
      )
      expect(manifestSource).toContain("role-cell")
      expect(manifestSource).toContain("invite-status-chip")
      expect(manifestSource).toContain('"status": "compose-recipe"')
    })

    it("does not invoke addCommand for reclassified compose-recipe entries", async () => {
      await sandboxInitCommand("compose-pattern", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const called = vi.mocked(addCommand).mock.calls
      const names = called.map((c) => c[0][0])
      expect(names).toContain("button")
      expect(names).toContain("badge")
      expect(names).not.toContain("role-cell")
      expect(names).not.toContain("invite-status-chip")
    })

    it("leaves gap-new entries untouched after reclassification", async () => {
      await sandboxInitCommand("compose-pattern", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const config = JSON.parse(
        readFileSync(join(testDir, ".lo", "sandbox", "compose-pattern", "sandbox.json"), "utf-8")
      ) as {
        primitives: Array<{ name: string; status: string; viTicket: string | null }>
      }

      const widgetStack = config.primitives.find((p) => p.name === "widget-stack")
      const statusPill = config.primitives.find((p) => p.name === "status-pill")
      expect(widgetStack?.status).toBe("gap-new")
      expect(statusPill?.status).toBe("gap-new")
      expect(statusPill?.viTicket).toBe("VI-999")

      const stubsDir = join(testDir, ".lo", "sandbox", "compose-pattern", "components", "stubs")
      expect(existsSync(join(stubsDir, "widget-stack.tsx"))).toBe(true)
      expect(existsSync(join(stubsDir, "status-pill.tsx"))).toBe(true)
      expect(existsSync(join(stubsDir, "role-cell.tsx"))).toBe(false)
      expect(existsSync(join(stubsDir, "invite-status-chip.tsx"))).toBe(false)
    })

    it("emits an informational warning naming the reclassified primitives", async () => {
      await sandboxInitCommand("compose-pattern", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const config = JSON.parse(
        readFileSync(join(testDir, ".lo", "sandbox", "compose-pattern", "sandbox.json"), "utf-8")
      ) as { primitives: Array<{ name: string; status: string }> }
      // The warning is emitted via manifest.warnings — surfaced through
      // SandboxInitJsonResult.warnings. Re-run with --json to inspect.
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      await sandboxInitCommand("compose-pattern-json", testDir, {
        handoff: COMPOSE_FIXTURE,
        theme: "space",
        skipInstall: true,
        json: true,
      })
      const lastJson = logSpy.mock.calls.flat().join("\n")
      logSpy.mockRestore()
      expect(lastJson).toMatch(/reclassified as compose-recipe/)
      expect(lastJson).toMatch(/role-cell/)
      // The original sandbox.json is consistent with the JSON-mode run.
      expect(config.primitives.find((p) => p.name === "role-cell")?.status).toBe(
        "compose-recipe"
      )
    })
  })

  describe("--from-html-prototype", () => {
    const PROTOTYPE_FIXTURE = join(HERE, "fixtures", "prototype-org-mgmt")

    it("copies prototype files into public/prototype/ and pairs them with manifest screens", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const sandboxDir = join(testDir, ".lo", "sandbox", "test-pattern")
      expect(existsSync(join(sandboxDir, "public", "prototype", "screen-1-list.html"))).toBe(true)
      expect(existsSync(join(sandboxDir, "public", "prototype", "screen-2-detail.html"))).toBe(true)
      expect(existsSync(join(sandboxDir, "public", "prototype", "styles.css"))).toBe(true)
    })

    it("emits an iframe-loading screen route with the screen-to-html map baked in", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const routeSource = readFileSync(
        join(testDir, ".lo", "sandbox", "test-pattern", "app", "screens", "[name]", "page.tsx"),
        "utf-8"
      )
      expect(routeSource).toContain("SCREEN_HTML")
      expect(routeSource).toContain("screen-1-list.html")
      expect(routeSource).toContain("screen-2-detail.html")
      expect(routeSource).toContain("<iframe")
      expect(routeSource).toContain("/prototype/")
    })

    it("records fromHtmlPrototype in sandbox.json", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const config = JSON.parse(
        readFileSync(join(testDir, ".lo", "sandbox", "test-pattern", "sandbox.json"), "utf-8")
      ) as { fromHtmlPrototype: { sourceDir: string; screenMap: Record<string, string> } | null }
      expect(config.fromHtmlPrototype).not.toBeNull()
      expect(config.fromHtmlPrototype?.sourceDir).toBe(PROTOTYPE_FIXTURE)
      expect(config.fromHtmlPrototype?.screenMap["list-view"]).toBe("screen-1-list.html")
      expect(config.fromHtmlPrototype?.screenMap["detail-view"]).toBe("screen-2-detail.html")
    })

    it("errors when the prototype directory does not exist", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)

      await expect(
        sandboxInitCommand("test-pattern", testDir, {
          handoff: FIXTURE,
          theme: "space",
          fromHtmlPrototype: join(testDir, "does-not-exist"),
          skipInstall: true,
        })
      ).rejects.toThrow(/process.exit/)

      exitSpy.mockRestore()
    })

    it("leaves the placeholder screen route alone when --from-html-prototype is not passed", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        skipInstall: true,
      })
      const routeSource = readFileSync(
        join(testDir, ".lo", "sandbox", "test-pattern", "app", "screens", "[name]", "page.tsx"),
        "utf-8"
      )
      expect(routeSource).not.toContain("SCREEN_HTML")
      expect(routeSource).not.toContain("<iframe")
      expect(routeSource).toContain("ScreenSample")
    })

    it("auto-discovers state-coverage screens beyond the manifest's named screens", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const config = JSON.parse(
        readFileSync(join(testDir, ".lo", "sandbox", "test-pattern", "sandbox.json"), "utf-8")
      ) as {
        screens: Array<{ name: string; kind: string }>
        fromHtmlPrototype: {
          screenMap: Record<string, string>
          stateCoverageScreens: string[]
        } | null
      }

      // The fixture handoff declares 2 named screens; the prototype dir has 5
      // `screen-N-*.html` files. Screens 3/4/5 should become state-coverage.
      const named = config.screens.filter((s) => s.kind === "named")
      const stateCov = config.screens.filter((s) => s.kind === "state-coverage")
      expect(named.map((s) => s.name)).toEqual(["list-view", "detail-view"])
      expect(stateCov.map((s) => s.name)).toEqual([
        "state-coverage-menus",
        "state-coverage-feedback",
        "state-coverage-edge-states",
      ])

      expect(config.fromHtmlPrototype?.stateCoverageScreens).toEqual([
        "state-coverage-menus",
        "state-coverage-feedback",
        "state-coverage-edge-states",
      ])
      expect(config.fromHtmlPrototype?.screenMap["state-coverage-menus"]).toBe(
        "screen-3-menus.html"
      )
      expect(config.fromHtmlPrototype?.screenMap["state-coverage-edge-states"]).toBe(
        "screen-5-edge-states.html"
      )
    })

    it("includes state-coverage screens in the iframe-loading screen route map", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const routeSource = readFileSync(
        join(testDir, ".lo", "sandbox", "test-pattern", "app", "screens", "[name]", "page.tsx"),
        "utf-8"
      )
      expect(routeSource).toContain('"state-coverage-menus"')
      expect(routeSource).toContain('"screen-3-menus.html"')
      expect(routeSource).toContain('"state-coverage-feedback"')
      expect(routeSource).toContain('"state-coverage-edge-states"')
    })

    it("records kind: 'state-coverage' in the runtime sandbox-manifest.ts module", async () => {
      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        fromHtmlPrototype: PROTOTYPE_FIXTURE,
        skipInstall: true,
      })

      const manifestSource = readFileSync(
        join(testDir, ".lo", "sandbox", "test-pattern", "lib", "sandbox-manifest.ts"),
        "utf-8"
      )
      expect(manifestSource).toContain('"state-coverage-menus"')
      expect(manifestSource).toContain('"kind": "state-coverage"')
      expect(manifestSource).toContain('"kind": "named"')
    })
  })

  describe("theme resolution", () => {
    const ORIGINAL_PRIVATE_PATH = process.env.VISOR_THEMES_PRIVATE_PATH

    afterEach(() => {
      if (ORIGINAL_PRIVATE_PATH === undefined) {
        delete process.env.VISOR_THEMES_PRIVATE_PATH
      } else {
        process.env.VISOR_THEMES_PRIVATE_PATH = ORIGINAL_PRIVATE_PATH
      }
    })

    it("resolves themes via VISOR_THEMES_PRIVATE_PATH when set", async () => {
      const { writeFileSync, mkdirSync: mkdirSyncFs } = await import("fs")
      const privateRoot = join(testDir, "themes-private")
      const themeDir = join(privateRoot, "themes", "entr")
      mkdirSyncFs(themeDir, { recursive: true })
      const themePath = join(themeDir, "theme.visor.yaml")
      writeFileSync(themePath, "name: entr\n")

      process.env.VISOR_THEMES_PRIVATE_PATH = privateRoot

      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "entr",
        skipInstall: true,
      })

      const calls = vi.mocked(themeApplyCommand).mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]?.[0]).toBe(themePath)
    })

    it("--theme-file overrides everything else, even without the env var", async () => {
      delete process.env.VISOR_THEMES_PRIVATE_PATH
      const { writeFileSync } = await import("fs")
      const explicitThemePath = join(testDir, "explicit.visor.yaml")
      writeFileSync(explicitThemePath, "name: explicit\n")

      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "entr",
        themeFile: explicitThemePath,
        skipInstall: true,
      })

      const calls = vi.mocked(themeApplyCommand).mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]?.[0]).toBe(explicitThemePath)
    })

    it("--theme-file wins over VISOR_THEMES_PRIVATE_PATH when both resolve", async () => {
      const { writeFileSync, mkdirSync: mkdirSyncFs } = await import("fs")
      const privateRoot = join(testDir, "themes-private")
      const themeDir = join(privateRoot, "themes", "entr")
      mkdirSyncFs(themeDir, { recursive: true })
      const envThemePath = join(themeDir, "theme.visor.yaml")
      writeFileSync(envThemePath, "name: entr-env\n")

      const explicitThemePath = join(testDir, "explicit.visor.yaml")
      writeFileSync(explicitThemePath, "name: entr-explicit\n")

      process.env.VISOR_THEMES_PRIVATE_PATH = privateRoot

      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "entr",
        themeFile: explicitThemePath,
        skipInstall: true,
      })

      const calls = vi.mocked(themeApplyCommand).mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]?.[0]).toBe(explicitThemePath)
    })

    it("falls back to themes/ when env var and --theme-file are absent", async () => {
      delete process.env.VISOR_THEMES_PRIVATE_PATH
      const { writeFileSync, mkdirSync: mkdirSyncFs } = await import("fs")
      const themesDir = join(testDir, "themes")
      mkdirSyncFs(themesDir, { recursive: true })
      const fallbackPath = join(themesDir, "space.visor.yaml")
      writeFileSync(fallbackPath, "name: space\n")

      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "space",
        skipInstall: true,
      })

      const calls = vi.mocked(themeApplyCommand).mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]?.[0]).toBe(fallbackPath)
    })

    it("warns with an actionable command when no theme path resolves", async () => {
      delete process.env.VISOR_THEMES_PRIVATE_PATH

      const logSpy = vi.spyOn(console, "log")

      await sandboxInitCommand("test-pattern", testDir, {
        handoff: FIXTURE,
        theme: "missing-theme",
        json: true,
        skipInstall: true,
      })

      expect(vi.mocked(themeApplyCommand)).not.toHaveBeenCalled()

      // With json: true the entire result is JSON-stringified to stdout (the
      // last console.log call). Its `warnings` array carries the theme miss.
      const lastCall = logSpy.mock.calls.at(-1)
      const jsonOutput = lastCall?.[0] as string
      const result = JSON.parse(jsonOutput) as { warnings: string[] }
      const themeWarning = result.warnings.find((w) => w.includes("missing-theme"))
      expect(themeWarning).toBeTruthy()
      expect(themeWarning).toContain("--theme-file")
      expect(themeWarning).toContain("VISOR_THEMES_PRIVATE_PATH")
      expect(themeWarning).toContain("visor theme apply")
    })
  })
})
