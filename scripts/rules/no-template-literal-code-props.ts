import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const noTemplateLiteralCodeProps: Rule = {
  name: 'no-template-literal-code-props',
  description: 'No backtick template literals in MDX code={} props — MDX strips whitespace',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];
    const pattern = 'packages/docs/content/**/*.mdx';

    for await (const filePath of glob(pattern)) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match code={` as a JSX attribute, not inside a string value.
        // If the line starts with code={"..., any code={` inside is string content, not a prop.
        const trimmed = line.trimStart();
        if (/^code=\{`/.test(trimmed)) {
          results.push({
            pass: false,
            message: 'Template literal in code={} prop — use escaped string code={"..."} instead',
            file: filePath,
            line: i + 1,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No template literal code props found' });
    }

    return results;
  },
};
