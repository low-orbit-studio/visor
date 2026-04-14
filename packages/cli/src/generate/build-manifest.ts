/**
 * Build Manifest Script
 *
 * Reads per-component .visor.yaml files and .visor-pattern.yaml files,
 * auto-extracts tokens from CSS modules, and produces dist/visor-manifest.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"
import { parse as parseYAML } from "yaml"
import { extractTokensFromCSS } from "./extract-tokens.js"
import type {
  ComponentMetadata,
  BlockMetadata,
  PatternMetadata,
  VisorManifest,
  ManifestComponent,
  ManifestBlock,
  ManifestHook,
  ManifestPattern,
  ManifestToken,
  HookParam,
  HookReturn,
} from "./manifest-types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "../../../..")
const DIST_DIR = join(__dirname, "../../dist")
const COMPONENTS_DIR = join(REPO_ROOT, "components/ui")
const BLOCKS_DIR = join(REPO_ROOT, "blocks")
const PATTERNS_DIR = join(REPO_ROOT, "patterns")
const HOOKS_DIR = join(REPO_ROOT, "hooks")
const TOKENS_SRC_DIR = join(REPO_ROOT, "packages/tokens/src/tokens")

const REQUIRED_COMPONENT_FIELDS = [
  "name",
  "description",
  "category",
  "when_to_use",
  "when_not_to_use",
  "why",
  "dependencies",
  "example",
] as const

const REQUIRED_BLOCK_FIELDS = [
  "name",
  "description",
  "category",
  "components_used",
  "when_to_use",
  "when_not_to_use",
] as const

const REQUIRED_PATTERN_FIELDS = [
  "name",
  "description",
  "components_used",
  "when_to_use",
  "structure",
  "notes",
] as const

function validateRequiredFields(
  data: Record<string, unknown>,
  fields: readonly string[],
  filePath: string
): void {
  const missing = fields.filter((f) => !(f in data) || data[f] === null || data[f] === undefined)
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields in ${filePath}: ${missing.join(", ")}`
    )
  }
}

function loadComponentMetadata(): Map<string, ComponentMetadata> {
  const components = new Map<string, ComponentMetadata>()

  if (!existsSync(COMPONENTS_DIR)) {
    console.warn("  Warning: components/ui/ directory not found")
    return components
  }

  const dirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("__"))

  for (const dir of dirs) {
    const yamlPath = join(COMPONENTS_DIR, dir.name, `${dir.name}.visor.yaml`)
    if (!existsSync(yamlPath)) {
      console.warn(`  Warning: No .visor.yaml for ${dir.name}`)
      continue
    }

    const raw = readFileSync(yamlPath, "utf-8")
    const data = parseYAML(raw) as Record<string, unknown>
    validateRequiredFields(data, REQUIRED_COMPONENT_FIELDS, yamlPath)
    components.set(dir.name, data as unknown as ComponentMetadata)
  }

  return components
}

function loadBlockMetadata(): Map<string, BlockMetadata> {
  const blocksMap = new Map<string, BlockMetadata>()

  if (!existsSync(BLOCKS_DIR)) {
    console.warn("  Warning: blocks/ directory not found")
    return blocksMap
  }

  const dirs = readdirSync(BLOCKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("__"))

  for (const dir of dirs) {
    const yamlPath = join(BLOCKS_DIR, dir.name, `${dir.name}.visor.yaml`)
    if (!existsSync(yamlPath)) {
      console.warn(`  Warning: No .visor.yaml for block ${dir.name}`)
      continue
    }

    const raw = readFileSync(yamlPath, "utf-8")
    const data = parseYAML(raw) as Record<string, unknown>
    validateRequiredFields(data, REQUIRED_BLOCK_FIELDS, yamlPath)
    blocksMap.set(dir.name, data as unknown as BlockMetadata)
  }

  return blocksMap
}

function loadTokensForComponent(componentName: string): string[] {
  const cssPath = join(COMPONENTS_DIR, componentName, `${componentName}.module.css`)
  if (!existsSync(cssPath)) {
    return []
  }
  const cssContent = readFileSync(cssPath, "utf-8")
  return extractTokensFromCSS(cssContent)
}

function loadPatterns(): Map<string, PatternMetadata> {
  const patterns = new Map<string, PatternMetadata>()

  if (!existsSync(PATTERNS_DIR)) {
    console.warn("  Warning: patterns/ directory not found")
    return patterns
  }

  const files = readdirSync(PATTERNS_DIR).filter((f) =>
    f.endsWith(".visor-pattern.yaml")
  )

  for (const file of files) {
    const filePath = join(PATTERNS_DIR, file)
    const raw = readFileSync(filePath, "utf-8")
    const data = parseYAML(raw) as Record<string, unknown>
    validateRequiredFields(data, REQUIRED_PATTERN_FIELDS, filePath)

    const patternName = basename(file, ".visor-pattern.yaml")
    patterns.set(patternName, data as unknown as PatternMetadata)
  }

  return patterns
}

async function loadHooks(): Promise<Map<string, ManifestHook>> {
  const hooksMap = new Map<string, ManifestHook>()

  const { hooks } = await import(
    join(REPO_ROOT, "registry/registry-hooks.ts")
  )

  for (const hook of hooks) {
    const yamlPath = join(HOOKS_DIR, `${hook.name}.visor.yaml`)
    let params: HookParam[] | undefined
    let returns: HookReturn[] | undefined

    if (existsSync(yamlPath)) {
      const raw = readFileSync(yamlPath, "utf-8")
      const data = parseYAML(raw) as Record<string, unknown>

      if (Array.isArray(data.params) && data.params.length > 0) {
        params = data.params as HookParam[]
      }

      if (Array.isArray(data.returns) && data.returns.length > 0) {
        returns = data.returns as HookReturn[]
      }
    } else {
      console.warn(`  Warning: No .visor.yaml for hook ${hook.name}`)
    }

    hooksMap.set(hook.name, {
      description: hook.description || "",
      ...(params !== undefined ? { params } : {}),
      ...(returns !== undefined ? { returns } : {}),
    })
  }

  return hooksMap
}

// ============================================================
// Token extraction helpers
// ============================================================

/**
 * Parse primitive color hex values from TS source for resolution.
 * Matches entries like: "neutral-900": "#111827" or white: "#ffffff"
 */
