# W028 — husky 9's `.husky/_/` wrapper directory does not propagate to git worktrees

## Lesson

husky 9 installs its hooks via a wrapper directory `.husky/_/` and sets `core.hooksPath = .husky/_` in the shared `.git/config`. The wrapper is created on `npm install` by the husky binary (run from the `prepare` script) and is gitignored — it is not a tracked artifact.

Subagent worktrees created with `git worktree add` inherit `core.hooksPath` from the shared `.git/config` but do **not** have `.husky/_/` materialized inside the worktree directory, because `npm install` is never run there. Git resolves the hook path against the worktree's working directory, finds nothing, and **silently skips the hook** — no error, no warning, the push proceeds.

For Visor this manifested as missed pre-push changeset generation in `/lo-swarm` teammate worktrees (VI-374). Only the CI `Changeset Gate` caught it, after the PR was opened.

## Fix

Drop the wrapper layer. Set `core.hooksPath` to `.husky` (relative, no `/_`) so git invokes the tracked `.husky/pre-push` / `.husky/pre-commit` scripts directly — those resolve per-worktree because the path is relative.

In `package.json`:

```json
"prepare": "husky 2>/dev/null; git config core.hooksPath .husky 2>/dev/null || true"
```

Two non-obvious details:

1. **Use `;` not `&&` between `husky` and the `git config` override.** With `&&`, the override silently skips when husky exits non-zero (missing binary, npm install partial failure), leaving `core.hooksPath` at husky's default `.husky/_` — the original bug. With `;`, the override runs unconditionally; the trailing `|| true` still keeps the script harmless in CI/no-git environments.
2. **Run `git config core.hooksPath .husky` once locally** after pulling this change for the first time. The `prepare` script does it for every subsequent `npm install`, but the existing local config will still point at `.husky/_` until something rewrites it.

The husky 9 wrapper adds three behaviors (`HUSKY=0` skip, `~/.config/husky/init.sh` sourcing, `node_modules/.bin` PATH inject) — none are used by Visor's tracked hooks, so dropping the indirection costs nothing.

## How to spot

- Push from a subagent worktree (or any worktree where `npm install` was not run) and see no hook output at all — not `[lo-changeset]`, not validation, nothing. The hook is missing, not failing.
- `git config core.hooksPath` returns `.husky/_` after `npm install` — symptom of the husky default. Should be `.husky`.
- CI `Changeset Gate` failing on PRs from agent-authored branches while the same change works fine when pushed from the main worktree.

## Verification

Regression test lives at `scripts/__tests__/husky-worktree-propagation.test.mjs`. Three cases:

1. Parent repo with `core.hooksPath = .husky` fires the hook on push.
2. Worktree inherits `.husky` from shared config and fires the hook.
3. Pre-fix state (`core.hooksPath = .husky/_` plus no wrapper in the worktree) silently skips — locks in the failure mode.

## Tags

`husky`, `git-hooks`, `worktree`, `changeset`, `pre-push`, `tooling`
