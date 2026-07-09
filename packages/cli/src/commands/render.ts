import { existsSync, mkdirSync, readFileSync } from "fs"
import { dirname, isAbsolute, join, resolve } from "path"
import { logger } from "../utils/logger.js"

/**
 * `visor render` — single-component render-fidelity harness (BO-66).
 *
 * Renders ONE real Visor component to a PNG using the REAL emitted tokens
 * (`packages/tokens/dist/tokens.css`) + the REAL per-theme CSS
 * (`packages/docs/app/<slug>-theme.css`) + the REAL component `.tsx`
 * (esbuild-bundled), fully serverless — no `next dev`. Fast enough to run
 * per-component per-PR as a fidelity gate.
 *
 *   visor render <component> --theme <slug> --mode <light|dark> [--out <path>] [--fixture <name>] [--state <name>]
 *
 * Why serverless + single-component (not the docs e2e suite): `themes.spec.ts`
 * only covers the curated ComparatorSpecimen subset and diffs vs the previous
 * baseline (never an approved design); `generate-previews.ts` boots the full
 * Next docs server for 3 hardcoded components. This harness is CLI-native and
 * serverless so it runs fast, per-component.
 *
 * Playwright + esbuild are LAZY/OPTIONAL deps (loaded only when this command
 * runs) so `npx visor` consumers who never render pay no install-size cost.
 */

export interface RenderOptions {
  theme: string
  mode?: string
  out?: string
  fixture?: string
  state?: string
  width?: string
  height?: string
  keep?: boolean
  json?: boolean
}

// A component fixture: a JS-source props expression (may reference `React`)
// plus an optional explicit export name and interactive-state target selector.
interface Fixture {
  /** Named export to render. Defaults to the PascalCase of the component name. */
  export?: string
  /** JS source that evaluates to the component's props object. `React` is in scope. */
  props: string
  /** CSS selector (inside #root) to drive for interactive-state capture. */
  interactiveTarget?: string
}

/**
 * Default fixtures give each render real content, not an empty shell. Keyed
 * `<component> -> <fixture-name>`; "default" is used when `--fixture` is omitted.
 * Components without a registered fixture render with empty props and a warning.
 */
export const FIXTURES: Record<string, Record<string, Fixture>> = {
  "stat-card": {
    default: {
      export: "StatCard",
      props: `{
        label: "Total Revenue",
        value: "$48,120",
        delta: { value: "+12.4%", direction: "up", label: "vs last month" },
        footer: "Updated moments ago",
      }`,
    },
  },
  "doc-nav": {
    default: {
      export: "DocNav",
      interactiveTarget: '[data-slot="doc-nav-group-trigger"]',
      props: `{
        currentPath: "/docs/getting-started",
        docs: [
          { order: 0, label: "Overview", href: "/docs/overview" },
          { order: 1, label: "Getting Started", href: "/docs/getting-started" },
          { order: 2, label: "Installation", href: "/docs/installation" },
          { order: 1, label: "Dashboard", href: "/docs/veronica/dashboard", scope: ["Veronica"], group: "Veronica" },
          { order: 2, label: "Settings", href: "/docs/veronica/settings", scope: ["Veronica"], group: "Veronica" },
          { order: 1, label: "Overview", href: "/docs/solespark/overview", scope: ["SoleSpark"], group: "SoleSpark" },
          { order: 10, label: "Changelog", href: "/docs/changelog" },
        ],
      }`,
    },
  },
  button: {
    default: {
      export: "Button",
      interactiveTarget: "button",
      props: `{ children: "Get started" }`,
    },
  },
  badge: {
    default: {
      export: "Badge",
      props: `{ children: "New" }`,
    },
  },
}

export const VALID_MODES = new Set(["light", "dark"])
export const VALID_STATES = new Set(["default", "hover", "focus", "active"])

/** Build the clear install-prompt error for absent optional deps. */
export function missingDepsError(missing: string[]): {
  code: string
  message: string
  hint: string
} {
  const installArgs = missing.join(" ")
  const needsBrowsers = missing.includes("playwright")
  return {
    code: "OPTIONAL_DEP_MISSING",
    message: `\`visor render\` needs ${missing.join(" and ")}, which ${
      missing.length > 1 ? "are" : "is"
    } not installed.`,
    hint: `Install with: npm install -D ${installArgs}${
      needsBrowsers ? " && npx playwright install chromium" : ""
    }`,
  }
}

