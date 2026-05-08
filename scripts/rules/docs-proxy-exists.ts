import { readdir, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import type { Rule, RuleResult } from './types.js';

/**
 * Components that intentionally have no source `<name>.tsx` entrypoint matching
 * the directory name (e.g. `form/` exposes `form.tsx` AND `form-field.tsx`,
 * not a single `form.tsx`). These are still checked: the proxy requirement
 * only applies when `components/ui/<name>/<name>.tsx` exists.
 */

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a candidate proxy file is well-formed:
 *   - has the `'use client'` directive at the top
 *   - re-exports from the source path
 */
async function readProxyContent(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function hasUseClientDirective(content: string): boolean {
  // Allow leading comments/whitespace before the directive.
  const stripped = content
    .replace(/^\s*\/\*[\s\S]*?\*\//, '')
    .replace(/^(?:\s*\/\/.*\n)+/, '')
    .trimStart();
  return /^['"]use client['"]\s*;?/.test(stripped);
}

export const docsProxyExists: Rule = {
  name: 'docs-proxy-exists',
  description:
    'Every component with components/ui/<name>/<name>.tsx has a docs proxy at packages/docs/components/ui/<name>.tsx (flat) or packages/docs/components/ui/<name>/<name>.tsx (subdirectory)',
  category: 'docs',
  async run() {
    const results: RuleResult[] = [];
    const componentDirs: string[] = [];

    for await (const entry of await readdir('components/ui', {
      withFileTypes: true,
    })) {
      if (entry.isDirectory() && !entry.name.startsWith('__')) {
        componentDirs.push(entry.name);
      }
    }

    for (const dir of componentDirs) {
      const sourceFile = `components/ui/${dir}/${dir}.tsx`;
      const sourceExists = await fileExists(sourceFile);

      // Only enforce the proxy requirement when the canonical source file
      // exists. Components without a `<name>/<name>.tsx` entrypoint (e.g.
      // multi-export packages) are out of scope for this rule.
      if (!sourceExists) {
        continue;
      }

      const flatProxy = `packages/docs/components/ui/${dir}.tsx`;
      const subProxy = `packages/docs/components/ui/${dir}/${dir}.tsx`;

      const flatExists = await fileExists(flatProxy);
      const subExists = await fileExists(subProxy);

      if (!flatExists && !subExists) {
        results.push({
          pass: false,
          message: `Missing docs proxy file. Create one of:\n      - ${flatProxy} (flat: imported via '@/components/ui/${dir}')\n      - ${subProxy} (subdirectory: imported via '@/components/ui/${dir}/${dir}')\n      The proxy must include the 'use client' directive at the top and re-export from ${sourceFile}.`,
          file: sourceFile,
        });
        continue;
      }

      // Validate `'use client'` directive on whichever proxy exists.
      const proxyToCheck = flatExists ? flatProxy : subProxy;
      const content = await readProxyContent(proxyToCheck);
      if (content === null) {
        results.push({
          pass: false,
          message: `Could not read docs proxy file at ${proxyToCheck}.`,
          file: proxyToCheck,
        });
        continue;
      }

      if (!hasUseClientDirective(content)) {
        results.push({
          pass: false,
          message: `Docs proxy at ${proxyToCheck} is missing the 'use client' directive on the first non-comment line. Without it, components that use hooks fail at prerender.`,
          file: proxyToCheck,
        });
        continue;
      }

      results.push({
        pass: true,
        message: `Has docs proxy (${flatExists ? 'flat' : 'subdirectory'})`,
        file: sourceFile,
      });
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No component directories with a canonical source file found',
      });
    }

    return results;
  },
};
