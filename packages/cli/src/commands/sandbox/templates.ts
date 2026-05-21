import type { HandoffManifest, MockField, PrimitiveEntry, ScreenEntry } from "./parse-handoff.js"

const SANDBOX_PACKAGE_VERSION = "16.2.6"
const SANDBOX_REACT_VERSION = "19.0.0"
const SANDBOX_REACT_DOM_VERSION = "19.0.0"
const SANDBOX_PLAYWRIGHT_VERSION = "1.49.0"
const SANDBOX_PIXELMATCH_VERSION = "6.0.0"
const SANDBOX_PNGJS_VERSION = "7.0.0"

export function packageJsonTemplate(name: string): string {
  return `${JSON.stringify(
    {
      name: `sandbox-${name}`,
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: SANDBOX_PACKAGE_VERSION,
        react: SANDBOX_REACT_VERSION,
        "react-dom": SANDBOX_REACT_DOM_VERSION,
        "@loworbitstudio/visor-core": "*",
        "@loworbitstudio/visor-theme-engine": "*",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        typescript: "^5.7.2",
        "@playwright/test": `^${SANDBOX_PLAYWRIGHT_VERSION}`,
        pixelmatch: `^${SANDBOX_PIXELMATCH_VERSION}`,
        pngjs: `^${SANDBOX_PNGJS_VERSION}`,
      },
    },
    null,
    2
  )}\n`
}

export function tsconfigTemplate(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: false,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules", "captures", ".next"],
    },
    null,
    2
  )}\n`
}

export function nextConfigTemplate(): string {
  return `import type { NextConfig } from "next"\nimport path from "node:path"\nimport { fileURLToPath } from "node:url"\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url))\n\nconst nextConfig: NextConfig = {\n  reactStrictMode: true,\n  // Sandbox is local-only — disable production telemetry and image opt to keep startup fast.\n  images: { unoptimized: true },\n  // Anchor turbopack root to the sandbox dir so a parent-repo package-lock.json\n  // doesn't pull the workspace root upstream (VI-440).\n  turbopack: { root: __dirname },\n}\n\nexport default nextConfig\n`
}

export function nextEnvDtsTemplate(): string {
  return `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`
}

export function gitignoreTemplate(): string {
  return [
    "node_modules",
    ".next",
    "out",
    "captures/pending",
    "captures/diffs",
    "*.log",
    "",
  ].join("\n")
}

export function rootLayoutTemplate(pattern: string): string {
  return `import "./globals.css"\nimport { FOWT_SCRIPT } from "@loworbitstudio/visor-theme-engine/fowt"\nimport type { Metadata } from "next"\nimport type { ReactNode } from "react"\n\nexport const metadata: Metadata = {\n  title: "Sandbox — ${pattern}",\n  description: "Visor sandbox for in-vivo primitive iteration.",\n}\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang="en">\n      <head>\n        <script>{FOWT_SCRIPT}</script>\n      </head>\n      <body>{children}</body>\n    </html>\n  )\n}\n`
}

export function globalsCssPlaceholder(): string {
  return `/* This file is overwritten by 'visor theme apply' during sandbox init. */\n:root {\n  --bg-surface: #f7f7f8;\n  --text-primary: #111827;\n}\nbody { background: var(--bg-surface); color: var(--text-primary); margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }\n`
}

export function indexPageTemplate(): string {
  return `import Link from "next/link"\nimport { manifest } from "@/lib/sandbox-manifest"\n\nexport default function SandboxIndex() {\n  return (\n    <main style={{ padding: "32px", maxWidth: "880px", margin: "0 auto" }}>\n      <h1>Sandbox: {manifest.pattern}</h1>\n      <p style={{ color: "var(--text-secondary, #555)" }}>{manifest.primitives.length} primitives · {manifest.screens.length} screens</p>\n      <section>\n        <h2>Primitives</h2>\n        <ul>\n          {manifest.primitives.map((p) => (\n            <li key={p.name}><Link href={\`/primitives/\${p.name}\`}>{p.name}</Link> <small>({p.status}{p.viTicket ? " · " + p.viTicket : ""})</small></li>\n          ))}\n        </ul>\n      </section>\n      <section>\n        <h2>Screens</h2>\n        <ul>\n          {manifest.screens.map((s) => (\n            <li key={s.name}><Link href={\`/screens/\${s.name}\`}>{s.title}</Link></li>\n          ))}\n        </ul>\n      </section>\n    </main>\n  )\n}\n`
}

