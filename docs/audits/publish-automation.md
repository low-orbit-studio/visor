# Visor Publish Automation Audit

> **Historical document.** Originally written as the VI-334 spike output. Since publication, **VI-419 deleted `auto-version.yml` and `scripts/auto-version.mjs`** in favor of a changesets-only flow on the Visor side. The sections below referencing `auto-version` describe the *prior* state of the Visor public pipeline and should be read as history. The themes-private repo still uses its own auto-version setup — those mentions remain current.

## TL;DR

- **The npm side is already mostly automatic.** Patch publishes for `@loworbitstudio/visor-core`, `@loworbitstudio/visor`, and `@loworbitstudio/visor-theme-engine` are zero-touch on PR merge. **Minor and major** publishes require the author to commit a changeset by hand — the only material human-in-the-loop step on the public side.
- **The private themes repo is the real manual gap.** `@low-orbit-studio/visor-themes-private` requires a manual `package.json` version bump, manual `git tag`, and manual `git push --tags` to publish. No auto-version, no changesets.
- **The docs site is fully automatic** via Vercel's GitHub integration. No action needed (and out of scope per VI-334).
- **Recommended path: hybrid.** Full automation is achievable for every individual artifact. Add a thin `/lo-visor-publish` operator skill for the rare case of a coordinated cross-repo release (Visor change + themes-private change shipped together) where keeping a human in the loop matches the blast-radius posture.

## Artifacts in scope

| # | Artifact | Type | Repo | Registry |
|---|----------|------|------|----------|
| 1 | `@loworbitstudio/visor-core` | npm package | `low-orbit-studio/visor` (public) | npmjs.org |
| 2 | `@loworbitstudio/visor` (CLI) | npm package | `low-orbit-studio/visor` (public) | npmjs.org |
| 3 | `@loworbitstudio/visor-theme-engine` | npm package | `low-orbit-studio/visor` (public) | npmjs.org |
| 4 | Visor docs site | Next.js site | `low-orbit-studio/visor` (public) | Vercel (`visor.design`, `visor.loworbit.studio`) |
| 5 | `@low-orbit-studio/visor-themes-private` | npm package | `low-orbit-studio/visor-themes-private` (private) | GitHub Packages |

**Out of scope per ticket:** auditing the docs site deployment beyond noting it exists; auditing the Flutter `visor_core` pub.dev path (Phase 10a).

## Classification key

- **auto** — happens with zero operator action.
- **manual** — requires operator action and there is no automation candidate (rare).
- **manual-but-automatable** — requires operator action today, but a concrete fix would automate it.
- **manual-and-not-automatable** — requires operator judgment by design (e.g., approving a cross-repo coordinated release).

---

## Artifact 1–3: npm packages (visor-core, visor CLI, visor-theme-engine)

These three packages share one publish pipeline driven by `release.yml` and `auto-version.yml` in the `low-orbit-studio/visor` repo.

### Patch publish flow (most common)

