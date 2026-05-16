---
"@loworbitstudio/visor": minor
---

VI-402 feat: `AdminSettingsSection` gains `eyebrow`, `titleSize`, and `titleFamily` props for editorial section headers.

Sections can now render an uppercase eyebrow label (e.g. "ACCOUNT · PROFILE") above the title, plus tune the title scale (`"default" | "lg" | "xl" | "marquee"`) and font family (`"body" | "marquee"`). Mirrors PageHeader's existing API (VI-303). Sections without the new props are byte-for-byte unchanged.
