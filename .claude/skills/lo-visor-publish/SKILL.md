---
name: lo-visor-publish
description: Publish health check and cross-repo coordinated release for the 4 Visor artifacts (visor-core, visor CLI, visor-theme-engine, visor-themes-private). Two modes — `status` (read-only health report: version drift, queued-but-unreleased changesets, and publish-path staleness; non-zero exit on any) and `coordinate` (single-confirmation cross-repo release). Use when checking whether any artifact has unpublished work on main, or when shipping a coordinated Visor + visor-themes-private bundle (BO-29-style case).
---

# /lo-visor-publish — Operator publish surface

> Day-to-day publishing is fully automatic. This skill exists for two narrow operator tasks: health checks (`status`) and cross-repo coordinated releases (`coordinate`). It contains no publish logic — each repo's existing CI workflow remains the source of truth for what publishes.

## When to invoke

- **`status`** — to check whether any of the 4 publishable Visor artifacts have unpublished work on main, whether changesets are queued but unreleased, and whether the publish path has gone stale. Useful as a pre-release sanity check or as a CI gate ("all artifacts must be in sync before opening a release announcement PR").
- **`coordinate`** — when a single feature spans Visor + visor-themes-private and both must ship together. Reference case: BO-29 (Finalize Private Theme Resolution) — required Visor code change + visor-themes-private data change + republish.

## Modes

### `status` — drift report

Reads the published version of each artifact from its registry and compares to the version on `main`.

**Run it under Varlock.** Reading the private `@low-orbit-studio/visor-themes-private` version authenticates against GitHub Packages with `GITHUB_PACKAGES_TOKEN` (Bitwarden-backed, per `.env.schema`). Run bare and that row comes back `auth?` with a fix-it hint; run under Varlock and all four resolve:

```bash
varlock run -- node scripts/visor-publish-status.mjs
```

