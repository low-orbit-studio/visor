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
  return Math.abs(rA - rB) <= 8 && Math.abs(gA - gB) <= 8 && Math.abs(bA - bB) <= 8;
}

const COLOR_ROLES = ['primary', 'accent', 'neutral', 'success', 'warning', 'error', 'info'] as const;

/**
 * Every color role's light value must land at --color-{role}-500 in the base
 * CSS block. For any role that also has a colors-dark override, the dark
 * primitive override block must anchor that dark value at --color-{role}-500.
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
      const colorsDark = parsed?.['colors-dark'] as Record<string, unknown> | undefined;
      const themeName = typeof parsed?.name === 'string' ? parsed.name : '';
      const slug = themeName.toLowerCase().replace(/\s+/g, '-');
      const cssPath = `packages/docs/app/${slug}-theme.css`;

      let cssContent: string;
      try {
        cssContent = await readFile(cssPath, 'utf-8');
      } catch {
        continue;
      }

      for (const role of COLOR_ROLES) {
        const lightColor = typeof colors?.[role] === 'string' ? colors[role] as string : null;
        if (!lightColor) continue;

        // Check light anchor: first --color-{role}-500 in the file
        const allMatches = [...cssContent.matchAll(new RegExp(`--color-${role}-500:\\s*([^;]+);`, 'g'))];
        const lightMatch = allMatches[0];
        if (!lightMatch) {
          results.push({
            pass: false,
            message: `"${themeName}" CSS has no --color-${role}-500 declaration`,
            file: cssPath,
          });
          continue;
        }
        const actual500 = lightMatch[1].trim();
        const actualHex = toHex(actual500) ?? actual500.toLowerCase();
        if (!colorsMatch(actual500, lightColor)) {
          results.push({
            pass: false,
            message:
              `"${themeName}" brand contract violated: colors.${role} is ${lightColor} ` +
              `but --color-${role}-500 is ${actual500}. Brand must anchor at 500.`,
            file: cssPath,
          });
        } else {
          results.push({
            pass: true,
            message: `"${themeName}" ${role} anchors at --color-${role}-500 (${lightColor} → ${actualHex})`,
            file: cssPath,
          });
        }

        // Check dark anchor if colors-dark has this role
        const darkColor = typeof colorsDark?.[role] === 'string' ? colorsDark[role] as string : null;
        if (darkColor) {
          const darkMatch = allMatches.length >= 2 ? allMatches[1] : null;
          if (!darkMatch) {
            results.push({
              pass: false,
              message:
                `"${themeName}" has colors-dark.${role} (${darkColor}) but CSS has no dark-mode override of --color-${role}-500.`,
              file: cssPath,
            });
          } else {
            const actualDark500 = darkMatch[1].trim();
            const actualDarkHex = toHex(actualDark500) ?? actualDark500.toLowerCase();
            if (!colorsMatch(actualDark500, darkColor)) {
              results.push({
                pass: false,
                message:
                  `"${themeName}" dark brand contract violated: colors-dark.${role} is ${darkColor} ` +
                  `but the dark override of --color-${role}-500 is ${actualDark500}.`,
                file: cssPath,
              });
            } else {
              results.push({
                pass: true,
                message: `"${themeName}" dark ${role} anchors at --color-${role}-500 (${darkColor} → ${actualDarkHex})`,
                file: cssPath,
              });
            }
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
