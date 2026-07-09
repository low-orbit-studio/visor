import { describe, it, expect } from 'vitest';
import { visorYamlDesignRef } from '../visor-yaml-complete.js';

describe('visor-yaml-design-ref rule', () => {
  it('has correct metadata', () => {
    expect(visorYamlDesignRef.name).toBe('visor-yaml-design-ref');
    expect(visorYamlDesignRef.category).toBe('structure');
    expect(visorYamlDesignRef.warnOnly).toBe(true);
  });

  it('returns only boolean pass/fail results (no score dimension)', async () => {
    const results = await visorYamlDesignRef.run();
    for (const r of results) {
      expect(typeof r.pass).toBe('boolean');
      expect(r.score).toBeUndefined();
    }
  });

  it('is silent for components without a design_ref (conditional field, not advisory)', async () => {
    // Only components carrying design_ref should appear in the results — a
    // component with no approved design must never be flagged. If nothing in the
    // repo carries a design_ref yet, the rule returns exactly one pass.
    const results = await visorYamlDesignRef.run();
    if (results.length === 1 && results[0].file === undefined) {
      expect(results[0].pass).toBe(true);
      expect(results[0].message).toMatch(/No component .*design_ref/);
    } else {
      // Every emitted result corresponds to a file that actually carries the field.
      for (const r of results) {
        expect(r.file).toBeDefined();
      }
    }
  });

  it('passes doc-nav — its design_ref resolves to an existing reference image', async () => {
    // doc-nav is the retroactive-proof exemplar (BO-67): its design_ref points at
    // docs/audits/BO-67/doc-nav-approved.png, which is committed alongside.
    const results = await visorYamlDesignRef.run();
    const docNav = results.find((r) => r.file?.includes('doc-nav/doc-nav.visor.yaml'));
    expect(docNav).toBeDefined();
    expect(docNav?.pass).toBe(true);
    expect(docNav?.message).toMatch(/resolves to an existing file|URL/);
  });
});
