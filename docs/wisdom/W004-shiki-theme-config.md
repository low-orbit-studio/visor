---
id: W004
topic: Shiki theme config — spread order and dual-theme mode
tags: [shiki, fumadocs, docs, syntax-highlighting, css-variables]
scope: local
severity: high
---

# W004: Shiki theme config — spread order and dual-theme mode

## Lesson

Two independent issues caused ComponentPreview code blocks to render different colors than markdown code fences:

### 1. Spread order in source.config.ts

`rehypeCodeDefaultOptions` contains its own `themes` property. If you spread it AFTER your custom `themes`, it silently overwrites your config:

```ts
// WRONG — rehypeCodeDefaultOptions.themes overwrites your themes
rehypeCodeOptions: {
  themes: { light: 'github-light', dark: 'tokyo-night' },
  ...rehypeCodeDefaultOptions,
}

// CORRECT — your themes override the defaults
rehypeCodeOptions: {
  ...rehypeCodeDefaultOptions,
  themes: { light: 'github-light', dark: 'tokyo-night' },
}
```

### 2. Single-theme vs dual-theme mode

Fumadocs uses Shiki's **dual-theme** mode: `themes: { light, dark }` with `defaultColor: false`. This generates CSS variables (`--shiki-light`, `--shiki-dark`) on each token span. Fumadocs' `shiki.css` then applies `color: var(--shiki-light)` or `color: var(--shiki-dark)` based on `.dark` class.

ComponentPreview must use the same dual-theme API — NOT the single-theme `theme: 'tokyo-night'` API, which generates inline `color` styles that don't respond to theme switching.

## Context

Discovered when comparing the "Usage" markdown code fence (blue component names) with the "Variants" ComponentPreview code block (red/pink component names) on the toggle-group docs page.

## How to Apply

- Any component that calls `codeToHtml()` must use `themes: {}` + `defaultColor: false`
- Never change the spread order in `source.config.ts` — custom config must come last
- If adding a new Shiki consumer, match the exact config from `source.config.ts`
