import { describe, it, expect } from 'vitest';
import { noTemplateLiteralCodeProps } from '../rules/no-template-literal-code-props.js';
import { shikiThemeConsistency } from '../rules/shiki-theme-consistency.js';
import { shikiDualThemeMode } from '../rules/shiki-dual-theme-mode.js';
import { sourceConfigSpreadOrder } from '../rules/source-config-spread-order.js';
import { cssModuleTypesSync } from '../rules/css-module-types-sync.js';
import { tokenFallbackGray } from '../rules/token-fallback-gray.js';
import { noInlineShadows } from '../rules/no-inline-shadows.js';
import { spacingGrid } from '../rules/spacing-grid.js';

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
  ];

  it('all rules have required properties', () => {
    for (const rule of allRules) {
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(['docs', 'components', 'tokens']).toContain(rule.category);
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
