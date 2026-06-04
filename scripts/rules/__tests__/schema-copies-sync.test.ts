import { describe, it, expect } from 'vitest';
import {
  schemaCopiesSync,
  firstDifferingLine,
  DOCS_SCHEMA,
  ENGINE_SCHEMA,
} from '../schema-copies-sync.js';

describe('schema-copies-sync rule', () => {
  it('has correct metadata', () => {
    expect(schemaCopiesSync.name).toBe('schema-copies-sync');
    expect(schemaCopiesSync.category).toBe('structure');
    // Mandatory enforcement — drift between the copies must fail the build,
    // not warn (the whole point of VI-502 is to stop the silent bleeding).
    expect(schemaCopiesSync.warnOnly).toBeFalsy();
  });

  it('description names both copies', () => {
    expect(schemaCopiesSync.description).toMatch(/docs/);
    expect(schemaCopiesSync.description).toMatch(/theme-engine/);
  });

  describe('firstDifferingLine (red/green)', () => {
    it('returns null for identical strings (green)', () => {
      const s = '{\n  "a": 1,\n  "b": 2\n}\n';
      expect(firstDifferingLine(s, s)).toBeNull();
    });

    it('pinpoints the first differing line (red)', () => {
      const a = 'line1\nline2\nline3\n';
      const b = 'line1\nLINE-TWO\nline3\n';
      expect(firstDifferingLine(a, b)).toBe(2);
    });

    it('flags trailing-newline drift even when every line matches', () => {
      const a = 'line1\nline2';
      const b = 'line1\nline2\n';
      expect(firstDifferingLine(a, b)).not.toBeNull();
    });

    it('reports the first line for a leading difference', () => {
      expect(firstDifferingLine('x\ny', 'z\ny')).toBe(1);
    });
  });

  it('passes against the reconciled repo (both copies identical)', async () => {
    const results = await schemaCopiesSync.run();
    const failures = results.filter((r) => !r.pass);
    expect(
      failures,
      `Expected zero failures but got: ${failures.map((f) => f.message).join('\n')}`,
    ).toHaveLength(0);
    expect(results.every((r) => r.score === undefined)).toBe(true);
  });

  it('targets the documented schema paths', () => {
    expect(DOCS_SCHEMA).toBe('docs/visor-theme.schema.json');
    expect(ENGINE_SCHEMA).toBe('packages/theme-engine/src/visor-theme.schema.json');
  });
});
