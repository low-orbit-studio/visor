# VI-813 RichText Five-Look Shots

Ten shots: five looks at 390 and 1440 wide, from `packages/docs/e2e/rich-text-five-looks.spec.ts` with `VI813_SHOTS` set.

| Look | 390 | 1440 | In This Repo |
|------|-----|------|--------------|
| Today | `rich-text__today__390.png` | `rich-text__today__1440.png` | Yes |
| Dark | `rich-text__dark__390.png` | `rich-text__dark__1440.png` | Yes |
| Dark + Photo | `rich-text__dark-photo__390.png` | `rich-text__dark-photo__1440.png` | No |
| Light | `rich-text__light__390.png` | `rich-text__light__1440.png` | Yes |
| Light + Photo | `rich-text__light-photo__390.png` | `rich-text__light-photo__1440.png` | No |

The four photo-look shots show a private Honcho Campout client photo, so they stay out of this public repo (operator ruling VI-829 q-4). They are captured and checked like the others, and all ten are on the Review Host page: http://vi-813.visor.localhost:4100/

To re-take them, point `VI813_PHOTO_DARK` and `VI813_PHOTO_LIGHT` at the private photos (a night photo and a daytime photo). The `.gitignore` here keeps the photo shots from being committed.
