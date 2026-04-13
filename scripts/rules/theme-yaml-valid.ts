import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseConfig } from '../../packages/theme-engine/src/pipeline.js';
import type { Rule, RuleResult } from './types.js';

// Stock themes only — these are committed and must always be present in public/themes/.
// Custom/proprietary themes (entr, kaiah, veronica, solespark, blacklight-brand, reference-app)
// live in custom-themes/ (gitignored) and are copied to public/themes/ by `visor theme sync`.
// They are not validated here because they are absent on fresh clone.
const THEME_YAML_FILES: { label: string; yamlFile: string }[] = [
  { label: 'Blackout', yamlFile: 'blackout' },
  { label: 'Modern Minimal', yamlFile: 'modern-minimal' },
  { label: 'Neutral', yamlFile: 'neutral' },
  { label: 'Space', yamlFile: 'space' },
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
