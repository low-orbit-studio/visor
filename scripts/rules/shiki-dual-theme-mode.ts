import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const PREVIEW_FILES = [
  'packages/docs/components/preview.tsx',
  'packages/docs/components/block-preview.tsx',
];

export const shikiDualThemeMode: Rule = {
  name: 'shiki-dual-theme-mode',
  description: 'Preview components use themes: {} + defaultColor: false, not single theme:',
  category: 'components',
  async run() {
    const results: RuleResult[] = [];

    for (const file of PREVIEW_FILES) {
      let content: string;
      try {
        content = await readFile(file, 'utf-8');
      } catch {
        continue;
      }

      const lines = content.split('\n');

      // Check for single-theme usage: codeToHtml(code, { ... theme: ... })
      // This is wrong — should use themes: { light, dark } with defaultColor: false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match standalone `theme` key (not `themes`)
        if (/\btheme\b(?!s)/.test(line) && /codeToHtml|lang:/.test(lines.slice(Math.max(0, i - 3), i + 3).join('\n'))) {
          results.push({
            pass: false,
            message: 'Uses single theme: instead of themes: {} with defaultColor: false',
            file,
            line: i + 1,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All preview components use dual-theme mode',
      });
    }

    return results;
  },
};
