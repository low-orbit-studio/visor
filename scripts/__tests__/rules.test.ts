import { describe, it, expect } from 'vitest';
import { noTemplateLiteralCodeProps } from '../rules/no-template-literal-code-props.js';
import { shikiThemeConsistency } from '../rules/shiki-theme-consistency.js';
import { shikiDualThemeMode } from '../rules/shiki-dual-theme-mode.js';
import { sourceConfigSpreadOrder } from '../rules/source-config-spread-order.js';
import { cssModuleTypesSync } from '../rules/css-module-types-sync.js';
import { tokenFallbackGray } from '../rules/token-fallback-gray.js';
import { noInlineShadows } from '../rules/no-inline-shadows.js';
import { spacingGrid } from '../rules/spacing-grid.js';
import { noHardcodedMotion } from '../rules/no-hardcoded-motion.js';
import { noHardcodedOverlay } from '../rules/no-hardcoded-overlay.js';
import { focusRingTokens } from '../rules/focus-ring-tokens.js';
import { themeStructure } from '../rules/theme-structure.js';
import { noHardcodedColors } from '../rules/no-hardcoded-colors.js';
import { visorYamlExists } from '../rules/visor-yaml-exists.js';
import { visorYamlComplete } from '../rules/visor-yaml-complete.js';
import { testFileExists } from '../rules/test-file-exists.js';
import { cssModuleExists } from '../rules/css-module-exists.js';
import { registryEntryExists } from '../rules/registry-entry-exists.js';
import { docsHasPreview } from '../rules/docs-has-preview.js';
import { docsHasPropsTable } from '../rules/docs-has-props-table.js';
import { docsHasInstallCommand } from '../rules/docs-has-install-command.js';
import { docsConsistentSections } from '../rules/docs-consistent-sections.js';
import { docsAlphabetized } from '../rules/docs-alphabetized.js';

