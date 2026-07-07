---
"@loworbitstudio/visor": patch
---

Clean the admin-block registry substrate under the React 19 compiler `react-hooks/*` lint rules so consumers on a stock `eslint-config-next` config no longer get a red lint gate from vendored copy-and-own source (VI-602). `sidebar` now derives `isMobile` from a `matchMedia` subscription via `useSyncExternalStore` instead of a `setState`-in-effect (`react-hooks/set-state-in-effect` error, SSR-safe, behavior-preserving). `data-table`'s unavoidable TanStack `useReactTable()` interaction (`react-hooks/incompatible-library`) is now suppressed with a narrow, documented inline disable at the single call site rather than a dir-wide exemption. `bulk-action-bar`'s mount-only auto-focus disable directive was repositioned so it still suppresses `react-hooks/exhaustive-deps` under the newer rule (which reports on the deps-array line). Consuming apps can drop the `components/ui/**` + `blocks/**` ESLint exemption.
