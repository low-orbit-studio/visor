# W033 — A gate that dies before its check is indistinguishable from a gate that passes; assert the check ran, not just that the job did

**Tags:** ci, workflows, publish, monorepo, build-order, coverage-hole

**Source:** VI-642. The Visor Publish Smoke — the gate that stops `npx visor add <component>` from writing a stale version — failed **276 consecutive runs over three and a half months**, from 2026-06-04 until someone happened to look at the Actions tab. It never reached the comparison it exists to perform.

## What

The workflow ran `npm ci`, then `npm run build -w packages/cli`, then the smoke. The CLI's `build:manifest` imports `@loworbitstudio/visor-theme-engine`, which resolves through the workspace symlink to `packages/theme-engine` — whose `dist/` is a build artifact. `npm ci` does not produce it, `packages/theme-engine` has no `prepare` script, and the workflow never built it. So:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  node_modules/@loworbitstudio/visor-theme-engine/dist/index.js
  imported from packages/cli/src/generate/build-manifest.ts
```

| step | outcome |
| -- | -- |
| Build CLI | **failure** |
| Run publish smoke | skipped |
| Audit drifted VI- tickets | skipped |
| Surface smoke outcome | skipped |

The import landed in VI-505 (#566), merged 2026-06-04 11:47 EDT. The last green smoke was 2026-06-04 02:12 UTC — the run immediately before it.

## Why it survived so long

Three properties compounded, and each is worth recognising on its own:

1. **It failed on a schedule, not on a PR.** Nobody's merge was ever blocked, so nobody had a reason to look. A red check on your own PR gets fixed in minutes; a red nightly gets fixed when someone goes looking.
2. **It failed *before* the assertion, not at it.** `continue-on-error: true` on the smoke step plus a later `Surface smoke outcome` step meant the design was "let the smoke report, then decide." A build failure short-circuits all of that. The job was red, but for a reason that looks like infrastructure noise rather than the signal the gate exists to emit.
3. **CI was green the whole time.** Every CI job builds the engine first (`npm run build` at root, or `-w packages/theme-engine -w packages/tokens -w packages/cli` in the test shards). Only this workflow built `packages/cli` alone. Green CI actively reassures you that build-order problems do not exist.

The failure mode is not "the gate was wrong." It is "the gate was absent, and absence looked like infrastructure flake."

## When

Any CI job whose *purpose* is an assertion — drift gates, smoke tests, publish checks, nightly audits, security scans — rather than a build or test that fails loudly in your face. Especially when it runs on `schedule` or `workflow_run` rather than on pull requests.

Also: any workspace script in this monorepo that imports a sibling package. `npm` has no topological build ordering for arbitrary scripts, so `npm run build -w packages/X` is only self-sufficient if X depends on nothing else in the workspace. See also [W021](W021-visor-cli-global-vs-workspace.md) (`theme:sync` hit the same shape) and the recurring "build dist first or get false failures" trap when docs/cli vitest runtime-import the engine.

## How

**The immediate fix** — build what the CLI's build actually depends on, matching the CI shards:

```yaml
- name: Build CLI (produces packages/cli/dist/registry.json)
  run: npm run build -w packages/theme-engine -w packages/tokens -w packages/cli
```

**The durable lesson** — a gate should be able to prove it ran. Prefer a workflow shape where the assertion step's *absence* is itself a failure, not a silence:

- Do not let a required assertion sit behind `continue-on-error` + a later interpreter step without also asserting the assertion executed. `steps.<id>.outcome == 'skipped'` should be treated as failure, not as "no drift found."
- When a gate has been quiet for a while, check *when it last passed*, not whether it is currently red. `gh api .../workflows/<file>/runs --jq '.workflow_runs[] | select(.conclusion=="success") | .created_at'` answers "has this ever worked?" in one call, and the last-success date is usually adjacent to the commit that broke it.
- Documented local recipes drift the same way. CLAUDE.md's `smoke:publish` and `audit:publish` snippets carried the identical incomplete build line, so reproducing the CI failure by hand reproduced the *bug*, not the check. Fix the docs with the workflow.

**Not done here, worth its own ticket:** alerting on scheduled-workflow failure. The repo already has a `Stale Version Packages PR Alert` workflow; a sibling that notices "a scheduled gate has been red for N consecutive runs" would have caught this in a day instead of a quarter.
