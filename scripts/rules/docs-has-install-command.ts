import { readFile } from 'node:fs/promises';
import { getComponentMdxFiles } from './docs-utils.js';
import type { Rule, RuleResult } from './types.js';

export const docsHasInstallCommand: Rule = {
  name: 'docs-has-install-command',
  description: 'Every component .mdx has an installation code block with `npx visor add`',
  category: 'docs',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];
    const files = await getComponentMdxFiles();

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const hasInstallCommand = /```bash\s*\n\s*npx visor add\s/.test(content);

      if (!hasInstallCommand) {
        results.push({
          pass: false,
          message: 'Missing installation code block with `npx visor add`',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All component docs have install command',
      });
    }

    return results;
  },
};
