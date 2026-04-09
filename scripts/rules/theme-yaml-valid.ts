import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseConfig } from '@loworbitstudio/visor-theme-engine';
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

export const themeYamlValid: Rule = {
  name: 'theme-yaml-valid',
  description: 'Every .visor.yaml in public/themes/ passes parseConfig() validation (schema in sync with pipeline)',
  category: 'themes' as 'structure',
  async run() {
    const results: RuleResult[] = [];

    for (const theme of THEME_YAML_FILES) {
      const filePath = join('packages/docs/public/themes', `${theme.yamlFile}.visor.yaml`);
      try {
        const yaml = await readFile(filePath, 'utf-8');
        parseConfig(yaml);
        results.push({ pass: true, message: `${theme.label} YAML is valid`, file: filePath });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          pass: false,
          message: `${theme.label} YAML failed validation: ${message}`,
          file: filePath,
        });
      }
    }

    return results;
  },
};
