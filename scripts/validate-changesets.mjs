#!/usr/bin/env node
/**
 * validate-changesets.mjs
 *
 * Runs the changesets release planner against the current set of .changeset/*.md
 * files and fails non-zero on any structural error — most importantly the
 * "package not in workspace" error that broke release.yml for 6 days in VI-418
 * (changesets referenced `"visor"` instead of `"@loworbitstudio/visor"`).
 *
 * Why a custom validator vs. `npx changeset status`:
 *   `changeset status` silently ignores unknown package names — it computes
 *   "0 packages to bump" and exits 0. `changeset version` is what actually
 *   throws, but running it in CI would mutate package.json/CHANGELOG.md files.
 *   `@changesets/get-release-plan` is the same code path `changeset version`
 *   uses to validate, but it returns a plan object instead of writing files.
 *
 * Exit codes: 0 = ok, 1 = invalid changeset (e.g. unknown package, bad bump
 * type, etc. — whatever assemble-release-plan throws on).
 */

import getReleasePlan from '@changesets/get-release-plan';
import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

const cwd = process.cwd();

let plan;
try {
  const { packages, root } = await getPackages(cwd);
  const config = await read(cwd, { packages, root });
  plan = await getReleasePlan(cwd, undefined, config);
} catch (err) {
  console.error('::error::Changeset validation failed.');
  console.error('');
  console.error(err.message);
  console.error('');
  console.error('Common causes:');
  console.error('  * Frontmatter references a package not in the workspace.');
  console.error('    Use the full npm name (e.g. "@loworbitstudio/visor"),');
  console.error('    not the workspace-root name ("visor").');
  console.error('  * Bump type is something other than patch | minor | major.');
  console.error('  * Frontmatter YAML is malformed.');
  console.error('');
  console.error('Fix the offending file under .changeset/ and push again.');
  process.exit(1);
}

const releases = plan.releases.filter(r => r.type !== 'none');
if (releases.length === 0) {
  console.log('Changesets valid (no pending releases).');
} else {
  console.log(`Changesets valid (${plan.changesets.length} changesets, ${releases.length} planned releases):`);
  for (const r of releases) {
    console.log(`  ${r.name}: ${r.oldVersion} → ${r.newVersion} (${r.type})`);
  }
}
