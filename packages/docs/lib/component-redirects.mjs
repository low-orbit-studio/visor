import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * VI-721: components live at /docs/components/<group>/<slug>, but old links, bookmarks
 * and in-content references use /docs/components/<slug>. Derive one permanent redirect
 * per component from the filesystem so it stays correct as components are added.
 */
export function componentRedirects(componentsDir) {
  const bySlug = new Map();
  for (const group of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const file of readdirSync(path.join(componentsDir, group.name))) {
      if (!file.endsWith('.mdx') || file === 'index.mdx') continue;
      const slug = file.slice(0, -'.mdx'.length);
      if (bySlug.has(slug)) {
        throw new Error(
          `Duplicate component slug "${slug}" in groups "${bySlug.get(slug)}" and "${group.name}": ungrouped redirect would be ambiguous`,
        );
      }
      bySlug.set(slug, group.name);
    }
  }
  return [
    // No components index page exists, so land on a real one.
    { source: '/docs/components', destination: '/docs/components/general/button', permanent: true },
    ...[...bySlug].map(([slug, group]) => ({
      source: `/docs/components/${slug}`,
      destination: `/docs/components/${group}/${slug}`,
      permanent: true,
    })),
  ];
}
