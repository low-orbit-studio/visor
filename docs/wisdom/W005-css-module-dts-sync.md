---
id: W005
topic: CSS module .d.ts files must be updated manually
tags: [css-modules, typescript, components]
scope: local
severity: moderate
---

# W005: CSS module .d.ts files must be updated manually

## Lesson

When adding new CSS classes to a `.module.css` file, the corresponding `.module.css.d.ts` type declaration file must be updated manually. There is no automatic generation.

At dev time, CSS module imports return `any` (via Vitest's `classNameStrategy: 'non-scoped'`), so missing types don't cause runtime errors. But `tsc --noEmit` will fail with `Property 'newClass' does not exist on type {...}`.

## Fix

Always update the `.d.ts` file in the same commit as the `.module.css` change. The format is straightforward:

```ts
declare const styles: {
  readonly existingClass: string
  readonly newClass: string  // <-- add here
}
export default styles
```

## Context

Discovered when adding `sizeXs` and `itemSizeXs` to `toggle-group.module.css` — the type declaration was not updated, causing `tsc` to fail while dev and tests passed fine.

## How to Apply

- When adding/removing/renaming CSS classes in any `.module.css`, immediately update the `.d.ts`
- Run `npx tsc --noEmit` to verify before committing
- The validation checker (once built) will automate this check
