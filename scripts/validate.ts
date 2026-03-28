import { noTemplateLiteralCodeProps } from './rules/no-template-literal-code-props.js';
import { shikiThemeConsistency } from './rules/shiki-theme-consistency.js';
import { shikiDualThemeMode } from './rules/shiki-dual-theme-mode.js';
import { sourceConfigSpreadOrder } from './rules/source-config-spread-order.js';
import { cssModuleTypesSync } from './rules/css-module-types-sync.js';
import { tokenFallbackGray } from './rules/token-fallback-gray.js';
import { noInlineShadows } from './rules/no-inline-shadows.js';
import { spacingGrid } from './rules/spacing-grid.js';
import type { Rule } from './rules/types.js';

const rules: Rule[] = [
  noTemplateLiteralCodeProps,
  shikiThemeConsistency,
  shikiDualThemeMode,
  sourceConfigSpreadOrder,
  cssModuleTypesSync,
  tokenFallbackGray,
  noInlineShadows,
  spacingGrid,
];

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

async function main() {
  const filterArg = process.argv[2];
  const activeRules = filterArg
    ? rules.filter((r) => r.name === filterArg || r.category === filterArg)
    : rules;

  if (activeRules.length === 0) {
    console.error(`${RED}No rules matched filter: ${filterArg}${RESET}`);
    console.error(
      `Available rules: ${rules.map((r) => r.name).join(', ')}`
    );
    console.error(
      `Available categories: ${[...new Set(rules.map((r) => r.category))].join(', ')}`
    );
    process.exit(1);
  }

  console.log(
    `\n${BOLD}Visor Regression Validator${RESET} ${DIM}(${activeRules.length} rules)${RESET}\n`
  );

  let totalFails = 0;
  let totalPass = 0;
  let totalWarns = 0;

  for (const rule of activeRules) {
    const results = await rule.run();
    const failures = results.filter((r) => !r.pass);
    const passes = results.filter((r) => r.pass);

    if (rule.warnOnly) {
      totalWarns += failures.length;
    } else {
      totalFails += failures.length;
    }
    totalPass += passes.length;

    if (failures.length === 0) {
      console.log(
        `${GREEN}✓${RESET} ${BOLD}${rule.name}${RESET} ${DIM}— ${rule.description}${RESET}`
      );
    } else {
      const severity = rule.warnOnly ? 'warn' : 'fail';
      const color = rule.warnOnly ? YELLOW : RED;
      const icon = rule.warnOnly ? '⚠' : '✗';
      console.log(
        `${color}${icon}${RESET} ${BOLD}${rule.name}${RESET} ${DIM}— ${rule.description}${RESET} ${YELLOW}(${failures.length} ${severity}${failures.length === 1 ? '' : 's'})${RESET}`
      );
      for (const result of failures) {
        const resultIcon = rule.warnOnly
          ? `${YELLOW}⚠${RESET}`
          : `${RED}✗${RESET}`;
        const location = result.file
          ? `${DIM}${result.file}${result.line ? `:${result.line}` : ''}${RESET} `
          : '';
        console.log(`  ${resultIcon} ${location}${result.message}`);
      }
    }
  }

  const warnStr = totalWarns > 0 ? `, ${YELLOW}${totalWarns} warnings${RESET}` : '';
  console.log(
    `\n${BOLD}Results:${RESET} ${GREEN}${totalPass} passed${RESET}, ${totalFails > 0 ? RED : GREEN}${totalFails} failed${RESET}${warnStr}\n`
  );

  process.exit(totalFails > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}Validator crashed:${RESET}`, err);
  process.exit(1);
});
