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
import {
  elementDefaultsOwnedByBase,
  findOwnedDeclarations,
  nativeControlComponentNames,
} from '../rules/element-defaults-owned-by-base.js';
import { themeStructure } from '../rules/theme-structure.js';
import { themePrimaryScale } from '../rules/theme-primary-scale.js';
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

describe('theme-primary-scale', () => {
  it('has correct metadata', () => {
    expect(themePrimaryScale.name).toBe('theme-primary-scale');
    expect(themePrimaryScale.category).toBe('tokens');
  });

  it('passes on current codebase', async () => {
    const results = await themePrimaryScale.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
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
    themePrimaryScale,
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

describe('element-defaults-owned-by-base', () => {
  it('has correct metadata', () => {
    expect(elementDefaultsOwnedByBase.name).toBe('element-defaults-owned-by-base');
    expect(elementDefaultsOwnedByBase.category).toBe('components');
  });

  it('passes on the current codebase (after the VI-616 sweep)', async () => {
    const results = await elementDefaultsOwnedByBase.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toHaveLength(0);
  });

  it('derives its native-control target set from NATIVE_TO_VISOR + INPUT_TYPE_MAP', () => {
    const names = nativeControlComponentNames();
    // From NATIVE_TO_VISOR.
    expect(names.has('button')).toBe(true);
    expect(names.has('select')).toBe(true);
    // From INPUT_TYPE_MAP — proves both maps feed the set.
    expect(names.has('number-input')).toBe(true);
    expect(names.has('phone-input')).toBe(true);
    // Not a native control in either map — no hardcoded path list.
    expect(names.has('card')).toBe(false);
  });
});

describe('element-defaults-owned-by-base — fixtures', () => {
  const fixture = 'components/ui/fixture/fixture.module.css';

  it('fails on a component that re-declares font-family: inherit, passes after removal', () => {
    const bad = ['.base {', '  color: red;', '  font-family: inherit;', '}'].join('\n');
    const badResults = findOwnedDeclarations(bad, fixture, true);
    expect(badResults).toHaveLength(1);
    expect(badResults[0].pass).toBe(false);
    expect(badResults[0].line).toBe(3);

    const good = ['.base {', '  color: red;', '}'].join('\n');
    expect(findOwnedDeclarations(good, fixture, true)).toHaveLength(0);
  });

  it('fails on the `font: inherit` shorthand variant', () => {
    const css = ['.trigger {', '  font: inherit;', '}'].join('\n');
    expect(findOwnedDeclarations(css, fixture, true)).toHaveLength(1);
  });

  it('fails on a body-font token with a hardcoded system-ui fallback', () => {
    const css = ['.pill {', '  font-family: var(--font-body, system-ui, sans-serif);', '}'].join('\n');
    const results = findOwnedDeclarations(css, fixture, false);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('must be `inherit`');
  });

  it('accepts the canonical var(--font-body, inherit) form', () => {
    const css = ['.pill {', '  font-family: var(--font-body, inherit);', '}'].join('\n');
    expect(findOwnedDeclarations(css, fixture, false)).toHaveLength(0);
  });

  it('accepts a deliberate non-body font routed through a token', () => {
    const css = ['.field {', '  font-family: var(--font-mono, ui-monospace, monospace);', '}'].join('\n');
    expect(findOwnedDeclarations(css, fixture, false)).toHaveLength(0);
  });

  it('fails on a hardcoded font stack with no token', () => {
    const css = ['.field {', '  font-family: ui-monospace, Menlo, monospace;', '}'].join('\n');
    const results = findOwnedDeclarations(css, fixture, false);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('hardcoded font stack');
  });

  it('ignores declarations inside comments', () => {
    const css = ['/* font-family: inherit; */', '.base {', '  color: red;', '}'].join('\n');
    expect(findOwnedDeclarations(css, fixture, true)).toHaveLength(0);
  });

  it('flags search/number appearance resets only for native-control components', () => {
    const css = ['input[type="search"] {', '  appearance: none;', '}'].join('\n');
    expect(findOwnedDeclarations(css, fixture, true)).toHaveLength(1);
    expect(findOwnedDeclarations(css, fixture, false)).toHaveLength(0);
  });
});
