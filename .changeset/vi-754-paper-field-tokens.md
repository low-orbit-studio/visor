---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

VI-754: Paper declares the field family and a 13px desk type floor.

- Paper now sets `--input-bg`, `--textarea-bg`, `--select-bg`, `--number-input-bg`, `--tag-input-bg`, `--combobox-bg` and `--otp-bg` to a 6% ink fill, and their `-border` tokens to `transparent`, in both modes. A root theme's field tokens can no longer inherit into a Paper scope. Focus and invalid rings still draw.
- New `typography.floor` (px): any `--font-size-*` step below it is raised to it. Paper sets `13`, so its `--font-size-xs` is 13px. Unset, output is unchanged.
