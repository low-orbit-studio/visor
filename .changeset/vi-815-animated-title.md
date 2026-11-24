---
"@loworbitstudio/visor": minor
---

feat: add AnimatedTitle (VI-815), lifted from the Honcho kit's TitleWords and rebuilt in CSS

`npx visor add animated-title` ships a title drawn word by word with CSS keyframes and a per-word `animation-delay` (word i starts at `delay + i × stagger`), with no animation library. `animation="blur"` (default) lifts each word 6px into focus from a 14px blur (1.1s, 60ms apart); `rise` slides it up out of a mask (1.05s, 55ms apart); `weight` fades it in from weight 300 to 520 (1.3s, 50ms apart). The curve is the theme's `--motion-easing-enter`; durations and staggers are `--animated-title-duration` / `--animated-title-stagger` with the kit's numbers as defaults. `play={false}` holds the words on their first frame, `delay` (ms) sets `--animated-title-delay`, `format` draws each word, and `as` picks the element (default `h2`). Screen readers read the full title once from a visually hidden copy; the words are `aria-hidden`. Under reduced motion the title shows settled with no animation.