export function pascalCase(kebab: string): string {
  return kebab
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

/** Resolve the first existing path from a candidate list. */
function firstExisting(candidates: string[]): string | null {
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

/** Locate the component `.tsx` for `<name>` relative to `cwd`. */
export function resolveComponentFile(cwd: string, name: string): string | null {
  return firstExisting([
    resolve(cwd, "components", "ui", name, `${name}.tsx`),
    resolve(cwd, "components", "devtools", name, `${name}.tsx`),
    resolve(cwd, "components", "ui", name, "index.tsx"),
  ])
}

/** Locate the emitted per-theme CSS for `<slug>` relative to `cwd`. */
export function resolveThemeCssFile(cwd: string, slug: string): string | null {
  return firstExisting([
    resolve(cwd, "packages", "docs", "app", `${slug}-theme.css`),
    resolve(cwd, "app", `${slug}-theme.css`),
    resolve(cwd, `${slug}-theme.css`),
  ])
}

/** Locate the emitted base tokens CSS relative to `cwd`. */
export function resolveTokensCssFile(cwd: string): string | null {
  return firstExisting([
    resolve(cwd, "packages", "tokens", "dist", "tokens.css"),
    resolve(cwd, "node_modules", "@loworbitstudio", "visor-core", "dist", "tokens.css"),
  ])
}

/**
 * Lazily load an optional dependency. Returns the module or `null` if it is not
 * installed. Mirrors the optional-dependency handling used for browser tooling
 * that must not bloat the published CLI (see fonts-add's env-guard pattern).
 */
async function loadOptional(moduleName: "playwright" | "esbuild"): Promise<unknown | null> {
  try {
    return await import(moduleName)
  } catch {
    return null
  }
}

/**
 * Settle helpers ported from the playbook's `scripts/fidelity/settle.mjs`
 * (font + animation settling). Ported inline — the CLI is npm-distributed and
 * cannot depend on the playbook checkout. `page` is typed loosely because the
 * CLI's tsconfig omits the DOM lib; browser-side bodies are passed as strings.
 */
const ANIMATION_DISABLE_CSS =
  "*, *::before, *::after { " +
  "animation-duration: 0s !important; animation-delay: 0s !important; " +
  "transition-duration: 0s !important; transition-delay: 0s !important; " +
  "caret-color: transparent !important; }"

async function settle(page: any, fontsTimeout = 5000): Promise<void> {
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS })
  await page.evaluate(
    `new Promise(function (r) {` +
      `  var t = setTimeout(r, ${fontsTimeout});` +
      `  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { clearTimeout(t); r(); }); }` +
      `  else { clearTimeout(t); r(); }` +
      `})`
  )
}

/**
 * Compose the standalone HTML document.
 *
 * Cascade order matters (VI-511 footgun): base tokens first, then the real
 * per-theme CSS (which self-declares the `@layer` order and scopes per-mode by
 * ancestor — `.dark .<slug>-theme` vs `html:not(.dark) .<slug>-theme`), then the
 * component's esbuild-emitted CSS, then harness layout. The theme class lives on
 * `#theme-scope` (NOT `<html>`), so `<html>` stays OUTSIDE the theme scope and
 * exposes the RAW tokens.css value of any custom property — the base probe reads
 * it to prove the themed surface resolved to its mapped value, not the primitive.
 */
export function buildHtml(opts: {
  tokensCss: string
  themeCss: string
  componentCss: string
  bundleJs: string
  themeClass: string
  mode: string
}): string {
  const htmlClass = opts.mode === "dark" ? "dark" : ""
  return `<!doctype html>
<html lang="en" class="${htmlClass}" style="color-scheme: ${opts.mode}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style data-visor="tokens">
${opts.tokensCss}
</style>
<style data-visor="theme">
${opts.themeCss}
</style>
<style data-visor="component">
${opts.componentCss}
</style>
<style data-visor="harness">
html, body { margin: 0; padding: 0; }
#theme-scope {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-page, #ffffff);
  color: var(--text-primary, #111827);
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
}
#root { width: 100%; max-width: 420px; }
</style>
</head>
<body>
<div id="theme-scope" class="${opts.themeClass}">
<div id="root"></div>
</div>
<script>
${opts.bundleJs}
</script>
</body>
</html>`
}

