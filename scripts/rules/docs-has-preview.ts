import { readFile } from 'node:fs/promises';
import { getComponentMdxFiles } from './docs-utils.js';
import type { Rule, RuleResult } from './types.js';

export const docsHasPreview: Rule = {
  name: 'docs-has-preview',
  description: 'Every component .mdx file imports and uses <ComponentPreview>',
  category: 'docs',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];
    const files = await getComponentMdxFiles();

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const hasImport = content.includes("from '@/components/preview'") ||
        content.includes('from "@/components/preview"');
      const hasUsage = content.includes('<ComponentPreview');

      if (!hasImport || !hasUsage) {
        const missing = !hasImport && !hasUsage
          ? 'Missing import and usage of ComponentPreview'
          : !hasImport
            ? 'Missing import of ComponentPreview'
            : 'Missing usage of <ComponentPreview>';
        results.push({
          pass: false,
          message: missing,
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All component docs have ComponentPreview',
      });
    }

    return results;
  },
};
