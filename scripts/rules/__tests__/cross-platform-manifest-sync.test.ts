import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import { crossPlatformManifestSync, syncManifests } from '../cross-platform-manifest-sync.js';

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

  it('skips the Flutter RichText, whose React namesake declares flutter_sibling: none (VI-813)', async () => {
    const results = await crossPlatformManifestSync.run();
    const richText = results.find((r) => r.file?.includes('visor_rich_text'));
    expect(richText?.pass).toBe(true);
    expect(richText?.message).toMatch(/flutter_sibling: none/);
  });
});

describe('cross-platform-manifest-sync flutter_sibling opt-out (VI-813)', () => {
  let root = '';
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function repo(reactExtra: string) {
    root = mkdtempSync(join(tmpdir(), 'xplat-sync-'));
    mkdirSync(join(root, 'components/ui/widget'), { recursive: true });
    mkdirSync(join(root, 'components/flutter/visor_widget'), { recursive: true });
    writeFileSync(join(root, 'components/flutter/visor_widget/visor_widget.visor.yaml'), 'name: Widget\ndescription: Flutter widget.\ncategory: general\n');
    writeFileSync(join(root, 'components/ui/widget/widget.visor.yaml'), `name: Widget\ndescription: React widget.\ncategory: typography\n${reactExtra}`);
    return root;
  }

  it('fails a same-name pair whose shared fields differ', async () => {
    const results = await syncManifests(repo(''));
    expect(results).toHaveLength(1);
    expect(results[0]!.pass).toBe(false);
    expect(results[0]!.message).toMatch(/description, category/);
  });

  it('passes the same pair when the React manifest says flutter_sibling: none', async () => {
    const results = await syncManifests(repo('flutter_sibling: none\n'));
    expect(results).toHaveLength(1);
    expect(results[0]!.pass).toBe(true);
    expect(results[0]!.message).toMatch(/flutter_sibling: none/);
  });

  it('only the value none opts out', async () => {
    const results = await syncManifests(repo('flutter_sibling: visor_widget\n'));
    expect(results[0]!.pass).toBe(false);
  });
});
