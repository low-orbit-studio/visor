---
"@loworbitstudio/visor": patch
---

VI-627: Stop `visor spawn` defaulting its blessed-build root to a hardcoded `$HOME` path.

`spawn` resolved its blessed-build root to `$HOME/Code/low-orbit/low-orbit-playbook/design-prototypes` whenever neither `--blessed-dir` nor `VISOR_BLESSED_DIR` was supplied. That is one developer's machine layout shipped inside a public npm package: on a CI runner, a second machine, or any other clone location it resolved to a directory that does not exist, and `spawn` failed at build discovery with a misleading `Available builds: (none found)` against a path that was never real — sending the reader looking for missing *builds* when the actual problem was a missing *root*.

The `$HOME`-relative constant is gone. Resolution is now `--blessed-dir` → `VISOR_BLESSED_DIR` → discovery (the nearest `design-prototypes/` directory found by walking up from the current working directory). When none of the three resolves, `spawn` (and `spawn --list-blessed`) fails with an actionable `No blessed-build root configured. Pass --blessed-dir <path>, set VISOR_BLESSED_DIR, or run from a checkout that contains a 'design-prototypes/' directory.`

`--blessed-dir` and `VISOR_BLESSED_DIR` behaviour is unchanged.
