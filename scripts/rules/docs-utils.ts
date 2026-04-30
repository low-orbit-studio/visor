import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const EXCLUDED_GROUPS = ['blocks', 'deck'];

/**
 * Pages that are docs pages (not component wrappers) and are intentionally
 * exempt from component-centric rules (ComponentPreview, PropsTable, install command).
 * These are CSS utilities or reference pages, not React components.
 */
const EXCLUDED_PAGES = ['utilities'];

/**
 * Returns paths of all component MDX files, excluding blocks/ and deck/ groups
 * and pages in EXCLUDED_PAGES.
 */
export async function getComponentMdxFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const filePath of glob(
    'packages/docs/content/docs/components/*/*.mdx'
  )) {
    const group = filePath.split('/').at(-2)!;
    const page = filePath.split('/').at(-1)!.replace('.mdx', '');
    if (!EXCLUDED_GROUPS.includes(group) && !EXCLUDED_PAGES.includes(page)) {
      files.push(filePath);
    }
  }
  return files.sort();
}

/**
 * Returns paths of all component group meta.json files, excluding blocks/ and deck/.
 */
export async function getComponentMetaFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const filePath of glob(
    'packages/docs/content/docs/components/*/meta.json'
  )) {
    const group = filePath.split('/').at(-2)!;
    if (!EXCLUDED_GROUPS.includes(group)) {
      files.push(filePath);
    }
  }
  return files.sort();
}

export { readFile };
