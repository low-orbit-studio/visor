import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

// Properties that should use spacing tokens
const SPACING_PROPS = [
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-inline',
  'padding-block',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-inline',
  'margin-block',
  'gap',
  'row-gap',
  'column-gap',
];

// Build regex: property: <value that isn't a var() or 0 or auto>
const SPACING_PROP_PATTERN = new RegExp(
  `\\b(${SPACING_PROPS.join('|')})\\s*:\\s*(.+?)\\s*;`,
  'g'
);

// Values that are always OK without a token
const EXEMPT_VALUES = /^(0|auto|inherit|initial|unset|revert)$/;

function hasHardcodedSpacing(value: string): boolean {
  // Split on spaces for shorthand (e.g., padding: 8px 16px)
  const parts = value.trim().split(/\s+/);
  return parts.some((part) => {
    // Allow 0 without units
    if (part === '0') return false;
    // Allow CSS keywords
    if (EXEMPT_VALUES.test(part)) return false;
    // Allow values that use var() or calc() anywhere in the part
    if (part.includes('var(') || part.includes('calc(')) return false;
    // Flag px, rem, em values that aren't tokens
    if (/^\d+(\.\d+)?(px|rem|em)$/.test(part)) return true;
    return false;
  });
}

export const spacingGrid: Rule = {
  name: 'spacing-grid',
  description: 'Padding/gap/margin use var(--spacing-N) tokens',
  category: 'tokens',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/**/*.module.css')) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments
        if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('*')) continue;

        SPACING_PROP_PATTERN.lastIndex = 0;
        let m = SPACING_PROP_PATTERN.exec(line);
        while (m !== null) {
          const prop = m[1];
          const value = m[2];
          if (hasHardcodedSpacing(value)) {
            results.push({
              pass: false,
              message: `Hardcoded spacing: ${prop}: ${value} — use var(--spacing-N)`,
              file: filePath,
              line: i + 1,
            });
          }
          m = SPACING_PROP_PATTERN.exec(line);
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All spacing uses tokens',
      });
    }

    return results;
  },
};
