# Style rules

Append-only. One rule per line: `- <rule> (source: <ticket or packet>, <date>)`.
A newer ruling supersedes an older one by saying so; never delete a line.

- [external/no-client-photos-public] Honcho's Campout photos never enter the public Visor repo, as the photo files or as screenshots of the Dark + Photo and Light + Photo looks. Photo-look screenshots go to the Review Station and .lo/ (gitignored) only; docs/audits/ holds the Today, Dark and Light shots. This overrides any ticket line or finding that asks for photo-look PNGs in the repo. (source: VI-813 (Justin, chat), 2026-11-23)
- [ci/no-new-ci-cost] Never edit .github/workflows/** to add a test, step or job without Justin's yes on its measured minutes. Browser tests (Playwright, VISOR_REQUIRE_BROWSER) are leaving CI (VI-847): keep new browser tests in the repo, run them locally and paste the result in the PR body. (source: Justin, chat, Nov 23 (VI-846/VI-847), 2026-11-23)
- [ci/no-webkit-in-ci] NEVER install or run WebKit in CI, in any job, for any reason (Justin, Nov 23: 'NO MORE WEBKIT IN CI EVER'). WebKit/Safari checks run locally only and their result goes in the PR body. (source: Justin, chat, Nov 23 (VI-808), 2026-11-23) Widened Nov 24 (Justin: "Obviously the all-project ban is for both chromium and webkit, not just webkit."): NO browser of any kind (Chromium, WebKit, Firefox) in CI, in any project; browser tests run locally.
