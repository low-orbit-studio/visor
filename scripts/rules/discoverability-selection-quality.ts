/**
 * discoverability-selection-quality
 *
 * Ensures the metadata agents use to SELECT the right component stays meaningful.
 * The primary goal: agents find the right component every time and never build
 * ad hoc when Visor already has one.
 *
 * Checks:
 *   1. Components have ≥2 when_to_use items — agents need enough signal to match
 *      a use case to a component, not just know a component exists.
 *   2. Components have ≥1 when_not_to_use item — negative guidance prevents agents
 *      from reaching for the wrong component when a better one exists.
 *   3. Patterns have a non-empty structure field — the JSX template is what agents
 *      actually use for composition. A pattern without one is decoration only.
 *
 * warnOnly: runs as a warning in standard mode, fails in strict CI mode.
 * Part of the AI-first discoverability validator. See docs/ai-consumability.md.
 */

import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse } from 'yaml';
import type { Rule, RuleResult } from './types.js';

export const MIN_WHEN_TO_USE = 2;
export const MIN_WHEN_NOT_TO_USE = 1;
export const MIN_STRUCTURE_LENGTH = 20; // chars — enough to be real JSX, not a placeholder

export const discoverabilitySelectionQuality: Rule = {
  name: 'discoverability-selection-quality',
  description:
    'Components have meaningful when_to_use/when_not_to_use; patterns have JSX structure',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    // === Components: when_to_use / when_not_to_use quality ===
    for await (const yamlPath of glob('components/ui/**/*.visor.yaml')) {
      let doc: Record<string, unknown>;

      try {
        const content = await readFile(yamlPath, 'utf-8');
        doc = parse(content) as Record<string, unknown>;
      } catch {
        continue; // parse errors caught by visor-yaml-complete
      }

      const whenToUse = doc.when_to_use;
      const whenNotToUse = doc.when_not_to_use;

      const issues: string[] = [];

      if (!Array.isArray(whenToUse) || whenToUse.length < MIN_WHEN_TO_USE) {
        const count = Array.isArray(whenToUse) ? whenToUse.length : 0;
        issues.push(`when_to_use has ${count} item(s), need ≥${MIN_WHEN_TO_USE}`);
      }

      if (!Array.isArray(whenNotToUse) || whenNotToUse.length < MIN_WHEN_NOT_TO_USE) {
        const count = Array.isArray(whenNotToUse) ? whenNotToUse.length : 0;
        issues.push(`when_not_to_use has ${count} item(s), need ≥${MIN_WHEN_NOT_TO_USE}`);
      }

      if (issues.length > 0) {
        results.push({
          pass: false,
          message: issues.join('; '),
          file: yamlPath,
        });
      } else {
        results.push({
          pass: true,
          message: 'Selection metadata meets quality bar',
          file: yamlPath,
        });
      }
    }

    // === Patterns: structure field must contain real JSX ===
    for await (const patternPath of glob('patterns/*.visor-pattern.yaml')) {
      let doc: Record<string, unknown>;

      try {
        const content = await readFile(patternPath, 'utf-8');
        doc = parse(content) as Record<string, unknown>;
      } catch {
        continue;
      }

      const structure = doc.structure;
      const hasStructure =
        typeof structure === 'string' && structure.trim().length >= MIN_STRUCTURE_LENGTH;

      if (!hasStructure) {
        results.push({
          pass: false,
          message: 'Pattern missing structure field — agents need JSX template to compose components',
          file: patternPath,
        });
      } else {
        results.push({
          pass: true,
          message: 'Pattern has JSX structure',
          file: patternPath,
        });
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No selection quality issues found' });
    }

    return results;
  },
};
