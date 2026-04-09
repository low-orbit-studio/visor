import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rule, RuleResult } from './types.js';

// Inline the theme registry so this rule doesn't depend on the docs package at runtime
const THEME_YAML_FILES: { label: string; yamlFile: string }[] = [
  { label: 'Blackout', yamlFile: 'blackout' },
  { label: 'Neutral', yamlFile: 'neutral' },
  { label: 'Space', yamlFile: 'space' },
  { label: 'ENTR', yamlFile: 'entr' },
  { label: 'Kaiah', yamlFile: 'kaiah' },
  { label: 'Veronica', yamlFile: 'veronica' },
  { label: 'Blacklight Brand', yamlFile: 'blacklight' },
  { label: 'Reference App', yamlFile: 'reference-app' },
];

export const themeYamlExists: Rule = {
  name: 'theme-yaml-exists',
  description: 'Every theme with a yamlFile entry has a matching .visor.yaml in public/themes/',
  category: 'themes',
  async run() {
    const results: RuleResult[] = [];

    for (const theme of THEME_YAML_FILES) {
      const filePath = join('packages/docs/public/themes', `${theme.yamlFile}.visor.yaml`);
      try {
        await access(filePath);
        results.push({ pass: true, message: `${theme.label} config exists`, file: filePath });
      } catch {
        results.push({
          pass: false,
          message: `${theme.label} is missing its Theme Creator config — create packages/docs/public/themes/${theme.yamlFile}.visor.yaml`,
          file: filePath,
        });
      }
    }

    return results;
  },
};
