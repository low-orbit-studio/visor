import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rule, RuleResult } from './types.js';

// Stock themes only — these are committed and must always be present in public/themes/.
// Custom/proprietary themes (entr, kaiah, veronica, solespark, blacklight-brand, reference-app)
// live in custom-themes/ (gitignored) and are copied to public/themes/ by `visor theme sync`.
// They are not checked here because they are absent on fresh clone.
const THEME_YAML_FILES: { label: string; yamlFile: string }[] = [
  { label: 'Blackout', yamlFile: 'blackout' },
  { label: 'Modern Minimal', yamlFile: 'modern-minimal' },
  { label: 'Neutral', yamlFile: 'neutral' },
  { label: 'Space', yamlFile: 'space' },
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
