import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const SOURCE_CONFIG = 'packages/docs/source.config.ts';

export const sourceConfigSpreadOrder: Rule = {
  name: 'source-config-spread-order',
  description: '...rehypeCodeDefaultOptions spread comes before custom overrides',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];

    let content: string;
    try {
      content = await readFile(SOURCE_CONFIG, 'utf-8');
    } catch {
      results.push({
        pass: false,
        message: `Cannot read ${SOURCE_CONFIG}`,
        file: SOURCE_CONFIG,
      });
      return results;
    }

    const lines = content.split('\n');
    let spreadLine = -1;
    let themesLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('...rehypeCodeDefaultOptions')) {
        spreadLine = i;
      }
      if (/themes:\s*\{/.test(lines[i])) {
        themesLine = i;
      }
    }

    if (spreadLine === -1) {
      results.push({
        pass: false,
        message: 'No ...rehypeCodeDefaultOptions spread found',
        file: SOURCE_CONFIG,
      });
      return results;
    }

    if (themesLine === -1) {
      results.push({
        pass: false,
        message: 'No themes: {} block found',
        file: SOURCE_CONFIG,
      });
      return results;
    }

    if (spreadLine > themesLine) {
      results.push({
        pass: false,
        message: `Spread on line ${spreadLine + 1} comes after themes on line ${themesLine + 1} — spread will overwrite custom themes`,
        file: SOURCE_CONFIG,
        line: spreadLine + 1,
      });
    } else {
      results.push({
        pass: true,
        message: 'Spread comes before custom overrides',
        file: SOURCE_CONFIG,
      });
    }

    return results;
  },
};