describe('no-template-literal-code-props', () => {
  it('has correct metadata', () => {
    expect(noTemplateLiteralCodeProps.name).toBe('no-template-literal-code-props');
    expect(noTemplateLiteralCodeProps.category).toBe('docs');
  });

  it('passes on current codebase (after migration)', async () => {
    const results = await noTemplateLiteralCodeProps.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('shiki-theme-consistency', () => {
  it('has correct metadata', () => {
    expect(shikiThemeConsistency.name).toBe('shiki-theme-consistency');
    expect(shikiThemeConsistency.category).toBe('components');
  });

  it('passes when preview themes match source.config.ts', async () => {
    const results = await shikiThemeConsistency.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('shiki-dual-theme-mode', () => {
  it('has correct metadata', () => {
    expect(shikiDualThemeMode.name).toBe('shiki-dual-theme-mode');
    expect(shikiDualThemeMode.category).toBe('components');
  });

  it('passes when preview components use dual theme mode', async () => {
    const results = await shikiDualThemeMode.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('source-config-spread-order', () => {
  it('has correct metadata', () => {
    expect(sourceConfigSpreadOrder.name).toBe('source-config-spread-order');
    expect(sourceConfigSpreadOrder.category).toBe('docs');
  });

  it('passes when spread comes before custom overrides', async () => {
    const results = await sourceConfigSpreadOrder.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('css-module-types-sync', () => {
  it('has correct metadata', () => {
    expect(cssModuleTypesSync.name).toBe('css-module-types-sync');
    expect(cssModuleTypesSync.category).toBe('tokens');
    expect(cssModuleTypesSync.warnOnly).toBe(true);
  });

  it('returns results for existing css modules', async () => {
    const results = await cssModuleTypesSync.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('token-fallback-gray', () => {
  it('has correct metadata', () => {
    expect(tokenFallbackGray.name).toBe('token-fallback-gray');
    expect(tokenFallbackGray.category).toBe('tokens');
  });

  it('passes on current codebase', async () => {
    const results = await tokenFallbackGray.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('no-inline-shadows', () => {
  it('has correct metadata', () => {
    expect(noInlineShadows.name).toBe('no-inline-shadows');
    expect(noInlineShadows.category).toBe('tokens');
  });

  it('passes on current codebase', async () => {
    const results = await noInlineShadows.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('spacing-grid', () => {
  it('has correct metadata', () => {
    expect(spacingGrid.name).toBe('spacing-grid');
    expect(spacingGrid.category).toBe('tokens');
    expect(spacingGrid.warnOnly).toBe(true);
  });

  it('returns results for existing css modules', async () => {
    const results = await spacingGrid.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('docs-has-preview', () => {
  it('has correct metadata', () => {
    expect(docsHasPreview.name).toBe('docs-has-preview');
    expect(docsHasPreview.category).toBe('docs');
    expect(docsHasPreview.warnOnly).toBe(true);
  });

  it('returns results for component docs', async () => {
    const results = await docsHasPreview.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('docs-has-props-table', () => {
  it('has correct metadata', () => {
    expect(docsHasPropsTable.name).toBe('docs-has-props-table');
    expect(docsHasPropsTable.category).toBe('docs');
    expect(docsHasPropsTable.warnOnly).toBe(true);
  });

  it('returns results for component docs', async () => {
    const results = await docsHasPropsTable.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('docs-has-install-command', () => {
  it('has correct metadata', () => {
    expect(docsHasInstallCommand.name).toBe('docs-has-install-command');
    expect(docsHasInstallCommand.category).toBe('docs');
    expect(docsHasInstallCommand.warnOnly).toBe(true);
  });

  it('returns results for component docs', async () => {
    const results = await docsHasInstallCommand.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('docs-consistent-sections', () => {
  it('has correct metadata', () => {
    expect(docsConsistentSections.name).toBe('docs-consistent-sections');
    expect(docsConsistentSections.category).toBe('docs');
    expect(docsConsistentSections.warnOnly).toBe(true);
  });

  it('returns results for component docs', async () => {
    const results = await docsConsistentSections.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('docs-alphabetized', () => {
  it('has correct metadata', () => {
    expect(docsAlphabetized.name).toBe('docs-alphabetized');
    expect(docsAlphabetized.category).toBe('docs');
  });

  it('returns results for component meta files', async () => {
    const results = await docsAlphabetized.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('no-hardcoded-motion', () => {
  it('has correct metadata', () => {
    expect(noHardcodedMotion.name).toBe('no-hardcoded-motion');
    expect(noHardcodedMotion.category).toBe('tokens');
  });

  it('passes on current codebase (after fixes)', async () => {
    const results = await noHardcodedMotion.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('no-hardcoded-overlay', () => {
  it('has correct metadata', () => {
    expect(noHardcodedOverlay.name).toBe('no-hardcoded-overlay');
    expect(noHardcodedOverlay.category).toBe('tokens');
  });

  it('passes on current codebase (after fixes)', async () => {
    const results = await noHardcodedOverlay.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('focus-ring-tokens', () => {
  it('has correct metadata', () => {
    expect(focusRingTokens.name).toBe('focus-ring-tokens');
    expect(focusRingTokens.category).toBe('tokens');
    expect(focusRingTokens.warnOnly).toBe(true);
  });

  it('returns results for component css', async () => {
    const results = await focusRingTokens.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('theme-structure', () => {
  it('has correct metadata', () => {
    expect(themeStructure.name).toBe('theme-structure');
    expect(themeStructure.category).toBe('tokens');
    expect(themeStructure.warnOnly).toBe(true);
  });

  it('returns results for theme files', async () => {
    const results = await themeStructure.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('no-hardcoded-colors', () => {
  it('has correct metadata', () => {
    expect(noHardcodedColors.name).toBe('no-hardcoded-colors');
    expect(noHardcodedColors.category).toBe('tokens');
  });

  it('passes on current codebase', async () => {
    const results = await noHardcodedColors.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('visor-yaml-exists', () => {
  it('has correct metadata', () => {
    expect(visorYamlExists.name).toBe('visor-yaml-exists');
    expect(visorYamlExists.category).toBe('structure');
  });

  it('passes on current codebase', async () => {
    const results = await visorYamlExists.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('visor-yaml-complete', () => {
  it('has correct metadata', () => {
    expect(visorYamlComplete.name).toBe('visor-yaml-complete');
    expect(visorYamlComplete.category).toBe('structure');
    expect(visorYamlComplete.warnOnly).toBe(true);
  });

  it('returns results for visor yaml files', async () => {
    const results = await visorYamlComplete.run();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('test-file-exists', () => {
  it('has correct metadata', () => {
    expect(testFileExists.name).toBe('test-file-exists');
    expect(testFileExists.category).toBe('structure');
  });

  it('passes on current codebase', async () => {
    const results = await testFileExists.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('css-module-exists', () => {
  it('has correct metadata', () => {
    expect(cssModuleExists.name).toBe('css-module-exists');
    expect(cssModuleExists.category).toBe('structure');
  });

  it('passes on current codebase', async () => {
    const results = await cssModuleExists.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('registry-entry-exists', () => {
  it('has correct metadata', () => {
    expect(registryEntryExists.name).toBe('registry-entry-exists');
    expect(registryEntryExists.category).toBe('structure');
  });

  it('passes on current codebase', async () => {
    const results = await registryEntryExists.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });
});

describe('rule type compliance', () => {
  const allRules = [
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

  it('all rules have required properties', () => {
    for (const rule of allRules) {
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(['docs', 'components', 'tokens', 'structure']).toContain(rule.category);
      expect(typeof rule.run).toBe('function');
    }
  });

  it('all rules have unique names', () => {
    const names = allRules.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all rules return at least one result', async () => {
    for (const rule of allRules) {
      const results = await rule.run();
      expect(results.length).toBeGreaterThan(0);
    }
  });
});
