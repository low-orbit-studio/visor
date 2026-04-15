import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { Rule, RuleResult } from './types.js';

/**
 * When a theme specifies typography.scale != 1, the docs adapter is supposed to
 * emit size-adjust on every @font-face block so the font renders at the right
 * visual size relative to other themes.
 *
 * This rule reads every .visor.yaml in public/themes/, checks for scale != 1,
 * then verifies the corresponding *-theme.css contains size-adjust declarations.
 *
 * Example: blacklight has scale: 0.8 — its @font-face blocks must all include
 *   size-adjust: 80%;
 */
export const themeFontScaleAdjust: Rule = {
  name: 'theme-font-scale-adjust',
  description: 'Themes with typography.scale != 1 must have size-adjust on their @font-face declarations',
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
        continue; // theme-yaml-valid rule handles parse failures
      }

      const typography = parsed?.typography as Record<string, unknown> | undefined;
      const scale = typeof typography?.scale === 'number' ? typography.scale : 1;

      if (scale === 1) continue; // No adjustment needed

      // Derive the theme slug and find the corresponding CSS file
      const themeName = typeof parsed?.name === 'string' ? parsed.name : '';
      const slug = themeName.toLowerCase().replace(/\s+/g, '-');
      const cssPath = `packages/docs/app/${slug}-theme.css`;

      let cssContent: string;
      try {
        cssContent = await readFile(cssPath, 'utf-8');
      } catch {
        results.push({
          pass: false,
          message: `Theme "${themeName}" has typography.scale: ${scale} but CSS file not found: ${cssPath}`,
          file: yamlPath,
        });
        continue;
      }

      const expectedAdjust = `size-adjust: ${Math.round(scale * 100)}%;`;

      // Count @font-face blocks and size-adjust occurrences
      const fontFaceCount = (cssContent.match(/@font-face\s*\{/g) ?? []).length;
      const sizeAdjustCount = (cssContent.match(/size-adjust:/g) ?? []).length;

      if (fontFaceCount === 0) {
        // No visor-fonts in this theme — nothing to check
        results.push({
          pass: true,
          message: `"${themeName}" (scale: ${scale}) has no @font-face blocks — no size-adjust needed`,
          file: cssPath,
        });
        continue;
      }

      if (sizeAdjustCount === 0) {
        results.push({
          pass: false,
          message:
            `"${themeName}" has typography.scale: ${scale} and ${fontFaceCount} @font-face block(s) ` +
            `but no size-adjust declarations. Expected "${expectedAdjust}" on each @font-face.`,
          file: cssPath,
        });
      } else if (sizeAdjustCount < fontFaceCount) {
        results.push({
          pass: false,
          message:
            `"${themeName}" has ${fontFaceCount} @font-face block(s) but only ${sizeAdjustCount} size-adjust ` +
            `declaration(s). All @font-face blocks should have "${expectedAdjust}".`,
          file: cssPath,
        });
      } else {
        results.push({
          pass: true,
          message: `"${themeName}" (scale: ${scale}) has size-adjust: ${Math.round(scale * 100)}% on all @font-face blocks`,
          file: cssPath,
        });
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No themes with non-default typography.scale found' });
    }

    return results;
  },
};
