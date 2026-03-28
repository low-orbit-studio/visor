import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

// Tailwind Slate hex values — these should NOT be used as fallbacks
const SLATE_HEX = new Set([
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
  '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617',
]);

export const tokenFallbackGray: Rule = {
  name: 'token-fallback-gray',
  description: 'CSS var() fallbacks use Tailwind Gray hex values, not Slate',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];
    const patterns = [
      'components/**/*.module.css',
      'packages/tokens/**/*.css',
      'packages/tokens/**/*.ts',
    ];

    for (const pattern of patterns) {
      for await (const filePath of glob(pattern)) {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          // Match var() with fallback: var(--something, #hex)
          const fallbackRegex = /var\([^,]+,\s*(#[0-9a-fA-F]{3,8})\s*\)/g;
          let m = fallbackRegex.exec(lines[i]);
          while (m !== null) {
            const hex = m[1].toLowerCase();
            if (SLATE_HEX.has(hex)) {
              results.push({
                pass: false,
                message: `Slate hex fallback ${hex} — use Tailwind Gray instead`,
                file: filePath,
                line: i + 1,
              });
            }
            m = fallbackRegex.exec(lines[i]);
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All var() fallbacks use Gray, not Slate',
      });
    }

    return results;
  },
};
