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
});
