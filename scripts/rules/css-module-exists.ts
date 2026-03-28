import { readdir } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const cssModuleExists: Rule = {
  name: 'css-module-exists',
  description: 'Every component has a .module.css file',
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
      let hasCssModule = false;
      for await (const _file of glob(`components/ui/${dir}/*.module.css`)) {
        hasCssModule = true;
        break;
      }

      results.push({
        pass: hasCssModule,
        message: hasCssModule
          ? 'Has CSS module'
          : 'Missing .module.css file',
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
