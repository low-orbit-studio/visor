---
"@loworbitstudio/visor": patch
---

Fix `HeroGlow` reduced-motion rest opacity: under `prefers-reduced-motion: reduce` the glow now rests at full opacity (`1`) instead of `0.75` (VI-581). The original `bl-hero-glow` (BL-326) set no base opacity and only killed the animation, so its computed rest was `1`; the registry port had "normalized" to the keyframe's `0.75` rest value, dimming reduced-motion users ~25%. A pixel-faithful adoption no longer needs a consumer override.
