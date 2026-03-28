---
id: W003
topic: MDX strips whitespace from JSX template literal props
tags: [mdx, fumadocs, docs, whitespace]
scope: local
severity: high
---

# W003: MDX strips whitespace from JSX template literal props

## Lesson

MDX compilation removes leading whitespace from template literal content inside JSX props. A `code` prop like:

```mdx
<ComponentPreview code={`<Parent>
  <Child />
</Parent>`} />
```

Compiles to a string with zero indentation: `<Parent>\n<Child />\n</Parent>`.

## Fix

Two-layer defense:

1. **Use escaped strings** instead of template literals for code props in MDX:
   ```mdx
   <ComponentPreview code={"<Parent>\n  <Child />\n</Parent>"} />
   ```

2. **Add `dedent()` in the component** as a safety net — strips common leading whitespace from all non-empty lines before passing to Shiki. This handles any extra indentation MDX adds.

## Context

Discovered when ComponentPreview code blocks showed flat (unindented) JSX while the markdown code fences above them showed proper nesting. The compiled `.next` output confirmed MDX stripped the spaces.

## How to Apply

- When writing new ComponentPreview code props, always use `{"..."}` with explicit `\n` — never template literals
- The `dedent()` function in `preview.tsx` and `block-preview.tsx` handles edge cases
