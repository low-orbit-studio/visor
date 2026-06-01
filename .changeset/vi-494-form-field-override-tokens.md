---
"@loworbitstudio/visor": minor
---

Form-field override token fallbacks (VI-494). Every form-field component now
exposes a per-component CSS override token as the outer fallback so themes can
retune fill and border without editing component CSS: `--{cmp}-bg` /
`--{cmp}-border` on input, textarea, select, number-input, otp-input, combobox,
and tag-input; `--switch-track-bg` on the switch track; `--radio-border` on the
radio-group border. The full semantic fallback chain is preserved — a theme that
sets none of the new tokens renders byte-for-byte identically to today, so the
change is backward-compatible. Unblocks BL-227 (Blacklight solid field
treatment).
