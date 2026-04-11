#!/usr/bin/env tsx
/**
 * One-shot: reorder component MDX sections so previews come first.
 *
 * Canonical order after this runs:
 *   <frontmatter + imports>
 *   ## <all preview H2s, in existing order>
 *   ## Installation
 *   ## Usage
 *   ## API Reference  (or ## Props, or first H2 containing PropsTable)
 *   ## <all trailing sections: Accessibility, Source Files, etc.>
 *
 * The rewrite moves Installation and Usage from their current spot (just
 * after the imports block) to just before API Reference, preserving every
 * other section's position and the file's frontmatter / imports block.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const ROOT = '/Users/justinschier/Code/visor/packages/docs/content/docs/components';

interface Section {
  heading: string; // e.g. "## Installation"
  body: string; // content after the heading line up to the next H2 (exclusive)
}

function splitMdx(content: string): { preamble: string; sections: Section[] } {
  const lines = content.split('\n');
  let firstH2 = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      firstH2 = i;
      break;
    }
  }
  if (firstH2 === -1) return { preamble: content, sections: [] };

  const preamble = lines.slice(0, firstH2).join('\n');
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  for (let i = firstH2; i < lines.length; i++) {
    const line = lines[i];
    if (/^## /.test(line)) {
      if (currentHeading !== null) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n') });
      }
      currentHeading = line;
      currentBody = [];
    } else if (currentHeading !== null) {
      currentBody.push(line);
    }
  }
  if (currentHeading !== null) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n') });
  }
  // Trim trailing blank lines from each body so joinSections can reinsert
  // exactly one blank line between sections without accumulating drift.
  for (const s of sections) {
    s.body = s.body.replace(/\n+$/, '');
  }
  return { preamble, sections };
}

function isInstallation(s: Section) {
  return /^## Installation\b/.test(s.heading);
}
function isUsage(s: Section) {
  return /^## Usage\b/.test(s.heading);
}
function isApiAnchor(s: Section, body: string) {
  return (
    /^## (API|Props)\b/.test(s.heading) || s.body.includes('<PropsTable')
  );
}

function joinSections(sections: Section[]): string {
  // Each section: heading line, then body (which may start with a blank
  // line — we preserve it verbatim so Markdown rendering still sees the
  // gap between the heading and the first content element).
  return sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n');
}

function rewrite(content: string): string | null {
  const { preamble, sections } = splitMdx(content);
  if (sections.length === 0) return null;

  const installation = sections.find(isInstallation);
  const usage = sections.find(isUsage);
  if (!installation && !usage) return null; // nothing to move

  const withoutMoved = sections.filter(
    (s) => !isInstallation(s) && !isUsage(s)
  );

  // Find API anchor in the remaining list.
  let apiIdx = withoutMoved.findIndex((s) => isApiAnchor(s, s.body));
  if (apiIdx === -1) apiIdx = withoutMoved.length; // put at end if no anchor

  // Already in desired order? Bail so we don't thrash unchanged files.
  // Desired: Installation/Usage appear immediately before the API anchor.
  const originalInstallIdx = sections.findIndex(isInstallation);
  const originalApiIdx = sections.findIndex((s) => isApiAnchor(s, s.body));
  if (
    installation &&
    originalInstallIdx !== -1 &&
    originalApiIdx !== -1 &&
    originalInstallIdx === originalApiIdx - (usage ? 2 : 1)
  ) {
    // Installation directly precedes API anchor already (possibly with Usage).
    return null;
  }

  const moved = [
    ...withoutMoved.slice(0, apiIdx),
    ...(installation ? [installation] : []),
    ...(usage ? [usage] : []),
    ...withoutMoved.slice(apiIdx),
  ];

  const body = joinSections(moved);
  // preamble already ends with a blank line in practice; normalize spacing.
  const out = `${preamble.replace(/\s+$/, '')}\n\n${body}`;
  return out.endsWith('\n') ? out : out + '\n';
}

async function main() {
  const files: string[] = [];
  // @ts-expect-error — node 22 glob async iterator typing
  for await (const entry of glob('**/*.mdx', { cwd: ROOT })) {
    files.push(`${ROOT}/${entry}`);
  }

  let changed = 0;
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const rewritten = rewrite(content);
    if (rewritten && rewritten !== content) {
      await writeFile(file, rewritten);
      changed++;
      console.log(`rewrote ${file.replace(ROOT + '/', '')}`);
    }
  }
  console.log(`\n${changed} files updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
