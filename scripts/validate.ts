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
import { themePrimaryScale } from './rules/theme-primary-scale.js';
import { themeYamlExists } from './rules/theme-yaml-exists.js';
import { themeYamlValid } from './rules/theme-yaml-valid.js';
import { noHardcodedColors } from './rules/no-hardcoded-colors.js';
import { visorYamlExists } from './rules/visor-yaml-exists.js';
import { visorYamlComplete, visorYamlPreviewUrl } from './rules/visor-yaml-complete.js';
import { testFileExists } from './rules/test-file-exists.js';
import { cssModuleExists } from './rules/css-module-exists.js';
import { registryEntryExists } from './rules/registry-entry-exists.js';
import { docsHasPreview } from './rules/docs-has-preview.js';
import { docsHasPropsTable } from './rules/docs-has-props-table.js';
import { docsHasInstallCommand } from './rules/docs-has-install-command.js';
import { docsConsistentSections } from './rules/docs-consistent-sections.js';
import { docsAlphabetized } from './rules/docs-alphabetized.js';
import { docsPageExists } from './rules/docs-page-exists.js';
import { themeFontImports } from './rules/theme-font-imports.js';
import { globalsCssImportsOrder } from './rules/globals-css-imports-order.js';
import { globalsWordmarkRules } from './rules/globals-wordmark-rules.js';
import { themeFontScaleAdjust } from './rules/theme-font-scale-adjust.js';
import { themePrimaryBrandAnchor } from './rules/theme-primary-brand-anchor.js';
import { registryManifestSync } from './rules/registry-manifest-sync.js';
import { hooksDocsPageExists } from './rules/hooks-docs-page-exists.js';
import { patternsDocsPageExists } from './rules/patterns-docs-page-exists.js';
import { registryBuildIntegrity } from './rules/registry-build-integrity.js';
import { discoverabilityVariantDrift } from './rules/discoverability-variant-drift.js';
import { discoverabilitySelectionQuality } from './rules/discoverability-selection-quality.js';
import { discoverabilityScore } from './rules/discoverability-score.js';
import { themeTextContrast } from './rules/theme-text-contrast.js';
import { crossPlatformManifestSync } from './rules/cross-platform-manifest-sync.js';
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
  themePrimaryScale,
  themeFontImports,
  themeFontScaleAdjust,
  themePrimaryBrandAnchor,
  globalsCssImportsOrder,
  globalsWordmarkRules,
  themeYamlExists,
  themeYamlValid,
  noHardcodedColors,
  visorYamlExists,
  visorYamlComplete,
  visorYamlPreviewUrl,
  crossPlatformManifestSync,
  testFileExists,
  cssModuleExists,
  registryEntryExists,
  registryManifestSync,
  registryBuildIntegrity,
  discoverabilityVariantDrift,
  discoverabilitySelectionQuality,
  discoverabilityScore,
  themeTextContrast,
  hooksDocsPageExists,
  patternsDocsPageExists,
  docsPageExists,
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
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const filterArg = args.find((a) => !a.startsWith('--'));
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

    // Scoring rules: any result carries a numeric score — always print all results
    const isScoring = results.some((r) => r.score !== undefined);

    if (failures.length === 0) {
      console.log(
        `${GREEN}✓${RESET} ${BOLD}${rule.name}${RESET} ${DIM}— ${rule.description}${RESET}`
      );
      if (isScoring) {
        for (const result of results) {
          const isSummary = result === results[results.length - 1];
          const color = result.pass ? (isSummary ? BOLD : DIM) : YELLOW;
          console.log(`  ${color}${result.message}${RESET}`);
        }
      }
    } else {
      const severity = rule.warnOnly ? 'warn' : 'fail';
      const color = rule.warnOnly ? YELLOW : RED;
      const icon = rule.warnOnly ? '⚠' : '✗';
      console.log(
        `${color}${icon}${RESET} ${BOLD}${rule.name}${RESET} ${DIM}— ${rule.description}${RESET} ${YELLOW}(${failures.length} ${severity}${failures.length === 1 ? '' : 's'})${RESET}`
      );
      if (isScoring) {
        // For scoring rules, always print all results; mark failures distinctly
        for (const result of results) {
          const isSummary = result === results[results.length - 1];
          const resultColor = !result.pass
            ? (rule.warnOnly ? YELLOW : RED)
            : (isSummary ? BOLD : DIM);
          const resultIcon = !result.pass
            ? (rule.warnOnly ? `${YELLOW}⚠${RESET}` : `${RED}✗${RESET}`)
            : ' ';
          console.log(`  ${resultIcon} ${resultColor}${result.message}${RESET}`);
        }
      } else {
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
  }

  const warnStr = totalWarns > 0 ? `, ${YELLOW}${totalWarns} warnings${RESET}` : '';
  console.log(
    `\n${BOLD}Results:${RESET} ${GREEN}${totalPass} passed${RESET}, ${totalFails > 0 ? RED : GREEN}${totalFails} failed${RESET}${warnStr}${strict ? ` ${DIM}(strict)${RESET}` : ''}\n`
  );

  const failed = totalFails > 0 || (strict && totalWarns > 0);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}Validator crashed:${RESET}`, err);
  process.exit(1);
});
