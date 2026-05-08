import { describe, it, expect } from 'vitest';
import { docsProxyExists } from '../docs-proxy-exists.js';

describe('docs-proxy-exists rule', () => {
  it('has correct metadata', () => {
    expect(docsProxyExists.name).toBe('docs-proxy-exists');
    expect(docsProxyExists.category).toBe('docs');
    // Mandatory enforcement, not warn-only — missing proxies broke CI in
    // the 2026-05-07 wave (VI-327, VI-328) and need to fail the build.
    expect(docsProxyExists.warnOnly).toBeFalsy();
  });

  it('description mentions both flat and subdirectory proxy variants', () => {
    expect(docsProxyExists.description).toMatch(/flat/);
    expect(docsProxyExists.description).toMatch(/subdirectory/);
  });

  it('returns at least one result and only boolean pass/fail (no score)', async () => {
    const results = await docsProxyExists.run();
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.pass).toBe('boolean');
      expect(r.score).toBeUndefined();
    }
  });

  it('passes against the current repo (existing components are conformant)', async () => {
    const results = await docsProxyExists.run();
    const failures = results.filter((r) => !r.pass);
    expect(
      failures,
      `Expected zero failures but got: ${failures.map((f) => f.message).join('\n')}`
    ).toHaveLength(0);
  });

  it('passing results are anchored to source files under components/ui/', async () => {
    const results = await docsProxyExists.run();
    const passing = results.filter((r) => r.pass && r.file);
    expect(passing.length).toBeGreaterThan(0);
    for (const r of passing) {
      expect(r.file).toMatch(/^components\/ui\/[^/]+\/[^/]+\.tsx$/);
    }
  });

  it('reports proxy variant (flat or subdirectory) in success messages', async () => {
    const results = await docsProxyExists.run();
    const passing = results.filter((r) => r.pass && r.file);
    for (const r of passing) {
      expect(r.message).toMatch(/Has docs proxy \((flat|subdirectory)\)/);
    }
  });

  it('canonical example proxy (station-spectrum) is detected', async () => {
    const results = await docsProxyExists.run();
    const stationSpectrum = results.find((r) =>
      r.file?.includes('station-spectrum')
    );
    expect(stationSpectrum).toBeDefined();
    expect(stationSpectrum?.pass).toBe(true);
  });
});
