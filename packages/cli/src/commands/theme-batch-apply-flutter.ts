/**
 * theme-batch-apply-flutter
 *
 * Iterates all .visor.yaml files in themes/ (stock) and custom-themes/
 * (custom), calls the flutter adapter for each one, writes per-theme token
 * files to packages/visor_themes/lib/src/<slug>/, then generates the
 * meta-barrel packages/visor_themes/lib/visor_themes.dart and the package's
 * pubspec.yaml.
 *
 * Modelled on the multi-file discovery loop in theme-sync.ts:287-356.
 *
 * File layout emitted:
 *   packages/visor_themes/
 *   ├── pubspec.yaml
 *   ├── pubspec_overrides.yaml
 *   ├── analysis_options.yaml
 *   ├── .gitignore
 *   └── lib/
 *       ├── visor_themes.dart           ← meta barrel + VisorThemes sealed class
 *       └── src/
 *           ├── blackout/
 *           │   ├── colors/visor_colors.dart
 *           │   ├── typography/visor_text_styles.dart
 *           │   ├── spacing/visor_spacing.dart
 *           │   ├── radius/visor_radius.dart
 *           │   ├── shadows/visor_shadows.dart
 *           │   ├── strokes/visor_stroke_widths.dart
 *           │   ├── opacity/visor_opacity.dart
 *           │   ├── motion/visor_motion.dart
 *           │   └── theme/visor_theme.dart
 *           ├── modern-minimal/
 *           │   └── ...
 *           └── ...
 *
 * The adapter generates paths like `lib/src/colors/visor_colors.dart`;
 * we strip the `lib/src/` prefix and place files under `lib/src/<slug>/`.
 * The pubspec.yaml and `lib/ui.dart` barrel the adapter emits are dropped —
 * only token + theme dart files land in the package.
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  rmSync,
} from "fs"
import { join, basename, dirname } from "path"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { flutterAdapter } from "@loworbitstudio/visor-theme-engine/adapters"
import type { FlutterAdapterOptions } from "@loworbitstudio/visor-theme-engine/adapters"
import { logger } from "../utils/logger.js"
import { findRepoRoot } from "../utils/theme-helpers.js"

export interface ThemeBatchApplyFlutterOptions {
  json?: boolean
  dryRun?: boolean
}

/** Scan a directory for .visor.yaml files (returns empty if dir absent). */
function scanThemeDir(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".visor.yaml"))
    .map((f) => join(dir, f))
    .sort()
}

/** kebab-case slug → lowerCamelCase Dart getter name.
 *  "modern-minimal" → "modernMinimal"
 *  "blacklight-underground" → "blacklightUnderground"
 *  "reference-app" → "referenceApp"
 */
