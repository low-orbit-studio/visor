import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const focusRingTokens: Rule = {
  name: 'focus-ring-tokens',
  description: 'Focus rings must use var(--focus-ring-width) and var(--focus-ring-offset)',
  category: 'tokens',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/**/*.module.css')) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Find :focus-visible blocks and check their contents
      let inFocusBlock = false;
      let braceDepth = 0;
      let blockStart = 0;
      let hasOutlineWidth = false;
      let hasOutlineOffset = false;
      let hasBoxShadowFocus = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Strip :not(...) wrappers so selectors like :hover:not(:focus-visible)
        // don't start a phantom focus block.
        const lineWithoutNot = line.replace(/:not\([^)]*\)/g, '');

        if (/:focus-visible/.test(lineWithoutNot)) {
          inFocusBlock = true;
          braceDepth = 0;
          blockStart = i;
          hasOutlineWidth = false;
          hasOutlineOffset = false;
          hasBoxShadowFocus = false;
        }

        if (inFocusBlock) {
          for (const ch of line) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
          }

          // Check for focus ring token usage
          if (line.includes('var(--focus-ring-width')) hasOutlineWidth = true;
          if (line.includes('var(--focus-ring-offset')) hasOutlineOffset = true;
          // Box-shadow focus pattern uses focus-ring-width inside the shadow
          if (/box-shadow.*var\(--focus-ring-width/.test(line)) hasBoxShadowFocus = true;

          if (braceDepth <= 0 && inFocusBlock) {
            inFocusBlock = false;

            // Box-shadow pattern only needs --focus-ring-width
            if (hasBoxShadowFocus) {
              results.push({
                pass: true,
                message: 'Focus ring uses box-shadow pattern with tokens',
                file: filePath,
                line: blockStart + 1,
              });
              continue;
            }

            // Outline pattern needs both width and offset
            if (!hasOutlineWidth) {
              results.push({
                pass: false,
                message: ':focus-visible missing var(--focus-ring-width) — use outline: var(--focus-ring-width) solid ...',
                file: filePath,
                line: blockStart + 1,
              });
            }
            if (!hasOutlineOffset) {
              results.push({
                pass: false,
                message: ':focus-visible missing var(--focus-ring-offset) — use outline-offset: var(--focus-ring-offset)',
                file: filePath,
                line: blockStart + 1,
              });
            }
            if (hasOutlineWidth && hasOutlineOffset) {
              results.push({
                pass: true,
                message: 'Focus ring uses outline pattern with tokens',
                file: filePath,
                line: blockStart + 1,
              });
            }
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No :focus-visible blocks found to check',
      });
    }

    return results;
  },
};
