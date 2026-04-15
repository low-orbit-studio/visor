/**
 * Theme font pipeline — connects font resolution to the .visor.yaml import flow.
 *
 * Takes the typography section from a .visor.yaml file and produces:
 *   - Resolved font resources (Google Fonts URLs or custom flags)
 *   - Preload/preconnect link tags
 *   - CSS output (@font-face stubs, custom property overrides)
 *   - Warnings for fonts needing manual setup
 */

import { resolveFont, buildVisorFontUrl } from "./resolve.js";
import { generatePreloadLinks, generateStylesheetLinks } from "./preload.js";
import type {
  FontResolution,
  ThemeFontResult,
  VisorTypography,
  FontDisplayStrategy,
} from "./types.js";

/**
 * Generate CSS custom property overrides for the resolved fonts.
 *
 * Maps display font → --font-heading and body font → --font-body/--font-sans.
 * For Google Fonts, also generates the stylesheet import comment.
 * For custom fonts, generates placeholder @font-face blocks.
 */
function generateFontCSS(
  heading: FontResolution | null,
  displayFont: FontResolution | null,
  body: FontResolution | null,
  mono: FontResolution | null,
  typography: VisorTypography
): string {
  const lines: string[] = [];
  const allSlots = [heading, displayFont, body, mono];

  // Google Fonts stylesheet imports (as CSS comments for reference)
  const googleFonts = allSlots.filter(
    (r): r is FontResolution => r !== null && r.source === "google-fonts"
  );
  if (googleFonts.length > 0) {
    lines.push("/* Google Fonts — load these stylesheets in your HTML <head> */");
    for (const font of googleFonts) {
      lines.push(`/* ${font.cssUrl} */`);
    }
    lines.push("");
  }

  // Visor Fonts @font-face declarations (real, not placeholders)
  const visorFonts = allSlots.filter(
    (r): r is FontResolution => r !== null && r.source === "visor-fonts"
  );
  const seenVisorFonts = new Set<string>();
  if (visorFonts.length > 0) {
    lines.push("/* Visor Fonts — CDN-hosted @font-face declarations */");
    for (const font of visorFonts) {
      if (seenVisorFonts.has(font.family)) continue;
      seenVisorFonts.add(font.family);
      for (const weight of font.weights) {
        const url = buildVisorFontUrl(font.org ?? "", font.family, weight);
        lines.push(`@font-face {`);
        lines.push(`  font-family: "${font.family}";`);
        lines.push(`  src: url("${url}") format("woff2");`);
        lines.push(`  font-weight: ${weight};`);
        lines.push(`  font-style: ${font.italic ? "italic" : "normal"};`);
        lines.push(`  font-display: ${font.display};`);
        lines.push(`}`);
        lines.push("");
      }
    }
  }

  // Local font @font-face placeholders
  const localFonts = allSlots.filter(
    (r): r is FontResolution => r !== null && r.source === "local"
  );
  if (localFonts.length > 0) {
    lines.push(
      "/* Local fonts — add your @font-face declarations below */"
    );
    for (const font of localFonts) {
      lines.push(`/* @font-face {`);
      lines.push(`     font-family: "${font.family}";`);
      lines.push(`     src: url("/fonts/${font.family.replace(/ /g, "-").toLowerCase()}.woff2") format("woff2");`);
      lines.push(`     font-weight: ${font.weights.length === 1 ? font.weights[0] : `${font.weights[0]} ${font.weights[font.weights.length - 1]}`};`);
      lines.push(`     font-style: ${font.italic ? "italic" : "normal"};`);
      lines.push(`     font-display: ${font.display};`);
      lines.push(`   } */`);
      lines.push("");
    }
  }

  // Size-adjusted fallback @font-face declarations (eliminates CLS during swap)
  const allFonts = allSlots.filter(
    (r): r is FontResolution => r !== null
  );
  const seenFamilies = new Set<string>();
  for (const font of allFonts) {
    if (!seenFamilies.has(font.family)) {
      seenFamilies.add(font.family);
      lines.push(generateFallbackFontFace(font));
      lines.push("");
    }
  }

  // CSS custom property overrides
  const overrides: string[] = [];

  if (heading) {
    const fallbackName = `${heading.family} Fallback`;
    const fallback = getFallbackStack(heading);
    overrides.push(
      `  --font-heading: "${heading.family}", "${fallbackName}", ${fallback};`
    );
  }

  if (displayFont) {
    const fallbackName = `${displayFont.family} Fallback`;
    const fallback = getFallbackStack(displayFont);
    overrides.push(
      `  --font-display: "${displayFont.family}", "${fallbackName}", ${fallback};`
    );
  }

  if (body) {
    const fallbackName = `${body.family} Fallback`;
    const fallback = getFallbackStack(body);
    overrides.push(`  --font-body: "${body.family}", "${fallbackName}", ${fallback};`);
    overrides.push(`  --font-sans: "${body.family}", "${fallbackName}", ${fallback};`);
  }

  if (mono) {
    const fallbackName = `${mono.family} Fallback`;
    const fallback = getFallbackStack(mono);
    overrides.push(`  --font-mono: "${mono.family}", "${fallbackName}", ${fallback};`);
  }

  // Weight overrides from typography config
  // These target the semantic weight tokens (--weight-heading, --weight-body)
  // which components reference for role-based weight decisions.
  if (typography.heading?.weight) {
    overrides.push(
      `  --weight-heading: ${typography.heading.weight};`
    );
  }
  if (typography.display?.weight) {
    overrides.push(
      `  --weight-display: ${typography.display.weight};`
    );
  }
  if (typography.body?.weight) {
    overrides.push(
      `  --weight-body: ${typography.body.weight};`
    );
  }

  if (overrides.length > 0) {
    lines.push(":root {");
    lines.push(...overrides);
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Get a CSS fallback font stack based on the font's category.
 *
 * Category-aware: serif fonts fall back to serif system fonts,
 * monospace to monospace, etc. This reduces the visual jump during
 * font-display: swap by matching the fallback shape more closely.
 */
function getFallbackStack(resolution: FontResolution): string {
  switch (resolution.category) {
    case "serif":
      return 'Georgia, "Times New Roman", Times, serif';
    case "monospace":
      return '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace';
    case "display":
    case "handwriting":
    case "sans-serif":
    default:
      return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  }
}

/**
 * Generate a @font-face override block that creates a size-adjusted system
 * fallback font. This eliminates layout shift (CLS) during font loading by
 * making the fallback occupy the same space as the target font.
 *
 * The browser uses this adjusted fallback immediately, then swaps to the
 * real font with zero layout shift.
 */
function generateFallbackFontFace(resolution: FontResolution): string {
  const fallbackName = `${resolution.family} Fallback`;
  const systemFont = getSystemFallbackFont(resolution.category);

  // size-adjust percentages for common category pairings.
  // These are approximate — exact values depend on the specific font,
  // but category-level adjustments eliminate the worst CLS.
  const sizeAdjust = getSizeAdjust(resolution.category);

  return [
    `@font-face {`,
    `  font-family: "${fallbackName}";`,
    `  src: local("${systemFont}");`,
    `  size-adjust: ${sizeAdjust};`,
    `  ascent-override: 100%;`,
    `  descent-override: 20%;`,
    `  line-gap-override: 0%;`,
    `}`,
  ].join("\n");
}

function getSystemFallbackFont(category: string): string {
  switch (category) {
    case "serif":
      return "Georgia";
    case "monospace":
      return "Courier New";
    default:
      return "Arial";
  }
}

function getSizeAdjust(category: string): string {
  switch (category) {
    case "serif":
      return "105%";
    case "monospace":
      return "100%";
    default:
      return "107%"; // Most Google sans-serif fonts are slightly wider than Arial
  }
}

/**
 * Resolve all fonts for a theme's typography configuration.
 *
 * This is the main entry point for the font pipeline — called during
 * .visor.yaml import to process the typography section.
 */
export function resolveThemeFonts(
  typography: VisorTypography,
  options?: { display?: FontDisplayStrategy }
): ThemeFontResult {
  const display = options?.display ?? "swap";
  const warnings: string[] = [];

  // Resolve heading font
  let headingResolution: FontResolution | null = null;
  if (typography.heading?.family) {
    // Explicit weights array takes full precedence; otherwise derive from weight field
    const weights: number[] = typography.heading.weights
      ? [...typography.heading.weights]
      : typography.heading.weight
        ? [typography.heading.weight]
        : [];

    headingResolution = resolveFont(typography.heading.family, {
      weights: weights.length > 0 ? weights : undefined,
      display,
      source: typography.heading.source,
      org: typography.heading.org,
    });

    if (headingResolution.guidance) {
      warnings.push(headingResolution.guidance);
    }
  }

  // Resolve body font
  let bodyResolution: FontResolution | null = null;
  if (typography.body?.family) {
    let bodyWeights: number[];
    if (typography.body.weights) {
      // Explicit weights array takes full precedence — use exactly what's specified
      bodyWeights = [...typography.body.weights];
    } else {
      bodyWeights = [];
      if (typography.body.weight) bodyWeights.push(typography.body.weight);
      // Always include 400 and 700 for body text
      if (!bodyWeights.includes(400)) bodyWeights.push(400);
      if (!bodyWeights.includes(700)) bodyWeights.push(700);
    }

    // Same family as heading — merge weights into a single resolution
    if (
      headingResolution &&
      typography.body.family.toLowerCase() ===
        headingResolution.family.toLowerCase()
    ) {
      const mergedWeights = Array.from(
        new Set([...headingResolution.weights, ...bodyWeights])
      ).sort((a, b) => a - b);

      // Re-resolve with merged weights so the CSS URL includes everything
      headingResolution = resolveFont(typography.heading!.family, {
        weights: mergedWeights,
        display,
        source: typography.heading!.source,
        org: typography.heading!.org,
      });
      bodyResolution = headingResolution;
    } else {
      bodyResolution = resolveFont(typography.body.family, {
        weights: bodyWeights.length > 0 ? bodyWeights : undefined,
        display,
        source: typography.body.source,
        org: typography.body.org,
      });

      if (bodyResolution.guidance) {
        warnings.push(bodyResolution.guidance);
      }
    }
  }

  // Resolve display font
  let displayResolution: FontResolution | null = null;
  if (typography.display?.family) {
    const displayWeights: number[] = typography.display.weights
      ? [...typography.display.weights]
      : typography.display.weight
        ? [typography.display.weight]
        : [];

    // Same family as heading — merge weights into a single resolution (smart deduplication).
    // Skip the merge if heading has an explicit weights override; those take precedence.
    if (
      headingResolution &&
      typography.display.family.toLowerCase() ===
        headingResolution.family.toLowerCase()
    ) {
      if (typography.heading?.weights) {
        // Heading weights are explicitly locked — display piggybacks without merging
        displayResolution = headingResolution;
      } else {
        const mergedWeights = Array.from(
          new Set([...headingResolution.weights, ...displayWeights])
        ).sort((a, b) => a - b);

        headingResolution = resolveFont(typography.heading!.family, {
          weights: mergedWeights,
          display,
          source: typography.heading!.source,
          org: typography.heading!.org,
        });
        displayResolution = headingResolution;
      }
    } else if (
      bodyResolution &&
      typography.display.family.toLowerCase() ===
        bodyResolution.family.toLowerCase()
    ) {
      // Same family as body — merge weights
      const mergedWeights = Array.from(
        new Set([...bodyResolution.weights, ...displayWeights])
      ).sort((a, b) => a - b);

      bodyResolution = resolveFont(typography.body!.family, {
        weights: mergedWeights,
        display,
        source: typography.body!.source,
        org: typography.body!.org,
      });
      displayResolution = bodyResolution;
    } else {
      displayResolution = resolveFont(typography.display.family, {
        weights: displayWeights.length > 0 ? displayWeights : undefined,
        display,
        source: typography.display.source,
        org: typography.display.org,
      });

      if (displayResolution.guidance) {
        warnings.push(displayResolution.guidance);
      }
    }
  }

  // Resolve mono font
  let monoResolution: FontResolution | null = null;
  if (typography.mono?.family) {
    const monoWeights: number[] = [];
    if (typography.mono.weight) monoWeights.push(typography.mono.weight);

    monoResolution = resolveFont(typography.mono.family, {
      weights: monoWeights.length > 0 ? monoWeights : undefined,
      display,
      source: typography.mono.source,
      org: typography.mono.org,
      category: "monospace",
    });

    if (monoResolution.guidance) {
      warnings.push(monoResolution.guidance);
    }
  }

  // Collect all unique resolutions for preload generation
  const allResolutions: FontResolution[] = [];
  if (headingResolution) allResolutions.push(headingResolution);
  if (displayResolution && displayResolution !== headingResolution) {
    allResolutions.push(displayResolution);
  }
  if (bodyResolution && bodyResolution !== headingResolution && bodyResolution !== displayResolution) {
    allResolutions.push(bodyResolution);
  }
  if (monoResolution) allResolutions.push(monoResolution);

  const preloadLinks = generatePreloadLinks(allResolutions);
  const stylesheetLinks = generateStylesheetLinks(allResolutions);
  const allLinks = [...preloadLinks, ...stylesheetLinks];

  const css = generateFontCSS(headingResolution, displayResolution, bodyResolution, monoResolution, typography);

  return {
    heading: headingResolution,
    display: displayResolution,
    body: bodyResolution,
    mono: monoResolution,
    preloadLinks: allLinks,
    css,
    warnings,
  };
}
