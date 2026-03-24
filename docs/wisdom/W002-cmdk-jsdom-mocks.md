# W002: cmdk requires scrollIntoView mock and axe-core rule exception in jsdom

**Tags:** testing, cmdk, a11y, jsdom

## Lesson

The `cmdk` library (Command Palette) requires two jsdom accommodations:

1. **`scrollIntoView` mock** — cmdk calls `Element.prototype.scrollIntoView` for keyboard navigation, which jsdom doesn't implement. Without the mock, all cmdk tests throw `e.scrollIntoView is not a function`. Added globally in `vitest.setup.ts`.

2. **`aria-required-children` axe-core exception** — cmdk wraps `role="option"` items inside group divs between the `role="listbox"` container and the option elements. axe-core flags this as a violation (`aria-required-children`), but cmdk manages the ARIA semantics correctly. Disable this rule in command component a11y tests.

## Context

Discovered during VI-32 (Navigation & Menu Components) when adding the Command Palette component.

## Fix Location

- `vitest.setup.ts` — scrollIntoView mock (line ~32)
- `components/ui/command/__tests__/command.test.tsx` — axe rule exception in a11y test
