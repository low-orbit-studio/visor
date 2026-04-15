import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { Rule, RuleResult } from './types.js';

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
      const actual500 = match[1].trim().toLowerCase();
      const expected = primary.toLowerCase();
      if (actual500 !== expected) {
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
          message: `"${themeName}" brand anchors at --color-primary-500 (${expected})`,
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
          const actualDark500 = darkOverrideMatch[1].trim().toLowerCase();
          const expectedDark = darkPrimary.toLowerCase();
          if (actualDark500 !== expectedDark) {
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
              message: `"${themeName}" dark brand anchors at --color-primary-500 (${expectedDark})`,
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
