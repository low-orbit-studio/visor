# VI-799 Compare: Kit Notice vs Visor Soft Alert

The honcho-planning Everything Page FormDeck "Your Answers Didn't Send" Notice
(`/formdeck/everything?frame=slides/submit-failed/failed&tone=dark|light`, read-only)
next to Visor's soft destructive Alert on the `honcho-backstage` theme, in Dark + Photo
and Light + Photo, over the same Backstage photo, at the same 350px width.

Each `side-by-side__*.png` is Notice | Alert | difference. `diff__*.png` is the
per-pixel difference (brighter is more different), both padded, never stretched.

## Matches

| Property | Kit Notice | Visor soft Alert |
|---|---|---|
| Backdrop filter | `blur(24px) saturate(1.15)` | the same, from `--glass-on-control-blur` |
| Outline, Dark + Photo | 1px inset, white at 64% | the same |
| Icon, title, body ink | ink 100 / ink 100 / ink 80 | the same, from `--glass-on-ink` |
| Icon gap | 12px | 12px |
| Edge | full outline, no stripe | full outline, no stripe |

## Remaining Deltas

| Property | Kit Notice | Visor soft Alert | Where it closes |
|---|---|---|---|
| Fill | ink at 10% | ink at 9% (`--glass-control-fill`) | honcho-backstage glass value |
| Outline, Light + Photo | ink at 80% | ink at 64% | the kit's light ink-64 is 80%; LYD-92 |
| Corner | 16px | 24px | bind `--alert-radius` in honcho-backstage |
| Inset | 14px 18px | 12px 14px | bind `--alert-soft-padding` |
| Icon | 20px | 32px (every tone, the info note included, since round 2) | bind `--alert-icon-size` |
| Title | 15/22, weight 620 | 14/21, weight 700 | no Visor knob; LYD-92 |
| Body line height | 20px | 21px | no Visor knob; LYD-92 |
| Link | underlined, 2px offset | inherits the page's link style | a line in honcho-planning; LYD-92 |
| Behind the alert | the FormDeck slide's glass card | the docs specimen's glass form panel (the glass layer's recipe, card fill and blur) | page context, not the Alert |

Captured with `clean-capture.mjs` (`cleanShot`), each PNG stamped with its base commit.
