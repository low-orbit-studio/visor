/**
 * pattern-overlap-detection
 *
 * Prevents duplicate/overlapping composition patterns from drifting back in
 * (the wizard-flow/onboarding-flow class of bug — VI-535/536/537).
 *
 * Heuristic: any two patterns whose `components_used` sets are highly similar
 * (Jaccard ≥ JACCARD_THRESHOLD) are near-duplicates UNLESS they explicitly
 * disambiguate each other — each pattern's `when_not_to_use` must name the
 * other pattern's slug ("reach for X, not Y"). A high-similarity pair with no
 * mutual reference is flagged.
 *
 * Two patterns can legitimately share most components (e.g. form-with-validation
 * vs modal-form) — but only if they tell agents/authors when to pick which.
 * The mutual when_not_to_use reference is that contract.
 *
 * warnOnly: true — surfaces as a warning in `npm run validate`, fails CI under
 * `validate:strict`. Mirrors the discoverability rule family.
 *
 * See docs/ai-consumability.md and patterns/.
 */

import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse } from 'yaml';
import { basename } from 'node:path';
import type { Rule, RuleResult } from './types.js';

/** Component-set similarity at or above which two patterns must mutually disambiguate. */
export const JACCARD_THRESHOLD = 0.6;

export interface PatternEntry {
  /** File slug (basename without .visor-pattern.yaml) — the canonical pattern id. */
  slug: string;
  componentsUsed: string[];
  whenNotToUse: string[];
}

/** Jaccard similarity of two string sets: |A ∩ B| / |A ∪ B|. Empty/empty = 0. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** True if any of `text` items mention `slug` as a substring (case-insensitive). */
function mentions(whenNotToUse: string[], slug: string): boolean {
  const needle = slug.toLowerCase();
  return whenNotToUse.some((item) => item.toLowerCase().includes(needle));
}

/**
 * Pure overlap check — testable without disk. Returns one result per
 * high-similarity pair (pass when mutually disambiguated, fail otherwise),
 * or a single pass when no pair crosses the threshold.
 */
export function detectPatternOverlaps(patterns: PatternEntry[]): RuleResult[] {
  const results: RuleResult[] = [];
  const sets = patterns.map((p) => new Set(p.componentsUsed));

  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const sim = jaccard(sets[i], sets[j]);
      if (sim < JACCARD_THRESHOLD) continue;

      const a = patterns[i];
      const b = patterns[j];
      const aNamesB = mentions(a.whenNotToUse, b.slug);
      const bNamesA = mentions(b.whenNotToUse, a.slug);
      const pct = (sim * 100).toFixed(0);

      if (aNamesB && bNamesA) {
        results.push({
          pass: true,
          message: `${a.slug} ↔ ${b.slug} share ${pct}% of components but mutually disambiguate via when_not_to_use`,
          file: `patterns/${a.slug}.visor-pattern.yaml`,
        });
      } else {
        const missing: string[] = [];
        if (!aNamesB) missing.push(`${a.slug}'s when_not_to_use must name ${b.slug}`);
        if (!bNamesA) missing.push(`${b.slug}'s when_not_to_use must name ${a.slug}`);
        results.push({
          pass: false,
          message: `${a.slug} ↔ ${b.slug} share ${pct}% of components (Jaccard ≥ ${JACCARD_THRESHOLD}) with no mutual when_not_to_use reference — ${missing.join('; ')}`,
          file: `patterns/${a.slug}.visor-pattern.yaml`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ pass: true, message: 'No high-similarity pattern pairs found' });
  }
  return results;
}

export const patternOverlapDetection: Rule = {
  name: 'pattern-overlap-detection',
  description:
    'Patterns with highly similar components_used (Jaccard ≥ 0.6) must mutually disambiguate via when_not_to_use',
  category: 'structure',
  warnOnly: true,
  async run() {
    const patterns: PatternEntry[] = [];

    for await (const patternPath of glob('patterns/*.visor-pattern.yaml')) {
      try {
        const content = await readFile(patternPath, 'utf-8');
        const doc = parse(content) as Record<string, unknown>;
        patterns.push({
          slug: basename(patternPath, '.visor-pattern.yaml'),
          componentsUsed: Array.isArray(doc.components_used)
            ? (doc.components_used as string[])
            : [],
          whenNotToUse: Array.isArray(doc.when_not_to_use)
            ? (doc.when_not_to_use as string[])
            : [],
        });
      } catch {
        continue; // parse errors are caught by visor-yaml / selection-quality rules
      }
    }

    if (patterns.length === 0) {
      return [{ pass: true, message: 'No patterns found' }];
    }

    return detectPatternOverlaps(patterns);
  },
};
