import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { Rule, RuleResult } from './types.js';

/**
 * VI-638 — `typography.scale` multiplies the `--font-size-*` ramp, and that is
 * the only mechanism that sets type size.
 *
 * This rule used to enforce the opposite: it required `size-adjust` on every
 * `@font-face` block of a scaled theme. That was one of four contradicting
 * implementations of `scale` — it applied to `visor-fonts` slots only, left the
 * emitted ramp at its absolute values, and shrank glyphs relative to their line
 * box rather than scaling the type system. So a theme declaring `scale: 0.85`
 * rendered a 13.6px body while `var(--font-size-base)` still read 16px.
 *
 * The rule now enforces the replacement contract on every theme with a non-1
 * scale:
 *   1. the emitted ramp responds — `--font-size-base` is `<scale>rem`;
 *   2. the page inherits it — `font-size: var(--font-size-base…)` is bound on
 *      the scope selector;
 *   3. `size-adjust` is gone — keeping it alongside a scaled ramp would shrink
 *      twice (0.85 x 0.85).
 */
export const themeTypeScaleRamp: Rule = {
  name: 'theme-type-scale-ramp',
  description:
    'Themes with typography.scale != 1 must scale their --font-size-* ramp, bind the page to --font-size-base, and emit no size-adjust (VI-638)',
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

      if (scale === 1) continue; // Unscaled themes emit the ramp verbatim

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

      const failures: string[] = [];

      // 1. The ramp responds to scale.
      const base = cssContent.match(/--font-size-base: ([\d.]+)rem;/);
      if (!base) {
        failures.push('no --font-size-base declaration found');
      } else if (Math.abs(Number(base[1]) - scale) > 1e-6) {
        failures.push(
          `--font-size-base is ${base[1]}rem, expected ${scale}rem (the ramp is not responding to typography.scale)`,
        );
      }

      // 2. The page inherits the scaled base.
      if (!cssContent.includes('font-size: var(--font-size-base')) {
        failures.push(
          'the scope selector does not bind `font-size: var(--font-size-base, 1rem)`, so the scale never reaches the page',
        );
      }

      // 3. The retired mechanism is gone.
      const sizeAdjustCount = (cssContent.match(/size-adjust:/g) ?? []).length;
      if (sizeAdjustCount > 0) {
        failures.push(
          `${sizeAdjustCount} size-adjust declaration(s) remain — against a scaled ramp these shrink the type twice (VI-638 retired size-adjust as an expression of typography.scale)`,
        );
      }

      results.push(
        failures.length > 0
          ? { pass: false, message: `"${themeName}" (scale: ${scale}): ${failures.join('; ')}`, file: cssPath }
          : {
              pass: true,
              message: `"${themeName}" (scale: ${scale}) scales its ramp to --font-size-base: ${scale}rem, binds the page to it, and emits no size-adjust`,
              file: cssPath,
            },
      );
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No themes with non-default typography.scale found' });
    }

    return results;
  },
};
