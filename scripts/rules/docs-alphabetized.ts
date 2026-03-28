import { readFile } from 'node:fs/promises';
import { getComponentMetaFiles } from './docs-utils.js';
import type { Rule, RuleResult } from './types.js';

export const docsAlphabetized: Rule = {
  name: 'docs-alphabetized',
  description: 'Components within each group meta.json are alphabetized A-Z',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];
    const metaFiles = await getComponentMetaFiles();

    for (const filePath of metaFiles) {
      const content = await readFile(filePath, 'utf-8');
      const meta = JSON.parse(content) as { title: string; pages: string[] };
      const pages = meta.pages;
      const sorted = [...pages].sort((a, b) => a.localeCompare(b));

      for (let i = 0; i < pages.length; i++) {
        if (pages[i] !== sorted[i]) {
          results.push({
            pass: false,
            message: `"${pages[i]}" is out of alphabetical order in ${meta.title} group (expected "${sorted[i]}")`,
            file: filePath,
          });
          break;
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All component groups are alphabetized',
      });
    }

    return results;
  },
};
