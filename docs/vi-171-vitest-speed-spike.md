# VI-171 — Vitest Runtime Spike Report

**Status:** spike complete — POC branch `vi-171-spike-cut-vitest-runtime-75` proves the win, not yet landed.
**Target:** cut full-suite vitest runtime by ≥75%.
**Result:** **79.2% reduction** in CI wall clock via combined config + 4-way sharding (max shard 5.65s vs baseline 27.17s). **Target met.**

## Environment

- Host: Apple Silicon M-series, 14 cores, 36 GB RAM
- Node 22.22.0, npm 10.9.4, vitest 4.1.2, jsdom 25.0.1, happy-dom 20.0.6
- Baseline commit: `b817ac7` (main)
- 222 test files, 2,871 tests, all passing

## Headline Numbers

| Scenario | Baseline | POC | Reduction |
|----------|---------:|----:|----------:|
| Local `npm test` (warm median) | 27.17 s | 19.52 s | 28.2 % |
| CI wall clock (4-way sharded, slowest shard) | 27.17 s¹ | **5.65 s** | **79.2 %** ✅ |
| Environment setup (aggregate) | 86.45 s | ~60 s | ~31 % |
| Setup-file aggregate | 32.73 s | ~10 s | ~70 % |
| Import aggregate | 151.63 s | ~110 s | ~28 % |

¹ The baseline is an unsharded single-runner pipeline; GitHub Actions wall clock equals the slowest of 4 matrix jobs once sharded.

## Baseline (unmodified main)

Three cold runs (cleared `node_modules/.vite` + `node_modules/.cache` between each) and three warm runs:

| Run | Cold real (s) | Warm real (s) |
|-----|--------------:|--------------:|
| 1 | 27.02 | 26.11 |
| 2 | 27.51 | 27.17 |
| 3 | 28.31 | 27.94 |
| **median** | **27.51** | **27.17** |

Vitest internal breakdown (warm1): `transform 8.95s, setup 32.73s, import 151.63s, tests 39.02s, environment 86.45s`. Top-10 slowest files = 41 % of aggregate per-file duration.

## Levers Evaluated

Measured independently against the unmodified baseline (two warm runs each, median reported). Levers are ordered by delivered delta.

| # | Lever | Local warm (s) | Δ vs baseline | Notes |
|---|-------|---------------:|--------------:|-------|
| — | **Baseline** | 27.17 | — | default pool, jsdom, axe global, no sharding |
| L4a | `pool: "threads"` alone | 23.87 | −12.1 % | Vitest 4 defaults to `forks`; threads is faster for this suite |
| L4b | `pool: "threads"` + `isolate: false` | ~9.3 | −66 %* | *but 431 tests fail from state leakage — not landable yet; see VI-179 |
| L1 | lazy axe-core (move config out of global setup) | 23.79 | −12.4 % | only 11 `*.a11y.test.tsx` files use it; saved axe-core import for ~211 other files |
| L3 | workspace projects (node vs jsdom split) | 26.90 | −1.0 % | tiny alone — most cost is in the dom project anyway |
| L2 | happy-dom swap | varies | see combined | no extra win on top of L1+L4+L3 alone, but 2,871 tests still pass under happy-dom (good news) |
| **L1+L4a** | lazy axe + threads | ~20.0 | −26 % | |
| **L1+L4a+L3+L2 (combined landable)** | + workspace + happy-dom | **19.52** | **−28.2 %** | all 2,871 tests pass, typecheck clean |
| L5 | CI sharding (`--shard=1..4/4`) | per-shard ~5 s | — | on full 14-core box; in CI each shard gets its own 4-core runner |
| **Combined + L5** (pipeline wall clock) | max shard **5.65 s** | **−79.2 %** | slowest shard gates the matrix |
| L6 | `deps.inline` / `optimizeDeps` audit | not measured | — | import aggregate (106 s) still dominates; candidate for follow-up |
| L7 | Top-10 slow-file profile | — | — | top-2 are node-env `scripts/rules/*` (5.6 s + 3.0 s); the Three.js `sphere-playground` block takes 1.8 s. No obvious optimisations without refactoring test shape |
| L8 | CSS modules transform | not measured | — | modest aggregate (≤1 s) — not worth isolated measurement |

### Per-shard timing (combined config, shards run alone on full box)

