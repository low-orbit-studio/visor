/**
 * Migration script: Convert MDX template literal code={} props to escaped strings.
 *
 * Transforms: code={`...`} → code={"..."}
 *
 * Run: npx tsx scripts/migrate-code-props.ts [--dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateFile(filePath: string): Promise<number> {
  const content = await readFile(filePath, 'utf-8');

  // Find all code={`...`} patterns, handling nested backticks
  // Strategy: find `code={` + backtick, then track nesting to find the matching close
  let result = '';
  let i = 0;
  let migrations = 0;

  while (i < content.length) {
    // Look for code={`
    const marker = 'code={`';
    const idx = content.indexOf(marker, i);
    if (idx === -1) {
      result += content.slice(i);
      break;
    }

    // Copy everything before the match
    result += content.slice(i, idx);

    // Find the matching closing `}
    // We need to handle nested template literals with \`
    const startOfTemplate = idx + marker.length;
    let j = startOfTemplate;
    let depth = 1; // We're inside one backtick

    while (j < content.length && depth > 0) {
      if (content[j] === '\\' && j + 1 < content.length && content[j + 1] === '`') {
        // Escaped backtick inside template — skip both chars
        j += 2;
        continue;
      }
      if (content[j] === '`') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }

    if (depth !== 0) {
      // Couldn't find matching close — leave unchanged
      result += content.slice(idx, idx + marker.length);
      i = idx + marker.length;
      continue;
    }

    // Extract the template content (between opening ` and closing `)
    const templateContent = content.slice(startOfTemplate, j);

    // Convert to escaped string:
    // 1. Replace literal newlines with \n
    // 2. Escape double quotes
    // 3. Replace \` (escaped backticks in template) with plain backticks
    const escaped = templateContent
      .replace(/\\/g, '\\\\')     // Escape existing backslashes first
      .replace(/"/g, '\\"')       // Escape double quotes
      .replace(/\n/g, '\\n')      // Newlines to \n
      .replace(/\\\\`/g, '`');    // \` becomes ` (undo double-escape of the backtick escapes)

    result += `code={"${escaped}"}`;
    migrations++;

    // Skip past the `}
    i = j + 2; // skip ` and }
  }

  if (migrations > 0 && !DRY_RUN) {
    await writeFile(filePath, result, 'utf-8');
  }

  return migrations;
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no files will be modified\n' : '');

  let totalMigrations = 0;
  let totalFiles = 0;
  const pattern = 'packages/docs/content/**/*.mdx';

  for await (const filePath of glob(pattern)) {
    const content = await readFile(filePath, 'utf-8');
    if (!content.includes('code={`')) continue;

    const count = await migrateFile(filePath);
    if (count > 0) {
      totalFiles++;
      totalMigrations += count;
      console.log(`  ${filePath} — ${count} migration${count === 1 ? '' : 's'}`);
    }
  }

  console.log(`\n${totalMigrations} migrations across ${totalFiles} files${DRY_RUN ? ' (dry run)' : ''}`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
