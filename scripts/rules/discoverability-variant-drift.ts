/**
 * discoverability-variant-drift
 *
 * Ensures .visor.yaml variant lists exactly match the variant classes defined in
 * the component's CSS module. Drift in either direction breaks AI agent trust:
 *
 *   - CSS variant not in YAML → agent can't discover it, builds ad hoc instead
 *   - YAML variant not in CSS → agent generates code for a non-existent variant
 *
 * Axis mapping convention: YAML `variant: [default, filled-destructive]` corresponds
 * to CSS classes `.variantDefault` and `.variantFilledDestructive`. Similarly,
 * `size: [sm, md]` maps to `.sizeSm` and `.sizeMd`.
 *
 * Part of the AI-first discoverability validator. See docs/ai-consumability.md.
 */

import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse } from 'yaml';
import type { Rule, RuleResult } from './types.js';

/**
 * Convert a kebab-case YAML variant value to the camelCase suffix used in CSS class names.
 * "filled-destructive" → "FilledDestructive"
 */
function yamlValueToCamel(value: string): string {
  return value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Convert a camelCase CSS class suffix to kebab-case YAML variant value.
 * "FilledDestructive" → "filled-destructive"
 * "Default" → "default"
 * "Sm" → "sm"
 */
function camelToKebab(camel: string): string {
  return camel
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

export const discoverabilityVariantDrift: Rule = {
  name: 'discoverability-variant-drift',
  description:
    '.visor.yaml variants match CSS module — prevents agents from discovering phantom or missing variants',
  category: 'structure',
  warnOnly: false,
  async run() {
    const results: RuleResult[] = [];

    for await (const yamlPath of glob('components/ui/**/*.visor.yaml')) {
      let doc: Record<string, unknown>;

      try {
        const content = await readFile(yamlPath, 'utf-8');
        doc = parse(content) as Record<string, unknown>;
      } catch {
        continue; // parse errors caught by visor-yaml-complete
      }

      if (!doc.variants || typeof doc.variants !== 'object' || Array.isArray(doc.variants)) {
        continue; // no variants declared — nothing to check
      }

      const variants = doc.variants as Record<string, unknown>;

      // Derive the CSS module path: components/ui/badge/badge.visor.yaml → components/ui/badge/badge.module.css
      const dir = yamlPath.replace(/\/[^/]+\.visor\.yaml$/, '');
      const componentName = dir.split('/').pop()!;
      const cssPath = `${dir}/${componentName}.module.css`;

      let cssContent: string;
      try {
        cssContent = await readFile(cssPath, 'utf-8');
      } catch {
        continue; // no CSS module — compound or Radix-only component, skip
      }

      for (const [axis, yamlRaw] of Object.entries(variants)) {
        if (!Array.isArray(yamlRaw)) continue;
        const yamlValues = yamlRaw as string[];

        // Extract all CSS classes for this variant axis.
        // Pattern: .<axis><Suffix>  e.g. .variantDefault, .variantFilledDestructive, .size2xl
        // The suffix either starts with a capital letter (word-based: Default, FilledDestructive)
        // or a digit (numeric-prefixed: 2xl). Both forms are valid CSS class conventions in Visor.
        const axisRegex = new RegExp(`\\.${axis}([A-Z][A-Za-z]*|[0-9][A-Za-z0-9]*)`, 'g');
        const cssMatches = [...cssContent.matchAll(axisRegex)];
        const cssValues = [...new Set(cssMatches.map((m) => camelToKebab(m[1])))];

        if (cssValues.length === 0) continue; // axis not styled in CSS — skip (e.g. boolean flag variants)

        // CSS variants missing from YAML — agent cannot discover these, will build ad hoc
        const undiscoverable = cssValues.filter((v) => !yamlValues.includes(v));
        if (undiscoverable.length > 0) {
          results.push({
            pass: false,
            message: `${axis}: CSS has ${undiscoverable.length} variant(s) missing from YAML (undiscoverable by agents): ${undiscoverable.join(', ')}`,
            file: yamlPath,
          });
        }

        // YAML variants missing from CSS — agent will generate invalid code
        const falseClaims = yamlValues.filter((v) => !cssValues.includes(v));
        if (falseClaims.length > 0) {
          results.push({
            pass: false,
            message: `${axis}: YAML declares ${falseClaims.length} variant(s) with no matching CSS class (false metadata): ${falseClaims.join(', ')}`,
            file: yamlPath,
          });
        }

        if (undiscoverable.length === 0 && falseClaims.length === 0) {
          results.push({
            pass: true,
            message: `${axis}: all ${yamlValues.length} variant(s) match CSS`,
            file: yamlPath,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No variant drift found' });
    }

    return results;
  },
};
