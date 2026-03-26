/**
 * Fetches the Google Fonts catalog and generates a TypeScript module.
 *
 * Usage:
 *   GOOGLE_FONTS_API_KEY=... npx tsx scripts/update-google-fonts-catalog.ts
 *
 * If no API key is provided, fetches the public developer API endpoint.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(
  __dirname,
  "../src/fonts/google-fonts-catalog.ts"
);

interface GoogleFontsApiItem {
  family: string;
  variants: string[];
  category: string;
}

interface GoogleFontsApiResponse {
  items: GoogleFontsApiItem[];
}

function variantsToWeights(variants: string[]): number[] {
  const weights = new Set<number>();
  for (const v of variants) {
    if (v === "regular" || v === "italic") {
      weights.add(400);
    } else {
      const num = parseInt(v.replace("italic", ""), 10);
      if (!isNaN(num)) weights.add(num);
    }
  }
  return Array.from(weights).sort((a, b) => a - b);
}

function variantsToStyles(variants: string[]): string[] {
  const styles = new Set<string>();
  for (const v of variants) {
    if (v === "italic" || v.endsWith("italic")) {
      styles.add("italic");
    } else {
      styles.add("normal");
    }
  }
  return Array.from(styles).sort();
}

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  const url = apiKey
    ? `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
    : `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=`;

  if (!apiKey) {
    console.error(
      "Warning: No GOOGLE_FONTS_API_KEY set. The API may reject the request."
    );
    console.error(
      "Set GOOGLE_FONTS_API_KEY in your environment and try again."
    );
    process.exit(1);
  }

  console.log("Fetching Google Fonts catalog...");
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = (await response.json()) as GoogleFontsApiResponse;
  console.log(`Fetched ${data.items.length} font families.`);

  const entries = data.items.map((item) => ({
    family: item.family,
    weights: variantsToWeights(item.variants),
    styles: variantsToStyles(item.variants),
    category: item.category,
  }));

  const output = `/**
 * Google Fonts Catalog
 *
 * Auto-generated — do not edit manually.
 * Run \`npm run update-catalog\` to regenerate.
 *
 * Source: Google Fonts API (sorted by popularity)
 * Total families: ${entries.length}
 */

import type { GoogleFontEntry } from "./types.js";

export const googleFontsCatalog: GoogleFontEntry[] = ${JSON.stringify(entries, null, 2)};

/** Lookup map for O(1) family name resolution */
const catalogMap = new Map<string, GoogleFontEntry>();
for (const entry of googleFontsCatalog) {
  catalogMap.set(entry.family.toLowerCase(), entry);
}

/** Look up a font family in the Google Fonts catalog (case-insensitive) */
export function lookupGoogleFont(family: string): GoogleFontEntry | undefined {
  return catalogMap.get(family.toLowerCase());
}
`;

  writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`Wrote catalog to ${OUTPUT_PATH}`);
}

main();
