# @loworbitstudio/visor-core

## 0.6.0

### Minor Changes

- VI-312: Ship every `dist/*.css` file pre-wrapped in matching CSS `@layer` blocks (`visor-primitives`, `visor-semantic`, `visor-adaptive`) with a layer-order declaration prepended. Generated themes from `visor theme apply --adapter nextjs` now win the cascade against visor-core's defaults without consumer intervention. Unlayered consumer overrides written after `@import "@loworbitstudio/visor-core"` continue to win — the documented override pattern is unchanged.

## 0.5.0

### Minor Changes

- 7ec9229: Ship stock themes (blackout, modern-minimal, neutral, space) as npm subpath exports. Consumers can now `import '@loworbitstudio/visor-core/themes/blackout'` and apply the matching `.{slug}-theme` class.

## 0.4.1

### Patch Changes

- 84e3cb5: Document WCAG AA contrast ratios for text tokens and add migration note for consumers with local overrides.

## 0.2.0

### Minor Changes

- Initial release of Visor design tokens — CSS custom properties for primitives, semantic tokens, and light/dark themes.