function slugToCamel(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * Strip the `lib/src/` prefix from adapter-relative paths so they can be
 * placed inside `lib/src/<slug>/`.
 *
 * Adapter emits:
 *   lib/src/colors/visor_colors.dart  → colors/visor_colors.dart
 *   lib/src/theme/visor_theme.dart   → theme/visor_theme.dart
 *   lib/ui.dart                      → (skipped — barrel dropped)
 *   pubspec.yaml                     → (skipped — not a sub-package)
 */
function mapAdapterPath(relPath: string): string | null {
  if (relPath === "pubspec.yaml") return null
  if (relPath === "lib/ui.dart") return null
  if (relPath.startsWith("lib/src/")) {
    return relPath.slice("lib/src/".length)
  }
  return null
}

/** Generate the pubspec.yaml for packages/visor_themes. */
function emitVisorThemesPubspec(): string {
  return [
    `name: visor_themes`,
    `description: All Visor-generated Flutter ThemeData packages — 4 stock + 7 custom themes. GENERATED — regenerate with \`npm run themes:apply-flutter\`.`,
    `version: 0.1.0+1`,
    `publish_to: none`,
    ``,
    `environment:`,
    `  sdk: ^3.5.0`,
    `  flutter: ^3.24.0`,
    ``,
    `dependencies:`,
    `  flutter:`,
    `    sdk: flutter`,
    `  visor_core: ^0.1.0`,
    ``,
    `dev_dependencies:`,
    `  flutter_test:`,
    `    sdk: flutter`,
    `  flutter_lints: ^5.0.0`,
    ``,
    `flutter:`,
    `  uses-material-design: true`,
    ``,
  ].join("\n")
}

/** Generate pubspec_overrides.yaml so visor_core resolves to the local path. */
function emitVisorThemesPubspecOverrides(): string {
  return [
    `# Path overrides for in-monorepo development.`,
    `# visor_core is not yet published to pub.dev; this forces the local copy.`,
    `dependency_overrides:`,
    `  visor_core:`,
    `    path: ../visor-flutter`,
    ``,
  ].join("\n")
}

/** Generate analysis_options.yaml for packages/visor_themes. */
function emitAnalysisOptions(): string {
  return [
    `include: package:flutter_lints/flutter.yaml`,
    ``,
    `linter:`,
    `  rules:`,
    `    - avoid_print`,
    ``,
  ].join("\n")
}

/**
 * Dart-safe snake_case prefix alias for import `as` clause.
 * "modern-minimal" → "modern_minimal_t"
 * "blacklight-underground" → "blacklight_underground_t"
 * Suffix "_t" ensures no collision with class/variable names.
 */
function slugToDartPrefix(slug: string): string {
  return slug.replace(/-/g, "_") + "_t"
}

/** Generate the meta-barrel lib/visor_themes.dart. */
function emitMetaBarrel(slugs: string[]): string {
  const lines: string[] = [
    `// GENERATED BY visor — DO NOT EDIT.`,
    `// Regenerate with \`npm run themes:apply-flutter\`.`,
    `//`,
    `// Aggregates Dart ThemeData for all Visor themes (4 stock + 7 custom).`,
    `// Access themes via [VisorThemes], e.g. VisorThemes.blackout.light`,
    ``,
    `import 'package:flutter/material.dart';`,
    ``,
    `// Re-export visor_core so consumers access VisorColorsData etc. with`,
    `// a single import of this package.`,
    `export 'package:visor_core/visor_core.dart';`,
    ``,
  ]

  // Import each theme's visor_theme.dart with a prefix alias
  for (const slug of slugs) {
    const prefix = slugToDartPrefix(slug)
    lines.push(`import 'src/${slug}/theme/visor_theme.dart' as ${prefix};`)
  }

  lines.push(``)
  lines.push(`/// A light/dark [ThemeData] pair for a single Visor theme.`)
  lines.push(`class VisorThemePair {`)
  lines.push(`  final ThemeData light;`)
  lines.push(`  final ThemeData dark;`)
  lines.push(`  const VisorThemePair({required this.light, required this.dark});`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`/// Static access to all Visor-generated Flutter themes.`)
  lines.push(`///`)
  lines.push(`/// Usage:`)
  lines.push(`/// \`\`\`dart`)
  lines.push(`/// MaterialApp(`)
  lines.push(`///   theme: VisorThemes.blackout.light,`)
  lines.push(`///   darkTheme: VisorThemes.blackout.dark,`)
  lines.push(`/// );`)
  lines.push(`/// \`\`\``)
  lines.push(`sealed class VisorThemes {`)
  for (const slug of slugs) {
    const camel = slugToCamel(slug)
    const prefix = slugToDartPrefix(slug)
    lines.push(`  static VisorThemePair get ${camel} => VisorThemePair(`)
    lines.push(`    light: ${prefix}.VisorAppTheme.light,`)
    lines.push(`    dark: ${prefix}.VisorAppTheme.dark,`)
    lines.push(`  );`)
  }
  lines.push(`}`)
  lines.push(``)

  return lines.join("\n")
}

/** Generate the .gitignore for packages/visor_themes. */
function emitGitignore(): string {
  return [
    `.dart_tool/`,
    `.packages`,
    `build/`,
    `pubspec.lock`,
    `*.g.dart`,
    ``,
  ].join("\n")
}

interface ProcessedTheme {
  slug: string
  camel: string
  primaryHex: string
  /** Map from dest-relative path (e.g. "colors/visor_colors.dart") to content */
  tokenFiles: Record<string, string>
}

export function themeBatchApplyFlutterCommand(
  cwd: string,
  options: ThemeBatchApplyFlutterOptions
): void {
  const repoRoot = findRepoRoot(cwd)
  if (!repoRoot) {
    const msg =
      "Could not locate repo root (packages/docs/ not found). Run from within the visor repo."
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  const themesDir = join(repoRoot, "themes")
  const customThemesDir = join(repoRoot, "custom-themes")
  const outputDir = join(repoRoot, "packages", "visor_themes")

  // Discover all .visor.yaml files
  const stockFiles = scanThemeDir(themesDir)
  const customFiles = scanThemeDir(customThemesDir)
  const allFiles = [...stockFiles, ...customFiles]

  if (allFiles.length === 0) {
    const msg = `No .visor.yaml files found in themes/ or custom-themes/. Nothing to generate.`
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.warn(msg)
    }
    return
  }

  if (!options.json) {
    logger.info(`Found ${allFiles.length} theme YAML files (${stockFiles.length} stock, ${customFiles.length} custom)`)
  }

  // Process each theme
  const processed: ProcessedTheme[] = []
  const errors: string[] = []

  for (const filePath of allFiles) {
    let yamlContent: string
    try {
      yamlContent = readFileSync(filePath, "utf-8")
    } catch {
      errors.push(`Could not read: ${filePath}`)
      continue
    }

    let data: ReturnType<typeof generateThemeData>
    try {
      data = generateThemeData(yamlContent)
    } catch (err) {
      errors.push(
        `Failed to parse ${basename(filePath)}: ${err instanceof Error ? err.message : "Unknown error"}`
      )
      continue
    }

    const slug = data.config.name.toLowerCase().replace(/\s+/g, "-")
    const camel = slugToCamel(slug)

    const flutterOptions: FlutterAdapterOptions = {
      packageName: `visor_themes_${slug.replace(/-/g, "_")}`,
      themeClassName: "VisorAppTheme",
    }

    let fileMap: ReturnType<typeof flutterAdapter>
    try {
      fileMap = flutterAdapter(
        {
          primitives: data.primitives,
          tokens: data.tokens,
          config: data.config,
        },
        flutterOptions
      )
    } catch (err) {
      errors.push(
        `Failed flutter adapter for ${slug}: ${err instanceof Error ? err.message : "Unknown error"}`
      )
      continue
    }

    // Extract primary hex from primitives for test assertions
    const primsAsUnknown: unknown = data.primitives
    const primitivesMap = primsAsUnknown as Record<string, unknown>
    const primaryHex = typeof primitivesMap?.primary500 === "string" ? primitivesMap.primary500 : "#000000"

    // Map adapter output paths to slug-scoped relative paths
    // lib/src/colors/visor_colors.dart → colors/visor_colors.dart
    const tokenFiles: Record<string, string> = {}
    for (const [relPath, content] of Object.entries(fileMap.files)) {
      const mapped = mapAdapterPath(relPath)
      if (mapped !== null) {
        tokenFiles[mapped] = content
      }
    }

    // Update imports in visor_theme.dart to use sibling paths
    if (tokenFiles["theme/visor_theme.dart"]) {
      tokenFiles["theme/visor_theme.dart"] = tokenFiles["theme/visor_theme.dart"]
        .replace(/import '\.\.\/colors\/visor_colors\.dart';/g, "import '../colors/visor_colors.dart';")
        .replace(/import '\.\.\/typography\/visor_text_styles\.dart';/g, "import '../typography/visor_text_styles.dart';")
        .replace(/import '\.\.\/spacing\/visor_spacing\.dart';/g, "import '../spacing/visor_spacing.dart';")
        .replace(/import '\.\.\/radius\/visor_radius\.dart';/g, "import '../radius/visor_radius.dart';")
        .replace(/import '\.\.\/shadows\/visor_shadows\.dart';/g, "import '../shadows/visor_shadows.dart';")
        .replace(/import '\.\.\/strokes\/visor_stroke_widths\.dart';/g, "import '../strokes/visor_stroke_widths.dart';")
        .replace(/import '\.\.\/opacity\/visor_opacity\.dart';/g, "import '../opacity/visor_opacity.dart';")
        .replace(/import '\.\.\/motion\/visor_motion\.dart';/g, "import '../motion/visor_motion.dart';")
    }

    processed.push({ slug, camel, primaryHex, tokenFiles })
  }

  if (errors.length > 0) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, errors }))
    } else {
      errors.forEach((e) => logger.error(e))
    }
    process.exit(1)
    return
  }

  if (options.dryRun) {
    if (!options.json) {
      logger.info(`[dry-run] Would generate ${processed.length} theme packages in ${outputDir}`)
      for (const { slug } of processed) {
        logger.item(`  packages/visor_themes/lib/src/${slug}/`)
      }
    } else {
      console.log(
        JSON.stringify({
          success: true,
          dryRun: true,
          themes: processed.map((p) => p.slug),
          outputDir,
        })
      )
    }
    return
  }

  const slugs = processed.map((p) => p.slug)

  // Clean and recreate the lib/src directory to ensure idempotency
  const libSrcDir = join(outputDir, "lib", "src")
  if (existsSync(libSrcDir)) {
    rmSync(libSrcDir, { recursive: true, force: true })
  }

  // Write meta-level package files
  const packageFiles: Record<string, string> = {
    "pubspec.yaml": emitVisorThemesPubspec(),
    "pubspec_overrides.yaml": emitVisorThemesPubspecOverrides(),
    "analysis_options.yaml": emitAnalysisOptions(),
    ".gitignore": emitGitignore(),
    "lib/visor_themes.dart": emitMetaBarrel(slugs),
  }

  let totalFiles = 0
  for (const [relPath, content] of Object.entries(packageFiles)) {
    const absPath = join(outputDir, relPath)
    mkdirSync(dirname(absPath), { recursive: true })
    writeFileSync(absPath, content, "utf-8")
    totalFiles++
  }

  // Write per-theme token files under lib/src/<slug>/
  for (const { slug, tokenFiles } of processed) {
    const themeBaseDir = join(outputDir, "lib", "src", slug)
    for (const [relPath, content] of Object.entries(tokenFiles)) {
      const absPath = join(themeBaseDir, relPath)
      mkdirSync(dirname(absPath), { recursive: true })
      writeFileSync(absPath, content, "utf-8")
      totalFiles++
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify({
        success: true,
        outputDir,
        themes: slugs,
        totalFiles,
      })
    )
  } else {
    logger.success(`Flutter theme package generated: ${outputDir}`)
    logger.item(`Themes: ${slugs.join(", ")}`)
    logger.item(`Total files written: ${totalFiles}`)
  }
}
