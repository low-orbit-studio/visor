import { noTemplateLiteralCodeProps } from './rules/no-template-literal-code-props.js';
import { shikiThemeConsistency } from './rules/shiki-theme-consistency.js';
import { shikiDualThemeMode } from './rules/shiki-dual-theme-mode.js';
import { sourceConfigSpreadOrder } from './rules/source-config-spread-order.js';
import { cssModuleTypesSync } from './rules/css-module-types-sync.js';
import { tokenFallbackGray } from './rules/token-fallback-gray.js';
import { noInlineShadows } from './rules/no-inline-shadows.js';
import { spacingGrid } from './rules/spacing-grid.js';
import { noHardcodedMotion } from './rules/no-hardcoded-motion.js';
import { noHardcodedOverlay } from './rules/no-hardcoded-overlay.js';
import { focusRingTokens } from './rules/focus-ring-tokens.js';
import { themeStructure } from './rules/theme-structure.js';
import { noHardcodedColors } from './rules/no-hardcoded-colors.js';
import { visorYamlExists } from './rules/visor-yaml-exists.js';
import { visorYamlComplete } from './rules/visor-yaml-complete.js';
import { testFileExists } from './rules/test-file-exists.js';
import { cssModuleExists } from './rules/css-module-exists.js';
import { registryEntryExists } from './rules/registry-entry-exists.js';
import { docsHasPreview } from './rules/docs-has-preview.js';
import { docsHasPropsTable } from './rules/docs-has-props-table.js';
import { docsHasInstallCommand } from './rules/docs-has-install-command.js';
import { docsConsistentSections } from './rules/docs-consistent-sections.js';
import { docsAlphabetized } from './rules/docs-alphabetized.js';
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
  noHardcodedMotion,
  noHardcodedOverlay,
  focusRingTokens,
  themeStructure,
  noHardcodedColors,
  visorYamlExists,
  visorYamlComplete,
  testFileExists,
  cssModuleExists,
  registryEntryExists,
  docsHasPreview,
  docsHasPropsTable,
  docsHasInstallCommand,
  docsConsistentSections,
  docsAlphabetized,
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