function parsePrimitiveColors(src: string): Record<string, string> {
  const result: Record<string, string> = {}
  const re = /["']?([\w-]+)["']?\s*:\s*["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    result[m[1]] = m[2]
  }
  return result
}

/**
 * Resolve a primitive color reference like "color-neutral-900" to its hex value.
 * Falls back to a var() reference if not in the lookup table.
 */
function resolveColorRef(ref: string, primitiveColors: Record<string, string>): string {
  const colorKey = ref.startsWith("color-") ? ref.slice("color-".length) : ref
  return primitiveColors[colorKey] ?? `var(--${ref})`
}

/**
 * Extract key-value pairs from a simple TypeScript object literal.
 * Handles quoted/unquoted keys and string or numeric values.
 */
function extractObjectEntries(src: string, exportName: string): [string, string][] {
  const startMarker = new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*\\{`)
  const startMatch = startMarker.exec(src)
  if (!startMatch) return []

  const bodyStart = startMatch.index + startMatch[0].length
  let depth = 1
  let i = bodyStart
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++
    else if (src[i] === "}") depth--
    i++
  }
  const body = src.slice(bodyStart, i - 1)

  const results: [string, string][] = []
  // Match key: "value" or key: 'value' or key: numericValue
  const re = /["']?([\w.-]+)["']?\s*:\s*(?:"([^"]*?)"|'([^']*?)'|(-?\d+(?:\.\d+)?))/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body)) !== null) {
    const key = match[1]
    const val = match[2] ?? match[3] ?? match[4]
    if (key && val !== undefined) {
      results.push([key, val])
    }
  }
  return results
}

/**
 * Extract adaptive token entries (with light/dark variants) from TypeScript source.
 * Returns [key, lightRef, darkRef] triples.
 */
function extractAdaptiveEntries(src: string, exportName: string): [string, string, string][] {
  const startMarker = new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*\\{`)
  const startMatch = startMarker.exec(src)
  if (!startMatch) return []

  const bodyStart = startMatch.index + startMatch[0].length
  let depth = 1
  let i = bodyStart
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++
    else if (src[i] === "}") depth--
    i++
  }
  const body = src.slice(bodyStart, i - 1)

  const results: [string, string, string][] = []
  // Match: "key": { light: "...", dark: "..." } blocks
  const tokenRe = /["']?([\w.-]+)["']?\s*:\s*\{([^}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(body)) !== null) {
    const key = m[1]
    const inner = m[2]
    if (key === "light" || key === "dark") continue

    const lightMatch = /light\s*:\s*["']([^"']+)["']/.exec(inner)
    const darkMatch = /dark\s*:\s*["']([^"']+)["']/.exec(inner)

    if (lightMatch && darkMatch) {
      results.push([key, lightMatch[1], darkMatch[1]])
    }
  }
  return results
}

