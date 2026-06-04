import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rule, RuleResult } from './types.js';

// VI-502: the two visor-theme.schema.json copies are hand-maintained with no
// generator and have drifted before (the engine copy carried `migrate` +
// `strokeWidths` + per-theme CDN routing the docs copy lacked). The engine copy
// drives validation, so it is the source of truth; the docs copy must mirror it
// byte-for-byte. This rule fails the moment they diverge again.
export const DOCS_SCHEMA = 'docs/visor-theme.schema.json';
export const ENGINE_SCHEMA = 'packages/theme-engine/src/visor-theme.schema.json';

/**
 * Returns the 1-based line number of the first difference between two strings,
 * or `null` if they are identical. Pure — no I/O — so the guard's red/green
 * behavior is unit-testable without touching the real files.
 */
export function firstDifferingLine(a: string, b: string): number | null {
  if (a === b) return null;
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) return i + 1;
  }
  // Identical line-by-line but unequal strings (e.g. trailing newline drift).
  return max + 1;
}

export const schemaCopiesSync: Rule = {
  name: 'schema-copies-sync',
  description:
    'The two visor-theme.schema.json copies (docs + theme-engine) are byte-identical',
  category: 'structure',
  async run(): Promise<RuleResult[]> {
    const root = process.cwd();
    const docs = await readFile(path.join(root, DOCS_SCHEMA), 'utf-8');
    const engine = await readFile(path.join(root, ENGINE_SCHEMA), 'utf-8');

    const diffLine = firstDifferingLine(docs, engine);
    if (diffLine === null) {
      return [
        {
          pass: true,
          message: 'docs and theme-engine visor-theme.schema.json copies are identical',
        },
      ];
    }

    return [
      {
        pass: false,
        file: DOCS_SCHEMA,
        line: diffLine,
        message:
          `visor-theme.schema.json copies have drifted (first difference at line ${diffLine}). ` +
          `Reconcile ${DOCS_SCHEMA} with ${ENGINE_SCHEMA} (the engine copy is the source of truth).`,
      },
    ];
  },
};
