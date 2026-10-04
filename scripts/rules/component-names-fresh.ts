import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rule, RuleResult } from './types.js';
import {
  collectNames,
  renderOutput,
  OUTPUT_PATH,
} from '../generate-visor-component-names.js';

// VI-688: the root `pretest` script regenerates visor-component-names.generated.ts
// and overwrites it silently, so CI tests pass against a fresh copy while the
// committed one goes stale — then the Changesets release run regenerates it into
// the Version Packages PR, which the release gate refuses. This rule compares the
// committed file against a fresh render from the generator (single source of
// truth) before tests run.
export const GENERATED_FILE =
  'components/devtools/source-inspector/visor-component-names.generated.ts';
export const FIX_HINT =
  'run npm run generate:component-names and commit the result';

const ENTRY = /^ {2}("(?:[^"\\]|\\.)*"),$/gm;

/** Extracts the names listed in a generated names file. Pure. */
export function parseNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const m of source.matchAll(ENTRY)) {
    names.add(JSON.parse(m[1] as string) as string);
  }
  return names;
}

/**
 * Names in `fresh` absent from `committed` (missing) and names in `committed`
 * absent from `fresh` (extra). Pure — sorted for stable messages.
 */
export function diffNames(
  committed: Set<string>,
  fresh: Set<string>,
): { missing: string[]; extra: string[] } {
  const sort = (xs: string[]) => xs.sort((a, b) => a.localeCompare(b));
  return {
    missing: sort([...fresh].filter((n) => !committed.has(n))),
    extra: sort([...committed].filter((n) => !fresh.has(n))),
  };
}

function preview(names: string[]): string {
  const head = names.slice(0, 5).join(', ');
  return names.length > 5 ? `${head}, +${names.length - 5} more` : head;
}

export const componentNamesFresh: Rule = {
  name: 'component-names-fresh',
  description:
    'visor-component-names.generated.ts matches what the generator would emit from the registry',
  category: 'structure',
  async run(): Promise<RuleResult[]> {
    const committed = await readFile(OUTPUT_PATH, 'utf-8');
    const fresh = renderOutput(collectNames().names);

    if (committed === fresh) {
      return [
        {
          pass: true,
          message: 'visor-component-names.generated.ts is up to date',
        },
      ];
    }

    const { missing, extra } = diffNames(
      parseNames(committed),
      parseNames(fresh),
    );
    const parts: string[] = [];
    if (missing.length) parts.push(`missing: ${preview(missing)}`);
    if (extra.length) parts.push(`extra: ${preview(extra)}`);
    const detail = parts.length ? parts.join('; ') : 'formatting differs';

    return [
      {
        pass: false,
        file: path.relative(process.cwd(), OUTPUT_PATH) || GENERATED_FILE,
        message: `visor-component-names.generated.ts is stale (${detail}). ${FIX_HINT}.`,
      },
    ];
  },
};
