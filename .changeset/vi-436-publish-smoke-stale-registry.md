---
"@loworbitstudio/visor": patch
---

VI-436 fix(scripts): `visor-publish-smoke.mjs` now detects a stale local `dist/registry.json` and exits with a clear "rebuild first" message instead of reporting phantom content drift.

The smoke compares a locally-built `dist/registry.json` to the registry inside the latest published npm tarball. When the local build was stale relative to source, every primitive whose source had changed since the last build registered as "content drift" and recently-added primitives registered as "missing in source" — eroding trust in the publish-gate signal exactly like a false negative would. Adds a freshness check that stats every source file referenced by the current registry plus the `registry/*.ts` definitions and the build-registry script itself; exits code 2 with the offending newer file's path when stale. Wires a new `--skip-staleness-check` flag for CI (which already builds immediately before invoking the smoke) and updates the `smoke:publish` npm script to chain `npm run build:registry -w packages/cli` so the happy path "just works" for operators.
