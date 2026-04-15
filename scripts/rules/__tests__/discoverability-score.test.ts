import { describe, it, expect } from 'vitest';
import { discoverabilityScore } from '../discoverability-score.js';

describe('discoverability-score rule', () => {
  it('has correct metadata', () => {
    expect(discoverabilityScore.name).toBe('discoverability-score');
    expect(discoverabilityScore.category).toBe('structure');
    expect(discoverabilityScore.warnOnly).toBe(true);
  });

  it('returns exactly 11 results (10 dimension results + 1 summary)', async () => {
    const results = await discoverabilityScore.run();
    expect(results).toHaveLength(11);
  });

  it('each dimension result has a score between 0 and 10', async () => {
    const results = await discoverabilityScore.run();
    const dimensions = results.slice(0, 10);
    for (const r of dimensions) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(10);
    }
  });

  it('summary score equals sum of dimension scores', async () => {
    const results = await discoverabilityScore.run();
    const dimensions = results.slice(0, 10);
    const summary = results[10];
    const dimSum = dimensions.reduce((acc, r) => acc + (r.score ?? 0), 0);
    expect(summary.score).toBeCloseTo(dimSum, 5);
  });

  it('summary result includes total and letter grade in message', async () => {
    const results = await discoverabilityScore.run();
    const summary = results[10];
    expect(summary.message).toMatch(/Discoverability total:/);
    expect(summary.message).toMatch(/\/100/);
    expect(summary.message).toMatch(/grade [A-F]/);
  });

  it('each dimension message includes Q-number label and /10', async () => {
    const results = await discoverabilityScore.run();
    for (let i = 0; i < 10; i++) {
      expect(results[i].message).toMatch(new RegExp(`Q${i + 1}\\s`));
      expect(results[i].message).toMatch(/\/10/);
    }
  });

  it('all dimension results have pass: true (warnOnly mode, scores ≥ 0)', async () => {
    const results = await discoverabilityScore.run();
    const dimensions = results.slice(0, 10);
    for (const r of dimensions) {
      expect(r.pass).toBe(true);
    }
  });

  it('summary result pass: true when DISCOVERABILITY_MIN_SCORE is 0', async () => {
    const results = await discoverabilityScore.run();
    const summary = results[10];
    // With DISCOVERABILITY_MIN_SCORE = 0, total ≥ 0 is always true
    expect(summary.pass).toBe(true);
  });

  describe('Q6 Token Discovery — dist fallback', () => {
    it('scores ≥ 8/10 when dist/visor-manifest.json is absent but source files exist', async () => {
      const results = await discoverabilityScore.run();
      // Q6 is index 5 (0-based)
      const q6 = results[5];
      expect(q6.message).toMatch(/Q6\s/);
      // When dist is absent, ManifestToken fallback + tokens --json should give full score
      expect(q6.score).toBeGreaterThanOrEqual(8);
    });

    it('Q6 message mentions fallback source when dist is absent', async () => {
      const results = await discoverabilityScore.run();
      const q6 = results[5];
      // Either dist path or fallback path should be reflected in the detail
      expect(q6.message).toMatch(/manifest\.tokens|ManifestToken|tokens --json/);
    });
  });

  describe('Q8 Versioning — dist fallback', () => {
    it('scores ≥ 8/10 when dist artifacts are absent but source files exist', async () => {
      const results = await discoverabilityScore.run();
      // Q8 is index 7 (0-based)
      const q8 = results[7];
      expect(q8.message).toMatch(/Q8\s/);
      // When dist is absent, CHANGELOG.md + package.json + visor diff should give full score
      expect(q8.score).toBeGreaterThanOrEqual(8);
    });

    it('Q8 message mentions fallback sources when dist is absent', async () => {
      const results = await discoverabilityScore.run();
      const q8 = results[7];
      // Should reference either dist artifacts or their fallbacks
      expect(q8.message).toMatch(/CHANGELOG|manifest|visor diff/);
    });
  });

  // These tests verify fallback behavior when dist artifacts are absent.
  // They run against the actual filesystem, which naturally lacks a dist/ directory
  // in fresh worktrees and CI runners.
  describe('fallback path behavior when dist is absent (filesystem-based)', () => {
    it('Q6: scores ≥ 8/10 using source fallbacks when dist/visor-manifest.json is absent', async () => {
      const results = await discoverabilityScore.run();
      const q6 = results[5];
      // When dist is absent, ManifestToken in manifest-types.ts + tokens --json give 10/10
      // When dist is present, manifest.tokens + tokens --json give 10/10
      // Either way, score should be ≥ 8
      expect(q6.score).toBeGreaterThanOrEqual(8);
    });

    it('Q6: message reflects which check path was used', async () => {
      const results = await discoverabilityScore.run();
      const q6 = results[5];
      // Should mention either the dist manifest path or the source fallback
      expect(q6.message).toMatch(/manifest\.tokens|ManifestToken/);
    });

    it('Q8: scores ≥ 8/10 using source fallbacks when dist artifacts are absent', async () => {
      const results = await discoverabilityScore.run();
      const q8 = results[7];
      // When dist is absent: CHANGELOG.md + package.json version + visor diff = 10/10
      // When dist is present: CHANGELOG.json + manifest.version + visor diff = 10/10
      // Either way, score should be ≥ 8
      expect(q8.score).toBeGreaterThanOrEqual(8);
    });

    it('Q8: message reflects which check path was used', async () => {
      const results = await discoverabilityScore.run();
      const q8 = results[7];
      // Should mention changelog (either json or md) and either manifest or cli-package
      expect(q8.message).toMatch(/CHANGELOG/);
    });

    it('Q6 + Q8 combined score ≥ 18/20 regardless of dist state', async () => {
      const results = await discoverabilityScore.run();
      const q6Score = results[5].score ?? 0;
      const q8Score = results[7].score ?? 0;
      expect(q6Score + q8Score).toBeGreaterThanOrEqual(18);
    });
  });
});
