import { describe, it, expect } from 'vitest';
import {
  patternOverlapDetection,
  detectPatternOverlaps,
  jaccard,
  JACCARD_THRESHOLD,
  type PatternEntry,
} from '../pattern-overlap-detection.js';

describe('pattern-overlap-detection rule', () => {
  it('has correct metadata', () => {
    expect(patternOverlapDetection.name).toBe('pattern-overlap-detection');
    expect(patternOverlapDetection.category).toBe('structure');
    // warnOnly so it gates validate:strict (CI) without breaking plain `npm run validate`
    expect(patternOverlapDetection.warnOnly).toBe(true);
  });

  describe('jaccard()', () => {
    it('returns 1 for identical sets', () => {
      expect(jaccard(new Set(['a', 'b', 'c']), new Set(['a', 'b', 'c']))).toBe(1);
    });
    it('returns 0 for disjoint sets', () => {
      expect(jaccard(new Set(['a', 'b']), new Set(['c', 'd']))).toBe(0);
    });
    it('returns 0 for two empty sets', () => {
      expect(jaccard(new Set(), new Set())).toBe(0);
    });
    it('computes partial overlap', () => {
      // {a,b,c} ∩ {a,b} = 2 ; ∪ = 3 ; 2/3
      expect(jaccard(new Set(['a', 'b', 'c']), new Set(['a', 'b']))).toBeCloseTo(2 / 3, 5);
    });
  });

  describe('detectPatternOverlaps()', () => {
    it('flags a high-similarity pair with no mutual when_not_to_use', () => {
      const patterns: PatternEntry[] = [
        { slug: 'alpha', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['Some unrelated note'] },
        { slug: 'beta', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['Another unrelated note'] },
      ];
      const results = detectPatternOverlaps(patterns);
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(1);
      expect(failures[0].message).toContain('alpha');
      expect(failures[0].message).toContain('beta');
      expect(failures[0].message.toLowerCase()).toContain('when_not_to_use');
    });

    it('passes a high-similarity pair that mutually disambiguates via when_not_to_use', () => {
      const patterns: PatternEntry[] = [
        { slug: 'alpha', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['For the X case, use beta'] },
        { slug: 'beta', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['For the Y case, use alpha'] },
      ];
      const results = detectPatternOverlaps(patterns);
      expect(results.every((r) => r.pass)).toBe(true);
    });

    it('flags when only ONE side names the other (mutual reference required)', () => {
      const patterns: PatternEntry[] = [
        { slug: 'alpha', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['For the X case, use beta'] },
        { slug: 'beta', componentsUsed: ['a', 'b', 'c', 'd'], whenNotToUse: ['No reference here'] },
      ];
      const results = detectPatternOverlaps(patterns);
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(1);
      expect(failures[0].message).toContain("beta's when_not_to_use must name alpha");
    });

    it('does not flag pairs below the Jaccard threshold', () => {
      const patterns: PatternEntry[] = [
        { slug: 'alpha', componentsUsed: ['a', 'b'], whenNotToUse: [] },
        { slug: 'beta', componentsUsed: ['c', 'd'], whenNotToUse: [] },
      ];
      const results = detectPatternOverlaps(patterns);
      expect(results.every((r) => r.pass)).toBe(true);
    });

    it('sanity: re-introducing a wizard-flow-like duplicate trips the rule', () => {
      // wizard-flow vs onboarding-flow shared the stepper+field+input+button+alert
      // archetype. Re-adding such a near-clone with no mutual when_not_to_use must fail.
      // (Documented here as a regression guard — NOT committed to patterns/.)
      const patterns: PatternEntry[] = [
        {
          slug: 'onboarding-flow',
          componentsUsed: ['stepper', 'progress', 'card', 'button', 'field', 'input', 'checkbox', 'alert'],
          whenNotToUse: ['Login or signup itself — use auth-flow'],
        },
        {
          slug: 'wizard-flow',
          componentsUsed: ['stepper', 'progress', 'field', 'input', 'button', 'alert', 'card', 'checkbox'],
          whenNotToUse: ['Some note that does not name onboarding-flow'],
        },
      ];
      const results = detectPatternOverlaps(patterns);
      expect(results.some((r) => !r.pass)).toBe(true);
    });
  });

  it('the current repo pattern set has no undisambiguated overlaps', async () => {
    const results = await patternOverlapDetection.run();
    const failures = results.filter((r) => !r.pass);
    expect(failures).toEqual([]);
  });

  it('THRESHOLD is the documented 0.6', () => {
    expect(JACCARD_THRESHOLD).toBe(0.6);
  });
});
