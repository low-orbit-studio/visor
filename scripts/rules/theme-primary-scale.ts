import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const REQUIRED_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export const themePrimaryScale: Rule = {
  name: 'theme-primary-scale',
  description: 'Every theme CSS file defines a complete --color-primary-* scale (50–950)',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('packages/docs/app/*-theme.css')) {
      const content = await readFile(filePath, 'utf-8');

      const missingSteps = REQUIRED_STEPS.filter(
        (step) => !content.includes(`--color-primary-${step}:`)
      );

      if (missingSteps.length > 0) {
        results.push({
          pass: false,
          message: `Missing --color-primary-* steps: ${missingSteps.map((s) => s).join(', ')} — run \`npm run themes:compute-scales\` to regenerate`,
          file: filePath,
        });
      } else {
        results.push({
          pass: true,
          message: 'Complete --color-primary-* scale defined',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No theme CSS files found to check',
      });
    }

    return results;
  },
};
