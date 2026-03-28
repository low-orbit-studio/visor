import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

const REQUIRED_SECTIONS = [
  { marker: 'Section 1', label: 'Shared tokens (mode-independent)' },
  { marker: 'Section 2', label: 'Dark mode overrides' },
  { marker: 'Section 3', label: 'Light mode overrides' },
];

const OPTIONAL_SECTIONS = [
  { marker: 'Section 4', label: 'Framework bridge' },
  { marker: 'Section 5', label: 'Creative extensions' },
];

export const themeStructure: Rule = {
  name: 'theme-structure',
  description: 'Theme CSS files follow the 5-section template structure',
  category: 'tokens',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('packages/docs/app/*-theme.css')) {
      const content = await readFile(filePath, 'utf-8');

      // Check required sections
      for (const section of REQUIRED_SECTIONS) {
        if (!content.includes(section.marker)) {
          results.push({
            pass: false,
            message: `Missing required "${section.marker}: ${section.label}" marker`,
            file: filePath,
          });
        }
      }

      // Check that sections appear in order
      const allSections = [...REQUIRED_SECTIONS, ...OPTIONAL_SECTIONS];
      let lastIndex = -1;
      for (const section of allSections) {
        const idx = content.indexOf(section.marker);
        if (idx !== -1) {
          if (idx < lastIndex) {
            results.push({
              pass: false,
              message: `"${section.marker}" appears out of order — sections must be sequential`,
              file: filePath,
            });
          }
          lastIndex = idx;
        }
      }

      // If no failures for this file, mark as passing
      const fileFailures = results.filter((r) => !r.pass && r.file === filePath);
      if (fileFailures.length === 0) {
        results.push({
          pass: true,
          message: 'Theme follows 5-section template',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No theme CSS files found to check',
      });
    }

    return results;
  },
};