Output (per [VI-340 D2](https://linear.app/low-orbit-studio/issue/VI-340), extended by [VI-633](https://linear.app/low-orbit-studio/issue/VI-633)):

```text
Artifact                                     Published   On main   Drift
@loworbitstudio/visor-core                   0.6.0       0.6.0     no
@loworbitstudio/visor                        0.7.0       0.7.0     no
@loworbitstudio/visor-theme-engine           0.4.1       0.4.1     no
@low-orbit-studio/visor-themes-private       0.1.4       0.1.4     no

Pending changesets: 6 (oldest 44d, threshold 14d)
Last publish:       @loworbitstudio/visor@1.21.0, 44d ago
```

**Read the two lines under the table, not just the Drift column.** A package version
only moves when the Version Packages PR merges, so for the whole window between a
feature landing and a release, published `===` on-main and every Drift cell reads `no`.
The queue lines are what see into that window.

That is not hypothetical. Across the 2026-07/09 outage `packages/cli/package.json` sat
at `1.21.0` for **44 days** while the npm credential was dead and six tickets went
unreleased — the table read clean and exit 0 every day of it.

- **Pending changesets** — count of `.changeset/*.md` on main (`README.md` excluded),
  plus the age of the oldest, by **git commit date** (not filesystem mtime, which a
  fresh clone or CI checkout resets to now and which would silently disarm the gate).
- **Last publish** — days since the currently-published `@loworbitstudio/visor` was
  published, read from the registry's `time` map. Deliberately *not* derived from CI
  run status: during the outage the `Release` workflow went green three times in a row
  while publishing nothing, because with pending changesets it takes the PR-refresh
  path and never reaches the publish step. Green CI was not evidence; a registry
  timestamp is.

**Staleness threshold.** A non-empty queue never fails the check on its own — pending
changesets are normal mid-development, and a permanently-red gate is an ignored gate.
The check fails only when the **oldest** pending changeset exceeds the threshold
(default **14 days**):

```bash
node scripts/visor-publish-status.mjs --stale-days=30   # or VISOR_PUBLISH_STALE_DAYS=30
```

Raise it during a deliberate release freeze; lower it to tighten the loop.

**Drift values:**
- `no` — published version matches main.
- `ahead` — main is ahead of the registry. Triggers exit code 1.
- `behind` — registry is ahead of main (rare; means a publish happened on a different branch or the local is stale).
- `auth?` — the private artifact could not be read because its GitHub Packages credential is missing/expired (no `GITHUB_PACKAGES_TOKEN`, or an npm 401). This is a local-setup issue, not publish drift — the report prints a `varlock run -- ...` hint. Exit code 1.
- `error` — could not read one side (missing repo, registry unreachable). Exit code 1.

**Exit codes:**
- `0` — all artifacts in sync (or only `behind`) **and** the queue is not stale.
- `1` — drift, error, missing credential, **or a stale queue** on at least one artifact.
- `2` — invocation error (wrong worktree, bad arguments, unparseable threshold).

A stale queue exits 1 with an explicit note that the table above reads clean — the
point being that a clean table is exactly what the failure mode looks like.

### `coordinate` — cross-repo release

Verifies, previews, and watches a coordinated release across Visor and visor-themes-private.

```bash
node scripts/visor-publish-coordinate.mjs <visor-PR> <themes-PR> [--dry-run]
```

Both arguments accept a numeric PR number or a full GitHub URL. Both PRs must be **already merged** on their respective `main` branches.

Flow (per [VI-340 D5](https://linear.app/low-orbit-studio/issue/VI-340)):

1. Verify both PRs merged.
2. Verify CI passed on both.
3. Fetch each PR's file list and Visor's pending changesets; compute a unified bump preview.
4. Print preview (Visor side: changeset-driven or auto-patch; themes side: auto-patch or no-bump).
5. Single confirmation prompt.
6. On confirm: locate and watch the existing `release.yml` (Visor) and `publish.yml` (themes-private) runs triggered by each merge.
7. Report final published versions for all 4 artifacts.

**`--dry-run`:** runs gates 1–4 (validation + preview), prints what would happen, exits without touching workflows. Use this before the live run to verify the preview matches expectations.

## Auth requirements

- `gh` CLI authenticated to `github.com` (org access for both `low-orbit-studio/visor` and `low-orbit-studio/visor-themes-private`).
- `.npmrc` configured for `@low-orbit-studio` against `https://npm.pkg.github.com/` with a `read:packages` token (already configured per BO-25 close-out).

No new secrets, no new tokens.

## Failure modes

| Symptom | Meaning | Fix |
|---------|---------|-----|
| `Not a Visor checkout` | Invoked from outside the Visor repo | `cd ~/Code/visor` and re-run |
| `MISSING` in the `On main` column for themes-private | The visor-themes-private repo is not at the expected location | Clone to `~/Code/low-orbit/visor-themes-private/` or set `VISOR_THEMES_PRIVATE_PATH=/path/to/repo` |
| `gh api failed` for a PR | PR doesn't exist, isn't accessible, or `gh` is unauthenticated | `gh auth status` and confirm org access |
| `PR #N is not merged` | Operator passed an unmerged PR | Wait for merge, then re-run |
| `CI conclusion is "failure"` | The PR's CI on the merge commit failed | Re-run failed checks before coordinating publishes |
| `no recent run found` while watching | Workflow didn't fire on merge (very rare) | Manually re-trigger via `gh workflow run` and re-watch |
| `Publish path looks stale` with an all-`no` Drift column | Changesets queued past the threshold while versions match — the publish path is not running | Check the `Release` workflow's most recent run **on the publish path** (zero pending changesets); green runs with changesets pending never reach the publish step |

## Out of scope

- **Rollback** — npm doesn't support reliable unpublish. Patch-bump-and-republish per [W020](../../docs/wisdom/W020-publish-coordination-drift.md) is the recovery path.
- **Auto-detection of "this needs a coordinated release"** — operator names the two PRs explicitly. Detection from the diff is a follow-up if the volume warrants it.
- **Three-or-more-repo coordination** — only Visor + visor-themes-private. File a follow-up if a third repo joins.
- **Initiating workflows** — both repos publish automatically on push to main. The skill watches existing runs; it does not initiate new ones in the happy path.

## Related

- Audit: [`docs/audits/publish-automation.md`](../../docs/audits/publish-automation.md) (VI-334).
- Reference case: BO-29 (`Finalize Private Theme Resolution`) — Visor PR #360 + themes PR #2 + republish at v0.1.2.
- Single-artifact publish flows are documented in the audit; this skill orchestrates only the cross-repo case.