| # | Step | Trigger | Classification |
|---|------|---------|----------------|
| 1 | Author opens PR with code change inside `packages/{tokens,cli,theme-engine}/` | manual (author work, not publish flow) | n/a |
| 2 | CI runs (`ci.yml` — lint, typecheck, build, 4-shard test, optional Flutter) | PR open / push | **auto** |
| 3 | PR merges to `main` | manual (merge button) | n/a (merge is the operator's intent signal) |
| 4 | `auto-version.yml` runs on PR-closed-and-merged: detects which `packages/*/` were touched but not version-bumped, patch-bumps `package.json` + updates `package-lock.json`, commits `chore: patch version bump for PR #N` to `main` | merge | **auto** |
| 5 | Push to `main` (from step 4) triggers `release.yml` | push | **auto** |
| 6 | `release.yml` runs `changesets/action`: with no pending changesets, the action runs `npm run changeset:publish`, which detects each `package.json` whose version exceeds what's on the registry and publishes it | push | **auto** |
| 7 | npm registry receives `@loworbitstudio/visor-core@X.Y.Z+1` (and any other touched packages) | step 6 | **auto** |

**Verdict:** patch publishes are fully zero-touch. Author writes code, opens PR, merges. Done.

### Minor / major publish flow

| # | Step | Trigger | Classification |
|---|------|---------|----------------|
| 1 | Author opens PR with code change | n/a | n/a |
| 2 | **Author runs `npm run changeset` and commits `.changeset/<slug>.md` describing the change and selecting `minor` or `major`** | author judgment | **manual-but-automatable** |
| 3 | CI runs (`ci.yml`) | PR open / push | **auto** |
| 4 | PR merges to `main` | n/a | n/a |
| 5 | `auto-version.yml` runs and detects `package.json` was already version-bumped by changesets — skips that package (per `detectChangedPackages` in `scripts/auto-version.mjs`) | merge | **auto** |
| 6 | `release.yml` runs `changesets/action`: with a pending changeset, the action opens (or updates) a "Version Packages: ..." PR that bumps the version, deletes the changeset, and updates `CHANGELOG.md`. Title is computed by `scripts/compute-release-title.mjs` | push | **auto** |
| 7 | Operator reviews and merges the Version Packages PR | manual (merge button) | n/a (single click — explicit go-signal for a release that has user-facing release notes) |
| 8 | Second `release.yml` run: no pending changesets, runs `changeset publish`, publishes to npm | push | **auto** |

**Verdict:** the only material manual step is **step 2** — the author writing a changeset markdown file by hand. This is the central friction point on the public-npm side.

### Auth / secrets

- `CHANGESETS_PAT` (fine-grained PAT) — used by `release.yml` checkout so pushes to `changeset-release/main` trigger downstream workflows. (Critical: `GITHUB_TOKEN` cannot push to a branch and have that push fire `pull_request` events on the same workflow run.)
- `NPM_TOKEN` (npm automation token) — used by `release.yml` to publish. Automation token bypasses OTP per VI-124 close-out.
- Token rotation is **manual-and-not-automatable** as a concept (security operations, not publish flow). Out of scope for this audit.

### Known gaps (not strictly manual steps, but worth surfacing)

- **W020 — workspace export-surface drift.** No CI gate verifies that downstream-package imports resolve against the *published* upstream tarball (only against the workspace symlink). When the CLI or theme-engine consumes a new export from visor-core that wasn't in the prior visor-core publish, dev/CI passes but consumers break on install. Patch-bump-and-republish is the fix path; a pre-publish gate is the prevention. **Suggested follow-up: VI ticket "Add publish-time export-surface drift gate."**

---

## Artifact 4: docs site (Vercel)

| # | Step | Trigger | Classification |
|---|------|---------|----------------|
| 1 | PR opened against `main` with `packages/docs/**` or `components/**` changes | n/a | n/a |
| 2 | `docs.yml` runs build verification (`npm run docs:build`) on push to `main` (path-filtered) | push | **auto** |
| 3 | Vercel's GitHub integration auto-deploys preview on PR open and production on push to `main` (independent of GH Actions, configured in Vercel project) | push | **auto** |

**Verdict:** fully zero-touch. Out of scope to fix per ticket; nothing to fix anyway.

---

## Artifact 5: `@low-orbit-studio/visor-themes-private`

Lives in a separate private repo at `~/Code/low-orbit/visor-themes-private/` (GitHub: `low-orbit-studio/visor-themes-private`). Publishes to GitHub Packages.

### Current publish flow

| # | Step | Trigger | Classification |
|---|------|---------|----------------|
| 1 | Operator edits a theme YAML or adds a new theme directory under `themes/<slug>/` | n/a | n/a |
| 2 | `ci.yml` runs `npm run validate` (calls `bin/validate-all.mjs`) and `npm test` on PR | PR | **auto** |
| 3 | PR merges to `main` | n/a | n/a |
| 4 | **Operator manually edits `package.json` and bumps `version`** (e.g., `0.1.2` → `0.1.3`) | operator action | **manual-but-automatable** |
| 5 | **Operator commits the version bump and pushes to `main`** | operator action | **manual-but-automatable** (collapses into step 4 once auto-versioning is in place) |
| 6 | **Operator manually creates and pushes the tag: `git tag v0.1.3 && git push origin v0.1.3`** | operator action | **manual-but-automatable** |
| 7 | `publish.yml` runs on tag push: `npm ci`, `npm run validate` (re-gate), `npm publish` to GitHub Packages | tag push | **auto** |

**Verdict:** steps 4–6 are the primary manual friction. There is no auto-version, no changesets, no push-to-main publish. The repo predates VI-184's auto-version pattern.

### Auth / secrets

- `GITHUB_TOKEN` (provided by Actions) is sufficient because GitHub Packages accepts the workflow token for publishing under the same org. No PAT or NPM_TOKEN needed.
- Consumer `.npmrc` requires a separate fine-grained PAT with `read:packages` to install — operational concern for consumer projects, **not part of this publish flow**.

---

## Manual steps inventory (consolidated)

| # | Where | Step | Classification | Proposed fix | Effort |
|---|-------|------|----------------|--------------|--------|
| 1 | Visor (public) | Author writes `.changeset/<slug>.md` for minor/major bumps | manual-but-automatable | Resurrect VI-184's commit-prefix changeset generator (`feat:` → minor, `feat!:` / `BREAKING CHANGE:` → major). Investigate first **why** VI-184 was reverted (commit `639fc49` replaced it with `auto-version.yml`) — likely because patch-only was good enough at the time and prefix-driven minor/major was perceived as fragile. Re-evaluate with current commit hygiene. **Alternative:** a Linear-label-driven workflow — operator sets `bump:minor` label on the Linear ticket; a PR-merge workflow generates the changeset from the label. Cleaner contract than free-form commit messages. | M |
| 2 | visor-themes-private | Operator manually bumps `package.json` version | manual-but-automatable | Port `scripts/auto-version.mjs` from Visor — lift the function, drop the multi-package PACKAGES list (single root package here), wire to a new `auto-version.yml` workflow on PR-merged. Single package = simpler than Visor's version. | S |
| 3 | visor-themes-private | Operator manually creates and pushes git tag | manual-but-automatable | Replace `publish.yml` trigger from `on: push: tags: 'v*.*.*'` to `on: push: branches: [main]` (matches Visor's `release.yml` model). Keep validation as the pre-publish gate. Tags become a side-effect (npm registry already records the version; tags are nice-to-have for git archaeology and can be created post-publish by the workflow itself if desired). | S |
| 4 | Cross-repo | Operator coordinates a Visor change + visor-themes-private change shipped together (e.g., BO-29's data fix that needed Visor code change + themes-private data change + republish) | manual-and-not-automatable (recommended) | **Keep a human in the loop here by design.** Cross-repo coordinated bumps cross blast-radius lines and benefit from a single operator confirming the bundle. Build a thin `/lo-visor-publish` skill that audits both repos, dry-runs the bumps, shows a single confirmation, then triggers each repo's publish in order. (Sketch below.) | M |
| 5 | Visor (public) | Workspace export-surface drift can ship a broken downstream | infrastructure gap, not a manual step | Add publish-time CI check: walk every workspace package's imports from other workspace packages, resolve the `^X.Y.Z` constraint against npm metadata, fail publish if any imported symbol is missing from the resolved upstream tarball. Lives in `release.yml` between `Build packages` and `changesets/action`. (W020.) | M–L |
| 6 | All artifacts | `NPM_TOKEN` / `CHANGESETS_PAT` rotation | manual-and-not-automatable | Operational security concern, not part of the publish flow proper. Mention only — no fix proposed. | n/a |

---

## Recommendation

### Path: **hybrid — full automation per artifact + thin operator skill for cross-repo coordination**

**Why hybrid and not pure full-automation:**

- Pure full-auto is technically feasible for every individual artifact. Steps 1–3 in the inventory above are all automatable.
- However, **cross-repo coordinated releases** (the BO-29 case — Visor code change + themes-private data change shipped together) benefit from a single human confirmation. The blast radius spans two repos and two registries; a 5-second "yes, ship the bundle" gate is appropriate. Forcing it through commit-message conventions or PR labels makes the contract murkier, not cleaner.
- Solo-operator reality: one human merging both PRs in close succession is already fine for routine cases. The skill earns its keep when the bundles get larger or when Bailey starts shipping cross-repo work.

### Sketch: `/lo-visor-publish` skill

Single command, two modes:

**Mode 1 — single-artifact publish status check (`/lo-visor-publish status`):**

```text
$ /lo-visor-publish status

Artifact                                       Latest published   Latest on main   Drift?
@loworbitstudio/visor-core                     0.6.0              0.6.0            no
@loworbitstudio/visor                          0.7.0              0.7.0            no
@loworbitstudio/visor-theme-engine             0.4.1              0.4.1            no
@low-orbit-studio/visor-themes-private         0.1.2              0.1.2            no

All artifacts in sync. No publish needed.
```

If drift exists, the report shows the diff (commits since last publish, files changed) and exits non-zero so it can gate other workflows.

**Mode 2 — coordinated cross-repo release (`/lo-visor-publish coordinate <visor-PR> <themes-PR>`):**

1. Verify both PRs are merged on their respective `main` branches.
2. Verify CI passed on both.
3. Compute the bump type for each (from labels or commits).
4. Show a unified diff: "Visor: 0.6.0 → 0.7.0 (minor). Themes: 0.1.2 → 0.1.3 (patch). 9 themes affected. Cross-link: VI-XXX."
5. Single confirmation prompt.
6. On confirm: trigger Visor's release workflow (no-op if already running), then trigger themes-private's publish workflow.
7. Watch both to completion, report final published versions.

The skill is a thin operator surface — it does not contain publish logic, it just orchestrates and confirms. Each repo's workflow remains the source of truth for "what publishes."

### Alternatives considered

- **Pure full-auto everywhere, no skill.** Cleaner mental model. Rejected because cross-repo coordination is genuinely a different shape of decision (two registries, two blast radii) and a single human gate is the right cost. Bailey, Veronica's downstream consumers, etc., benefit from a clear "all four artifacts shipped at version X.Y.Z together" record.
- **Operator skill for everything (no auto-version anywhere).** Rejected — the auto-version path is already running cleanly and saves real friction on every single PR. Removing it would be a regression.
- **Use the [changesets multi-repo / "release-please" patterns].** Considered. Both work, but they're heavier than the current `auto-version.mjs` + `changesets/action` setup. Lift-and-shift `auto-version.mjs` to themes-private gets us to fully-auto with a fraction of the migration cost. Revisit if a third or fourth private repo joins the family.

---

## Follow-up tickets to file

Each is concrete enough to file directly. Priority and estimates are suggestions; tune at intake.

### [VI-336](https://linear.app/low-orbit-studio/issue/VI-336) — `feat: auto-version visor-themes-private on PR merge`

- **Goal:** Port `scripts/auto-version.mjs` and `auto-version.yml` from Visor to `low-orbit-studio/visor-themes-private`. Change `publish.yml` trigger from tag push to push-to-main. After this lands, a merged PR in visor-themes-private auto-bumps the patch version and publishes — zero operator action.
- **Estimate:** S (3 points). Lift-and-shift with single-package simplification.
- **Priority:** Medium. Closes the largest manual gap surfaced by this audit.
- **Bundled:** the original "post-publish git tag for visor-themes-private" follow-up is folded in as D5 stretch goal.

### [VI-338](https://linear.app/low-orbit-studio/issue/VI-338) — `feat: local AI-written changesets via /lo-changeset skill + git pre-push hook`

- **Goal:** Eliminate the manual `npm run changeset` step using a local `claude -p`-powered script that generates the changeset from the diff. Wired into a husky pre-push hook (auto-fires on any push) and exposed as a `/lo-changeset` skill (manual invocation, lo-land integration).
- **Estimate:** M (5 points).
- **Priority:** Medium. The remaining material manual step on the public side; only kicks in for non-patch releases.
- **Note:** This supersedes both the originally-sketched commit-prefix / Linear-label approach AND the cancelled cloud-hosted spike at [VI-335](https://linear.app/low-orbit-studio/issue/VI-335). Local approach has no per-PR API cost, runs on the operator's existing Claude Code install, and avoids GitHub Actions secrets management.

### [VI-337](https://linear.app/low-orbit-studio/issue/VI-337) — `feat: pre-publish workspace export-surface drift gate (W020)`

- **Goal:** Add a CI step in `release.yml` that, for each package about to publish, statically analyses imports from sibling workspace packages, resolves their `^X.Y.Z` constraints against npm metadata, and fails the publish if any imported symbol is missing from the resolved upstream tarball.
- **Estimate:** M–L (5–8 points). Static analysis + npm metadata fetch + d.ts parsing.
- **Priority:** Medium. Already cost us once (Visor 0.5.0 → 0.5.1 patch republish). Will cost us again at some point if not gated.

### [VI-340](https://linear.app/low-orbit-studio/issue/VI-340) — `feat: /lo-visor-publish operator skill (status + coordinate)`

- **Goal:** Build the skill sketched above. Status mode + coordinate mode.
- **Estimate:** M (5 points).
- **Priority:** Low. Defer until VI-336 and VI-338 are landed; the skill's value depends on the underlying flows being individually fully-auto.
- **Dependency:** Blocked by [VI-336](https://linear.app/low-orbit-studio/issue/VI-336) (themes-private auto-version) and [VI-338](https://linear.app/low-orbit-studio/issue/VI-338) (local AI changesets).

---

## Out-of-scope notes (recorded so they don't get lost)

- **Docs site deployment.** Already on Vercel autopilot. Not audited beyond confirming it deploys via the Vercel GitHub integration (not via GH Actions). `docs.yml` runs build verification only.
- **Flutter `visor_core` pub.dev publish path.** Phase 10a, separate audit. Not covered here.
- **Token rotation hygiene.** `NPM_TOKEN`, `CHANGESETS_PAT`, GitHub Packages PAT — operational security topic, not a publish-flow step. Worth a separate ticket if rotation cadence is unclear.
- **Cross-repo wisdom (W020) prevention** is listed above as a follow-up, but the *capture* of W020 happened during VI-242/VI-280 work, not in this audit's window.
