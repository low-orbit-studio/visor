import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { parseColor, rgbToHex } from '../../packages/theme-engine/src/color.js';
import type { Rule, RuleResult } from './types.js';

/** Normalize any supported CSS color string to lowercase hex for comparison. */
function toHex(color: string): string | null {
  const parsed = parseColor(color);
  if (!parsed) return null;
  return rgbToHex(parsed.rgb).toLowerCase();
}

/**
 * Compare two CSS color strings for equality with ±1 per-channel tolerance.
 * The shade generator does an OKLCH→RGB→OKLCH round-trip before writing step 500,
 * which can introduce a 1-unit rounding difference vs. a direct OKLCH→hex conversion.
 */
function colorsMatch(a: string, b: string): boolean {
  const hexA = toHex(a);
  const hexB = toHex(b);
  if (!hexA || !hexB) return a.toLowerCase() === b.toLowerCase();
  if (hexA === hexB) return true;
  // Allow ±1 per channel for float rounding
  const rA = parseInt(hexA.slice(1, 3), 16);
  const gA = parseInt(hexA.slice(3, 5), 16);
  const bA = parseInt(hexA.slice(5, 7), 16);
  const rB = parseInt(hexB.slice(1, 3), 16);
  const gB = parseInt(hexB.slice(3, 5), 16);
  const bB = parseInt(hexB.slice(5, 7), 16);
  return Math.abs(rA - rB) <= 1 && Math.abs(gA - gB) <= 1 && Math.abs(bA - bB) <= 1;
}

/**
 * The brand color (colors.primary) must live at --color-primary-500 in the
 * generated theme CSS. This is the "brand anchor" contract. Without this
 * rule, shade generation can silently shift the brand color to 600/400/etc.
 * and visual regressions sneak in undetected (see the ENTR regression that
 * put brand at 600 after theme restore).
 *
 * For themes with colors-dark.primary set, we also check that the dark
 * primitive override block anchors the dark brand at --color-primary-500.
 */
export const themePrimaryBrandAnchor: Rule = {
  name: 'theme-primary-brand-anchor',
  description: 'colors.primary lands at --color-primary-500 in generated CSS (and colors-dark.primary at the dark override of --color-primary-500)',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for await (const yamlPath of glob('packages/docs/public/themes/*.visor.yaml')) {
      let yamlContent: string;
      try {
        yamlContent = await readFile(yamlPath, 'utf-8');
      } catch {
        continue;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = parseYaml(yamlContent) as Record<string, unknown>;
      } catch {
        continue;
      }

      const colors = parsed?.colors as Record<string, unknown> | undefined;
      const primary = typeof colors?.primary === 'string' ? colors.primary : null;
      if (!primary) continue;

      const themeName = typeof parsed?.name === 'string' ? parsed.name : '';
      const slug = themeName.toLowerCase().replace(/\s+/g, '-');
      const cssPath = `packages/docs/app/${slug}-theme.css`;

      let cssContent: string;
      try {
        cssContent = await readFile(cssPath, 'utf-8');
      } catch {
        continue;
      }

      // Extract the FIRST --color-primary-500 declaration (the base/light one in Section 1)
      const match = cssContent.match(/--color-primary-500:\s*([^;]+);/);
      if (!match) {
        results.push({
          pass: false,
          message: `"${themeName}" CSS has no --color-primary-500 declaration`,
          file: cssPath,
        });
        continue;
      }
      const actual500 = match[1].trim();
      // Normalize both to hex for format-independent comparison (e.g. oklch vs hex)
      const actualHex = toHex(actual500) ?? actual500.toLowerCase();
      const expectedHex = toHex(primary) ?? primary.toLowerCase();
      if (!colorsMatch(actual500, primary)) {
        results.push({
          pass: false,
          message:
            `"${themeName}" brand contract violated: colors.primary is ${primary} ` +
            `but --color-primary-500 is ${actual500}. Brand must anchor at 500.`,
          file: cssPath,
        });
      } else {
        results.push({
          pass: true,
          message: `"${themeName}" brand anchors at --color-primary-500 (${primary} → ${actualHex})`,
          file: cssPath,
        });
      }

      // If colors-dark.primary is set, check that it anchors in the dark override block
      const colorsDark = parsed?.['colors-dark'] as Record<string, unknown> | undefined;
      const darkPrimary = typeof colorsDark?.primary === 'string' ? colorsDark.primary : null;
      if (darkPrimary) {
        // Look for an override of --color-primary-500 scoped under .dark
        // (the second occurrence, inside the Primitive overrides (dark) block)
        const all500 = [...cssContent.matchAll(/--color-primary-500:\s*([^;]+);/g)];
        const darkOverrideMatch = all500.length >= 2 ? all500[1] : null;
        if (!darkOverrideMatch) {
          results.push({
            pass: false,
            message:
              `"${themeName}" has colors-dark.primary (${darkPrimary}) but CSS has no dark-mode override of --color-primary-500. ` +
              `Dark-first themes must regenerate the primary scale from the dark brand color.`,
            file: cssPath,
          });
        } else {
          const actualDark500 = darkOverrideMatch[1].trim();
          const actualDarkHex = toHex(actualDark500) ?? actualDark500.toLowerCase();
          const expectedDarkHex = toHex(darkPrimary) ?? darkPrimary.toLowerCase();
          if (!colorsMatch(actualDark500, darkPrimary)) {
            results.push({
              pass: false,
              message:
                `"${themeName}" dark brand contract violated: colors-dark.primary is ${darkPrimary} ` +
                `but the dark override of --color-primary-500 is ${actualDark500}.`,
              file: cssPath,
            });
          } else {
            results.push({
              pass: true,
              message: `"${themeName}" dark brand anchors at --color-primary-500 (${darkPrimary} → ${actualDarkHex})`,
              file: cssPath,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No themes found to check' });
    }

    return results;
  },
};
