import { existsSync, readFileSync } from "fs"
import { dirname, resolve } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildEntrySource,
  buildHtml,
  FIXTURES,
  missingDepsError,
  pascalCase,
  renderCommand,
  resolveComponentFile,
  resolveOutPath,
  resolveResetCssFile,
  resolveThemeCssFile,
  resolveTokensCssFile,
} from "../commands/render.js"

// ── Locate the repo root (dir containing components/ui) by walking up from cwd.
// import.meta.url is unreliable under vitest's threads pool (see memory), so we
// walk from process.cwd() which is the package or repo root.
function findRepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "components", "ui"))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

const REPO_ROOT = findRepoRoot()

describe("render — pure helpers", () => {
  it("pascalCase converts kebab component names to export names", () => {
    expect(pascalCase("doc-nav")).toBe("DocNav")
    expect(pascalCase("stat-card")).toBe("StatCard")
    expect(pascalCase("button")).toBe("Button")
    expect(pascalCase("admin-detail-drawer")).toBe("AdminDetailDrawer")
  })

  it("resolveComponentFile finds a real component under components/ui", () => {
    const file = resolveComponentFile(REPO_ROOT, "stat-card")
    expect(file).not.toBeNull()
    expect(file).toContain("components/ui/stat-card/stat-card.tsx")
  })

  it("resolveComponentFile returns null for an unknown component", () => {
    expect(resolveComponentFile(REPO_ROOT, "no-such-component-xyz")).toBeNull()
  })

  it("resolveThemeCssFile finds the emitted per-theme CSS", () => {
    const file = resolveThemeCssFile(REPO_ROOT, "space")
    expect(file).not.toBeNull()
    expect(file).toContain("space-theme.css")
  })

  it("resolveThemeCssFile returns null for an unknown theme", () => {
    expect(resolveThemeCssFile(REPO_ROOT, "no-such-theme")).toBeNull()
  })

  it("resolveOutPath defaults to .visor/renders and appends state suffix", () => {
    const dflt = resolveOutPath("/repo", undefined, "doc-nav", "space", "dark", "default")
    expect(dflt).toBe("/repo/.visor/renders/doc-nav__space__dark.png")
    const hover = resolveOutPath("/repo", undefined, "button", "neutral", "light", "hover")
    expect(hover).toBe("/repo/.visor/renders/button__neutral__light__hover.png")
  })

  it("resolveOutPath honours an explicit relative or absolute --out", () => {
    expect(resolveOutPath("/repo", "shot.png", "x", "y", "dark", "default")).toBe("/repo/shot.png")
    expect(resolveOutPath("/repo", "/tmp/a.png", "x", "y", "dark", "default")).toBe("/tmp/a.png")
  })

  it("FIXTURES registers representative content for the sanity-check components", () => {
    expect(FIXTURES["doc-nav"].default.props).toContain("currentPath")
    expect(FIXTURES["stat-card"].default.props).toContain("Total Revenue")
    expect(FIXTURES["button"].default.export).toBe("Button")
  })
})

describe("render — optional-dep error path", () => {
  it("missingDepsError names the deps and prints a clear install prompt", () => {
    const both = missingDepsError(["esbuild", "playwright"])
    expect(both.code).toBe("OPTIONAL_DEP_MISSING")
    expect(both.message).toContain("esbuild and playwright")
    expect(both.hint).toContain("npm install -D esbuild playwright")
    // Playwright browsers require a second install step — the prompt says so.
    expect(both.hint).toContain("npx playwright install chromium")
  })

  it("missingDepsError omits the browser step when only esbuild is missing", () => {
    const only = missingDepsError(["esbuild"])
    expect(only.message).toContain("esbuild, which is not installed")
    expect(only.hint).toContain("npm install -D esbuild")
    expect(only.hint).not.toContain("playwright install")
  })
})

