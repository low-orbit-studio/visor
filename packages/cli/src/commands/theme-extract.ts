import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join, basename, extname, relative } from "path";
import { stringify as stringifyYaml } from "yaml";
import {
  extractFromCSS,
  validate,
  type CSSFile,
  type ExtractionResult,
  type Confidence,
} from "@loworbitstudio/visor-theme-engine";
import { logger } from "../utils/logger.js";

export interface ThemeExtractOptions {
  from?: string;
  json?: boolean;
  output?: string;
  runValidation?: boolean;
}

/**
 * Scan targets in order of priority:
 * 1. CSS custom properties in :root and .dark selectors
 * 2. globals.css / tokens.css files
 * 3. CSS module files (component-scoped tokens)
 * 4. Tailwind config (if present)
 * 5. package.json (font dependencies)
 */
const CSS_FILE_PATTERNS = [
  "globals.css",
  "global.css",
  "tokens.css",
  "variables.css",
  "theme.css",
  "design-tokens.css",
  "primitives.css",
  "semantic.css",
  "adaptive.css",
];

const CSS_DIRS = [
  "src",
  "app",
  "styles",
  "css",
  "src/styles",
  "src/app",
  "src/css",
  "packages/tokens",
  "packages/design-tokens",
];

export function themeExtractCommand(
  cwd: string,
  options: ThemeExtractOptions
): void {
  const targetDir = resolve(cwd, options.from ?? ".");

  if (!existsSync(targetDir)) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: `Directory not found: ${targetDir}` }));
    } else {
      logger.error(`Directory not found: ${targetDir}`);
    }
    process.exit(2);
  }

  if (!options.json) {
    logger.heading("Visor Theme Extractor");
    logger.info(`Scanning: ${targetDir}`);
    logger.blank();
  }

  // Collect CSS files
  const cssFiles = collectCSSFiles(targetDir);

  if (cssFiles.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: "No CSS files found to extract from.",
      }));
    } else {
      logger.error("No CSS files found to extract from.");
      logger.info("Make sure the target directory contains .css files with custom properties.");
    }
    process.exit(2);
  }

  if (!options.json) {
    logger.info(`Found ${cssFiles.length} CSS file(s):`);
    for (const f of cssFiles) {
      logger.item(relative(targetDir, f.path));
    }
    logger.blank();
  }

  // Infer theme name from directory
  const themeName = inferThemeName(targetDir);

  // Run extraction
  const result = extractFromCSS(cssFiles, themeName);

  // Fix 2 (VI-82): Resolve var() font references by scanning layout files
  resolveVarFontReferences(result, targetDir);

  // Check for font dependencies in package.json
  const fontHints = extractFontHints(targetDir);
  if (fontHints && !result.config.typography) {
    result.config.typography = fontHints;
  }

  // Optionally validate the output
  let validationResult: ReturnType<typeof validate> | undefined;
  if (options.runValidation) {
    validationResult = validate(result.config);
  }

  // Output
  if (options.json) {
    outputJSON(result, validationResult);
  } else {
    outputYAML(result, options.output, cwd, validationResult);
  }
}

// ============================================================
// File Collection
// ============================================================

function collectCSSFiles(targetDir: string): CSSFile[] {
  const files: CSSFile[] = [];
  const seen = new Set<string>();

  // Priority 1: Known CSS file names in root and standard dirs
  for (const pattern of CSS_FILE_PATTERNS) {
    // Check root
    const rootPath = join(targetDir, pattern);
    addFileIfExists(rootPath, files, seen);

    // Check standard directories
    for (const dir of CSS_DIRS) {
      const dirPath = join(targetDir, dir, pattern);
      addFileIfExists(dirPath, files, seen);
    }
  }

  // Priority 2: Any .css files in standard dirs (exclude node_modules, .next, etc.)
  for (const dir of CSS_DIRS) {
    const dirPath = join(targetDir, dir);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      scanDirForCSS(dirPath, files, seen, 2);
    }
  }

  // Priority 3: Root-level .css files
  scanDirForCSS(targetDir, files, seen, 0);

  return files;
}

