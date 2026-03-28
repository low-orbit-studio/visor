import { readFile } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const SOURCE_CONFIG = 'packages/docs/source.config.ts';
const PREVIEW_FILES = [
  'packages/docs/components/preview.tsx',
  'packages/docs/components/block-preview.tsx',
];

function extractThemes(content: string): { light?: string; dark?: string } {
  const themes: { light?: string; dark?: string } = {};

  // Match theme assignments like: const theme = isDark ? 'github-dark' : 'github-light'
  const ternaryMatch = content.match(
    /isDark\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/
  );
  if (ternaryMatch) {
    themes.dark = ternaryMatch[1];
    themes.light = ternaryMatch[2];
  }

  return themes;
}

function extractSourceConfigThemes(
  content: string
): { light?: string; dark?: string } {
  const themes: { light?: string; dark?: string } = {};
  const lightMatch = content.match(/light:\s*['"]([^'"]+)['"]/);
  const darkMatch = content.match(/dark:\s*['"]([^'"]+)['"]/);
  if (lightMatch) themes.light = lightMatch[1];
  if (darkMatch) themes.dark = darkMatch[1];
  return themes;
}

export const shikiThemeConsistency: Rule = {
  name: 'shiki-theme-consistency',
  description: 'ComponentPreview/BlockPreview themes match source.config.ts',
  category: 'components',
  async run() {
    const results: RuleResult[] = [];

    let configContent: string;
    try {
      configContent = await readFile(SOURCE_CONFIG, 'utf-8');
    } catch {
      results.push({
        pass: false,
        message: `Cannot read ${SOURCE_CONFIG}`,
        file: SOURCE_CONFIG,
      });
      return results;
    }

    const configThemes = extractSourceConfigThemes(configContent);
    if (!configThemes.light && !configThemes.dark) {
      results.push({
        pass: false,
        message: 'No themes found in source.config.ts',
        file: SOURCE_CONFIG,
      });
      return results;
    }

    for (const file of PREVIEW_FILES) {
      let content: string;
      try {
        content = await readFile(file, 'utf-8');
      } catch {
        // File doesn't exist — skip
        continue;
      }

      const previewThemes = extractThemes(content);

      if (previewThemes.light && previewThemes.light !== configThemes.light) {
        results.push({
          pass: false,
          message: `Light theme '${previewThemes.light}' doesn't match source.config.ts '${configThemes.light}'`,
          file,
        });
      }

      if (previewThemes.dark && previewThemes.dark !== configThemes.dark) {
        results.push({
          pass: false,
          message: `Dark theme '${previewThemes.dark}' doesn't match source.config.ts '${configThemes.dark}'`,
          file,
        });
      }

      if (
        previewThemes.light === configThemes.light &&
        previewThemes.dark === configThemes.dark
      ) {
        results.push({
          pass: true,
          message: `Themes match source.config.ts`,
          file,
        });
      }
    }

    if (results.length === 0) {
      results.push({ pass: true, message: 'No preview files found to check' });
    }

    return results;
  },
};
