import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Rule, RuleResult } from './types.js';

// Only enforce on known floating-panel components, not on ambient surfaces like
// card, stat-card, navbar, bulk-action-bar which intentionally inherit surface-card.
const FLOATING_PANEL_NAMES = new Set([
  'popover',
  'dropdown-menu',
  'context-menu',
  'menubar',
  'hover-card',
  'combobox',
  'command',
  'select',
  'date-picker',
  'date-range-picker',
  'toast',
  'slider',
]);

function isFloatingPanelFile(filePath: string): boolean {
  // e.g. components/ui/dropdown-menu/dropdown-menu.module.css → "dropdown-menu"
  const name = basename(filePath).replace('.module.css', '');
  return FLOATING_PANEL_NAMES.has(name);
}

export const floatingPanelOpaqueBg: Rule = {
  name: 'floating-panel-opaque-bg',
  description:
    'Floating panels must use var(--surface-popover) for background-color, not bare var(--surface-card) — surface-card may be translucent in glass themes like Blackout',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/**/*.module.css')) {
      if (filePath.endsWith('.d.ts')) continue;
      if (!isFloatingPanelFile(filePath)) continue;

      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      let depth = 0;
      let blockHasBoxShadow = false;
      let bgViolations: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const openCount = (line.match(/\{/g) || []).length;
        const closeCount = (line.match(/\}/g) || []).length;

        if (openCount > 0 && depth === 0) {
          blockHasBoxShadow = false;
          bgViolations = [];
        }

        depth += openCount;

        if (depth >= 1 && !line.trimStart().startsWith('//')) {
          if (/box-shadow\s*:/.test(line)) {
            blockHasBoxShadow = true;
          }
          // Flag: uses surface-card without the required surface-popover fallback
          if (
            /background-color\s*:/.test(line) &&
            line.includes('var(--surface-card') &&
            !line.includes('var(--surface-popover')
          ) {
            bgViolations.push(i + 1);
          }
        }

        depth -= closeCount;

        if (depth === 0 && closeCount > 0 && blockHasBoxShadow) {
          for (const lineNum of bgViolations) {
            results.push({
              pass: false,
              message:
                'Floating panel uses bare var(--surface-card) — use var(--surface-popover, var(--surface-card, #ffffff)) so panels are opaque in glass themes (Blackout, Modern Minimal dark)',
              file: filePath,
              line: lineNum,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All floating panels use var(--surface-popover) for background-color',
      });
    }

    return results;
  },
};
