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
  }

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  const outputPath = join(DIST_DIR, "visor-manifest.json")
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), "utf-8")

  console.log(`\n✓ Built manifest: ${components.size} components, ${blocksMeta.size} blocks, ${patterns.size} patterns, ${hooks.size} hooks`)
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
