# W030 — `npx changeset status` silently passes unknown package names; use get-release-plan for validation

**Tags:** changesets, ci, validation, release, monorepo, publish

**Source:** VI-419 release pipeline cleanup. The ticket's first-choice spec was to run `npx changeset status --since=main` as the PR-time validity gate. Locally, that command exits 0 on a `.changeset/*.md` that frontmatter-targets `"bogus-package"` — silently treating the malformed entry as "no packages to bump." This is exactly the VI-418 failure mode (changesets referenced `"visor"` instead of `"@loworbitstudio/visor"`), so a gate built on `changeset status` would not have caught the bug it was designed to prevent.

## What

The `@changesets/cli@2.30.0` `status` command:

1. Calls `getReleasePlan` *but* filters its output through `getChangedPackagesSinceRef` before printing.
2. When an unknown package is referenced in a changeset, the assemble step *does* know it is invalid — but `status`'s output formatter shows "0 packages to bump at patch" rather than surfacing the error.
3. Exit code is 0.

`@changesets/get-release-plan` (the same code path `changeset version` uses under the hood) calls `assembleReleasePlan`, which throws:

```
Error: Found changeset zz-vi-419-test-malformed for package bogus-package which is not in the workspace
```

That is the strict validation we want. The fix is to call `getReleasePlan` directly from a small Node script and propagate the throw as a non-zero exit.

## Why

- **Bug catches the intended class.** The VI-418 reproduction (root `"visor"` name, arbitrary `"bogus-package"` name) both throw with a clear actionable error.
- **Non-mutating.** `changeset version` would also throw, but it writes `package.json`, `CHANGELOG.md`, and deletes the changeset file. Running it in CI is destructive. `get-release-plan` returns a plan object and writes nothing.
- **Stable API.** `@changesets/get-release-plan` is a published package on npm, used internally by the cli itself. Less surface area to break than `cli`'s formatter behavior.

## When

Any time you need a PR-time gate that validates `.changeset/*.md` frontmatter — package names, bump types, YAML structure — without mutating files. This is the right primitive for any changesets-based monorepo that's been bitten by a "merged then broke release" incident.

## How

`scripts/validate-changesets.mjs`:

```js
import getReleasePlan from '@changesets/get-release-plan';
import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

try {
  const { packages, root } = await getPackages(process.cwd());
  const config = await read(process.cwd(), { packages, root });
  await getReleasePlan(process.cwd(), undefined, config);
} catch (err) {
  console.error('::error::Changeset validation failed.');
  console.error(err.message);
  process.exit(1);
}
```

Pin `@changesets/get-release-plan`, `@changesets/config`, and `@manypkg/get-packages` as explicit `devDependencies` rather than relying on transitive resolution through `@changesets/cli` — a future cli upgrade could otherwise silently break the validator.

## Bonus signal

`get-release-plan`'s error message names the *changeset file* and the *unknown package*. Pipe the raw `err.message` through to the gate output so the author can fix the right file without grepping.
