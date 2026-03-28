import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

// Matches hex colors: #rgb, #rrggbb, #rrggbbaa
const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/;

// Matches rgb(), rgba(), hsl(), hsla() function calls
const COLOR_FN_PATTERN = /(?:rgba?|hsla?)\s*\(/;

function isInsideVarFallback(line: string, matchIndex: number): boolean {
  const before = line.substring(0, matchIndex);
  let depth = 0;

  for (let i = before.length - 1; i >= 0; i--) {
    const ch = before[i];
    if (ch === ')') depth++;
    if (ch === '(') {
      depth--;
      if (depth < 0) {
        const preceding = before.substring(Math.max(0, i - 3), i);
        if (preceding === 'var') {
          const between = before.substring(i + 1);
          return between.includes(',');
        }
        return false;
      }
    }
  }
  return false;
}

function isInsideColorMix(line: string, matchIndex: number): boolean {
  const before = line.substring(0, matchIndex);
  return /color-mix\s*\([^)]*$/.test(before);
}

function isInsideAttributeSelector(line: string, matchIndex: number): boolean {
  const before = line.substring(0, matchIndex);
  const lastOpen = before.lastIndexOf('[');
  const lastClose = before.lastIndexOf(']');
  return lastOpen > lastClose;
}

function isSelectorLine(line: string): boolean {
  const trimmed = line.trimStart();
  // Lines that end with { or are selectors (contain : only in pseudo-selectors or attr selectors)
  if (trimmed.endsWith('{') || trimmed.endsWith(',')) return true;
  // Lines with :global( are selector contexts
  if (trimmed.includes(':global(')) return true;
  return false;
}

export const noHardcodedColors: Rule = {
  name: 'no-hardcoded-colors',
  description: 'Component CSS must not use hardcoded colors outside var() fallbacks',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.module.css')) {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      let inKeyframes = false;
      let inMultiLineVar = false;
      let varParenDepth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();

        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

        // Track @keyframes blocks — colors in keyframes are allowed
        if (/@keyframes\b/.test(line)) inKeyframes = true;
        if (inKeyframes) {
          if (/^}\s*$/.test(trimmed)) {
            inKeyframes = false;
          }
          continue;
        }

        // Track multi-line var() fallbacks by counting unmatched parens
        if (inMultiLineVar) {
          for (const ch of line) {
            if (ch === '(') varParenDepth++;
            if (ch === ')') varParenDepth--;
          }
          if (varParenDepth <= 0) {
            inMultiLineVar = false;
            varParenDepth = 0;
          }
          continue;
        }

        // Detect start of multi-line var() — has var( but parens don't balance
        if (line.includes('var(')) {
          let depth = 0;
          for (const ch of line) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
          }
          if (depth > 0) {
            inMultiLineVar = true;
            varParenDepth = depth;
            continue;
          }
        }

        // Skip lines that are pure CSS custom property definitions
        if (/^\s*--[\w-]+\s*:/.test(line)) continue;

        // Skip selector lines (hex in attribute selectors like [stroke='#fff'])
        if (isSelectorLine(line)) continue;

        // Check for hex colors
        const hexRegex = new RegExp(HEX_PATTERN.source, 'gi');
        let m: RegExpMatchArray | null;
        while ((m = hexRegex.exec(line)) !== null) {
          if (
            !isInsideVarFallback(line, m.index) &&
            !isInsideColorMix(line, m.index) &&
            !isInsideAttributeSelector(line, m.index)
          ) {
            results.push({
              pass: false,
              message: `Hardcoded color ${m[0]} — use a CSS custom property with var()`,
              file: filePath,
              line: i + 1,
            });
          }
        }

        // Check for rgb/rgba/hsl/hsla function calls
        const fnRegex = new RegExp(COLOR_FN_PATTERN.source, 'gi');
        while ((m = fnRegex.exec(line)) !== null) {
          if (
            !isInsideVarFallback(line, m.index) &&
            !isInsideColorMix(line, m.index) &&
            !isInsideAttributeSelector(line, m.index)
          ) {
            results.push({
              pass: false,
              message: `Hardcoded color function ${m[0].trim()} — use a CSS custom property with var()`,
              file: filePath,
              line: i + 1,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No hardcoded colors found in component CSS',
      });
    }

    return results;
  },
};
