import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

// Components that intentionally have no standalone docs page:
// - lib utilities (utils, deck-registry, deck-stagger) are not UI components
const EXCLUDED_NAMES = new Set(['utils', 'deck-registry', 'deck-stagger']);

export const docsPageExists: Rule = {
  name: 'docs-page-exists',
  description:
    'Every registered component has a matching MDX docs page in packages/docs/content/docs/components/',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];

    // Only check the main UI registry — deck uses its own naming convention
    // (deck-dot-nav → dot-nav.mdx) and has complete docs in its own section.
    const registryFiles = ['registry/registry-ui.ts'];
    const registeredNames = new Set<string>();
    for (const filePath of registryFiles) {
      let content: string;
      try {
        content = await readFile(filePath, 'utf-8');
      } catch {
        continue;
      }
      const nameRegex = /name:\s*["']([^"']+)["']/g;
      let m: RegExpMatchArray | null;
      while ((m = nameRegex.exec(content)) !== null) {
        registeredNames.add(m[1]);
      }
    }

    // Build a set of all MDX filenames (without extension) under components/
    const existingPages = new Set<string>();
    for await (const filePath of glob(
      'packages/docs/content/docs/components/**/*.mdx'
    )) {
      const filename = filePath.split('/').at(-1)!.replace(/\.mdx$/, '');
      existingPages.add(filename);
    }

    for (const name of [...registeredNames].sort()) {
      if (EXCLUDED_NAMES.has(name)) continue;

      const hasPage = existingPages.has(name);
      results.push({
        pass: hasPage,
        message: hasPage
          ? 'Has docs page'
          : `No MDX docs page found for "${name}" in packages/docs/content/docs/components/`,
        file: `components/ui/${name}`,
      });
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No registered components found',
      });
    }

    return results;
  },
};