describe("render — CSS cascade + entry composition", () => {
  it("buildHtml orders tokens → theme → component and puts the theme class on <body> (so portals inherit it), not <html>", () => {
    const html = buildHtml({
      resetCss: "/* RESET */",
      tokensCss: "/* TOKENS */",
      themeCss: "/* THEME */",
      componentCss: "/* COMPONENT */",
      bundleJs: "/* JS */",
      themeClass: "space-theme",
      mode: "dark",
    })
    const resetIdx = html.indexOf("/* RESET */")
    const tokensIdx = html.indexOf("/* TOKENS */")
    const themeIdx = html.indexOf("/* THEME */")
    const componentIdx = html.indexOf("/* COMPONENT */")
    // Cascade order: base tokens before theme overrides before component CSS.
    expect(resetIdx).toBeGreaterThan(-1)
    expect(resetIdx).toBeLessThan(tokensIdx)
    expect(html).toContain('<style data-visor="reset">')
    expect(tokensIdx).toBeLessThan(themeIdx)
    expect(themeIdx).toBeLessThan(componentIdx)
    // Dark mode stamps <html class="dark">; the theme class lives on <body>
    // (VI-692: Radix portals mount there), leaving <html> outside the theme scope
    // for the base probe.
    expect(html).toContain('<html lang="en" class="dark"')
    expect(html).toContain('<body class="space-theme">')
    expect(html).toContain('<div id="theme-scope">')
    expect(html).not.toMatch(/<html[^>]*space-theme/)
  })

  it("buildHtml binds <body> to the same --font-body token the nextjs adapter binds to body", () => {
    const html = buildHtml({
      resetCss: "r", tokensCss: "t", themeCss: "th", componentCss: "c", bundleJs: "j",
      themeClass: "x-theme", mode: "light",
    })
    expect(html).toMatch(/font-family: var\(--font-body, var\(--font-sans,/)
  })

  it("resolveResetCssFile finds visor-core's reset from the workspace build", () => {
    const f = resolveResetCssFile(REPO_ROOT)
    expect(f).not.toBeNull()
    expect(f).toMatch(/reset\.css$/)
  })

  it("resolveResetCssFile returns null when no reset is present", () => {
    expect(resolveResetCssFile("/nonexistent-visor-dir")).toBeNull()
  })

  it("buildHtml leaves <html> without the dark class in light mode", () => {
    const html = buildHtml({
      resetCss: "/* RESET */",
      tokensCss: "t",
      themeCss: "th",
      componentCss: "c",
      bundleJs: "j",
      themeClass: "neutral-theme",
      mode: "light",
    })
    expect(html).toContain('<html lang="en" class=""')
    expect(html).toContain("color-scheme: light")
  })

  it("buildEntrySource imports the real component file and injects the fixture props", () => {
    const src = buildEntrySource(
      "/abs/components/ui/stat-card/stat-card.tsx",
      FIXTURES["stat-card"].default,
      "StatCard"
    )
    expect(src).toContain('import * as __mod from "/abs/components/ui/stat-card/stat-card.tsx"')
    expect(src).toContain("react-dom/client")
    expect(src).toContain('__resolveComponent(__mod, "StatCard")')
    expect(src).toContain("Total Revenue")
  })
})

describe("render — command validation (no browser)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockExit() {
    return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`)
    }) as never)
  }

  it("rejects an invalid --mode before touching the browser", async () => {
    mockExit()
    await expect(
      renderCommand("stat-card", REPO_ROOT, { theme: "space", mode: "sideways", json: true })
    ).rejects.toThrow("process.exit(1)")
    const out = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join("\n")
    expect(out).toContain("BAD_MODE")
  })

  it("errors clearly when the component does not exist", async () => {
    mockExit()
    await expect(
      renderCommand("no-such-component-xyz", REPO_ROOT, { theme: "space", mode: "dark", json: true })
    ).rejects.toThrow("process.exit(1)")
    const out = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join("\n")
    expect(out).toContain("COMPONENT_NOT_FOUND")
  })
})

// ── Full render integration — gated on Playwright's chromium binary AND a built
// tokens.css so CI (which may lack browsers / an unbuilt tokens dist) stays green.
async function browserReady(): Promise<boolean> {
  try {
    const pw = (await import("playwright")) as { chromium: { executablePath: () => string } }
    return existsSync(pw.chromium.executablePath())
  } catch {
    return false
  }
}

const INTEGRATION_READY =
  (await browserReady()) && resolveTokensCssFile(REPO_ROOT) !== null

describe.skipIf(!INTEGRATION_READY)("render — full integration (browser + real tokens/theme)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function runProbe(mode: "light" | "dark", theme = "space") {
    const out = resolve(
      REPO_ROOT,
      ".visor",
      "renders",
      `__test_stat-card__${theme}__${mode}.png`
    )
    await renderCommand("stat-card", REPO_ROOT, { theme, mode, out, json: true })
    const line = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c) => c[0] as string)
      .find((c) => typeof c === "string" && c.includes('"success"'))
    return { result: JSON.parse(line as string), out }
  }

  it(
    "renders a real component with mapped theme surfaces (not raw primitives)",
    async () => {
      const { result, out } = await runProbe("dark")
      expect(result.success).toBe(true)
      expect(existsSync(out)).toBe(true)
      expect(result.bytes).toBeGreaterThan(1000)
      // The themed surface resolved to its mapped value, not the base primitive.
      expect(result.probe.mapped).toBe(true)
      expect(result.probe.themedSurfaceCard).not.toBe(result.probe.baseSurfaceCard)
    },
    60000
  )

  // VI-692: the probe reads the themed <body> against raw <html>.
  it.each(["blacklight-app", "space", "neutral"])(
    "probe reports mapped=true for %s (theme class on <body>)",
    async (theme) => {
      const { result } = await runProbe("dark", theme)
      expect(result.success).toBe(true)
      expect(result.probe.mapped).toBe(true)
    },
    60000
  )

  it(
    "resolves different surfaces for dark vs light (mode scoping works)",
    async () => {
      const dark = await runProbe("dark")
      vi.restoreAllMocks()
      vi.spyOn(console, "log").mockImplementation(() => {})
      const light = await runProbe("light")
      expect(dark.result.probe.themedSurfaceCard).not.toBe(
        light.result.probe.themedSurfaceCard
      )
    },
    90000
  )
})

// VI-682 — native controls wear the theme's body font in the harness. Gated on the
// chromium binary + built reset, like the integration suite above.
const FONT_READY = (await browserReady()) && resolveResetCssFile(REPO_ROOT) !== null

describe.skipIf(!FONT_READY)("render — native button wears the theme body font (VI-682)", () => {
  const THEME_FONT = "Menlo, monospace"
  const page = (resetCss: string) =>
    buildHtml({
      resetCss,
      tokensCss: "",
      themeCss: `.fixture-theme { --font-body: ${THEME_FONT}; }`,
      componentCss: "",
      bundleJs: 'document.getElementById("root").innerHTML = "<button id=b>Label</button>";',
      themeClass: "fixture-theme",
      mode: "light",
    })

  async function buttonFont(html: string): Promise<string> {
    const pw = (await import("playwright")) as any
    const browser = await pw.chromium.launch()
    try {
      const p = await browser.newPage()
      await p.setContent(html, { waitUntil: "load" })
      return await p.evaluate(
        'getComputedStyle(document.getElementById("b")).fontFamily'
      )
    } finally {
      await browser.close()
    }
  }

  it("computed button font-family equals the theme body font with the reset injected", async () => {
    const reset = readFileSync(resolveResetCssFile(REPO_ROOT) as string, "utf-8")
    expect(await buttonFont(page(reset))).toBe(THEME_FONT)
  }, 60000)

  it("mutation control: dropping the reset leaves the button in the browser default font", async () => {
    expect(await buttonFont(page(""))).not.toBe(THEME_FONT)
  }, 60000)
})
