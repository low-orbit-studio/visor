import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const GLOBALS_PATH = 'packages/docs/app/globals.css';

/**
 * CSS spec: @import rules must precede all rules except @charset and @layer.
 * PostCSS (used by Next.js) hard-errors when this is violated, crashing the dev
 * server and CI builds. This rule catches it at validate-time before it ever
 * reaches the build step.
 */
export const globalsCssImportsOrder: Rule = {
  name: 'globals-css-imports-order',
  description: '@import rules in globals.css must precede all other rules (PostCSS hard requirement)',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    let content: string;
    try {
      content = await readFile(GLOBALS_PATH, 'utf-8');
    } catch {
      return [{ pass: false, message: `Could not read ${GLOBALS_PATH}`, file: GLOBALS_PATH }];
    }

    const lines = content.split('\n');
    let lastImportLine = -1;
    let firstNonImportLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      // Skip blank lines, comments, and @charset / @layer (allowed before @import by spec)
      if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      if (trimmed.startsWith('@charset') || trimmed.startsWith('@layer')) continue;

      if (trimmed.startsWith('@import')) {
        lastImportLine = i;
      } else if (firstNonImportLine === -1) {
        firstNonImportLine = i;
      }
    }

    if (lastImportLine !== -1 && firstNonImportLine !== -1 && firstNonImportLine < lastImportLine) {
      return [{
        pass: false,
        message:
          `@import on line ${lastImportLine + 1} follows a non-@import rule on line ${firstNonImportLine + 1}. ` +
          `All @import statements must come before any other CSS rules. ` +
          `This will cause a PostCSS hard error at build time.`,
        file: GLOBALS_PATH,
        line: lastImportLine + 1,
      }];
    }

    return [{ pass: true, message: 'All @import rules precede other CSS rules', file: GLOBALS_PATH }];
  },
};
