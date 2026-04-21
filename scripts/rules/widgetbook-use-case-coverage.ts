import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import type { Rule, RuleResult } from './types.js';

const WIDGET_DIR_PATTERN = 'components/flutter/visor_*/visor_*.dart';
const USE_CASE_DIR = 'packages/widgetbook/lib/use_cases';

export const widgetbookUseCaseCoverage: Rule = {
  name: 'widgetbook-use-case-coverage',
  description:
    'Every Flutter widget at components/flutter/visor_*/visor_*.dart has a matching use-case file at packages/widgetbook/lib/use_cases/ with at least one @UseCase annotation',
  category: 'structure',
  async run() {
    const results: RuleResult[] = [];

    for await (const widgetPath of glob(WIDGET_DIR_PATTERN)) {
      // Skip test files — only widget source files need use cases.
      if (widgetPath.endsWith('_test.dart')) continue;

      const widgetFilename = basename(widgetPath);
      const useCasePath = `${USE_CASE_DIR}/${widgetFilename}`;

      if (!existsSync(useCasePath)) {
        results.push({
          pass: false,
          message: `Widget ${widgetFilename} has no Widgetbook use case at ${useCasePath}. Add at least one @UseCase annotation.`,
          file: widgetPath,
        });
        continue;
      }

      const useCaseContent = await readFile(useCasePath, 'utf-8');
      if (!/@(widgetbook\.)?UseCase\s*\(/.test(useCaseContent)) {
        results.push({
          pass: false,
          message: `${useCasePath} exists but has no @UseCase annotations. Add at least one to cover a widget variant.`,
          file: useCasePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All Flutter widgets have Widgetbook use cases',
      });
    }

    return results;
  },
};
