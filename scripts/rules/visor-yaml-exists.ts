import { readdir } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const visorYamlExists: Rule = {
  name: 'visor-yaml-exists',
  description: 'Every component in components/ui/ has a .visor.yaml metadata file',
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
      let hasYaml = false;
      for await (const _file of glob(`components/ui/${dir}/*.visor.yaml`)) {
        hasYaml = true;
        break;
      }

      results.push({
        pass: hasYaml,
        message: hasYaml
          ? 'Has .visor.yaml'
          : 'Missing .visor.yaml metadata file',
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
