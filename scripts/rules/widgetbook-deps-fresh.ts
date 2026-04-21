import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Rule, RuleResult } from './types.js';

const PUBSPEC_PATH = 'packages/widgetbook/pubspec.yaml';
const OVERRIDES_PATH = 'packages/widgetbook/pubspec_overrides.yaml';

export const widgetbookDepsFresh: Rule = {
  name: 'widgetbook-deps-fresh',
  description:
    'Widgetbook pubspec_overrides.yaml pins visor_core to the local path (../visor-flutter); prevents accidental drift when adding deps.',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];

    if (!existsSync(PUBSPEC_PATH)) {
      // Widgetbook not present — rule is a no-op.
      return [
        {
          pass: true,
          message: 'packages/widgetbook/ not present — rule skipped',
        },
      ];
    }

    if (!existsSync(OVERRIDES_PATH)) {
      results.push({
        pass: false,
        message: `${OVERRIDES_PATH} is missing. Widgetbook needs visor_core pinned to the local path until visor_core is published to pub.dev.`,
        file: OVERRIDES_PATH,
      });
      return results;
    }

    const overrides = await readFile(OVERRIDES_PATH, 'utf-8');

    if (!/visor_core\s*:\s*\n\s*path\s*:\s*\.\.\/visor-flutter/.test(overrides)) {
      results.push({
        pass: false,
        message: `${OVERRIDES_PATH} must pin visor_core to path: ../visor-flutter. Current content:\n${overrides}`,
        file: OVERRIDES_PATH,
      });
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'Widgetbook pubspec overrides are correctly pinned',
      });
    }

    return results;
  },
};