export function primitiveRouteTemplate(): string {
  return `import { notFound } from "next/navigation"\nimport { manifest } from "@/lib/sandbox-manifest"\nimport { PrimitiveSample } from "@/components/sandbox-sample"\n\ninterface Params { name: string }\n\nexport function generateStaticParams() {\n  return manifest.primitives.map((p) => ({ name: p.name }))\n}\n\nexport default async function PrimitivePage({ params }: { params: Promise<Params> }) {\n  const { name } = await params\n  const entry = manifest.primitives.find((p) => p.name === name)\n  if (!entry) notFound()\n  return (\n    <main style={{ padding: "32px", maxWidth: "880px", margin: "0 auto" }}>\n      <h1>{entry.name}</h1>\n      <p style={{ color: "var(--text-secondary, #555)" }}>{entry.status}{entry.viTicket ? " · " + entry.viTicket : ""}</p>\n      <PrimitiveSample name={entry.name} />\n    </main>\n  )\n}\n`
}

export function screenRouteTemplate(): string {
  return `import { notFound } from "next/navigation"\nimport { manifest } from "@/lib/sandbox-manifest"\nimport { ScreenSample } from "@/components/sandbox-sample"\n\ninterface Params { name: string }\n\nexport function generateStaticParams() {\n  return manifest.screens.map((s) => ({ name: s.name }))\n}\n\nexport default async function ScreenPage({ params }: { params: Promise<Params> }) {\n  const { name } = await params\n  const entry = manifest.screens.find((s) => s.name === name)\n  if (!entry) notFound()\n  return (\n    <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>\n      <h1>{entry.title}</h1>\n      {entry.route ? <p style={{ color: "var(--text-secondary, #555)" }}><code>{entry.route}</code></p> : null}\n      <ScreenSample name={entry.name} />\n    </main>\n  )\n}\n`
}

// Iframe-loading variant used when `visor sandbox init --from-html-prototype` imported
// a Phase 1.5 HTML prototype. Each screen iframes the matching public/prototype/*.html.
export function prototypeScreenRouteTemplate(screenMap: Record<string, string>): string {
  const mapLiteral = JSON.stringify(screenMap, null, 2)
  return `import { notFound } from "next/navigation"\nimport { manifest } from "@/lib/sandbox-manifest"\nimport { ScreenSample } from "@/components/sandbox-sample"\n\nconst SCREEN_HTML: Record<string, string> = ${mapLiteral}\n\ninterface Params { name: string }\n\nexport function generateStaticParams() {\n  return manifest.screens.map((s) => ({ name: s.name }))\n}\n\nexport default async function ScreenPage({ params }: { params: Promise<Params> }) {\n  const { name } = await params\n  const entry = manifest.screens.find((s) => s.name === name)\n  if (!entry) notFound()\n  const htmlFile = SCREEN_HTML[entry.name]\n  return (\n    <main style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>\n      <h1>{entry.title}</h1>\n      {entry.route ? <p style={{ color: "var(--text-secondary, #555)" }}><code>{entry.route}</code></p> : null}\n      {htmlFile ? (\n        <iframe\n          src={\`/prototype/\${htmlFile}\`}\n          title={entry.title}\n          style={{ width: "100%", height: "calc(100vh - 160px)", border: "1px solid var(--border-default, #e5e7eb)", borderRadius: "8px", background: "var(--bg-surface, #f7f7f8)" }}\n        />\n      ) : (\n        <ScreenSample name={entry.name} />\n      )}\n    </main>\n  )\n}\n`
}

export function sandboxManifestModule(manifest: HandoffManifest): string {
  const payload = {
    pattern: manifest.pattern,
    theme: manifest.theme ?? null,
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
  }
  return `export const manifest = ${JSON.stringify(payload, null, 2)} as const\n\nexport type ManifestPrimitive = (typeof manifest)["primitives"][number]\nexport type ManifestScreen = (typeof manifest)["screens"][number]\n`
}

export function sandboxMocksModule(fields: MockField[]): string {
  if (fields.length === 0) {
    return `// No mock fields declared in recipe. Hand-edit this file to add fixtures consumed by screens/<name>/page.tsx.\nexport const mocks: Record<string, unknown> = {}\n`
  }
  const lines: string[] = [
    "// Auto-generated mock fixtures from the recipe's 'Inputs from generation skill' table.",
    "// Hand-edit values to provide realistic data for screens. The shapes below are TODO stubs.",
    "",
    "export const mocks = {",
  ]
  for (const f of fields) {
    const isArray = /\[\]\s*$/.test(f.type)
    const stub = isArray ? "[]" : f.field === "currentUser" ? '{ id: "u1", role: "owner" }' : '""'
    const safeKey = /^[a-zA-Z_$][\w$]*$/.test(f.field) ? f.field : `["${f.field.replace(/"/g, '\\"')}"]`
    const desc = f.description ? ` // ${f.description.slice(0, 80)}` : ""
    lines.push(`  ${safeKey}: ${stub} as unknown,${desc}`)
  }
  lines.push("} satisfies Record<string, unknown>", "")
  return lines.join("\n")
}

