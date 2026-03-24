---
id: W001
topic: vitest-axe requires custom type declarations
tags: [testing, typescript, a11y, vitest-axe]
scope: local
severity: moderate
---

# W001: vitest-axe requires custom type declarations

## Lesson

The `vitest-axe` package (v0.1.0) has two type-related bugs that cause `tsc --noEmit` to fail:

1. **Broken chunk reference** — `dist/index.d.ts` imports from `to-have-no-violations-e1679411.js`, but the actual JS chunk is named `chunk-X4FZIUYL.js`. This prevents TypeScript from resolving the `axe` export.
2. **Deprecated namespace** — `extend-expect.d.ts` augments `namespace Vi` (pre-v1 Vitest), but modern Vitest uses `declare module "vitest"` for matcher augmentation.

## Fix

A custom `vitest-axe.d.ts` at repo root provides both the module declaration for `vitest-axe` exports (`axe`, `configureAxe`) and the Vitest `Assertion` augmentation for `toHaveNoViolations`. This file is included in `tsconfig.json`.

## Context

Discovered during VI-28 when CI typecheck failed but local `npm test` (which uses Vitest's own type resolution) passed. Tests run fine — this is purely a `tsc` issue.

## How to Apply

- If upgrading `vitest-axe`, check whether the packaging bugs are fixed upstream — if so, `vitest-axe.d.ts` can be removed.
- If adding new axe matchers (e.g., `toHaveNoIncompleteResults`), add them to `vitest-axe.d.ts`.
