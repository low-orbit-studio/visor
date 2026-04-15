# W016: Mocking Node.js built-ins requires `@vitest-environment node` and a guarded setup file

**Tags:** testing, vitest, mocking, node, jsdom, child_process

## Lesson

When writing tests that mock Node.js built-in modules (e.g. `child_process`, `fs`, `os`), always force the `node` environment on those test files — and guard any jsdom-specific setup code against running in that environment.

**Two required changes:**

1. **Add `@vitest-environment node` docblock** to the test file. Without it, the workspace-root `vitest.config.ts` applies `jsdom` globally, which breaks `vi.mock` resolution for built-ins and causes mock implementations to bleed between tests (`vi.mocked(...).mockImplementation is not a function`).

2. **Guard `vitest.setup.ts` DOM stubs** with `typeof Element !== "undefined"`. The setup file runs in whatever environment the test specifies — switching a test to `node` causes DOM references in the setup file to throw `ReferenceError: Element is not defined`.

**Also:** always run `npx vitest run <path>` from the **workspace root** before pushing. Running from inside the package (`packages/cli`) uses a different config (`environment: "node"`) and hides this class of failure entirely.

## Example

```ts
// @vitest-environment node  ← required for Node.js built-in mocking
import { execFileSync } from 'child_process'
import { vi } from 'vitest'

vi.mock('child_process', () => ({ execFileSync: vi.fn() }))
```

```ts
// vitest.setup.ts — guard DOM stubs against node environment
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = function () {}
}
```

## Context

Discovered during VI-170 (doctor stale-global-cli check). The test passed locally when run from `packages/cli` (node environment) but failed in CI and from the workspace root (jsdom environment). Took three pushes to diagnose: first missing `mockImplementation`, then mock bleeding between tests, then setup file crash on environment switch.

## Fix Locations

- Test files mocking Node.js built-ins: add `// @vitest-environment node` as first line
- `vitest.setup.ts`: guard all `Element.*` and other DOM references with `typeof Element !== "undefined"`
