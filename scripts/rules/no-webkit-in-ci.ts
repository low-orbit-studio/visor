import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Rule, RuleResult } from './types.js';

// VI-847: "NO WEBKIT IN CI EVER" (Justin). WebKit installs cost minutes nobody approved.
const WEBKIT = /webkit|desktop safari/i;

export interface SourceFile {
  file: string;
  text: string;
}

/**
 * Pure check, so it can be tested without touching disk.
 * - workflows: any line naming webkit, or `playwright install` without `chromium`, fails.
 * - playwrightConfigs: the default `playwright.config.*` (CI's `test:vr` runs it) must not
 *   use webkit; any other webkit config fails only if a workflow names it or an npm script
 *   that runs it.
 */
export function findWebkitInCi(
  workflows: SourceFile[],
  playwrightConfigs: SourceFile[],
  scripts: Record<string, string>,
): RuleResult[] {
  const failures: RuleResult[] = [];
  const webkitConfigs = playwrightConfigs.filter((c) => WEBKIT.test(c.text));

  for (const c of webkitConfigs) {
    if (/^playwright\.config\./.test(basename(c.file))) {
      failures.push({ pass: false, message: 'Default Playwright config uses webkit, and CI runs it', file: c.file });
    }
  }

  // Names a workflow must not mention: each webkit config's stem and the scripts that run it.
  const banned = webkitConfigs.flatMap((c) => {
    const stem = basename(c.file).replace(/\.[cm]?[jt]s$/, '');
    const runners = Object.entries(scripts)
      .filter(([, cmd]) => cmd.includes(stem))
      .map(([name]) => name);
    return [stem, ...runners];
  });

  for (const wf of workflows) {
    wf.text.split('\n').forEach((line, i) => {
      const at = { file: wf.file, line: i + 1 };
      if (WEBKIT.test(line)) {
        failures.push({ pass: false, message: 'Workflow mentions webkit', ...at });
      } else if (/playwright install/.test(line) && !/chromium/.test(line)) {
        failures.push({ pass: false, message: '`playwright install` without `chromium` installs webkit too', ...at });
      } else {
        const hit = banned.find((name) => line.includes(name));
        if (hit) failures.push({ pass: false, message: `Workflow runs ${hit}, which uses webkit`, ...at });
      }
    });
  }
  return failures;
}

async function readDir(dir: string, match: RegExp): Promise<SourceFile[]> {
  const names = (await readdir(dir)).filter((n) => match.test(n));
  return Promise.all(names.map(async (n) => ({ file: join(dir, n), text: await readFile(join(dir, n), 'utf-8') })));
}

export const noWebkitInCi: Rule = {
  name: 'no-webkit-in-ci',
  description: 'No workflow installs or runs WebKit',
  category: 'structure',
  async run() {
    const workflows = await readDir('.github/workflows', /\.ya?ml$/);
    const configs = await readDir('packages/docs', /^playwright\..*config\.[cm]?[jt]s$/);
    const pkg = JSON.parse(await readFile('packages/docs/package.json', 'utf-8'));
    const failures = findWebkitInCi(workflows, configs, pkg.scripts ?? {});
    return failures.length > 0
      ? failures
      : [{ pass: true, message: `${workflows.length} workflows checked, no webkit` }];
  },
};
