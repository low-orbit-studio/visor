import { readFile } from 'node:fs/promises';
import { getComponentMdxFiles } from './docs-utils.js';
import type { Rule, RuleResult } from './types.js';

export const docsHasPropsTable: Rule = {
  name: 'docs-has-props-table',
  description: 'Every component .mdx file imports and uses <PropsTable>',
  category: 'docs',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];
    const files = await getComponentMdxFiles();

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const hasImport = content.includes("from '@/components/props-table'") ||
        content.includes('from "@/components/props-table"');
      const hasUsage = content.includes('<PropsTable');

      if (!hasImport || !hasUsage) {
        const missing = !hasImport && !hasUsage
          ? 'Missing import and usage of PropsTable'
          : !hasImport
            ? 'Missing import of PropsTable'
            : 'Missing usage of <PropsTable>';
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
        message: 'All component docs have PropsTable',
      });
    }

    return results;
  },
};
