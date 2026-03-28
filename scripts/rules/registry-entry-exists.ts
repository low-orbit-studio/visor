import { readdir, readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const registryEntryExists: Rule = {
  name: 'registry-entry-exists',
  description: 'Every component in components/ui/ has a matching registry entry',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];

    // Read registry-ui.ts and extract component names
    const registryContent = await readFile('registry/registry-ui.ts', 'utf-8');

    // Extract name fields from registry entries
    const nameRegex = /name:\s*["']([^"']+)["']/g;
    const registeredNames = new Set<string>();
    let m: RegExpMatchArray | null;
    while ((m = nameRegex.exec(registryContent)) !== null) {
      registeredNames.add(m[1]);
    }

    // Get all component directories
    const componentDirs: string[] = [];
    for await (const entry of await readdir('components/ui', { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('__')) {
        componentDirs.push(entry.name);
      }
    }

    for (const dir of componentDirs) {
      const hasEntry = registeredNames.has(dir);
      results.push({
        pass: hasEntry,
        message: hasEntry
          ? 'Has registry entry'
          : `No registry entry found for "${dir}" in registry/registry-ui.ts`,
        file: `components/ui/${dir}`,
      });
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No component directories found',
      });
    }

    return results;
  },
};
