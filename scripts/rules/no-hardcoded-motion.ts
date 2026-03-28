import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const BARE_EASING = /\b(linear|ease|ease-in|ease-out|ease-in-out)\b/;
const BARE_CUBIC = /cubic-bezier\(/;
const INSIDE_VAR = /var\([^)]*$/;

function hasBareMotionValue(line: string): { type: string; value: string } | null {
  // Only check lines with transition or animation properties
  if (!/(?:transition|animation)\s*:/.test(line)) return null;

  // Skip comments
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return null;

  // Split line into segments outside of var() expressions to check for bare values
  // Strategy: remove all var(...) blocks, then check what remains
  const withoutVars = line.replace(/var\([^)]*\)/g, '');

  // Check for bare easing keywords
  const easingMatch = withoutVars.match(BARE_EASING);
  if (easingMatch) {
    return { type: 'easing', value: easingMatch[0] };
  }

  // Check for bare cubic-bezier
  if (BARE_CUBIC.test(withoutVars)) {
    return { type: 'easing', value: 'cubic-bezier(...)' };
  }

  // Check for bare duration values (e.g., 150ms, 0.2s) outside var()
  const durationMatch = withoutVars.match(/\b(\d+(?:\.\d+)?)(ms|s)\b/);
  if (durationMatch) {
    return { type: 'duration', value: `${durationMatch[1]}${durationMatch[2]}` };
  }

  return null;
}

export const noHardcodedMotion: Rule = {
  name: 'no-hardcoded-motion',
  description: 'Transitions/animations must use var(--motion-*) tokens, not bare values',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.module.css')) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const violation = hasBareMotionValue(lines[i]);
        if (violation) {
          const token = violation.type === 'easing'
            ? 'var(--motion-easing-*)'
            : 'var(--motion-duration-*)';
          results.push({
            pass: false,
            message: `Bare ${violation.type} "${violation.value}" — use ${token} token`,
            file: filePath,
            line: i + 1,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No hardcoded motion values found',
      });
    }

    return results;
  },
};
