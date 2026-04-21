import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse } from 'yaml';
import type { Rule, RuleResult } from './types.js';

const SHARED_FIELDS = [
  'description',
  'category',
  'when_to_use',
  'when_not_to_use',
] as const;

type Manifest = Record<string, unknown>;

async function readManifest(filePath: string): Promise<Manifest | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return parse(content) as Manifest;
  } catch {
    return null;
  }
}

async function collect(pattern: string): Promise<Map<string, { path: string; doc: Manifest }>> {
  const byName = new Map<string, { path: string; doc: Manifest }>();
  for await (const filePath of glob(pattern)) {
    const doc = await readManifest(filePath);
    if (!doc) continue;
    const name = typeof doc.name === 'string' ? doc.name : null;
    if (!name) continue;
    byName.set(name.toLowerCase(), { path: filePath, doc });
  }
  return byName;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const crossPlatformManifestSync: Rule = {
  name: 'cross-platform-manifest-sync',
  description:
    'When a component has both a React manifest (components/ui/**) and a Flutter manifest (components/flutter/**), shared fields (description, category, when_to_use, when_not_to_use) must match',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];

    const flutterManifests = await collect(
      'components/flutter/**/*.visor.yaml'
    );
    if (flutterManifests.size === 0) {
      results.push({
        pass: true,
        message: 'No Flutter manifests found — cross-platform sync not applicable',
      });
      return results;
    }

    const reactManifests = await collect('components/ui/**/*.visor.yaml');

    for (const [key, flutter] of flutterManifests) {
      const react = reactManifests.get(key);
      if (!react) {
        // Flutter-only component — nothing to sync against
        results.push({
          pass: true,
          message: `Flutter-only component "${flutter.doc.name}" — no React sibling to compare`,
          file: flutter.path,
        });
        continue;
      }

      const mismatches: string[] = [];
      for (const field of SHARED_FIELDS) {
        const a = flutter.doc[field];
        const b = react.doc[field];
        // Both undefined: OK. One side undefined: flag as mismatch unless both are
        if (a === undefined && b === undefined) continue;
        if (!deepEqual(a, b)) {
          mismatches.push(field);
        }
      }

      if (mismatches.length > 0) {
        results.push({
          pass: false,
          message: `Shared fields out of sync with ${react.path}: ${mismatches.join(', ')}`,
          file: flutter.path,
        });
      } else {
        results.push({
          pass: true,
          message: `Shared fields match React sibling`,
          file: flutter.path,
        });
      }
    }

    return results;
  },
};
