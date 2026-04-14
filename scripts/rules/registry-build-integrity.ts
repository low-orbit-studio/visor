import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const registryBuildIntegrity: Rule = {
  name: 'registry-build-integrity',
  description:
    'Built registry.json has no empty file content and a reasonable item count',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];
    const registryPath = 'packages/cli/dist/registry.json';

    let raw: string;
    try {
      raw = await readFile(registryPath, 'utf-8');
    } catch {
      results.push({
        pass: true,
        message: 'registry.json not found (build may not have run)',
      });
      return results;
    }

    let registry: { items: Array<{ name: string; files: Array<{ content: string }> }> };
    try {
      registry = JSON.parse(raw);
    } catch {
      results.push({
        pass: false,
        message: 'registry.json is not valid JSON',
        file: registryPath,
      });
      return results;
    }

    if (!registry.items || !Array.isArray(registry.items)) {
      results.push({
        pass: false,
        message: 'registry.json missing "items" array',
        file: registryPath,
      });
      return results;
    }

    // Check total item count
    const count = registry.items.length;
    const countOk = count > 100;
    results.push({
      pass: countOk,
      message: countOk
        ? `Registry has ${count} items`
        : `Registry has only ${count} items (expected > 100)`,
      file: registryPath,
    });

    // Check for empty file content
    let emptyCount = 0;
    for (const item of registry.items) {
      if (!item.files) continue;
      for (const file of item.files) {
        if (file.content === '') {
          emptyCount++;
          results.push({
            pass: false,
            message: `Item "${item.name}" has a file with empty content`,
            file: registryPath,
          });
        }
      }
    }

    if (emptyCount === 0) {
      results.push({
        pass: true,
        message: 'No items have empty file content',
        file: registryPath,
      });
    }

    return results;
  },
};
