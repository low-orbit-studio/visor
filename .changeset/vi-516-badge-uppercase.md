---
"@loworbitstudio/visor": minor
---

Add `uppercase` prop to Badge for editorial label rendering (ENTERPRISE, PRO, FREE).

The prop applies a `.uppercase` CSS module class that sets the new `--badge-text-transform` CSS custom property to `uppercase`. The token hook means a theme can also drive text-transform without the prop — set `--badge-text-transform: uppercase` anywhere in the theme cascade.

Default behaviour (prop omitted) is unchanged: no `text-transform` is applied and mixed-case labels render as before.
