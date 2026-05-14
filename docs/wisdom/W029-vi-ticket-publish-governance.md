# W029 — Linear "Done" ≠ published registry; close the loop with a PR-comment audit

**Tags:** governance, github, publish, registry, ci, public-repo

**Source:** Three R-rounds (BO-12, BO-13, BO-14, BO-26) caught a recurring failure: VI- tickets marked Done in Linear whose code had merged to `main` but had never made it into the published `@loworbitstudio/visor` tarball. Consumers running `npx visor add <name>` received the older source. Until VI-306, every operator had to grep the published registry by hand to verify each Done ticket — a tax on every R-round, every new project, every Visor consumer.

## What

In a workspace that distributes via two independent surfaces — a git mainline (where "Done" is recorded) and an npm registry (where consumers actually pull from) — "Done" is ambiguous by default. Without explicit governance, "Done in Linear" means "merged to main"; consumers don't see anything until a release publishes the new tarball. Between those two moments, the trust model is broken: a ticket says shipped, the registry says nothing of the sort.

Tools that hide this:
- **Changesets** — bumps versions per-changeset, but the publish itself depends on the Version Packages PR being merged. Until then, `main` is ahead of the registry.
- **`/lo-land`** — closes the Linear ticket on PR merge, not on publish. That's the right default for most repos but wrong for any repo that distributes a registry.
- **Local smoke checks** — `visor-publish-smoke.mjs` (VI-305) catches the drift, but only emits to stdout / CI logs. A noticeable but not actionable signal.

The visible symptom: a primitive is mentioned in a closed VI- ticket, but `npx visor add <primitive>` writes the older source. Every consumer hits this independently.

## Where to post the signal

The first instinct was to post the signal back into Linear — the system that recorded the (incorrect) "Done" state. **Reject this for public repos.** Putting a Linear workspace API key into a public OSS repository's GitHub Secrets:
- Mixes private ticket-tracking with public infrastructure.
- Creates an exfiltration footprint for anyone with write access who can modify a workflow file.
- Confuses future contributors and forks who see `LINEAR_API_KEY` referenced in workflow YAML and wonder what it does.

Instead, post the signal on the **GitHub PR** that landed the drifted change. Reasons:
- Squash-merge commits always have a trailing `(#N)` so the PR is recoverable from `git log`.
- The PR is the public artifact that recorded the merge — same surface as the change itself.
- `GITHUB_TOKEN` is built into every Actions run; no secret to configure, no key to leak.
- Scoped permission (`pull-requests: write`) limits blast radius if the workflow is ever compromised.

## How (the fix path)

Close the loop with an audit that maps detected drift back to the PR that landed it.

The audit lives in [`scripts/visor-publish-audit.mjs`](../../scripts/visor-publish-audit.mjs):
1. Run the same drift detection as the smoke (`computeDrift`).
2. For each drifted file, `git log -1 -- <file>` finds the most recent commit that touched it.
3. The audit extracts the `VI-N` reference from the subject (commit-message convention is the source of truth) AND the trailing `(#N)` PR number (squash-merge convention).
4. Group findings by PR number. For each PR, post one comment naming the drifted primitives, the closing tickets, the short SHAs, and a traceability marker (`Publish-audit marker: <name>@<sha>`) for grep-ability.

The audit does **not** transition Linear ticket states or post to Linear at all. Linear governance is your operator habit — once you see the PR comment, you decide whether to re-open the Linear ticket or just cut a release. Lifecycle control stays with the human; the audit just makes the gap visible on the public artifact that introduced it.

CI wiring lives in [`.github/workflows/visor-publish-smoke.yml`](../../.github/workflows/visor-publish-smoke.yml). The smoke step has `continue-on-error: true` so the audit step can read its outcome via `steps.smoke.outcome == 'failure'`. The audit step is guarded to tolerate exit `1` (drift — expected) and surface any other failure. A final step re-raises the smoke's exit code so the job still fails on drift.

```bash
# Local invocations
npm run audit:publish                       # report against latest published
npm run audit:publish -- --json             # machine-readable
GITHUB_TOKEN=$(gh auth token) npm run audit:publish -- --post-comments
```

## How (the prevention)

The audit is reactive — it fires when drift already exists. The proactive prevention is `/lo-changeset` discipline: every VI- ticket that touches a registry primitive must land with a changeset, so the next Release workflow publishes the change. The audit catches the cases where that discipline slipped.

## When this applies

- Any repo where Linear "Done" is set on PR merge but the consumer-visible artifact ships via a separate publish step.
- Any repo that distributes via npm + a shadcn-style registry (the failure class is general; Visor is the first project to encounter it).
- Any time a consumer reports "the ticket says shipped but I don't see it" — that's the failure pattern this audit exists to detect.

## Operator response to an audit comment

1. Open the PR. The `Publish-audit marker:` lines tell you exactly which primitives drifted and at which commits.
2. Verify the drift: `npm run smoke:publish` locally.
3. Cut a new `@loworbitstudio/visor` release per [W020](W020-publish-coordination-drift.md) — usually a coordinated bundle if multiple primitives drifted.
4. After publish + a fresh smoke run, the audit will not fire again for those primitives. No manual cleanup of the comment needed — it's a historical signal, not a state.

## References

- [`scripts/visor-publish-audit.mjs`](../../scripts/visor-publish-audit.mjs) — the audit script.
- [`scripts/__tests__/visor-publish-audit.test.mjs`](../../scripts/__tests__/visor-publish-audit.test.mjs) — unit tests for the pure helpers.
- [`.github/workflows/visor-publish-smoke.yml`](../../.github/workflows/visor-publish-smoke.yml) — CI wiring.
- [W020](W020-publish-coordination-drift.md) — the underlying failure class (workspace symlinks mask drift).
- [VI-305](https://linear.app/low-orbit-studio/issue/VI-305/) — the detection layer (publish smoke).
- [VI-306](https://linear.app/low-orbit-studio/issue/VI-306/) — this governance layer.
