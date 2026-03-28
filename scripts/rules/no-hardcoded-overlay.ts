import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

export const noHardcodedOverlay: Rule = {
  name: 'no-hardcoded-overlay',
  description: 'Overlay backgrounds must use var(--overlay-bg), not bare rgba()',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/**/*.module.css')) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();

        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

        // Check for background-color or background with rgba() overlay patterns
        if (!/background(?:-color)?\s*:/.test(line)) continue;

        // Has rgba/hsla that looks like an overlay (translucent dark color)
        if (!/rgba?\s*\(|hsla?\s*\(/.test(line)) continue;

        // If it already uses var(--overlay-bg), it's fine
        if (line.includes('var(--overlay-bg')) continue;

        // Check for translucent dark colors (overlay patterns) with high opacity (>= 0.5)
        // Low-opacity rgba like rgba(0,0,0,0.05) are subtle hover effects, not overlays
        const overlayPattern = /rgba\s*\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[5-9]\d*\s*\)/;
        const hslaOverlay = /hsla\s*\(\s*0\s*,\s*0%?\s*,\s*0%?\s*,\s*0\.[5-9]\d*\s*\)/;

        if (overlayPattern.test(line) || hslaOverlay.test(line)) {
          results.push({
            pass: false,
            message: 'Bare overlay background — use var(--overlay-bg) token',
            file: filePath,
            line: i + 1,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All overlays use var(--overlay-bg)',
      });
    }

    return results;
  },
};
