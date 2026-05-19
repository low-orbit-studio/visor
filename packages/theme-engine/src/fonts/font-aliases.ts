/**
 * Font weight-name alias registry for the Visor Fonts CDN URL builder.
 *
 * Standard PostScript naming (Light/Regular/Medium/Bold/ExtraBold/Black)
 * is handled by the WEIGHT_NAMES table in resolve.ts. Foundries that use
 * non-standard names (e.g. Pangram Pangram's `Book` and `Super`) register
 * per-family overrides here so theme authors can keep writing standard
 * weight numbers in their .visor.yaml files.
 *
 * Family keys are exact-match (case-sensitive); weight keys are the numeric
 * weight (300, 400, 500, …) as in WEIGHT_NAMES. The mapped string is the
 * PostScript-style suffix that follows `{Family}-` in the bucket filename.
 */

export const FONT_WEIGHT_ALIASES: Record<string, Record<number, string>> = {
  "PP Model Mono": {
    400: "Book",
    800: "Super",
  },
  "PP Model Sans": {
    400: "Book",
    800: "Super",
  },
  "PP Model Plastic": {
    400: "Book",
    800: "Super",
  },
  // Hoefler's Gotham uses "Book" instead of "Regular" at weight 400.
  // Light (300) and Medium (500) match WEIGHT_NAMES defaults.
  Gotham: {
    400: "Book",
  },
};

export function lookupFontWeightAlias(
  family: string,
  weight: number
): string | null {
  return FONT_WEIGHT_ALIASES[family]?.[weight] ?? null;
}
