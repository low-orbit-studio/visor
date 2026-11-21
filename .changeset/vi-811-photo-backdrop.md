---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-core": minor
---

`npx visor add photo-backdrop` ships PhotoBackdrop, the photo behind a surface, lifted from the Honcho kit's backdrop without its `motion` dependency. Changing `current` fades the new background in over the last once its photo has loaded, settling from a 1.06 zoom, as CSS animations (`--photo-backdrop-*` variables, defaulting to the theme's `--motion-duration-page` and in-out curve); reduced motion drops the zoom and makes the fade near-instant. Upcoming photos preload one at a time at low priority after the photo on screen, `focal` keeps the subject in frame, `--photo-backdrop-fallback` shows until the first photo loads, and a `srcSet` builder prop replaces Honcho's file naming. With no `current` it renders nothing.

visor-core's glass switch now also matches any element holding a PhotoBackdrop as a direct child (`:has(> [data-slot="photo-backdrop"])`), so glass is on exactly where a photo is drawn.