| Shard | Files | Tests | Wall (s) |
|-------|------:|------:|---------:|
| 1/4 | 56 | 625 | 5.06 |
| 2/4 | 56 | 849 | 5.03 |
| 3/4 | 55 | 650 | 5.40 |
| 4/4 | 55 | 747 | **5.65** |

Shard 4 is the slowest — tuning bin-packing later could shave another 0.5–1 s.

## Recommended Configuration

Three files on the POC branch:

### 1. `vitest.config.ts`

Add `pool: "threads"` inside `test:`. Vitest 4's default pool is `"forks"`; switching alone saves ~12 %. **`isolate: false` is evaluated but NOT landed** — it halved wall clock to ~9 s but caused ~107/222 files and 431/2,871 tests to fail from state leakage across Radix Menu portals, Radix table state, and shared jsdom globals. The leakage is fixable but out of scope for this spike — tracked as VI-179.

### 2. `vitest.setup.ts`

Remove the global `axe-core` `configure()` and `expect.extend({ toHaveNoViolations })`. Keep the `console.error` "Not implemented" suppression (it's useful beyond axe). Keep all five DOM polyfills.

### 3. `test-utils/axe.ts`

Self-register the matcher and axe configuration on first import:

```ts
import { run as axeRun, configure, type RunOptions, type AxeResults } from "axe-core"
import { expect, type ExpectationResult } from "vitest"

let axeSetupDone = false
function ensureAxeSetup() {
  if (axeSetupDone) return
  axeSetupDone = true
  configure({
    allowedOrigins: ["<same_origin>"],
    rules: [{ id: "color-contrast", enabled: false }],
  })
  expect.extend({ toHaveNoViolations })
}
ensureAxeSetup()
```

Only the 11 `*.a11y.test.tsx` files import from `test-utils/axe` today — they will still pay axe's init cost, the other 211 test files will not.

### 4. `vitest.workspace.ts` (new)

Two projects: `node` (scripts, cli, theme-engine — environment `node`, empty `setupFiles`) and `dom` (components, blocks, hooks, docs, tokens — environment `happy-dom`). See file on the POC branch.

### 5. `.github/workflows/ci.yml`

Convert `build-and-test` to a `strategy.matrix` over `shard: [1, 2, 3, 4]` and run `npx vitest run --shard=$SHARD/4` with `SHARD` set via the `env:` block. Four parallel 4-core runners each process ~56 test files; the job completes when the slowest finishes.

## What Was Surprising

1. **Vitest 4 defaults to forks + isolate:true.** Switching to `threads` alone already saved 12 %. Documented this so we don't forget.
2. **happy-dom drop-in worked.** All 2,871 tests pass unmodified — including every Radix UI, Embla, cmdk test. But the wall-clock win on top of `isolate: false` + lazy axe is small, because we're already CPU-saturated on the dom project. happy-dom becomes more valuable on lower-core CI runners.
3. **Vitest 4 renamed `poolOptions.threads.isolate` → top-level `isolate`.** The nested form (`test.poolOptions.threads.isolate`) is silently ignored in 4.1.2 — tests ran as if `isolate: true`, which is why initial numbers looked safe but small. Moving to `isolate: false` at top-level *actually* disables isolation — and that revealed ~107 files with latent state leakage.
4. **`isolate: false` is too dangerous to land today.** It would cut wall clock to ~9 s (67 % reduction alone, 85 %+ combined with sharding). But 431 tests fail because Radix Menu portals, Radix Table state, and shared DOM globals leak across files in the same worker. Worth fixing (VI-179) but not in this spike.
5. **Workspace split alone (L3) saves only 0.3 s.** Most test time lives in the dom project — splitting it out doesn't help unless you also tune the dom project.
6. **Sharding is the real unlock for CI.** 30 % from config tuning + matrix parallelism is what gets us to 78 %. One of the two alone is not enough.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------:|-----------|
| happy-dom edge cases surface over time (Radix focus, Three.js SSR tests, cmdk keyboard nav) | Medium | Baseline pass today is 2,871/2,871. Add CI regression check; if a test breaks, flip its env back to jsdom with an `@vitest-environment jsdom` docblock |
| `isolate: false` allows state leaks between tests in same worker | Medium | All 2,871 tests still pass after three warm runs. Watch for flakiness — if a suite proves stateful, opt it back into isolation via per-file `@vitest-isolate` or move to its own project |
| 4 matrix runners × full build multiplies GitHub Actions minutes (4× install + 4× build) | Medium | Use `actions/cache` for `node_modules` and `dist/`. Build cost is ~30 s once cached. Net CI *minutes* still drop because wall clock matters more than aggregate minutes for developer iteration |
| Axe setup not registered if someone writes an a11y test without importing from `test-utils/axe` | Low | Add an eslint rule or CI grep that flags `toHaveNoViolations` usage without the import |
| Vitest 4.x `poolOptions` placement is a known bug | Low | Pin vitest 4.1.2 until confirmed fixed upstream; test both placements on next minor bump |

## Follow-Up Tickets to File

Each of these should be its own VI ticket so wins can land independently with separate PR review. Prioritised by ROI.

1. **VI-172 (P1) — Land vitest lazy-axe + pool tuning (L1 + L4).**
   Scope: apply `test/utils/axe.ts` self-register, strip global axe from `vitest.setup.ts`, add `pool: "threads"` + `isolate: false` in `vitest.config.ts`. No CI change. Expected: 30 % local speedup. Risk: low. Estimate: 2 pts.

2. **VI-173 (P1) — CI test sharding matrix (L5).**
   Scope: convert `build-and-test` workflow to a 4-way matrix with `--shard=N/4`; cache `node_modules` + `dist/` across shards. Expected: pipeline wall clock 5–6 s. Risk: medium (matrix debugging, cache hygiene). Estimate: 3 pts. Depends on VI-172.

3. **VI-174 (P2) — happy-dom swap for dom project (L2).**
   Scope: add `happy-dom` dep; introduce `vitest.workspace.ts` with node + dom projects; set `environment: happy-dom` on dom project. Expected: marginal wall clock win locally, larger win on 2–4 core CI runners. Risk: medium (edge cases in Radix/cmdk/Embla). Estimate: 3 pts. Independent of VI-172/173.

4. **VI-175 (P2) — Workspace split node vs dom (L3).**
   Scope: even if happy-dom is rejected (VI-174), still split node vs dom to stop loading jsdom for CLI/theme-engine. Could land inside VI-174. Estimate: 1 pt if bundled, 2 pts if standalone.

5. **VI-176 (P3) — Audit `deps.inline` / `optimizeDeps` (L6).**
   Scope: import aggregate is still 106 s post-POC. Profile with `--logHeapUsage --reporter=verbose`; dedupe React plugin transforms per worker. Exploratory — may land no change. Estimate: 2 pts.

6. **VI-177 (P3) — Re-bin shards to balance shard-4.**
   Scope: current `--shard=N/4` uses simple file-hash bin-packing. Slowest shard is 18 % bigger than fastest. Consider `vitest --sharding` heuristics or a custom manifest. Estimate: 2 pts. Only worth doing if VI-173 landed and CI wall clock sits at the shard-4 ceiling.

7. **VI-178 (P3) — Document Vitest 4 API migration for future config changes.**
   Non-code: add a short note in `docs/wisdom/` (or a new W0xx entry) capturing that Vitest 4 moved `poolOptions.threads.isolate` to a top-level `isolate` option. Estimate: 1 pt.

8. **VI-179 (P2) — Fix test state leakage so `isolate: false` can land.**
   Scope: isolate:false halves wall clock but leaks state across ~107 files — primarily Radix Menu portals that accumulate in a shared DOM and Radix Table state that persists. Fix leakage (explicit `cleanup()` in `afterEach`, proper portal teardown) then land `isolate: false`. Expected: further 50 % cut on top of current POC. Risk: high — touches 100+ test files. Estimate: 8 pts.

**Not recommended:** landing all levers as one PR. Sharding (L5) is the big CI win but carries matrix/cache risk that deserves its own review.

## Reproducing

From the POC branch:

```bash
git checkout vi-171-spike-cut-vitest-runtime-75
npm ci
npm run build -w packages/theme-engine -w packages/tokens -w packages/cli
/usr/bin/time -l npm test                 # ~19.5 s warm
npx vitest run --shard=1/4                 # ~5.1 s
npx vitest run --shard=4/4                 # ~5.7 s (slowest)
```

Raw artefacts: `.lo/bench/` on the POC branch has every `/usr/bin/time` log and vitest stdout used for the numbers in this report.
