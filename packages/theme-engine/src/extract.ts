/**
 * Theme Extraction Engine
 *
 * Scans CSS files from an existing project and produces a best-effort
 * VisorThemeConfig with confidence annotations per token.
 *
 * Handles three CSS architectures:
 * 1. Reference app: full 3-tier separation, :root/.dark, RGB channels
 * 2. Blacklight: flat primitives only, no semantic layer, opacity variants
 * 3. Kaiah: OKLCH format, @custom-variant dark, @theme inline syntax
 */

import { parseColor } from "./color.js";
import {
  SEMANTIC_MAP,
  isShadeRef,
  type ShadeRef,
} from "./semantic-map.js";
import type { VisorThemeConfig, ColorRole, ShadeStep, ParsedColor } from "./types.js";

// ============================================================
// Types
// ============================================================

export type Confidence = "high" | "medium" | "low";

export interface ExtractedToken {
  name: string;
  value: string;
  context: "light" | "dark";
  confidence: Confidence;
  reason: string;
}

export interface ExtractionResult {
  config: VisorThemeConfig;
  tokens: ExtractedToken[];
  unmapped: Array<{ name: string; value: string; context: "light" | "dark" }>;
  warnings: string[];
}

export interface CSSFile {
  path: string;
  content: string;
}

interface CSSDeclaration {
  property: string;
  value: string;
  context: "light" | "dark";
}

interface ColorCandidate {
  role: ColorRole;
  value: string;
  parsed: ParsedColor;
  confidence: Confidence;
  reason: string;
  shade?: ShadeStep;
}

// ============================================================
// CSS Parsing
// ============================================================

