import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import { flutterCssTokenSync, syncFlutterCssTokens } from '../flutter-css-token-sync.js';

describe('flutter-css-token-sync rule', () => {
  it('has correct metadata', () => {
    expect(flutterCssTokenSync.name).toBe('flutter-css-token-sync');
    expect(flutterCssTokenSync.category).toBe('tokens');
    expect(flutterCssTokenSync.warnOnly).toBeFalsy();
  });

  it('passes against the current repo, private theme CSS present or not', async () => {
    const failures = (await flutterCssTokenSync.run()).filter((r) => !r.pass);
    expect(
      failures,
      `Expected zero failures but got: ${failures.map((f) => f.message).join('\n')}`
    ).toHaveLength(0);
  });
});

describe('flutter-css-token-sync gitignored generated themes (VI-815)', () => {
  let root = '';
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // The repo's own .gitignore shape: every theme CSS is ignored, stock themes are re-included.
  function repo(gitignore: string) {
    root = mkdtempSync(join(tmpdir(), 'flutter-css-sync-'));
    execFileSync('git', ['init', '-q'], { cwd: root });
    mkdirSync(join(root, 'packages/docs/app'), { recursive: true });
    writeFileSync(join(root, '.gitignore'), gitignore);
    writeFileSync(join(root, 'packages/docs/app/private-theme.css'), '');
    writeFileSync(join(root, 'packages/docs/app/stock-theme.css'), '');
    execFileSync('git', ['add', '.'], { cwd: root });
    return root;
  }

  it('skips a gitignored theme and still fails a tracked theme that has no Dart theme', async () => {
    const results = await syncFlutterCssTokens(
      repo('packages/docs/app/*-theme.css\n!packages/docs/app/stock-theme.css\n')
    );
    const bySlug = (slug: string) => results.find((r) => r.file?.endsWith(`${slug}-theme.css`));

    expect(results).toHaveLength(2);
    expect(bySlug('private')?.pass).toBe(true);
    expect(bySlug('private')?.message).toMatch(/gitignored generated theme/);
    expect(bySlug('stock')?.pass).toBe(false);
    expect(bySlug('stock')?.message).toMatch(/No Flutter Dart file for CSS theme "stock"/);
  });

  it('fails both themes when neither is gitignored', async () => {
    const results = await syncFlutterCssTokens(repo(''));
    expect(results.map((r) => r.pass)).toEqual([false, false]);
  });
});
