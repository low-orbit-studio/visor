# Visor Versioning & Changelog Strategy

Visor uses a two-layer distribution model — tokens via npm (`@loworbitstudio/visor-core`) and components via a shadcn-style copy-and-own registry. Each layer has a distinct versioning approach.

---

## Tokens Package — Semver (`@loworbitstudio/visor-core`)

The tokens package is the only npm-distributed piece. It follows [Semantic Versioning](https://semver.org/).

### Semver Rules for Design Tokens

| Bump | Triggers |
|------|----------|
| **Major** (`1.0.0 → 2.0.0`) | Removing a token, renaming a token, changing a token's semantic meaning, restructuring the CSS layer architecture |
| **Minor** (`0.1.0 → 0.2.0`) | Adding new tokens, adding a new theme, adding a new token tier |
| **Patch** (`0.1.0 → 0.1.1`) | Adjusting a token's value (e.g. tweaking a color shade), fixing a typo in a comment, internal build changes with no output change |

**Key principle:** If a consumer's stylesheet would break or render differently after `npm update`, it is a breaking change and requires a major bump.

### Examples

- Renaming `--color-primary` → `--color-brand-primary`: **major**
- Adding `--color-surface-overlay`: **minor**
- Changing `--color-primary` from `#3b82f6` to `#2563eb`: **patch**
- Removing the `--spacing-xs` token: **major**

---

## Registry Components — Metadata-Based Versioning

Registry components (e.g. `button`, `input`, `dialog`) are distributed via copy-and-own — consumers run `npx visor add button` and the source is copied into their project. There is no npm package to version.

### How it Works

Each component in the registry has a version field in its registry metadata. This version is informational — it helps consumers identify when the canonical Visor source has diverged from their local copy.

```json
{
  "name": "button",
  "version": "1.2.0",
  "description": "A polymorphic button component with multiple variants."
}
```

### Version Bump Rules for Registry Components

| Bump | Triggers |
|------|----------|
| **Major** | API-breaking changes (removed props, renamed props, changed behavior) |
| **Minor** | New props, new variants, new slots |
| **Patch** | Bug fixes, accessibility improvements, internal refactors with no API change |

### Consumer Responsibility

Once a component is copied into a consumer project, it is owned by that project. The consumer decides when (and whether) to pull in updates. There is no automatic update mechanism — this is intentional. The registry metadata version is a reference point, not an enforcement mechanism.

Consumers can check the current canonical version via the Visor docs site and manually apply relevant changes.

---

## Changelog Tooling — Changesets

Visor uses [Changesets](https://github.com/changesets/changesets) for changelog management. Changesets is the standard for monorepos and integrates cleanly with npm workspaces.

### Why Changesets

- Designed for monorepos with multiple publishable packages
- Explicit, intent-driven changelogs written by the developer at the time of the change
- Works with `npm workspaces` out of the box
- Supports automated publishing via CI

### Automatic patch version bumps

`.github/workflows/auto-version.yml` runs on every PR merge to `main`. It inspects which files the PR changed, maps them to their owning package, and bumps that package's `patch` version directly in `package.json`. Only packages with actual file changes are bumped — docs-only or CI-only PRs produce no version change.

**Package mapping:**

| Files changed | Package bumped |
|---|---|
| `packages/tokens/**` | `@loworbitstudio/visor-core` |
| `packages/cli/**` | `@loworbitstudio/visor` |
| `packages/theme-engine/**` | `@loworbitstudio/visor-theme-engine` |
| `packages/docs/**`, root files, `components/**` | (no bump) |

The commit lands directly on `main` as `chore: patch version bump for PR #N`, which triggers `release.yml` → `changeset publish` → npm publish for the bumped packages.

**Minor and major bumps** are made manually: edit the `version` field in the relevant `package.json`, commit, and push. `release.yml` will publish on the next push to `main`.

### Workflow

#### 1. When making a change that affects a published package

No action needed — the auto-version workflow handles the patch bump on merge.

#### 2. When releasing

When ready to release, run:

```bash
npm run changeset:version
```

This consumes all pending `.changeset/*.md` files, bumps the version in `packages/tokens/package.json`, and updates `CHANGELOG.md`. Commit the result.

Then publish to npm:

```bash
npm run changeset:publish
```

#### 3. Registry component changes

Registry component version bumps are made manually in the component's registry metadata file. No changeset is needed (the component is not an npm package), but a brief note in the commit message describing the change type is expected.

### Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run changeset` | `changeset` | Create a new changeset for a pending change |
| `npm run changeset:version` | `changeset version` | Consume changesets and bump versions |
| `npm run changeset:publish` | `changeset publish` | Publish updated packages to npm |

---

## Breaking Change Communication

Breaking changes (major bumps) require additional steps beyond a changelog entry.

### Process

1. **Changeset entry** — the changeset summary must clearly state what changed and why it is breaking.

2. **Migration guide** — add a `docs/migrations/v{MAJOR}.md` file (e.g. `docs/migrations/v2.md`) describing:
   - What changed
   - What consumers need to do
   - Before/after code examples

3. **Docs site page** — add or update a migration guide page in `packages/docs/content/docs/` so the docs site reflects the breaking change.

4. **CHANGELOG.md** — the generated changelog entry is the authoritative record. Manually add a link to the migration guide in the changelog entry after `changeset:version` runs.

5. **Communication** — notify downstream consumers via the appropriate channel (Slack, Linear comment, direct outreach depending on the project).

### Example Migration Guide Structure

```
docs/migrations/v2.md

# Migration Guide: v1 → v2

## Breaking Changes

### Token renamed: `--color-primary` → `--color-brand-primary`

**Why:** Aligned with the updated semantic naming convention.

**Action required:**

Find all uses of `var(--color-primary)` and replace with `var(--color-brand-primary)`.
```

---

## Reference

- Changesets docs: https://github.com/changesets/changesets
- Semver spec: https://semver.org
- Existing migration notes: `docs/MIGRATION.md`
