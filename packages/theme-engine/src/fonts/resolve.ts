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
 * Resolve a font family name to a FontResolution.
 *
 * Looks up the family in the bundled Google Fonts catalog.
 * If found, constructs the CSS URL with requested weights and display strategy.
 * If not found, returns a custom source with guidance for manual setup.
 */
export function resolveFont(
  family: string,
  options: FontResolveOptions = {}
): FontResolution {
  const display = options.display ?? DEFAULT_DISPLAY;
  const requestedWeights = options.weights ?? DEFAULT_WEIGHTS;
  const italic = options.italic ?? false;

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
    };
  }

  // Not in Google Fonts — flag as custom
  return {
    family,
    source: "custom",
    cssUrl: null,
    weights: requestedWeights,
    italic,
    display,
    category: options.category ?? "sans-serif",
    guidance: `"${family}" is not available on Google Fonts. To use this font:\n` +
      `  1. Add the font files (.woff2) to your project's public/fonts/ directory\n` +
      `  2. Create @font-face declarations in your theme CSS\n` +
      `  3. Reference the font family in your theme's --font-display or --font-body token`,
  };
}
