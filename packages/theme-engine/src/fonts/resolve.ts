/**
 * Font resolver — maps font family names to loadable font resources.
 *
 * For Google Fonts: constructs the CSS URL deterministically.
 * For custom/commercial fonts: flags them with setup guidance.
 */

import { lookupGoogleFont } from "./google-fonts-catalog.js";
import type {
  FontResolution,
  FontResolveOptions,
  FontDisplayStrategy,
  FontSource,
} from "./types.js";

const DEFAULT_WEIGHTS = [400, 700];
const DEFAULT_DISPLAY: FontDisplayStrategy = "swap";

/**
 * Construct a Google Fonts CSS2 URL for a given family.
 *
 * Uses the CSS2 API format:
 *   https://fonts.googleapis.com/css2?family=Font+Name:ital,wght@0,400;0,700;1,400&display=swap
 */
function buildGoogleFontsCssUrl(
  family: string,
  weights: number[],
  italic: boolean,
  display: FontDisplayStrategy
): string {
  const encodedFamily = family.replace(/ /g, "+");

  // Build axis value list
  const tuples: string[] = [];

  // CSS2 API requires axis value tuples to be sorted
  const sortedWeights = [...weights].sort((a, b) => a - b);

  if (italic) {
    // Include both normal (ital=0) and italic (ital=1) for each weight
    for (const w of sortedWeights) {
      tuples.push(`0,${w}`);
    }
    for (const w of sortedWeights) {
      tuples.push(`1,${w}`);
    }
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@${tuples.join(";")}&display=${display}`;
  }

  // Normal only — just wght axis
  const wghtValues = sortedWeights.join(";");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${wghtValues}&display=${display}`;
}

/**
 * Build a Visor Fonts CDN URL for a specific font file.
 *
 * URL pattern: https://fonts.visor.design/{org}/{family-slug}/{filename}.woff2
 * Family slug: lowercase family name, spaces to hyphens.
 * Filename: original uploaded name (e.g., PPModelPlastic-Regular).
 */
export const VISOR_FONTS_CDN = "https://fonts.visor.design";

function buildFamilySlug(family: string): string {
  return family.toLowerCase().replace(/ /g, "-");
}

function buildFamilyPrefix(family: string): string {
  return family.replace(/ /g, "");
}

const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

export function buildVisorFontUrl(
  org: string,
  family: string,
  weight: number
): string {
  const slug = buildFamilySlug(family);
  const prefix = buildFamilyPrefix(family);
  const weightName = WEIGHT_NAMES[weight] ?? `W${weight}`;
  return `${VISOR_FONTS_CDN}/${org}/${slug}/${prefix}-${weightName}.woff2`;
}

/**
 * Resolve a font family name to a FontResolution.
 *
 * Resolution order:
 *   1. If source is explicitly "visor-fonts", build CDN URLs (requires org)
 *   2. If source is explicitly "local", return local guidance
 *   3. Otherwise, look up in Google Fonts catalog
 *   4. If not found in catalog, fall back to local
 */
export function resolveFont(
  family: string,
  options: FontResolveOptions = {}
): FontResolution {
  const display = options.display ?? DEFAULT_DISPLAY;
  const requestedWeights = options.weights ?? DEFAULT_WEIGHTS;
  const italic = options.italic ?? false;
  const explicitSource: FontSource | undefined = options.source;

  // Explicit visor-fonts source — build CDN URLs
  if (explicitSource === "visor-fonts") {
    return {
      family,
      source: "visor-fonts",
      cssUrl: null,
      weights: requestedWeights,
      italic,
      display,
      category: options.category ?? "sans-serif",
      guidance: null,
      org: options.org ?? null,
    };
  }

  // Explicit local source — skip catalog lookup
  if (explicitSource === "local") {
    return {
      family,
      source: "local",
      cssUrl: null,
      weights: requestedWeights,
      italic,
      display,
      category: options.category ?? "sans-serif",
      guidance:
        `"${family}" is a local font. To use this font:\n` +
        `  1. Add the font files (.woff2) to your project's public/fonts/ directory\n` +
        `  2. Create @font-face declarations in your theme CSS\n` +
        `  3. Reference the font family in your theme's --font-display or --font-body token`,
      org: null,
    };
  }

  const catalogEntry = lookupGoogleFont(family);

  if (catalogEntry) {
    // Filter requested weights to those actually available
    const availableWeights = requestedWeights.filter((w) =>
      catalogEntry.weights.includes(w)
    );

    // If none of the requested weights are available, use the catalog defaults
    const weights =
      availableWeights.length > 0 ? availableWeights : catalogEntry.weights;

    // Check if italic is available
    const hasItalic = catalogEntry.styles.includes("italic");
    const resolvedItalic = italic && hasItalic;

    const cssUrl = buildGoogleFontsCssUrl(
      catalogEntry.family,
      weights,
      resolvedItalic,
      display
    );

    return {
      family: catalogEntry.family, // Use canonical casing from catalog
      source: "google-fonts",
      cssUrl,
      weights,
      italic: resolvedItalic,
      display,
      category: catalogEntry.category,
      guidance: null,
      org: null,
    };
  }

  // Not in Google Fonts — flag as local
  return {
    family,
    source: "local",
    cssUrl: null,
    weights: requestedWeights,
    italic,
    display,
    category: options.category ?? "sans-serif",
    guidance:
      `"${family}" is not available on Google Fonts. To use this font:\n` +
      `  1. Add the font files (.woff2) to your project's public/fonts/ directory\n` +
      `  2. Create @font-face declarations in your theme CSS\n` +
      `  3. Reference the font family in your theme's --font-display or --font-body token`,
    org: null,
  };
}
