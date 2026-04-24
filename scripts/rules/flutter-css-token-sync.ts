import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const TOKENS: Array<{ cssVar: string; dartField: string }> = [
  { cssVar: '--surface-page', dartField: 'surfacePage' },
  { cssVar: '--surface-card', dartField: 'surfaceCard' },
  { cssVar: '--interactive-primary-bg', dartField: 'interactivePrimaryBg' },
  { cssVar: '--interactive-primary-text', dartField: 'interactivePrimaryText' },
];

/** Normalize any CSS color to an 8-char lowercase hex string like "ff020214". */
function normalizeCssColor(css: string): string | null {
  const trimmed = css.trim();

  const hexM = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(trimmed);
  if (hexM) {
    let h = hexM[1].toLowerCase();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return `ff${h}`;
  }

  const rgbaM = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/.exec(trimmed);
  if (rgbaM) {
    const r = parseInt(rgbaM[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbaM[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbaM[3], 10).toString(16).padStart(2, '0');
    const a = rgbaM[4] !== undefined
      ? Math.round(parseFloat(rgbaM[4]) * 255).toString(16).padStart(2, '0')
      : 'ff';
    return `${a}${r}${g}${b}`;
  }

  return null;
}

/** Extract a Dart Color(0xAARRGGBB) to normalized 8-char lowercase hex. */
function normalizeDartColor(dart: string): string | null {
  const m = /Color\(0x([0-9A-Fa-f]{8})\)/.exec(dart);
  if (!m) return null;
  return m[1].toLowerCase();
}

function extractCssDarkTokens(css: string, cssVars: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const blockRe = /\.dark\s+\.[a-z0-9-]+-theme\s*\{([^}]+)\}/gs;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(css)) !== null) {
    const block = m[1];
    for (const cssVar of cssVars) {
      if (cssVar in result) continue;
      const varRe = new RegExp(`${cssVar}:\\s*([^;\\n]+)`);
      const vm = varRe.exec(block);
      if (vm) {
        result[cssVar] = vm[1].trim();
      }
    }
    if (Object.keys(result).length === cssVars.length) break;
  }
  return result;
}

function extractDartDarkTokens(dart: string, dartFields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const darkM = /static final VisorColorsData dark = VisorColorsData\(([\s\S]+?)\s{2}\);/.exec(dart);
  if (!darkM) return result;
  const block = darkM[1];
  for (const field of dartFields) {
    const re = new RegExp(`\\b${field}:\\s*(Color\\(0x[0-9A-Fa-f]+\\))`);
    const fm = re.exec(block);
    if (fm) result[field] = fm[1];
  }
  return result;
}

export const flutterCssTokenSync: Rule = {
  name: 'flutter-css-token-sync',
  description:
    'Dark-mode Flutter token values in visor_themes must match the authoritative CSS theme values for surface-page, surface-card, interactive-primary-bg, and interactive-primary-text',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];
    const cssVars = TOKENS.map((t) => t.cssVar);
    const dartFields = TOKENS.map((t) => t.dartField);

    for await (const cssPath of glob('packages/docs/app/*-theme.css')) {
      const filename = cssPath.split('/').pop() ?? '';
      const slug = filename.replace(/-theme\.css$/, '');
      const dartPath = join(
        'packages/visor_themes/lib/src',
        slug,
        'colors/visor_colors.dart'
      );

      if (!existsSync(dartPath)) {
        results.push({
          pass: false,
          message: `No Flutter Dart file for CSS theme "${slug}" — expected ${dartPath}`,
          file: cssPath,
        });
        continue;
      }

      const [cssContent, dartContent] = await Promise.all([
        readFile(cssPath, 'utf-8'),
        readFile(dartPath, 'utf-8'),
      ]);

      const cssTokens = extractCssDarkTokens(cssContent, cssVars);
      const dartTokens = extractDartDarkTokens(dartContent, dartFields);

      let themePass = true;
      for (const { cssVar, dartField } of TOKENS) {
        const cssRaw = cssTokens[cssVar];
        const dartRaw = dartTokens[dartField];

        if (!cssRaw) continue;

        if (!dartRaw) {
          results.push({
            pass: false,
            message: `${slug}: dark ${dartField} missing in Dart (CSS has ${cssRaw})`,
            file: dartPath,
          });
          themePass = false;
          continue;
        }

        const cssNorm = normalizeCssColor(cssRaw);
        const dartNorm = normalizeDartColor(dartRaw);

        if (cssNorm === null) continue;

        if (cssNorm !== dartNorm) {
          results.push({
            pass: false,
            message: `${slug}: dark ${dartField} mismatch — CSS ${cssVar}: ${cssRaw} (${cssNorm}) != Dart ${dartRaw} (${dartNorm ?? 'unparseable'})`,
            file: dartPath,
          });
          themePass = false;
        }
      }

      if (themePass) {
        results.push({
          pass: true,
          message: `${slug}: dark-mode token values match CSS`,
          file: dartPath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No CSS theme files found — flutter-css-token-sync not applicable',
      });
    }

    return results;
  },
};