export function sandboxSampleComponent(): string {
  return `import { manifest, type ManifestPrimitive } from "@/lib/sandbox-manifest"\nimport { mocks } from "@/lib/sandbox-mocks"\n\nvoid mocks\n\n/** Dynamic primitive sample. v1 shows the primitive name in a frame; operator hand-edits routes for richer compositions. */\nexport function PrimitiveSample({ name }: { name: string }) {\n  const entry = manifest.primitives.find((p) => p.name === name) as ManifestPrimitive | undefined\n  if (!entry) return null\n  return (\n    <section data-sandbox-primitive={entry.name} style={{ padding: "24px", border: "1px solid var(--border-default, #e5e7eb)", borderRadius: "12px", marginTop: "16px" }}>\n      <p style={{ margin: 0, fontFamily: "var(--font-mono, monospace)", fontSize: "var(--text-sm, 13px)", color: "var(--text-secondary, #555)" }}>\n        Operator: hand-edit <code>app/primitives/[name]/page.tsx</code> to render this primitive in real states.\n      </p>\n    </section>\n  )\n}\n\nexport function ScreenSample({ name }: { name: string }) {\n  const entry = manifest.screens.find((s) => s.name === name)\n  if (!entry) return null\n  return (\n    <section data-sandbox-screen={entry.name} style={{ padding: "24px", border: "1px solid var(--border-default, #e5e7eb)", borderRadius: "12px", marginTop: "16px" }}>\n      <p style={{ margin: 0, fontFamily: "var(--font-mono, monospace)", fontSize: "var(--text-sm, 13px)", color: "var(--text-secondary, #555)" }}>\n        Operator: hand-edit <code>app/screens/[name]/page.tsx</code> to assemble the {entry.title} composition.\n      </p>\n    </section>\n  )\n}\n`
}

export function stubTemplate(entry: PrimitiveEntry): string {
  const componentName = toPascalCase(entry.name)
  const ticket = entry.viTicket ?? "VI-???"
  return `// GAP STUB — ${ticket}. Hand-edit this file to sketch the primitive in place.\nimport type { ReactNode } from "react"\n\nexport interface ${componentName}Props {\n  children?: ReactNode\n  [key: string]: unknown\n}\n\nexport function ${componentName}(props: ${componentName}Props) {\n  return (\n    <div\n      role="img"\n      aria-label="GAP: ${ticket} — ${entry.name}"\n      data-stub-component="${entry.name}"\n      style={{\n        border: "2px dashed var(--border-strong, #888)",\n        padding: "var(--spacing-4, 16px)",\n        borderRadius: "var(--radius-md, 8px)",\n        color: "var(--text-secondary, #555)",\n        fontFamily: "var(--font-mono, monospace)",\n        fontSize: "var(--text-sm, 12px)",\n        display: "inline-flex",\n        flexDirection: "column",\n        gap: "4px",\n        minWidth: "120px",\n        textAlign: "center",\n      }}\n    >\n      <strong>GAP: ${ticket}</strong>\n      <span>${entry.name}</span>\n      <span style={{ opacity: 0.7 }}>see visual spec</span>\n      {props.children}\n    </div>\n  )\n}\n`
}

