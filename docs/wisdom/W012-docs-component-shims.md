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

The shim file must include `'use client'` since all specimen components use hooks.

## Tags

`docs`, `nextjs`, `mdx`, `imports`, `alias`, `fumadocs`
