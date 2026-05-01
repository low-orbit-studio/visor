---
"@loworbitstudio/visor": minor
---

Add Flutter documentation section to the docs site (getting started, theming, tokens, and per-widget pages for button, stat-card, empty-state, section-header), platform `<Tabs>` on shared component pages with React + Flutter snippets, and a new `visor theme verify --target flutter <flutter-project>` CLI subcommand that runs `dart analyze` on generated Dart output. The verify command exits 0 on success, 1 on Dart analyzer errors, and supports `--json` for programmatic use. M4.B.1 of Phase 10a; unblocks per-widget Flutter MDX docs.