export function readmeTemplate(manifest: HandoffManifest, port: number): string {
  const shipped = manifest.primitives.filter((p) => p.status === "shipped" || p.status === "gap-inflight")
  const gaps = manifest.primitives.filter((p) => p.status === "gap-new")
  return [
    `# Sandbox: ${manifest.pattern}`,
    "",
    "Scaffolded by `visor sandbox init`. Iterate visually here, then capture approved states with `visor sandbox approve`.",
    "",
    "## Running",
    "",
    "```bash",
    `npx visor sandbox dev --name ${manifest.pattern}`,
    "```",
    "",
    `Dev server on **port ${port}** (port 3000 is reserved).`,
    "",
    `## Primitives (${shipped.length} shipped / ${gaps.length} gaps)`,
    "",
    ...shipped.map((p) => `- \`${p.name}\` — shipped`),
    ...gaps.map((p) => `- \`${p.name}\` — **GAP** (${p.viTicket ?? "VI-???"}) — stub at \`components/stubs/${p.name}.tsx\``),
    "",
    "## Screens",
    "",
    ...(manifest.screens.length === 0
      ? ["- (none declared in recipe)"]
      : manifest.screens.map((s) => `- \`/screens/${s.name}\` — ${s.title}${s.route ? ` (target route: \`${s.route}\`)` : ""}`)),
    "",
    "## Capturing",
    "",
    "```bash",
    `npx visor sandbox approve --name ${manifest.pattern}            # writes captures/approved/*.png`,
    `npx visor sandbox approve --name ${manifest.pattern} --diff     # pixel-diff vs prior approved`,
    "```",
    "",
  ].join("\n")
}

/**
 * Capture script written into the sandbox dir at approve-time. Lives there
 * because it depends on the sandbox's @playwright/test install — the CLI
 * itself does NOT bundle Playwright.
 */
export function captureScriptTemplate(): string {
  return `// Auto-generated by 'visor sandbox approve'. Do not edit by hand — rewrite via approve.\n// Always captures to captures/pending/ and pixel-diffs against captures/approved/ if a baseline exists.\n// Promotion of pending → approved happens via 'visor sandbox approve --approve' (operator review gate).\nimport { chromium } from "@playwright/test"\nimport { readFile, writeFile, mkdir, rm } from "node:fs/promises"\nimport { existsSync } from "node:fs"\nimport { join, dirname } from "node:path"\nimport { fileURLToPath } from "node:url"\nimport pixelmatch from "pixelmatch"\nimport { PNG } from "pngjs"\n\nconst sandboxDir = dirname(fileURLToPath(import.meta.url))\nconst configPath = join(sandboxDir, "sandbox.json")\nconst config = JSON.parse(await readFile(configPath, "utf-8"))\n\nconst port = Number(process.env.SANDBOX_PORT ?? config.port)\nconst baseUrl = \`http://localhost:\${port}\`\n\nconst routes = ["/", ...config.primitives.map((p) => \`/primitives/\${p.name}\`), ...config.screens.map((s) => \`/screens/\${s.name}\`)]\n\nconst approvedDir = join(sandboxDir, "captures", "approved")\nconst pendingDir = join(sandboxDir, "captures", "pending")\nconst diffsDir = join(sandboxDir, "captures", "diffs")\nawait rm(pendingDir, { recursive: true, force: true })\nawait rm(diffsDir, { recursive: true, force: true })\nawait mkdir(approvedDir, { recursive: true })\nawait mkdir(pendingDir, { recursive: true })\nawait mkdir(diffsDir, { recursive: true })\n\nfunction slugify(route) {\n  if (route === "/") return "index"\n  return route.replace(/^\\//, "").replace(/\\//g, "__")\n}\n\nconst browser = await chromium.launch()\nconst context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })\nconst page = await context.newPage()\nconst results = []\n\nfor (const route of routes) {\n  const slug = slugify(route)\n  const pngPath = join(pendingDir, \`\${slug}.png\`)\n  await page.goto(baseUrl + route, { waitUntil: "networkidle" })\n  const buf = await page.screenshot({ fullPage: true })\n  await writeFile(pngPath, buf)\n  const entry = { route, png: pngPath }\n  results.push(entry)\n\n  const baselinePath = join(approvedDir, \`\${slug}.png\`)\n  if (!existsSync(baselinePath)) {\n    entry.diff = "no-baseline"\n    continue\n  }\n  const baselineBuf = await readFile(baselinePath)\n  const baseline = PNG.sync.read(baselineBuf)\n  const candidate = PNG.sync.read(buf)\n  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {\n    const diffPath = join(diffsDir, \`\${slug}.diff.png\`)\n    await writeFile(diffPath, buf)\n    entry.diff = diffPath\n    entry.dimensionsMismatch = true\n    continue\n  }\n  const diffPng = new PNG({ width: baseline.width, height: baseline.height })\n  const pixels = pixelmatch(\n    baseline.data,\n    candidate.data,\n    diffPng.data,\n    baseline.width,\n    baseline.height,\n    { threshold: 0.1 }\n  )\n  if (pixels > 0) {\n    const diffPath = join(diffsDir, \`\${slug}.diff.png\`)\n    await writeFile(diffPath, PNG.sync.write(diffPng))\n    entry.diff = diffPath\n    entry.changedPixels = pixels\n  } else {\n    entry.diff = "clean"\n  }\n}\n\nawait browser.close()\nawait writeFile(join(sandboxDir, "captures", "last-run.json"), JSON.stringify({ baseUrl, routes: results }, null, 2))\nconsole.log(JSON.stringify({ ok: true, mode: "pending", routes: results }, null, 2))\n`
}

function toPascalCase(s: string): string {
  return s
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("")
}

export function sandboxManifestForCapture(manifest: HandoffManifest) {
  return {
    primitives: manifest.primitives.map((p) => ({ name: p.name })),
    screens: manifest.screens.map((s) => ({ name: s.name })),
  }
}

export function deriveScreenList(manifest: HandoffManifest): ScreenEntry[] {
  return manifest.screens
}
