import { readFile } from 'node:fs/promises';
import { getComponentMdxFiles } from './docs-utils.js';
import type { Rule, RuleResult } from './types.js';

interface Section {
  name: string;
  test: (content: string) => number; // returns position or -1
}

const REQUIRED_SECTIONS: Section[] = [
  {
    name: 'Installation',
    test: (c) => c.search(/^## Installation/m),
  },
  {
    name: 'ComponentPreview',
    test: (c) => c.indexOf('<ComponentPreview'),
  },
  {
    name: 'API Reference (PropsTable)',
    test: (c) => {
      // Match "## API Reference", "## Props", or a heading containing PropsTable usage nearby
      const apiMatch = c.search(/^## .*(?:API|Props)/m);
      const propsTablePos = c.indexOf('<PropsTable');
      // Return whichever comes first as the section position
      if (apiMatch >= 0) return apiMatch;
      if (propsTablePos >= 0) return propsTablePos;
      return -1;
    },
  },
];

export const docsConsistentSections: Rule = {
  name: 'docs-consistent-sections',
  description:
    'Every component .mdx has required sections in order: Installation, Preview(s), API Reference',
  category: 'docs',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];
    const files = await getComponentMdxFiles();

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const positions: { name: string; pos: number }[] = [];
      const missing: string[] = [];

      for (const section of REQUIRED_SECTIONS) {
        const pos = section.test(content);
        if (pos === -1) {
          missing.push(section.name);
        } else {
          positions.push({ name: section.name, pos });
        }
      }

      if (missing.length > 0) {
        results.push({
          pass: false,
          message: `Missing sections: ${missing.join(', ')}`,
          file: filePath,
        });
        continue;
      }

      // Check order
      for (let i = 1; i < positions.length; i++) {
        if (positions[i].pos < positions[i - 1].pos) {
          results.push({
            pass: false,
            message: `Section order violation: "${positions[i].name}" appears before "${positions[i - 1].name}"`,
            file: filePath,
          });
          break;
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All component docs have consistent sections',
      });
    }

    return results;
  },
};
