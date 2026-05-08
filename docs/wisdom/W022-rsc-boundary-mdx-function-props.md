# W022 — MDX demos for components with function props need a `'use client'` wrapper

**Tags:** docs, nextjs, mdx, rsc, fumadocs, function-props

## The Lesson

When a component accepts function props (like `renderItem`, `renderSeparator`, `renderRow`), the MDX demo cannot pass an inline arrow function directly. The MDX file is a React Server Component by default; passing a function across the RSC boundary fails Next.js prerender with:

```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
```

The fix is to extract the demo into a separate `'use client'` wrapper component under `packages/docs/components/ui/<component>-demo.tsx`, then import and render that wrapper from the MDX page.

## Why MDX Is RSC By Default

`packages/docs/` is a Next.js App Router site. Every MDX file under `content/docs/` is compiled as a Server Component unless something in the import chain forces a client boundary. Plain string and JSX-literal props serialize fine across the boundary, but functions do not — React refuses to send a function reference into a Client Component because the server has no way to round-trip a closure.

The component itself (e.g. `<Marquee>`) already has `'use client'`. That makes `<Marquee>` a Client Component, and Client Components consume props by serialization. Inline arrow functions in MDX `<Marquee renderItem={(item) => ...}>` fail at this serialization step because the surrounding MDX is the Server Component.

## The Wrapper Pattern

1. Create `packages/docs/components/ui/<component>-demo.tsx` with `'use client'` at the top.
2. Define and export a named demo component there. The arrow function lives inside this client component, where it never crosses an RSC boundary.
3. Import the demo from the MDX page and render it as a self-closing JSX element.

### Example: client-demo wrapper

```tsx
// packages/docs/components/ui/marquee-demo.tsx
'use client';

import { Marquee } from '../../../../components/ui/marquee/marquee';

const logos = ['AC', 'VR', 'LO', 'FG', 'NT', 'LN'];

export function MarqueeRenderItemDemo() {
  return (
    <Marquee
      items={logos}
      separator="·"
      renderItem={(item) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-muted)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {item}
        </span>
      )}
    />
  );
}
```

### Example: MDX import + render

```mdx
import { MarqueeRenderItemDemo } from '@/components/ui/marquee-demo';

<ComponentPreview
  title="Custom renderItem"
  code={"…verbatim source string…"}
>
  <MarqueeRenderItemDemo />
</ComponentPreview>
```

The `code` prop is a string literal, so it serializes across the boundary fine — only the live preview child needs the wrapper.

## Naming Convention

- One wrapper per component is sufficient even if the component has multiple function-prop demos. Export multiple named components from the same `<component>-demo.tsx` file (e.g., `MarqueeRenderItemDemo`, `MarqueeRenderSeparatorDemo`).
- Name the wrapper `<Component><Variant>Demo` (PascalCase) so import sites read clearly.
- File path: `packages/docs/components/ui/<component>-demo.tsx` (kebab-case).

## When to Reach for This

Reach for this pattern whenever a component prop is typed as a function — `renderItem`, `renderSeparator`, `renderHeader`, `onCustomEvent` callbacks shown inline, etc. String, number, boolean, ReactNode, and plain object props serialize fine and do **not** need a wrapper.

The plain (no-function-prop) demos can stay inline in MDX — only escalate to a wrapper when an arrow function appears in the demo source. See [W012](./W012-docs-component-shims.md) for the separate (but adjacent) docs proxy file pattern that every component needs regardless of function props.

## Canonical Example

VI-325 introduced [`Marquee`](https://github.com/loworbit/visor/pull/365) with a `renderItem` prop. The merged version uses this pattern:

- Wrapper: [`packages/docs/components/ui/marquee-demo.tsx`](../../packages/docs/components/ui/marquee-demo.tsx) — exports `MarqueeRenderItemDemo`.
- MDX consumer: [`packages/docs/content/docs/components/data-display/marquee.mdx`](../../packages/docs/content/docs/components/data-display/marquee.mdx) — imports `MarqueeRenderItemDemo` and renders `<MarqueeRenderItemDemo />` inside `<ComponentPreview>`.

The first PR landed without the wrapper and broke prerender on Vercel. The follow-up extracted `MarqueeRenderItemDemo` and unblocked the build.
