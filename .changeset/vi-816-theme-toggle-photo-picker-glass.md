---
"@loworbitstudio/visor": minor
---

ThemeToggle reads the glass layer. Inside `data-glass="on"` it takes the glass layer's control fill, hover fill, ring and ink and blurs the photo behind it with the control blur, the same values Button's `glass` variant reads; everywhere else it stays a solid button with no `backdrop-filter`. It stays round where a theme draws squircle corners. ThemeToggle and PhotoPicker take their easing from `--motion-easing-enter`, and PhotoPicker's draw wave from `--motion-duration-enter` when the theme sets it. `visor render` gains a `glass` fixture for both.
