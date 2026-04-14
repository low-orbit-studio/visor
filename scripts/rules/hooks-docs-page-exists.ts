import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Rule, RuleResult } from './types.js';

export const hooksDocsPageExists: Rule = {
  name: 'hooks-docs-page-exists',
  description:
    'Every registered hook has a matching MDX docs page in packages/docs/content/docs/hooks/',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];
    const registryContent = await readFile(
      'registry/registry-hooks.ts',
      'utf-8'
    );
    const nameRegex = /name:\s*["']([^"']+)["']/g;
    let m: RegExpMatchArray | null;
    while ((m = nameRegex.exec(registryContent)) !== null) {
      const hookName = m[1];
      const mdxPath = `packages/docs/content/docs/hooks/${hookName}.mdx`;
      const exists = existsSync(mdxPath);
      results.push({
        pass: exists,
        message: exists ? 'Has docs page' : `No MDX page found at ${mdxPath}`,
        file: mdxPath,
      });
    }
    if (results.length === 0) {
      results.push({ pass: true, message: 'No hooks found in registry' });
    }
    return results;
  },
};