/**
 * Build the tokens section for visor-manifest.json.
 * Reads and parses the TypeScript token source files directly.
 */
function buildTokensSection(): {
  primitives: ManifestToken[]
  semantic: ManifestToken[]
  adaptive: ManifestToken[]
  summary: { total: number }
} {
  const primSrc = readFileSync(join(TOKENS_SRC_DIR, "primitives.ts"), "utf-8")
  const semSrc = readFileSync(join(TOKENS_SRC_DIR, "semantic.ts"), "utf-8")
  const adaptSrc = readFileSync(join(TOKENS_SRC_DIR, "adaptive.ts"), "utf-8")

  const primitiveColorValues = parsePrimitiveColors(primSrc)

  const primitives: ManifestToken[] = []
  const semantic: ManifestToken[] = []
  const adaptive: ManifestToken[] = []

  // ---- PRIMITIVES ----

  // Colors: --color-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveColors")) {
    primitives.push({
      name: `--color-${key}`,
      tier: "primitive",
      description: `Primitive color: ${key}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Spacing: --spacing-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveSpacing")) {
    const px = Number(value)
    const rem = px === 0 ? "0" : `${px / 16}rem`
    primitives.push({
      name: `--spacing-${key}`,
      tier: "primitive",
      description: `Primitive spacing: ${px}px`,
      defaultLight: rem,
      defaultDark: rem,
    })
  }

  // Border radius: --radius-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveRadius")) {
    const px = Number(value)
    const rem = px >= 9999 ? "9999px" : px === 0 ? "0" : `${px / 16}rem`
    primitives.push({
      name: `--radius-${key}`,
      tier: "primitive",
      description: `Primitive border radius: ${key}`,
      defaultLight: rem,
      defaultDark: rem,
    })
  }

  // Border widths: --border-width-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveBorderWidths")) {
    primitives.push({
      name: `--border-width-${key}`,
      tier: "primitive",
      description: `Primitive border width: ${value}px`,
      defaultLight: `${value}px`,
      defaultDark: `${value}px`,
    })
  }

  // Font sizes: --font-size-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveFontSizes")) {
    const px = Number(value)
    const rem = `${px / 16}rem`
    primitives.push({
      name: `--font-size-${key}`,
      tier: "primitive",
      description: `Primitive font size: ${px}px`,
      defaultLight: rem,
      defaultDark: rem,
    })
  }

  // Font weights: --font-weight-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveFontWeights")) {
    primitives.push({
      name: `--font-weight-${key}`,
      tier: "primitive",
      description: `Primitive font weight: ${value}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Line heights: --line-height-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveLineHeights")) {
    primitives.push({
      name: `--line-height-${key}`,
      tier: "primitive",
      description: `Primitive line height: ${value}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Shadows (with dark variant): --shadow-{key}
  const darkShadows = Object.fromEntries(extractObjectEntries(primSrc, "primitiveShadowsDark"))
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveShadows")) {
    primitives.push({
      name: `--shadow-${key}`,
      tier: "primitive",
      description: `Primitive shadow: ${key}`,
      defaultLight: value,
      defaultDark: darkShadows[key] ?? value,
    })
  }

  // Z-index: --z-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveZIndex")) {
    primitives.push({
      name: `--z-${key}`,
      tier: "primitive",
      description: `Primitive z-index: ${key}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Font families: --font-{key} (values contain commas; need special parsing)
  // Extract font family entries from raw source using a dedicated approach
  const fontFamilyRe = /["']?(sans|mono)["']?\s*:\s*'([^']+)'/g
  let ffm: RegExpExecArray | null
  while ((ffm = fontFamilyRe.exec(primSrc)) !== null) {
    primitives.push({
      name: `--font-${ffm[1]}`,
      tier: "primitive",
      description: `Primitive font family: ${ffm[1]}`,
      defaultLight: ffm[2],
      defaultDark: ffm[2],
    })
  }

  // Overlay: --overlay-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveOverlay")) {
    primitives.push({
      name: `--overlay-${key}`,
      tier: "primitive",
      description: `Primitive overlay: ${key}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Focus ring: --focus-ring-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveFocusRing")) {
    primitives.push({
      name: `--focus-ring-${key}`,
      tier: "primitive",
      description: `Primitive focus ring ${key}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Motion durations: --motion-duration-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveMotionDurations")) {
    primitives.push({
      name: `--motion-duration-${key}`,
      tier: "primitive",
      description: `Primitive motion duration: ${value}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // Motion easings: --motion-easing-{key}
  for (const [key, value] of extractObjectEntries(primSrc, "primitiveMotionEasings")) {
    primitives.push({
      name: `--motion-easing-${key}`,
      tier: "primitive",
      description: `Primitive motion easing: ${key}`,
      defaultLight: value,
      defaultDark: value,
    })
  }

  // ---- SEMANTIC ----

  for (const [key, ref] of extractObjectEntries(semSrc, "semanticText")) {
    semantic.push({ name: `--text-${key}`, tier: "semantic", description: `Semantic text: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticSurface")) {
    semantic.push({ name: `--surface-${key}`, tier: "semantic", description: `Semantic surface: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticBorder")) {
    semantic.push({ name: `--border-${key}`, tier: "semantic", description: `Semantic border: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticInteractive")) {
    semantic.push({ name: `--interactive-${key}`, tier: "semantic", description: `Semantic interactive: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticSpacing")) {
    semantic.push({ name: `--${key}`, tier: "semantic", description: `Semantic spacing: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticMotionDuration")) {
    semantic.push({ name: `--motion-duration-${key}`, tier: "semantic", description: `Semantic motion duration: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticMotionEasing")) {
    semantic.push({ name: `--motion-easing-${key}`, tier: "semantic", description: `Semantic motion easing: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticTypography")) {
    semantic.push({ name: `--${key}`, tier: "semantic", description: `Semantic typography: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticSkeleton")) {
    semantic.push({ name: `--skeleton-${key}`, tier: "semantic", description: `Semantic skeleton shimmer: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticChart")) {
    semantic.push({ name: `--chart-${key}`, tier: "semantic", description: `Semantic chart color ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }
  for (const [key, ref] of extractObjectEntries(semSrc, "semanticSidebar")) {
    semantic.push({ name: `--sidebar-${key}`, tier: "semantic", description: `Semantic sidebar: ${key}`, defaultLight: `var(--${ref})`, defaultDark: `var(--${ref})` })
  }

  // ---- ADAPTIVE ----

  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveText")) {
    adaptive.push({ name: `--text-${key}`, tier: "adaptive", description: `Adaptive text: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveSurface")) {
    adaptive.push({ name: `--surface-${key}`, tier: "adaptive", description: `Adaptive surface: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveBorder")) {
    adaptive.push({ name: `--border-${key}`, tier: "adaptive", description: `Adaptive border: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveInteractive")) {
    adaptive.push({ name: `--interactive-${key}`, tier: "adaptive", description: `Adaptive interactive: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveSkeleton")) {
    adaptive.push({ name: `--skeleton-${key}`, tier: "adaptive", description: `Adaptive skeleton shimmer: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveChart")) {
    adaptive.push({ name: `--chart-${key}`, tier: "adaptive", description: `Adaptive chart color ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }
  for (const [key, light, dark] of extractAdaptiveEntries(adaptSrc, "adaptiveSidebar")) {
    adaptive.push({ name: `--sidebar-${key}`, tier: "adaptive", description: `Adaptive sidebar: ${key}`, defaultLight: resolveColorRef(light, primitiveColorValues), defaultDark: resolveColorRef(dark, primitiveColorValues) })
  }

  const total = primitives.length + semantic.length + adaptive.length
  return { primitives, semantic, adaptive, summary: { total } }
}

function buildCategories(
  components: Map<string, ComponentMetadata>
): Record<string, string[]> {
  const categories: Record<string, string[]> = {}

  for (const [name, meta] of components) {
    const cat = meta.category
    if (!categories[cat]) {
      categories[cat] = []
    }
    categories[cat].push(name)
  }

  // Sort components within each category
  for (const cat of Object.keys(categories)) {
    categories[cat].sort()
  }

  return categories
}

async function main(): Promise<void> {
  console.log("Building visor-manifest.json...\n")

  const components = loadComponentMetadata()
  console.log(`  Found ${components.size} component metadata files`)

  const blocksMeta = loadBlockMetadata()
  console.log(`  Found ${blocksMeta.size} block metadata files`)

  const patterns = loadPatterns()
  console.log(`  Found ${patterns.size} pattern files`)

  const hooks = await loadHooks()
  console.log(`  Found ${hooks.size} hooks`)

  // Build manifest components with auto-extracted tokens
  const manifestComponents: Record<string, ManifestComponent> = {}
  for (const [name, meta] of components) {
    const tokens = loadTokensForComponent(name)
    manifestComponents[name] = {
      category: meta.category,
      description: meta.description,
      when_to_use: meta.when_to_use,
      when_not_to_use: meta.when_not_to_use,
      ...(meta.variants ? { variants: meta.variants } : {}),
      ...(meta.props ? { props: meta.props } : {}),
      ...(meta.slots ? { slots: meta.slots } : {}),
      ...(meta.sub_components ? { sub_components: meta.sub_components } : {}),
      dependencies: meta.dependencies,
      tokens_used: tokens,
      example: meta.example,
    }
    console.log(`  ✓ ${name} (${tokens.length} tokens)`)
  }

  // Build manifest blocks
  const manifestBlocks: Record<string, ManifestBlock> = {}
  for (const [name, meta] of blocksMeta) {
    manifestBlocks[name] = {
      category: meta.category,
      description: meta.description,
      components_used: meta.components_used,
      when_to_use: meta.when_to_use,
      when_not_to_use: meta.when_not_to_use,
    }
    console.log(`  ✓ block: ${name}`)
  }

  // Build manifest patterns
  const manifestPatterns: Record<string, ManifestPattern> = {}
  for (const [name, meta] of patterns) {
    manifestPatterns[name] = {
      description: meta.description,
      components_used: meta.components_used,
      when_to_use: meta.when_to_use,
    }
    console.log(`  ✓ pattern: ${name}`)
  }

  // Build tokens section
  console.log("\n  Extracting design tokens...")
  const tokensSection = buildTokensSection()
  console.log(`  ✓ ${tokensSection.primitives.length} primitives, ${tokensSection.semantic.length} semantic, ${tokensSection.adaptive.length} adaptive tokens`)

  const rootPkg = JSON.parse(
    readFileSync(join(REPO_ROOT, "package.json"), "utf-8")
  ) as { version: string }

  const manifest: VisorManifest = {
    version: rootPkg.version,
    generated_at: new Date().toISOString(),
    components: manifestComponents,
    blocks: manifestBlocks,
    hooks: Object.fromEntries(hooks),
    patterns: manifestPatterns,
    categories: buildCategories(components),
    tokens: tokensSection,
  }

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  const outputPath = join(DIST_DIR, "visor-manifest.json")
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), "utf-8")

  console.log(`\n✓ Built manifest: ${components.size} components, ${blocksMeta.size} blocks, ${patterns.size} patterns, ${hooks.size} hooks, ${tokensSection.summary.total} tokens`)
  console.log(`✓ Written to ${outputPath}`)

  await buildChangelog(manifestComponents)
}

async function buildChangelog(components: Record<string, ManifestComponent>): Promise<void> {
  const pkgJson = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8")) as { version: string }
  const changelog = {
    version: pkgJson.version,
    generated_at: new Date().toISOString(),
    components: Object.fromEntries(
      Object.keys(components).map((name) => [
        name,
        { changeType: "current", files: [], breakingChange: false, migrationNote: null },
      ])
    ),
  }
  const outPath = join(DIST_DIR, "CHANGELOG.json")
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }
  writeFileSync(outPath, JSON.stringify(changelog, null, 2), "utf-8")
  console.log(`  ✓ CHANGELOG.json (${Object.keys(components).length} components)`)
}

main().catch((err) => {
  console.error("Failed to build manifest:", err)
  process.exit(1)
})