function addFileIfExists(filePath: string, files: CSSFile[], seen: Set<string>): void {
  const resolved = resolve(filePath);
  if (seen.has(resolved)) return;
  if (!existsSync(resolved)) return;

  try {
    const content = readFileSync(resolved, "utf-8");
    if (content.includes("--")) {
      files.push({ path: resolved, content });
      seen.add(resolved);
    }
  } catch {
    // Skip unreadable files
  }
}

function scanDirForCSS(dir: string, files: CSSFile[], seen: Set<string>, maxDepth: number): void {
  if (!existsSync(dir)) return;

  const SKIP_DIRS = new Set([
    "node_modules", ".next", ".nuxt", "dist", "build", ".git",
    ".cache", "coverage", ".turbo", ".vercel",
  ]);

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (maxDepth > 0) {
          scanDirForCSS(join(dir, entry.name), files, seen, maxDepth - 1);
        }
      } else if (entry.isFile() && extname(entry.name) === ".css") {
        addFileIfExists(join(dir, entry.name), files, seen);
      }
    }
  } catch {
    // Skip unreadable directories
  }
}

// ============================================================
// var() Font Resolution (Fix 2: VI-82)
// ============================================================

/** Layout file paths to scan for next/font declarations (relative to project root) */
const LAYOUT_FILE_PATHS = [
  "src/app/layout.tsx",
  "src/app/layout.ts",
  "src/app/layout.jsx",
  "src/app/layout.js",
  "app/layout.tsx",
  "app/layout.ts",
  "app/layout.jsx",
  "app/layout.js",
  "src/pages/_app.tsx",
  "src/pages/_app.ts",
  "src/pages/_app.jsx",
  "src/pages/_app.js",
  "pages/_app.tsx",
  "pages/_app.ts",
  "pages/_app.jsx",
  "pages/_app.js",
];

/**
 * Well-known next/font import names mapped to font family names.
 * Covers the most common Google Fonts used with next/font.
 */
const NEXT_FONT_MAP: Record<string, string> = {
  Inter: "Inter",
  Roboto: "Roboto",
  Open_Sans: "Open Sans",
  Lato: "Lato",
  Poppins: "Poppins",
  Montserrat: "Montserrat",
  Raleway: "Raleway",
  Nunito: "Nunito",
  Playfair_Display: "Playfair Display",
  Source_Code_Pro: "Source Code Pro",
  Fira_Code: "Fira Code",
  JetBrains_Mono: "JetBrains Mono",
  Roboto_Mono: "Roboto Mono",
  IBM_Plex_Mono: "IBM Plex Mono",
  IBM_Plex_Sans: "IBM Plex Sans",
  DM_Sans: "DM Sans",
  Space_Grotesk: "Space Grotesk",
  Geist: "Geist",
  Geist_Mono: "Geist Mono",
  Manrope: "Manrope",
  Outfit: "Outfit",
  Plus_Jakarta_Sans: "Plus Jakarta Sans",
  Work_Sans: "Work Sans",
  Rubik: "Rubik",
  Sora: "Sora",
  Lexend: "Lexend",
};

/**
 * Scan Next.js layout files for font declarations and resolve var() references
 * in the extracted typography config.
 *
 * Scoped to Next.js patterns only — not a general var() resolver.
 */
function resolveVarFontReferences(result: ExtractionResult, targetDir: string): void {
  const typo = result.config.typography;
  if (!typo) return;

  // Check if any font family is a var() reference
  const hasVarRef =
    typo.heading?.family?.startsWith("var(") ||
    typo.body?.family?.startsWith("var(") ||
    typo.mono?.family?.startsWith("var(");

  if (!hasVarRef) return;

  // Parse layout files for next/font declarations
  const fontMap = parseNextFontFromLayouts(targetDir);
  if (fontMap.size === 0) return;

  // Resolve var() references
  if (typo.heading?.family?.startsWith("var(")) {
    const varName = extractVarName(typo.heading.family);
    const resolved = fontMap.get(varName);
    if (resolved) typo.heading.family = resolved;
  }
  if (typo.body?.family?.startsWith("var(")) {
    const varName = extractVarName(typo.body.family);
    const resolved = fontMap.get(varName);
    if (resolved) typo.body.family = resolved;
  }
  if (typo.mono?.family?.startsWith("var(")) {
    const varName = extractVarName(typo.mono.family);
    const resolved = fontMap.get(varName);
    if (resolved) typo.mono.family = resolved;
  }
}

