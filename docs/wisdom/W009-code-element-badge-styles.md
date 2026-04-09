# W009 — `<code>` elements inherit global badge styles

## Lesson

When displaying text directly on a colored surface (color swatches, color bars, any tinted background), use `<span>` with explicit `font-family: var(--font-mono)` rather than `<code>` elements.

Theme CSS often applies visual badge treatment to `<code>` tags — background color, padding, border-radius — which causes unwanted pill/badge appearance when the goal is plain text rendered on top of a color.

## Example

```tsx
// ✗ Picks up global badge styles
<code className={styles.hex} style={{ color: textColor }}>{hex}</code>

// ✓ Plain text, monospace applied via CSS
<span className={styles.hex} style={{ color: textColor }}>{hex}</span>
```

```css
/* hex class in CSS module */
.hex {
  font-family: var(--font-mono, monospace);
  font-size: var(--font-size-xs, 0.75rem);
  line-height: 1;
}
```

## Affected components

`ColorSwatch`, `ColorBar`, `FontShowcase` — any component that overlays monospace text on a colored background.

## Tags

`css`, `typography`, `color`, `specimen`, `code-elements`
