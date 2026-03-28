import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse } from 'yaml';
import type { Rule, RuleResult } from './types.js';

const REQUIRED_FIELDS = ['name', 'description', 'category', 'props', 'when_to_use'];

export const visorYamlComplete: Rule = {
  name: 'visor-yaml-complete',
  description: '.visor.yaml files have required fields: name, description, category, props, when_to_use',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.visor.yaml')) {
      const content = await readFile(filePath, 'utf-8');
      let doc: Record<string, unknown>;

      try {
        doc = parse(content) as Record<string, unknown>;
      } catch {
        results.push({
          pass: false,
          message: 'Invalid YAML syntax',
          file: filePath,
        });
        continue;
      }

      const missing = REQUIRED_FIELDS.filter((f) => !(f in doc));

      if (missing.length > 0) {
        results.push({
          pass: false,
          message: `Missing required fields: ${missing.join(', ')}`,
          file: filePath,
        });
      } else {
        results.push({
          pass: true,
          message: 'All required fields present',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No .visor.yaml files found',
      });
    }

    return results;
  },
};