/** Generate the esbuild entry that mounts the real component with its fixture. */
export function buildEntrySource(
  componentFile: string,
  fixture: Fixture,
  exportName: string
): string {
  return `import * as React from "react";
import { createRoot } from "react-dom/client";
import * as __mod from ${JSON.stringify(componentFile)};

function __resolveComponent(mod, preferred) {
  if (preferred && mod[preferred]) return mod[preferred];
  if (mod.default) return mod.default;
  var isComp = function (v) {
    return typeof v === "function" || (v && typeof v === "object" && "$$typeof" in v);
  };
  for (var k in mod) { if (isComp(mod[k])) return mod[k]; }
  throw new Error("visor render: no React component export found");
}

var __Component = __resolveComponent(__mod, ${JSON.stringify(exportName)});
var __props = ${fixture.props};
createRoot(document.getElementById("root")).render(
  React.createElement(__Component, __props)
);`
}

export async function renderCommand(
  component: string,
  cwd: string,
  options: RenderOptions
): Promise<void> {
  const json = options.json ?? false
  const mode = (options.mode ?? "light").toLowerCase()
  const state = (options.state ?? "default").toLowerCase()

  const fail = (code: string, message: string, extra?: Record<string, unknown>): never => {
    if (json) {
      console.log(JSON.stringify({ success: false, error: { code, message }, ...extra }, null, 2))
    } else {
      logger.error(message)
      if (extra?.hint) logger.item(String(extra.hint))
    }
    process.exit(1)
  }

  if (!VALID_MODES.has(mode)) {
    fail("BAD_MODE", `Invalid --mode "${mode}". Use "light" or "dark".`)
  }
  if (!VALID_STATES.has(state)) {
    fail("BAD_STATE", `Invalid --state "${state}". Use one of: ${[...VALID_STATES].join(", ")}.`)
  }

  // ── Resolve inputs ─────────────────────────────────────────────────────────
  const componentFile = resolveComponentFile(cwd, component)
  if (!componentFile) {
    fail(
      "COMPONENT_NOT_FOUND",
      `Component "${component}" not found under components/ui/. Expected components/ui/${component}/${component}.tsx.`
    )
  }

  const themeCssFile = resolveThemeCssFile(cwd, options.theme)
  if (!themeCssFile) {
    fail(
      "THEME_NOT_FOUND",
      `Theme "${options.theme}" not found. Expected packages/docs/app/${options.theme}-theme.css.`,
      { hint: "Run `visor theme sync` to (re)generate theme CSS, or check the slug." }
    )
  }

  const tokensCssFile = resolveTokensCssFile(cwd)
  if (!tokensCssFile) {
    fail(
      "TOKENS_NOT_FOUND",
      "Emitted tokens.css not found. Expected packages/tokens/dist/tokens.css.",
      { hint: "Run `npm run build -w packages/tokens` first." }
    )
  }

  const fixtureName = options.fixture ?? "default"
  const componentFixtures = FIXTURES[component]
  const fixture: Fixture =
    componentFixtures?.[fixtureName] ?? { props: "{}" }
  if (options.fixture && !componentFixtures?.[fixtureName]) {
    fail(
      "FIXTURE_NOT_FOUND",
      `Fixture "${fixtureName}" not registered for "${component}". Available: ${
        componentFixtures ? Object.keys(componentFixtures).join(", ") : "(none)"
      }.`
    )
  }
  if (!componentFixtures && !json) {
    logger.warn(
      `No fixture registered for "${component}" — rendering with empty props. Add one to FIXTURES in render.ts for representative content.`
    )
  }
  const exportName = fixture.export ?? pascalCase(component)

  // ── Load optional deps ──────────────────────────────────────────────────────
  const esbuild = (await loadOptional("esbuild")) as any
  const playwright = (await loadOptional("playwright")) as any
  const missing: string[] = []
  if (!esbuild) missing.push("esbuild")
  if (!playwright) missing.push("playwright")
  if (missing.length > 0) {
    const dep = missingDepsError(missing)
    fail(dep.code, dep.message, { missing, hint: dep.hint })
  }

  // ── Bundle the real component ───────────────────────────────────────────────
  let componentCss = ""
  let bundleJs = ""
  try {
    const entrySource = buildEntrySource(componentFile as string, fixture, exportName)
    const result = await esbuild.build({
      stdin: {
        contents: entrySource,
        resolveDir: cwd,
        loader: "tsx",
        sourcefile: "visor-render-entry.tsx",
      },
      bundle: true,
      format: "iife",
      platform: "browser",
      jsx: "automatic",
      write: false,
      outdir: "visor-render-out",
      define: { "process.env.NODE_ENV": '"production"' },
      banner: { js: "globalThis.process = globalThis.process || { env: {} };" },
      logLevel: "silent",
    })
    for (const file of result.outputFiles ?? []) {
      if (file.path.endsWith(".css")) componentCss += file.text
      else if (file.path.endsWith(".js")) bundleJs += file.text
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    fail("BUNDLE_FAILED", `Failed to bundle ${component}: ${message}`)
  }

  // ── Compose HTML ────────────────────────────────────────────────────────────
  const themeClass = `${options.theme}-theme`
  const html = buildHtml({
    tokensCss: readFileSync(tokensCssFile as string, "utf-8"),
    themeCss: readFileSync(themeCssFile as string, "utf-8"),
    componentCss,
    bundleJs,
    themeClass,
    mode,
  })

  // ── Render + probe + capture ────────────────────────────────────────────────
  const width = Number(options.width ?? 720)
  const height = Number(options.height ?? 640)

  const outPath = resolveOutPath(cwd, options.out, component, options.theme, mode, state)
  mkdirSync(dirname(outPath), { recursive: true })

  const browser = await playwright.chromium.launch()
  let probe: {
    themedSurfaceCard: string
    baseSurfaceCard: string
    themedBg: string
    mapped: boolean
  }
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: mode,
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    await page.setContent(html, { waitUntil: "load" })
    // Wait for React to commit the component into #root.
    await page
      .waitForFunction(
        "document.getElementById('root') && document.getElementById('root').childElementCount > 0",
        undefined,
        { timeout: 10000 }
      )
      .catch(() => {})
    await settle(page)

    // Computed-style probe: prove the themed surface resolved to its MAPPED value
    // (read from #theme-scope) and NOT the raw primitive (read from <html>, which
    // is outside the theme scope). This backs the @layer/mode-scoping assertion.
    probe = (await page.evaluate(
      `(function () {
        var scope = document.getElementById("theme-scope");
        var html = document.documentElement;
        var read = function (el, prop) {
          return getComputedStyle(el).getPropertyValue(prop).trim();
        };
        var themed = read(scope, "--surface-card");
        var base = read(html, "--surface-card");
        return {
          themedSurfaceCard: themed,
          baseSurfaceCard: base,
          themedBg: getComputedStyle(scope).backgroundColor,
          mapped: themed !== "" && themed !== base,
        };
      })()`
    )) as typeof probe

    // Drive one interactive state before capture (hover/focus/active).
    if (state !== "default") {
      const target =
        fixture.interactiveTarget ??
        "#root button, #root a, #root input, #root [tabindex]"
      const el = await page.$(target)
      if (el) {
        if (state === "hover") await el.hover()
        else if (state === "focus") await el.focus()
        else if (state === "active") {
          await el.hover()
          await page.mouse.down()
        }
        await page.waitForTimeout(80)
      } else if (!json) {
        logger.warn(`No interactive target ("${target}") found for state "${state}".`)
      }
    }

    await page.screenshot({ path: outPath, fullPage: true })
    if (state === "active") await page.mouse.up().catch(() => {})
  } finally {
    await browser.close()
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  const fileSize = existsSync(outPath) ? statBytes(outPath) : 0
  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          component,
          theme: options.theme,
          mode,
          state,
          fixture: fixtureName,
          out: outPath,
          bytes: fileSize,
          probe,
        },
        null,
        2
      )
    )
    return
  }

  logger.success(`Rendered ${component} · ${options.theme} · ${mode}${state !== "default" ? ` · ${state}` : ""}`)
  logger.item(`→ ${outPath} (${formatBytes(fileSize)})`)
  logger.blank()
  if (probe!.mapped) {
    logger.success(
      `Themed --surface-card resolved to ${probe!.themedSurfaceCard} (base primitive: ${probe!.baseSurfaceCard}) — theme mapping applied.`
    )
  } else {
    logger.warn(
      `Themed --surface-card (${probe!.themedSurfaceCard}) equals the base primitive (${probe!.baseSurfaceCard}). ` +
        `The theme override did not apply — check @layer/mode scoping (VI-511).`
    )
  }
}

export function resolveOutPath(
  cwd: string,
  out: string | undefined,
  component: string,
  theme: string,
  mode: string,
  state: string
): string {
  if (out) {
    return isAbsolute(out) ? out : resolve(cwd, out)
  }
  const suffix = state === "default" ? "" : `__${state}`
  return resolve(cwd, ".visor", "renders", `${component}__${theme}__${mode}${suffix}.png`)
}

function statBytes(path: string): number {
  try {
    return readFileSync(path).length
  } catch {
    return 0
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