/** Regex to match selectors (tested against extracted selector strings, no braces) */
const ROOT_SELECTOR_RE = /(?::root|html)/;
const DARK_SELECTOR_RE =
  /(?:\.dark|\[data-theme=["']dark["']\]|@custom-variant\s+dark)/;

/**
 * Parse CSS content and extract all custom property declarations.
 * Groups them by light/dark context based on selector.
 */
export function parseCSSDeclarations(css: string): CSSDeclaration[] {
  const declarations: CSSDeclaration[] = [];

  // Remove CSS comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Find all rule blocks with their selectors
  const blocks = extractCSSBlocks(cleaned);

  for (const block of blocks) {
    const isDark = DARK_SELECTOR_RE.test(block.selector);
    const isRoot = ROOT_SELECTOR_RE.test(block.selector) && !isDark;
    const context: "light" | "dark" = isDark ? "dark" : "light";

    // Only extract from root-like or dark-mode selectors
    if (!isRoot && !isDark && !block.selector.includes(":root")) {
      // Also check for bare selectors that might contain custom properties
      // (e.g., component-level tokens in CSS modules)
      if (!block.body.includes("--")) continue;
    }

    // Skip blocks that contain nested blocks — declarations will be
    // extracted from the inner (leaf) blocks to avoid duplicates
    if (block.body.includes("{")) continue;

    // Extract custom property declarations
    const propRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    while ((m = propRe.exec(block.body)) !== null) {
      declarations.push({
        property: m[1],
        value: m[2].trim(),
        context,
      });
    }
  }

  return declarations;
}

interface CSSBlock {
  selector: string;
  body: string;
}

/** Extract CSS rule blocks (selector + body pairs) */
function extractCSSBlocks(css: string): CSSBlock[] {
  const blocks: CSSBlock[] = [];
  let i = 0;

  while (i < css.length) {
    // Find next opening brace
    const braceIdx = css.indexOf("{", i);
    if (braceIdx === -1) break;

    const selector = css.slice(i, braceIdx).trim();

    // Find matching closing brace (handle nesting)
    let depth = 1;
    let j = braceIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      if (css[j] === "}") depth--;
      j++;
    }

    const body = css.slice(braceIdx + 1, j - 1);

    if (selector) {
      blocks.push({ selector, body });

      // For nested blocks (e.g., @layer, @media), also parse the inner blocks
      if (body.includes("{")) {
        const innerBlocks = extractCSSBlocks(body);
        for (const inner of innerBlocks) {
          // Inherit dark context from outer selector
          const isDarkOuter = DARK_SELECTOR_RE.test(selector);
          if (isDarkOuter && !DARK_SELECTOR_RE.test(inner.selector)) {
            blocks.push({
              selector: `.dark ${inner.selector}`,
              body: inner.body,
            });
          } else {
            blocks.push(inner);
          }
        }
      }
    }

    i = j;
  }

  return blocks;
}

// ============================================================
// Token Classification
// ============================================================

/** Known Visor semantic token prefixes mapped to category */
const SEMANTIC_PREFIX_MAP: Record<string, keyof typeof SEMANTIC_MAP> = {
  "--text-": "text",
  "--surface-": "surface",
  "--border-": "border",
  "--interactive-": "interactive",
};

/** Reverse lookup: given a semantic token name, find the mapping entry */
function findSemanticMapping(
  tokenName: string
): { category: string; key: string; mapping: { light: unknown; dark: unknown } } | null {
  for (const [prefix, category] of Object.entries(SEMANTIC_PREFIX_MAP)) {
    if (tokenName.startsWith(prefix)) {
      const key = tokenName.slice(prefix.length);
      const map = SEMANTIC_MAP[category];
      if (key in map) {
        return { category, key, mapping: map[key] };
      }
    }
  }
  return null;
}

/** Check if a CSS value is a color (not a var reference, number, etc.) */
function isColorValue(value: string): boolean {
  if (value.startsWith("var(")) return false;
  if (/^\d+(\.\d+)?(px|rem|em|%|ms|s)?$/.test(value)) return false;
  if (value.includes(",") && (value.includes("sans") || value.includes("mono") || value.includes("serif"))) return false;
  if (value.startsWith("cubic-bezier")) return false;
  if (/^\d+px\s/.test(value)) return false;

  return parseColor(value) !== null;
}

// ============================================================
// Color Role Inference
// ============================================================

/** Anchor shade steps for inferring base color from a shade scale */
const ANCHOR_SHADES: Record<ColorRole, ShadeStep> = {
  primary: 600,
  accent: 600,
  neutral: 500,
  success: 500,
  warning: 500,
  error: 500,
  info: 500,
};

/** Well-known naming patterns that map to color roles */
const COLOR_NAME_PATTERNS: Array<{ pattern: RegExp; role: ColorRole; confidence: Confidence }> = [
  { pattern: /primary/i, role: "primary", confidence: "medium" },
  { pattern: /accent/i, role: "accent", confidence: "medium" },
  { pattern: /neutral|gray|grey/i, role: "neutral", confidence: "medium" },
  { pattern: /success|green/i, role: "success", confidence: "medium" },
  { pattern: /warning|amber|yellow|orange/i, role: "warning", confidence: "medium" },
  { pattern: /error|danger|red|destructive/i, role: "error", confidence: "medium" },
  { pattern: /info|blue/i, role: "info", confidence: "medium" },
];

/**
 * Infer color roles from extracted CSS declarations.
 *
 * Strategy:
 * 1. High confidence: exact match to a Visor semantic token mapping
 * 2. Medium confidence: naming convention matches (e.g., --primary-600)
 * 3. Low confidence: ambiguous color values
 */
function inferColorRoles(
  declarations: CSSDeclaration[]
): { candidates: ColorCandidate[]; unmapped: CSSDeclaration[] } {
  const candidates: ColorCandidate[] = [];
  const unmapped: CSSDeclaration[] = [];

  for (const decl of declarations) {
    const parsed = parseColor(decl.value);
    if (!parsed) continue;

    // Strategy 1: Check if property matches a known Visor semantic token
    const semanticMatch = findSemanticMapping(decl.property);
    if (semanticMatch) {
      const modeRef = decl.context === "light" ? semanticMatch.mapping.light : semanticMatch.mapping.dark;
      if (modeRef && isShadeRef(modeRef as ShadeRef)) {
        const ref = modeRef as ShadeRef;
        candidates.push({
          role: ref.role,
          value: decl.value,
          parsed,
          confidence: "high",
          reason: `Exact match: ${decl.property} maps to ${ref.role}/${ref.shade}`,
          shade: ref.shade,
        });
        continue;
      }
    }

    // Strategy 2: Check naming conventions
    let matched = false;
    for (const { pattern, role, confidence } of COLOR_NAME_PATTERNS) {
      if (pattern.test(decl.property)) {
        const shadeMatch = decl.property.match(/(\d{2,3})$/);
        const shade = shadeMatch ? (parseInt(shadeMatch[1]) as ShadeStep) : undefined;

        candidates.push({
          role,
          value: decl.value,
          parsed,
          confidence,
          reason: `Naming convention: ${decl.property} matches ${role} pattern`,
          shade,
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      unmapped.push(decl);
    }
  }

  return { candidates, unmapped };
}

/**
 * Select the best color for each role from candidates.
 * Prefers anchor shade (600 for primary/accent, 500 for status).
 */
function selectBestColors(
  candidates: ColorCandidate[]
): Map<ColorRole, { value: string; parsed: ParsedColor; confidence: Confidence; reason: string }> {
  const byRole = new Map<ColorRole, ColorCandidate[]>();

  for (const c of candidates) {
    const existing = byRole.get(c.role) ?? [];
    existing.push(c);
    byRole.set(c.role, existing);
  }

  const result = new Map<ColorRole, { value: string; parsed: ParsedColor; confidence: Confidence; reason: string }>();

  for (const [role, roleCandidates] of byRole) {
    const anchorShade = ANCHOR_SHADES[role];
    const sorted = [...roleCandidates].sort((a, b) => {
      const confOrder = { high: 0, medium: 1, low: 2 };
      const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
      if (confDiff !== 0) return confDiff;

      const aIsAnchor = a.shade === anchorShade ? 0 : 1;
      const bIsAnchor = b.shade === anchorShade ? 0 : 1;
      return aIsAnchor - bIsAnchor;
    });

    const best = sorted[0];
    result.set(role, {
      value: best.value,
      parsed: best.parsed,
      confidence: best.confidence,
      reason: best.reason,
    });
  }

  return result;
}

// ============================================================
// Typography Extraction
// ============================================================

interface TypographyResult {
  heading?: { family?: string; weight?: number };
  body?: { family?: string; weight?: number };
  mono?: { family?: string };
}

function extractTypography(declarations: CSSDeclaration[]): TypographyResult {
  const result: TypographyResult = {};

  for (const decl of declarations) {
    const prop = decl.property;
    const val = decl.value;

    if (prop.includes("font-heading") || prop.includes("font-display") || prop === "--font-family-heading") {
      result.heading = { ...result.heading, family: cleanFontValue(val) };
    } else if (prop.includes("font-body") || prop.includes("font-sans") || prop === "--font-family-body") {
      result.body = { ...result.body, family: cleanFontValue(val) };
    } else if (prop.includes("font-mono") || prop.includes("font-code") || prop === "--font-family-mono") {
      result.mono = { family: cleanFontValue(val) };
    }

    if (prop.includes("weight-heading") || prop === "--font-weight-heading") {
      const weight = parseInt(val);
      if (!isNaN(weight)) result.heading = { ...result.heading, weight };
    } else if (prop.includes("weight-body") || prop === "--font-weight-body") {
      const weight = parseInt(val);
      if (!isNaN(weight)) result.body = { ...result.body, weight };
    }
  }

  return result;
}

function cleanFontValue(val: string): string {
  if (val.startsWith("var(")) return val;
  return val.replace(/^["']|["']$/g, "");
}

// ============================================================
// Spacing / Radius / Shadow / Motion Extraction
// ============================================================

function extractSpacing(declarations: CSSDeclaration[]): { base?: number } | undefined {
  for (const decl of declarations) {
    if (decl.property === "--spacing-base" || decl.property === "--spacing-unit") {
      const val = parseInt(decl.value);
      if (!isNaN(val)) return { base: val };
    }
    if (decl.property === "--spacing-1") {
      const val = parseInt(decl.value);
      if (!isNaN(val)) return { base: val };
    }
  }
  return undefined;
}

function extractRadius(declarations: CSSDeclaration[]): Record<string, number> | undefined {
  const result: Record<string, number> = {};
  const radiusMap: Record<string, string> = {
    "--radius-sm": "sm",
    "--radius-md": "md",
    "--radius-lg": "lg",
    "--radius-xl": "xl",
    "--radius-pill": "pill",
    "--border-radius-sm": "sm",
    "--border-radius-md": "md",
    "--border-radius-lg": "lg",
    "--border-radius-xl": "xl",
    "--border-radius-pill": "pill",
  };

  for (const decl of declarations) {
    const key = radiusMap[decl.property];
    if (key) {
      const val = parseFloat(decl.value);
      if (!isNaN(val)) result[key] = val;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function extractShadows(declarations: CSSDeclaration[]): Record<string, string> | undefined {
  const result: Record<string, string> = {};
  const shadowMap: Record<string, string> = {
    "--shadow-xs": "xs",
    "--shadow-sm": "sm",
    "--shadow-md": "md",
    "--shadow-lg": "lg",
    "--shadow-xl": "xl",
  };

  for (const decl of declarations) {
    const key = shadowMap[decl.property];
    if (key) {
      result[key] = decl.value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function extractMotion(declarations: CSSDeclaration[]): Record<string, string> | undefined {
  const result: Record<string, string> = {};
  const motionMap: Record<string, string> = {
    "--motion-duration-fast": "duration-fast",
    "--motion-duration-normal": "duration-normal",
    "--motion-duration-slow": "duration-slow",
    "--motion-easing": "easing",
    "--duration-fast": "duration-fast",
    "--duration-normal": "duration-normal",
    "--duration-slow": "duration-slow",
    "--easing-default": "easing",
    "--transition-duration-fast": "duration-fast",
    "--transition-duration-normal": "duration-normal",
    "--transition-duration-slow": "duration-slow",
  };

  for (const decl of declarations) {
    const key = motionMap[decl.property];
    if (key) {
      result[key] = decl.value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// ============================================================
// Background / Surface Extraction
// ============================================================

function extractBackgroundSurface(
  declarations: CSSDeclaration[]
): { light: { background?: string; surface?: string }; dark: { background?: string; surface?: string } } {
  const result = {
    light: {} as { background?: string; surface?: string },
    dark: {} as { background?: string; surface?: string },
  };

  for (const decl of declarations) {
    const parsed = parseColor(decl.value);
    if (!parsed) continue;

    if (
      decl.property === "--surface-page" ||
      decl.property === "--background" ||
      decl.property === "--bg" ||
      decl.property === "--color-background"
    ) {
      if (decl.context === "dark") {
        result.dark.background = decl.value;
      } else {
        result.light.background = decl.value;
      }
    }

    if (
      decl.property === "--surface-card" ||
      decl.property === "--surface" ||
      decl.property === "--color-surface"
    ) {
      if (decl.context === "dark") {
        result.dark.surface = decl.value;
      } else {
        result.light.surface = decl.value;
      }
    }
  }

  return result;
}

// ============================================================
// Main Extraction Pipeline
// ============================================================

/**
 * Extract a VisorThemeConfig from CSS files.
 *
 * @param files - Array of CSS files with path and content
 * @param name - Theme name for the output config
 * @returns ExtractionResult with config, token details, unmapped tokens, and warnings
 */
export function extractFromCSS(
  files: CSSFile[],
  name: string = "extracted-theme"
): ExtractionResult {
  const warnings: string[] = [];
  const allDeclarations: CSSDeclaration[] = [];

  // Parse all CSS files
  for (const file of files) {
    try {
      const decls = parseCSSDeclarations(file.content);
      allDeclarations.push(...decls);
    } catch (err) {
      warnings.push(`Failed to parse ${file.path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (allDeclarations.length === 0) {
    warnings.push("No CSS custom properties found in any scanned files.");
    return {
      config: { name, version: 1, colors: { primary: "#6366f1" } },
      tokens: [],
      unmapped: [],
      warnings,
    };
  }

  // Separate color declarations for role inference
  const colorDeclarations = allDeclarations.filter((d) => isColorValue(d.value));

  // Infer color roles
  const { candidates, unmapped: unmappedDecls } = inferColorRoles(colorDeclarations);
  const bestColors = selectBestColors(candidates);

  // Extract non-color tokens from all declarations (each extractor filters by property name)
  const typography = extractTypography(allDeclarations);
  const spacing = extractSpacing(allDeclarations);
  const radius = extractRadius(allDeclarations);
  const shadows = extractShadows(allDeclarations);
  const motion = extractMotion(allDeclarations);
  const bgSurface = extractBackgroundSurface(allDeclarations);

  // Build extracted tokens list
  const tokens: ExtractedToken[] = [];
  for (const candidate of candidates) {
    tokens.push({
      name: `colors.${candidate.role}`,
      value: candidate.value,
      context: "light",
      confidence: candidate.confidence,
      reason: candidate.reason,
    });
  }

  // Build config
  const config: VisorThemeConfig = {
    name,
    version: 1,
    colors: {
      primary: bestColors.get("primary")?.value ?? "#6366f1",
    },
  };

  // Add optional colors
  const optionalRoles: ColorRole[] = ["accent", "neutral", "success", "warning", "error", "info"];
  for (const role of optionalRoles) {
    const color = bestColors.get(role);
    if (color) {
      (config.colors as Record<string, string>)[role] = color.value;
    }
  }

  // Add background/surface from explicit tokens
  if (bgSurface.light.background) config.colors.background = bgSurface.light.background;
  if (bgSurface.light.surface) config.colors.surface = bgSurface.light.surface;

  // Add dark mode colors
  const darkColors: Record<string, string> = {};
  if (bgSurface.dark.background) darkColors.background = bgSurface.dark.background;
  if (bgSurface.dark.surface) darkColors.surface = bgSurface.dark.surface;

  // Check for dark-specific color declarations
  for (const decl of colorDeclarations) {
    if (decl.context !== "dark") continue;
    for (const { pattern, role } of COLOR_NAME_PATTERNS) {
      if (pattern.test(decl.property)) {
        darkColors[role] = decl.value;
        break;
      }
    }
  }

  if (Object.keys(darkColors).length > 0) {
    config["colors-dark"] = darkColors as VisorThemeConfig["colors-dark"];
  }

  // Add typography
  if (typography.heading || typography.body || typography.mono) {
    config.typography = {};
    if (typography.heading) config.typography.heading = typography.heading;
    if (typography.body) config.typography.body = typography.body;
    if (typography.mono) config.typography.mono = typography.mono;
  }

  // Add spacing
  if (spacing) config.spacing = spacing;

  // Add radius
  if (radius) config.radius = radius as VisorThemeConfig["radius"];

  // Add shadows
  if (shadows) config.shadows = shadows as VisorThemeConfig["shadows"];

  // Add motion
  if (motion) config.motion = motion as VisorThemeConfig["motion"];

  // Confidence warnings
  if (!bestColors.has("primary")) {
    warnings.push(
      "Could not identify a primary color. Using default (#6366f1). Review the output and set colors.primary manually."
    );
  }

  const lowConfidenceTokens = tokens.filter((t) => t.confidence === "low");
  if (lowConfidenceTokens.length > 0) {
    warnings.push(
      `${lowConfidenceTokens.length} token(s) extracted with low confidence — review these values.`
    );
  }

  // Build unmapped list
  const unmapped = unmappedDecls.map((d) => ({
    name: d.property,
    value: d.value,
    context: d.context,
  }));

  return { config, tokens, unmapped, warnings };
}
