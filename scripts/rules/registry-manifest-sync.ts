import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const registryManifestSync: Rule = {
  name: 'registry-manifest-sync',
  description: 'Registry items and manifest entries are in sync',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    const registryPath = 'packages/cli/dist/registry.json';
    const manifestPath = 'packages/cli/dist/visor-manifest.json';

    // Try to read both files — if either is missing, skip with a pass note
    let registryRaw: string;
    let manifestRaw: string;
    try {
      registryRaw = await readFile(registryPath, 'utf-8');
    } catch {
      results.push({
        pass: true,
        message: 'registry.json not built yet — skipping sync check',
        file: registryPath,
      });
      return results;
    }
    try {
      manifestRaw = await readFile(manifestPath, 'utf-8');
    } catch {
      results.push({
        pass: true,
        message: 'visor-manifest.json not built yet — skipping sync check',
        file: manifestPath,
      });
      return results;
    }

    const registry = JSON.parse(registryRaw) as {
      items: Array<{
        name: string;
        type: string;
        category?: string;
        target?: string;
      }>;
    };
    const manifest = JSON.parse(manifestRaw) as {
      components: Record<string, { category?: string }>;
      blocks: Record<string, { category?: string }>;
    };

    // Registry types that should have manifest entries
    const syncableTypes = new Set([
      'registry:ui',
      'registry:block',
    ]);

    for (const item of registry.items) {
      if (!syncableTypes.has(item.type)) continue;
      // Flutter items use their own manifest schema; the React-focused
      // visor-manifest.json does not track them.
      if (item.target === 'flutter') continue;

      const isBlock = item.type === 'registry:block';
      const manifestSection = isBlock ? manifest.blocks : manifest.components;
      const sectionLabel = isBlock ? 'blocks' : 'components';
      const manifestEntry = manifestSection?.[item.name];

      if (!manifestEntry) {
        results.push({
          pass: false,
          message: `Registry item "${item.name}" (${item.type}) has no manifest entry in ${sectionLabel}`,
          file: manifestPath,
        });
        continue;
      }

      // Check category match
      if (item.category && manifestEntry.category && item.category !== manifestEntry.category) {
        results.push({
          pass: false,
          message: `Category mismatch for "${item.name}": registry="${item.category}", manifest="${manifestEntry.category}"`,
          file: manifestPath,
        });
      } else {
        results.push({
          pass: true,
          message: `"${item.name}" is synced between registry and manifest`,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No syncable registry items found',
      });
    }

    return results;
  },
};
