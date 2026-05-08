# W012 — Docs MDX components require a re-export shim in `packages/docs/components/ui/`

## Lesson

The `@/` alias in the docs package resolves to `packages/docs/`, not the repo root. Components that live at `components/ui/<name>/<name>.tsx` (repo root) are not directly accessible from MDX pages via `@/components/ui/<name>/<name>`.

Every component used in a docs MDX page requires a shim file at `packages/docs/components/ui/<name>.tsx` that re-exports from the root:

```tsx
// packages/docs/components/ui/color-bar.tsx
'use client';

export { ColorBar } from '../../../../components/ui/color-bar/color-bar';
```

MDX pages then import via the shim path:

```tsx
import { ColorBar } from '@/components/ui/color-bar';
```

## Pattern

The shim file must include `'use client'` since all specimen components use hooks. This is the difference between RSC-compatible and broken at prerender.

Both flat (`packages/docs/components/ui/<name>.tsx`) and subdirectory (`packages/docs/components/ui/<name>/<name>.tsx`) variants are valid — match the import path used by the MDX page.

## Enforcement

The `docs-proxy-exists` rule in `scripts/rules/` runs as part of `npm run validate` and CI. It fails when a component at `components/ui/<name>/<name>.tsx` is missing both proxy variants, or when the existing proxy is missing the `'use client'` directive. See `CONTRIBUTING.md` ("Docs proxy file") for the scaffolding checklist.

## Tags

`docs`, `nextjs`, `mdx`, `imports`, `alias`, `fumadocs`
