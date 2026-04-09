import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { lookupGoogleFont } from '@loworbitstudio/visor-theme-engine';
import type { Rule, RuleResult } from './types.js';

/**
 * Extract the first font family name from a CSS font-family value string.
 * Handles quoted ("Roboto") and unquoted (Roboto) family names.
 */
function firstFamilyName(value: string): string {
  const trimmed = value.trim();
  // Quoted: "Font Name" or 'Font Name'
  const quoted = trimmed.match(/^["']([^"']+)["']/);
  if (quoted) return quoted[1];
  // Unquoted: stop at comma or end
  return trimmed.split(',')[0].trim();
}

export const themeFontImports: Rule = {
  name: 'theme-font-imports',
  description: 'Every Google Font referenced in --font-* tokens has a matching @import in the theme CSS file',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('packages/docs/app/*-theme.css')) {
      const content = await readFile(filePath, 'utf-8');

      // Collect all --font-* token values defined in this file
      const fontTokenMatches = [...content.matchAll(/--font-[a-z-]+:\s*([^;]+);/g)];
      const families = new Set<string>();
      for (const match of fontTokenMatches) {
        const name = firstFamilyName(match[1]);
        if (name && !name.startsWith('var(')) {
          families.add(name);
        }
      }

      // Check each family that's in the Google Fonts catalog
      for (const family of families) {
        const catalogEntry = lookupGoogleFont(family);
        if (!catalogEntry) continue; // Not a Google Font — skip

        // Family name in a Google Fonts URL uses + for spaces
        const urlFamily = family.replace(/ /g, '+');
        const hasImport = content.includes(`fonts.googleapis.com`) &&
          content.includes(`family=${urlFamily}`);

        if (!hasImport) {
          results.push({
            pass: false,
            message: `"${family}" is a Google Font used in --font-* token but missing @import url("https://fonts.googleapis.com/...family=${urlFamily}...")`,
            file: filePath,
          });
        } else {
          results.push({
            pass: true,
            message: `"${family}" has Google Fonts @import`,
            file: filePath,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No theme CSS files found to check' });
    }

    return results;
  },
};
