import { mkdirSync, writeFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"
import type { HandoffManifest } from "./parse-handoff.js"
import type { PrototypeImport } from "./html-prototype.js"
import {
  captureScriptTemplate,
  gitignoreTemplate,
  globalsCssPlaceholder,
  indexPageTemplate,
  nextConfigTemplate,
  nextEnvDtsTemplate,
  packageJsonTemplate,
  primitiveRouteTemplate,
  prototypeScreenRouteTemplate,
  readmeTemplate,
  rootLayoutTemplate,
  sandboxManifestModule,
  sandboxMocksModule,
  sandboxSampleComponent,
  screenRouteTemplate,
  stubTemplate,
  tsconfigTemplate,
} from "./templates.js"

export interface ScaffoldResult {
  created: string[]
}

export interface ScaffoldOptions {
  prototypeImport?: PrototypeImport
}

/**
 * Write the Next.js sandbox scaffold into `sandboxDir`. Caller is responsible
 * for ensuring `sandboxDir` is empty (or that overwrite is intentional).
 */
export function writeScaffold(
  sandboxDir: string,
  manifest: HandoffManifest,
  port: number,
  options: ScaffoldOptions = {}
): ScaffoldResult {
  mkdirSync(sandboxDir, { recursive: true })
  const created: string[] = []

  const writeIfNew = (rel: string, contents: string): void => {
    const full = join(sandboxDir, rel)
    mkdirSync(dirOf(full), { recursive: true })
    writeFileSync(full, contents, "utf-8")
    created.push(rel)
  }

  writeIfNew("package.json", packageJsonTemplate(manifest.pattern))
  writeIfNew("tsconfig.json", tsconfigTemplate())
  writeIfNew("next.config.ts", nextConfigTemplate())
  writeIfNew("next-env.d.ts", nextEnvDtsTemplate())
  writeIfNew(".gitignore", gitignoreTemplate())
  writeIfNew("README.md", readmeTemplate(manifest, port))

  writeIfNew("app/layout.tsx", rootLayoutTemplate(manifest.pattern))
  writeIfNew("app/globals.css", globalsCssPlaceholder())
  writeIfNew("app/page.tsx", indexPageTemplate())
  writeIfNew("app/primitives/[name]/page.tsx", primitiveRouteTemplate())
  writeIfNew(
    "app/screens/[name]/page.tsx",
    options.prototypeImport
      ? prototypeScreenRouteTemplate(options.prototypeImport.screenMap)
      : screenRouteTemplate()
  )

  writeIfNew("components/sandbox-sample.tsx", sandboxSampleComponent())

  writeIfNew("lib/sandbox-manifest.ts", sandboxManifestModule(manifest))
  writeIfNew("lib/sandbox-mocks.ts", sandboxMocksModule(manifest.mockShapes))

  for (const p of manifest.primitives) {
    if (p.status === "gap-new") {
      writeIfNew(`components/stubs/${p.name}.tsx`, stubTemplate(p))
    }
  }

  // Capture script lives in the sandbox root so it can import sandbox-local
  // devDeps (@playwright/test, pixelmatch). Written here once so 'approve'
  // does not have to regenerate it every run.
  writeIfNew("playwright.capture.mjs", captureScriptTemplate())

  // Pre-create capture dirs so consumers don't see empty-state confusion.
  mkdirSync(join(sandboxDir, "captures", "approved"), { recursive: true })

  return { created }
}

function dirOf(p: string): string {
  const idx = p.lastIndexOf("/")
  return idx === -1 ? "." : p.slice(0, idx)
}

export function writeSandboxConfig(
  sandboxDir: string,
  manifest: HandoffManifest,
  port: number,
  options: {
    handoffPath: string
    theme: string
    visorVersion: string
    prototypeImport?: PrototypeImport
  }
): void {
  const config = {
    pattern: manifest.pattern,
    handoffPath: options.handoffPath,
    theme: options.theme,
    port,
    visorVersion: options.visorVersion,
    createdAt: new Date().toISOString(),
    primitives: manifest.primitives.map((p) => ({
      name: p.name,
      status: p.status,
      viTicket: p.viTicket ?? null,
      kind: p.kind ?? null,
    })),
    screens: manifest.screens.map((s) => ({
      name: s.name,
      title: s.title,
      route: s.route ?? null,
      kind: s.kind ?? "named",
    })),
    fromHtmlPrototype: options.prototypeImport
      ? {
          sourceDir: options.prototypeImport.sourceDir,
          screenMap: options.prototypeImport.screenMap,
          stateCoverageScreens: options.prototypeImport.stateCoverageScreens,
          stripChromeSelectors: options.prototypeImport.stripChromeSelectors,
        }
      : null,
  }
  writeFileSync(join(sandboxDir, "sandbox.json"), JSON.stringify(config, null, 2) + "\n", "utf-8")
}

export function sandboxIsEmpty(sandboxDir: string): boolean {
  if (!existsSync(sandboxDir)) return true
  try {
    return readdirSync(sandboxDir).filter((f) => !f.startsWith(".")).length === 0
  } catch {
    return false
  }
}