/** Extract the CSS variable name from a var() expression: var(--font-sans) -> --font-sans */
function extractVarName(varExpr: string): string {
  const match = varExpr.match(/var\(\s*(--[\w-]+)/);
  return match ? match[1] : varExpr;
}

/**
 * Parse Next.js layout files for `next/font` import declarations.
 * Returns a map of CSS variable name to resolved font family name.
 *
 * Detects patterns like:
 *   import { Inter } from "next/font/google";
 *   const inter = Inter({ variable: "--font-sans" });
 *
 *   import localFont from "next/font/local";
 *   const myFont = localFont({ variable: "--font-heading", ... });
 */
export function parseNextFontFromLayouts(targetDir: string): Map<string, string> {
  const fontMap = new Map<string, string>();

  for (const relPath of LAYOUT_FILE_PATHS) {
    const fullPath = join(targetDir, relPath);
    if (!existsSync(fullPath)) continue;

    try {
      const content = readFileSync(fullPath, "utf-8");
      parseNextFontDeclarations(content, fontMap);
    } catch {
      // Skip unreadable files
    }
  }

  return fontMap;
}

/**
 * Parse next/font declarations from file content.
 * Extracts the font name and its CSS variable assignment.
 */
export function parseNextFontDeclarations(
  content: string,
  fontMap: Map<string, string>
): void {
  // Pattern 1: Named Google Font imports
  // import { Inter, Roboto_Mono } from "next/font/google"
  const googleImportRe = /import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["']/g;
  let importMatch: RegExpMatchArray | null;

  const importedFonts: string[] = [];
  const googleImportMatches = content.matchAll(googleImportRe);
  for (const m of googleImportMatches) {
    const names = m[1].split(",").map((n) => n.trim()).filter(Boolean);
    importedFonts.push(...names);
  }

  // For each imported font, find its variable assignment
  for (const fontName of importedFonts) {
    const family = NEXT_FONT_MAP[fontName] ?? fontName.replace(/_/g, " ");

    // Match: const inter = Inter({ ... variable: "--font-sans" ... })
    const callRe = new RegExp(
      `(?:const|let|var)\\s+\\w+\\s*=\\s*${fontName}\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`,
      "m"
    );
    const callMatch = content.match(callRe);
    if (callMatch) {
      const varMatch = callMatch[1].match(/variable\s*:\s*["'](--[\w-]+)["']/);
      if (varMatch) {
        fontMap.set(varMatch[1], family);
      }
    }
  }

  // Pattern 2: Local font imports
  // import localFont from "next/font/local"
  // const myFont = localFont({ src: "...", variable: "--font-heading" })
  const localImportRe = /import\s+(\w+)\s+from\s*["']next\/font\/local["']/;
  const localImportMatch = content.match(localImportRe);

  if (localImportMatch) {
    const localFnName = localImportMatch[1];
    // Find all calls to localFont(...)
    const localCallRe = new RegExp(
      `(?:const|let|var)\\s+\\w+\\s*=\\s*${localFnName}\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`,
      "gm"
    );
    const localCallMatches = content.matchAll(localCallRe);

    for (const localCallMatch of localCallMatches) {
      const block = localCallMatch[1];
      const varMatch = block.match(/variable\s*:\s*["'](--[\w-]+)["']/);
      if (!varMatch) continue;

      const varName = varMatch[1];

      // Try to infer family name from the src path
      // e.g., src: "./fonts/Satoshi-Variable.woff2" -> Satoshi
      const srcMatch = block.match(/src\s*:\s*["']([^"']+)["']/);
      if (srcMatch) {
        const srcPath = srcMatch[1];
        const fileName = basename(srcPath, extname(srcPath));
        // Extract font name: strip weight/style suffixes
        const fontBaseName = fileName
          .replace(/[-_](Variable|Regular|Bold|Light|Medium|SemiBold|ExtraBold|Thin|Black|Italic).*$/i, "")
          .replace(/[-_]/g, " ")
          .trim();
        if (fontBaseName) {
          fontMap.set(varName, fontBaseName);
        }
      }
    }
  }
}

// ============================================================
// Font Hint Extraction
// ============================================================

interface FontHints {
  heading?: { family?: string };
  body?: { family?: string };
  mono?: { family?: string };
}

/** Known npm font packages → font family name */
const FONT_PACKAGE_MAP: Record<string, string> = {
  "@fontsource/inter": "Inter",
  "@fontsource/roboto": "Roboto",
  "@fontsource/open-sans": "Open Sans",
  "@fontsource/lato": "Lato",
  "@fontsource/poppins": "Poppins",
  "@fontsource/montserrat": "Montserrat",
  "@fontsource/raleway": "Raleway",
  "@fontsource/nunito": "Nunito",
  "@fontsource/playfair-display": "Playfair Display",
  "@fontsource/source-code-pro": "Source Code Pro",
  "@fontsource/fira-code": "Fira Code",
  "@fontsource/jetbrains-mono": "JetBrains Mono",
  "@fontsource-variable/inter": "Inter",
  "@fontsource-variable/roboto": "Roboto",
  "@fontsource-variable/open-sans": "Open Sans",
  "next/font": "", // handled separately
};

const MONO_FONT_NAMES = new Set([
  "Source Code Pro", "Fira Code", "JetBrains Mono", "Roboto Mono",
  "SF Mono", "Cascadia Code", "IBM Plex Mono",
]);

function extractFontHints(targetDir: string): FontHints | undefined {
  const pkgPath = join(targetDir, "package.json");
  if (!existsSync(pkgPath)) return undefined;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const fonts: string[] = [];

    for (const [dep, _] of Object.entries(allDeps)) {
      const family = FONT_PACKAGE_MAP[dep];
      if (family) fonts.push(family);
      // Handle @fontsource/<font-name> pattern
      if (dep.startsWith("@fontsource/") && !FONT_PACKAGE_MAP[dep]) {
        const name = dep.replace("@fontsource/", "").split("-").map(
          (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
        ).join(" ");
        fonts.push(name);
      }
      if (dep.startsWith("@fontsource-variable/") && !FONT_PACKAGE_MAP[dep]) {
        const name = dep.replace("@fontsource-variable/", "").split("-").map(
          (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
        ).join(" ");
        fonts.push(name);
      }
    }

    if (fonts.length === 0) return undefined;

    const result: FontHints = {};
    const monoFonts = fonts.filter((f) => MONO_FONT_NAMES.has(f));
    const bodyFonts = fonts.filter((f) => !MONO_FONT_NAMES.has(f));

    if (bodyFonts.length > 0) {
      result.heading = { family: bodyFonts[0] };
      result.body = { family: bodyFonts[0] };
    }
    if (monoFonts.length > 0) {
      result.mono = { family: monoFonts[0] };
    }

    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    return undefined;
  }
}

// ============================================================
// Theme Name Inference
// ============================================================

function inferThemeName(targetDir: string): string {
  // Try package.json name
  const pkgPath = join(targetDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) {
        const name = pkg.name.replace(/^@[\w-]+\//, "");
        return `${name}-theme`;
      }
    } catch {
      // Fall through
    }
  }

  // Fall back to directory name
  return `${basename(targetDir)}-theme`;
}

// ============================================================
// Output Formatters
// ============================================================

function confidenceComment(confidence: Confidence): string {
  return `# confidence: ${confidence}`;
}

function outputJSON(
  result: ExtractionResult,
  validationResult?: ReturnType<typeof validate>
): void {
  const output: Record<string, unknown> = {
    success: true,
    config: result.config,
    extraction: {
      tokens: result.tokens,
      unmapped: result.unmapped,
      warnings: result.warnings,
      summary: {
        totalTokens: result.tokens.length,
        highConfidence: result.tokens.filter((t) => t.confidence === "high").length,
        mediumConfidence: result.tokens.filter((t) => t.confidence === "medium").length,
        lowConfidence: result.tokens.filter((t) => t.confidence === "low").length,
        unmappedCount: result.unmapped.length,
      },
    },
  };

  if (validationResult) {
    output.validation = validationResult;
  }

  console.log(JSON.stringify(output, null, 2));
}

function outputYAML(
  result: ExtractionResult,
  outputPath: string | undefined,
  cwd: string,
  validationResult?: ReturnType<typeof validate>
): void {
  // Build YAML with confidence annotations as comments
  const yamlStr = buildAnnotatedYAML(result);

  // Determine output path
  const outFile = resolve(cwd, outputPath ?? ".visor.yaml");

  // Print summary
  const high = result.tokens.filter((t) => t.confidence === "high").length;
  const med = result.tokens.filter((t) => t.confidence === "medium").length;
  const low = result.tokens.filter((t) => t.confidence === "low").length;

  logger.info("Extraction summary:");
  logger.item(`${result.tokens.length} tokens extracted`);
  logger.item(`  High confidence: ${high}`);
  logger.item(`  Medium confidence: ${med}`);
  logger.item(`  Low confidence: ${low}`);
  logger.item(`${result.unmapped.length} unmapped tokens`);
  logger.blank();

  // Print warnings
  if (result.warnings.length > 0) {
    logger.warn("Warnings:");
    for (const w of result.warnings) {
      logger.item(w);
    }
    logger.blank();
  }

  // Print unmapped tokens
  if (result.unmapped.length > 0) {
    logger.info("Unmapped tokens (review manually):");
    for (const u of result.unmapped.slice(0, 10)) {
      logger.item(`${u.name}: ${u.value} (${u.context})`);
    }
    if (result.unmapped.length > 10) {
      logger.item(`... and ${result.unmapped.length - 10} more`);
    }
    logger.blank();
  }

  // Write file
  writeFileSync(outFile, yamlStr, "utf-8");
  logger.success(`Theme written to ${relative(cwd, outFile)}`);

  // Validation output
  if (validationResult) {
    logger.blank();
    if (validationResult.valid) {
      logger.success("Validation passed");
    } else {
      logger.warn("Validation issues:");
      for (const err of validationResult.errors) {
        logger.error(`  ${err.code}: ${err.message}`);
      }
    }
    if (validationResult.warnings.length > 0) {
      for (const w of validationResult.warnings) {
        logger.warn(`  ${w.code}: ${w.message}`);
      }
    }
  }
}

/**
 * Build a YAML string with confidence annotations as inline comments.
 * Uses the yaml library for base serialization, then inserts comment annotations.
 */
function buildAnnotatedYAML(result: ExtractionResult): string {
  const baseYaml = stringifyYaml(result.config, { lineWidth: 0 });

  // Build a map of token paths to confidence levels
  const confidenceMap = new Map<string, Confidence>();
  for (const token of result.tokens) {
    confidenceMap.set(token.name, token.confidence);
  }

  // Annotate color lines
  const lines = baseYaml.split("\n");
  const annotated: string[] = [];
  let inColors = false;
  let inColorsDark = false;

  for (const line of lines) {
    // Track section context
    if (/^colors:/.test(line)) {
      inColors = true;
      inColorsDark = false;
    } else if (/^colors-dark:/.test(line)) {
      inColorsDark = true;
      inColors = false;
    } else if (/^\S/.test(line) && !line.startsWith(" ")) {
      inColors = false;
      inColorsDark = false;
    }

    // Add confidence comments to color values
    if (inColors || inColorsDark) {
      const match = line.match(/^\s+([\w-]+):\s/);
      if (match) {
        const role = match[1];
        const key = `colors.${role}`;
        const confidence = confidenceMap.get(key);
        if (confidence) {
          annotated.push(`${line} ${confidenceComment(confidence)}`);
          continue;
        }
      }
    }

    annotated.push(line);
  }

  return annotated.join("\n");
}
