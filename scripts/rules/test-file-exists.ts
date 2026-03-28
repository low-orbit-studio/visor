import { readdir } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const testFileExists: Rule = {
  name: 'test-file-exists',
  description: 'Every component directory has __tests__/ with at least one test file',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];
    const componentDirs: string[] = [];

    for await (const entry of await readdir('components/ui', { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('__')) {
        componentDirs.push(entry.name);
      }
    }

    for (const dir of componentDirs) {
      let hasTest = false;
      for await (const _file of glob(`components/ui/${dir}/__tests__/*.test.{ts,tsx}`)) {
        hasTest = true;
        break;
      }

      results.push({
        pass: hasTest,
        message: hasTest
          ? 'Has test file(s)'
          : 'Missing __tests__/ directory or test files',
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
