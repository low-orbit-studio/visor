import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Rule, RuleResult } from './types.js';

export const patternsDocsPageExists: Rule = {
  name: 'patterns-docs-page-exists',
  description:
    'Every pattern in patterns/ has a matching MDX docs page in packages/docs/content/docs/patterns/',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];

    let entries: string[];
    try {
      const dirEntries = await readdir('patterns');
      entries = dirEntries.filter((f) => f.endsWith('.visor-pattern.yaml'));
    } catch {
      results.push({ pass: true, message: 'No patterns directory found' });
      return results;
    }

    for (const filename of entries.sort()) {
      const patternName = filename.replace('.visor-pattern.yaml', '');
      const mdxPath = `packages/docs/content/docs/patterns/${patternName}.mdx`;
      const exists = existsSync(mdxPath);
      results.push({
        pass: exists,
        message: exists ? 'Has docs page' : `No MDX page found at ${mdxPath}`,
        file: mdxPath,
      });
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No patterns found' });
    }

    return results;
  },
};
