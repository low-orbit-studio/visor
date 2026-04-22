# Patterns

Demo components for the Patterns section of the Visor docs. Each file is a
self-contained `*Demo` component that renders inside a `<BlockPreview>` in the
corresponding MDX page under `content/docs/patterns/`.

## Convention

- File name: `<pattern-slug>-demo.tsx`
- Export: named export matching the PascalCase component name
- No external state required — demos should be fully self-contained
- Import Visor components via `@/components/ui/<component>`
- Icons via `@phosphor-icons/react`

## Example MDX usage

```mdx
import { BlockPreview } from '@/components/block-preview';
import { EmptyStateDemo } from '@/components/patterns/empty-state-demo';

## Preview

<BlockPreview title="Empty State" code={"<EmptyStateDemo />"}>
  <EmptyStateDemo />
</BlockPreview>
```
