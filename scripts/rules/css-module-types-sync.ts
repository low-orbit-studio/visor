import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import type { Rule, RuleResult } from './types.js';

function extractCssClasses(cssContent: string): string[] {
  const classes: string[] = [];
  // Strip :global(...) blocks — those are not module-local classes
  const stripped = cssContent.replace(/:global\([^)]*\)/g, "");
  // Match class selectors like .className or .className:hover
  const classRegex = /\.([a-zA-Z_][\w-]*)\b/g;
  let m = classRegex.exec(stripped);
  while (m !== null) {
    if (!classes.includes(m[1])) {
      classes.push(m[1]);
    }
    m = classRegex.exec(stripped);
  }
  return classes;
}

function extractDtsClasses(dtsContent: string): string[] {
  const classes: string[] = [];
  // Match readonly property declarations:
  //   readonly className: string          (simple identifiers)
  //   readonly 'class-name': string       (quoted keys with hyphens or BEM modifiers)
  //   readonly "class-name": string       (double-quoted keys)
  const propRegex = /readonly\s+(?:['"]([^'"]+)['"]|(\w+))\s*:/g;
  let m = propRegex.exec(dtsContent);
  while (m !== null) {
    classes.push((m[1] ?? m[2]) as string);
    m = propRegex.exec(dtsContent);
  }
  return classes;
}

export const cssModuleTypesSync: Rule = {
  name: 'css-module-types-sync',
  description: 'Every class in .module.css has a matching entry in .module.css.d.ts',
  category: 'tokens',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];
    const pattern = 'components/**/*.module.css';

    for await (const cssPath of glob(pattern)) {
      const dtsPath = `${cssPath}.d.ts`;

      let cssContent: string;
      let dtsContent: string;
      try {
        cssContent = await readFile(cssPath, 'utf-8');
      } catch {
        continue;
      }

      try {
        dtsContent = await readFile(dtsPath, 'utf-8');
      } catch {
        results.push({
          pass: false,
          message: 'Missing .d.ts file',
          file: cssPath,
        });
        continue;
      }

      const cssClasses = extractCssClasses(cssContent);
      const dtsClasses = extractDtsClasses(dtsContent);

      const missing = cssClasses.filter((c) => !dtsClasses.includes(c));

      if (missing.length > 0) {
        results.push({
          pass: false,
          message: `Missing in .d.ts: ${missing.join(', ')}`,
          file: dtsPath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'All CSS module types are in sync',
      });
    }

    return results;
  },
};
