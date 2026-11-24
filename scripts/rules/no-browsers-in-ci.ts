import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rule, RuleResult } from './types.js';

// VI-847, VI-849: "no browsers in CI, ever" (Justin): neither Chromium nor WebKit.
// Covers installs, `playwright test`, playwright container images and any npm script that runs playwright.
const BROWSER = /chromium|webkit|firefox|desktop safari|playwright/i;

export interface SourceFile {
  file: string;
  text: string;
}

/** Pure check, so it can be tested without touching disk. `scripts` are npm scripts by name. */
export function findBrowsersInCi(workflows: SourceFile[], scripts: Record<string, string>): RuleResult[] {
  // Scripts that launch a browser: a workflow must not call them by name either.
  const runners = Object.entries(scripts)
    .filter(([, cmd]) => BROWSER.test(cmd))
    .map(([name]) => name);

  const failures: RuleResult[] = [];
  for (const wf of workflows) {
    wf.text.split('\n').forEach((line, i) => {
      const at = { file: wf.file, line: i + 1 };
      if (BROWSER.test(line)) {
        failures.push({ pass: false, message: 'Workflow installs or runs a browser', ...at });
        return;
      }
      const hit = runners.find((name) => line.includes(name));
      if (hit) failures.push({ pass: false, message: `Workflow runs ${hit}, which launches a browser`, ...at });
    });
  }
  return failures;
}

async function readWorkflows(dir: string): Promise<SourceFile[]> {
  const names = (await readdir(dir)).filter((n) => /\.ya?ml$/.test(n));
  return Promise.all(names.map(async (n) => ({ file: join(dir, n), text: await readFile(join(dir, n), 'utf-8') })));
}

export const noBrowsersInCi: Rule = {
  name: 'no-browsers-in-ci',
  description: 'No workflow installs or runs a browser (Chromium, WebKit, Firefox, Playwright)',
  category: 'structure',
  async run() {
    const workflows = await readWorkflows('.github/workflows');
    const scripts: Record<string, string> = {};
    for (const pkg of ['package.json', 'packages/docs/package.json']) {
      Object.assign(scripts, JSON.parse(await readFile(pkg, 'utf-8')).scripts ?? {});
    }
    const failures = findBrowsersInCi(workflows, scripts);
    return failures.length > 0
      ? failures
      : [{ pass: true, message: `${workflows.length} workflows checked, no browsers` }];
  },
};
