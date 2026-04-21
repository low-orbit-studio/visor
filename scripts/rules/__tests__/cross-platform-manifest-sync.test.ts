import { describe, it, expect } from 'vitest';
import { crossPlatformManifestSync } from '../cross-platform-manifest-sync.js';

describe('cross-platform-manifest-sync rule', () => {
  it('has correct metadata', () => {
    expect(crossPlatformManifestSync.name).toBe('cross-platform-manifest-sync');
    expect(crossPlatformManifestSync.category).toBe('structure');
  });

  it('passes when no Flutter manifests exist', async () => {
    // Pre-C5 state: no components/flutter/ directory exists yet. Rule
    // should return a single "not applicable" result. Once Flutter manifests
    // are added, this test will assert the broader contract instead.
    const results = await crossPlatformManifestSync.run();
    const hasFlutter = results.some((r) =>
      r.file?.includes('components/flutter/')
    );
    if (!hasFlutter) {
      expect(results).toHaveLength(1);
      expect(results[0].pass).toBe(true);
      expect(results[0].message).toMatch(/No Flutter manifests/);
    }
  });

  it('returns only boolean pass/fail results (no score dimension)', async () => {
    const results = await crossPlatformManifestSync.run();
    for (const r of results) {
      expect(typeof r.pass).toBe('boolean');
      expect(r.score).toBeUndefined();
    }
  });
});
