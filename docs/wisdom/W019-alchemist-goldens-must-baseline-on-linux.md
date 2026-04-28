# W019 — Alchemist CI goldens must be baselined on Linux, not macOS

**Tags:** flutter, testing, golden, alchemist, ci, docker
**Source:** [VI-256](https://linear.app/low-orbit-studio/issue/VI-256) — first CI run produced 1.04% pixel diffs across all 6 `visor_button` goldens, despite alchemist's CI mode using the Ahem font.

## What

When introducing alchemist golden tests to a Visor Flutter widget, you cannot generate the canonical CI baselines on macOS — even though alchemist's `CiGoldensConfig` uses the Ahem font for cross-OS character shape determinism. The Ahem font fixes glyph rendering, but rasterisation, anti-aliasing, and box rendering still differ subtly between macOS and Linux. A first PR that seeds goldens locally on macOS will fail every assertion on Linux CI with ~1% (~500 px) diffs.

W018 already says "run `flutter test --update-goldens` only on Linux to avoid host-OS divergence." This wisdom names the **how** — the specific Docker image and command — so future Wave 2 widget PRs do not relearn it.

## How (Docker workaround for macOS contributors)

```bash
# From the visor repo root
docker run --rm \
  -v "$PWD:$PWD" \
  -w "$PWD/components/flutter" \
  -e CI=true \
  ghcr.io/cirruslabs/flutter:3.35.5 \
  bash -c "git config --global --add safe.directory '*' \
    && flutter pub get \
    && flutter test --update-goldens visor_button/"
```

Notes:
- **Bind-mount the host path verbatim** (`$PWD:$PWD`), not `/work` or similar. Worktree `.git` files contain absolute host paths that must resolve identically inside the container.
- **Run as root** (omit `--user`). The container's Flutter SDK at `/sdks/flutter` writes to its own cache during `pub get`; running as the host user fails with permission errors. The Docker socket on macOS handles file-ownership translation back to the host user automatically (otherwise `chown -R` after).
- **Set `CI=true`** so alchemist's `HostPlatform.current()` produces CI goldens (Ahem font), not platform-specific ones.
- **Whitelist `*` in git safe.directory** because the container sees foreign UID-owned paths and would otherwise refuse.

## Why this matters

- Saves the next 8 Wave 2 widget PRs (VI-247, VI-249, VI-250, VI-251, VI-253, VI-254, VI-255, plus future) from rediscovering this. Each would otherwise burn a CI run + a Docker spelunking session.
- The `subosito/flutter-action` runs at the same Flutter pin (`3.35.5`) as `ghcr.io/cirruslabs/flutter:3.35.5`, so locally-Docker-generated baselines match CI byte-for-byte.

## When this applies

- Adding alchemist goldens to a new `visor_*` Flutter widget (Wave 2 ports).
- Updating goldens after intentional visual changes (theme tweaks, padding adjustments).
- Pre-PR seed run for any new golden suite landed via batch tickets.

## References

- [`alchemist` README — About platform tests vs. CI tests](https://github.com/Betterment/alchemist#about-platform-tests-vs-ci-tests).
- [`ghcr.io/cirruslabs/flutter`](https://github.com/cirruslabs/docker-images-flutter) — official Linux Flutter image; pinned versions match `subosito/flutter-action` releases.
- [W018 — Flutter widget quality baseline: built-in matchers + alchemist](./W018-flutter-widget-contract-baseline.md) — the parent guidance this concretises.
- [Flutter widget quality contract — Rec1, S16](../flutter-widget-quality-contract.md) — the contract row this supports.
