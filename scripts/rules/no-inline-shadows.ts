import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const noInlineShadows: Rule = {
  name: 'no-inline-shadows',
  description: 'No inline rgba() shadows — must use var(--shadow-*)',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];
    const patterns = [
      'components/**/*.module.css',
      'components/**/*.tsx',
    ];

    for (const pattern of patterns) {
      for await (const filePath of glob(pattern)) {
        // Skip .d.ts files
        if (filePath.endsWith('.d.ts')) continue;

        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Match box-shadow with inline rgba() values
          // Allow rgba() inside var() definitions (token files) and in comments
          if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

          if (
            /box-shadow\s*:/.test(line) &&
            /rgba?\(/.test(line) &&
            !line.includes('var(--shadow')
          ) {
            results.push({
              pass: false,
              message: 'Inline rgba() shadow — use var(--shadow-*) token',
              file: filePath,
              line: i + 1,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No inline shadows found',
      });
    }

    return results;
  },
};
