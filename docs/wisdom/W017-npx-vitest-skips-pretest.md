# W017: `npx vitest run` bypasses npm's `pretest` hook — run it explicitly in CI

**Tags:** testing, vitest, ci, npm, hooks

## Lesson

When invoking vitest directly with `npx vitest run --shard=N/M` (e.g., for CI sharding), npm lifecycle hooks like `pretest` are **not** executed. Only `npm test` / `npm run test` triggers `pretest`.

If `pretest` generates files that tests depend on — as Visor's does with `ensure-theme-overlays.mjs` producing `theme-config.custom.generated.ts` — the test run will fail with a cryptic vite import-resolution error on the generated file.

**Fix:** Add an explicit `npm run pretest` step before `npx vitest run` in CI:

```yaml
- name: Test
  run: |
    npm run pretest
    npx vitest run --shard=$SHARD/4
```

## Context

Discovered during VI-172 (skip docs build in CI). After switching the test step from `npm run test` to `npx vitest run --shard=...` in VI-171, the pretest hook stopped running. Shard 1/4 failed because `packages/docs/lib/__tests__/theme-config.test.ts` imports from `theme-config.custom.generated.ts`, which `ensure-theme-overlays.mjs` creates. Other shards passed by luck (they didn't include that file).

## Fix Locations

- `.github/workflows/ci.yml` — `build-and-test` job, Test step
