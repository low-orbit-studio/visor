"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { DEFAULT_THEME, getStoredTheme, resolveBrandStrategy } from "@/lib/theme-config";
import type { BrandGoverns } from "@loworbitstudio/visor-theme-engine";
import styles from "./pillars.module.css";

/** Wildcard accepted in any `governs` list — matches all of that namespace. */
const GOVERNS_WILDCARD = "*";

/**
 * Track the active theme via the same `visor-theme-change` event the Explorer
 * dispatches — the re-resolution model established by the Brand section
 * (brand.tsx) and shared by the Strategy surface (strategy.tsx). The main
 * Explorer, dual-pane compare, and matrix only activate stock/custom themes, so
 * no extra private slugs are accepted here.
 */
function useActiveTheme(): string {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);
  useEffect(() => {
    const read = () => setTheme(getStoredTheme());
    read();
    document.addEventListener("visor-theme-change", read);
    return () => document.removeEventListener("visor-theme-change", read);
  }, []);
  return theme;
}

/**
 * Read each governed token's live computed value off `document.body` — where the
 * active theme class lives (`applyTheme` swaps `.{theme}-theme` on <body>), so the
 * read reflects the current theme AND mode. Tokens are body-scoped and mode-gated
 * by the <html> class (`html.dark .x-theme { --primary }`), so body's computed
 * style is the correct, mode-resolved source. Re-reads on the Explorer's
 * `visor-theme-change` event (theme swap), on a MutationObserver of the <html>
 * class (the mode toggle flips `.dark`/`.light` there, dispatching no event), and
 * on the `prefers-color-scheme` media query (auto mode). Mirrors the observer
 * pattern in comparator-specimen.tsx.
 */
function useResolvedTokenValues(tokenVars: string[]): Record<string, string> {
  const key = tokenVars.join(",");
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const names = key ? key.split(",") : [];
    const read = () => {
      const style = getComputedStyle(document.body);
      const next: Record<string, string> = {};
      for (const name of names) next[name] = style.getPropertyValue(name).trim();
      setValues(next);
    };
    read();
    document.addEventListener("visor-theme-change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", read);
    return () => {
      document.removeEventListener("visor-theme-change", read);
      observer.disconnect();
      mql.removeEventListener("change", read);
    };
  }, [key]);
  return values;
}

/** Normalize a `governs` token ref to a CSS custom-property name (leading `--`). */
function toCssVar(token: string): string {
  return token.startsWith("--") ? token : `--${token}`;
}

/**
 * A pillar governs nothing when it links no tokens, components, or surfaces — a
 * slogan with no claim. The CI coherence check is VI-505's job; this surfaces the
 * smell visibly (D2).
 */
function governsNothing(governs: BrandGoverns): boolean {
  const total =
    (governs.tokens?.length ?? 0) +
    (governs.components?.length ?? 0) +
    (governs.surfaces?.length ?? 0);
  return total === 0;
}

/**
 * The governed targets of the selected pillar, surfaced in-card (VI-507 v1 scope):
 * tokens as live swatches + resolved values, components and surfaces as chips. No
 * cross-canvas highlight — that's a deferred follow-up.
 */
function PillarGoverns({ governs }: { governs: BrandGoverns }) {
  const tokens = governs.tokens ?? [];
  const resolved = useResolvedTokenValues(tokens.map(toCssVar));

  return (
    <div className={styles.governs} data-slot="pillar-governs">
      {tokens.length > 0 && (
        <div className={styles.governsGroup}>
          <Text as="span" size="xs" weight="semibold" color="tertiary" className={styles.governsLabel}>
            Tokens
          </Text>
          <div className={styles.tokenList}>
            {tokens.map((token) => {
              const cssVar = toCssVar(token);
              const value = resolved[cssVar];
              return (
                <div key={token} className={styles.tokenChip} data-slot="governs-token" data-token={token}>
                  <span
                    className={styles.swatch}
                    style={{ background: `var(${cssVar})` } as CSSProperties}
                    aria-hidden
                  />
                  <span className={styles.tokenName}>{cssVar}</span>
                  {value && <span className={styles.tokenValue}>{value}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {governs.components && governs.components.length > 0 && (
        <div className={styles.governsGroup}>
          <Text as="span" size="xs" weight="semibold" color="tertiary" className={styles.governsLabel}>
            Components
          </Text>
          <div className={styles.chipList}>
            {governs.components.map((name) => (
              <Badge key={name} variant="secondary" data-slot="governs-component">
                {name === GOVERNS_WILDCARD ? "all" : name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {governs.surfaces && governs.surfaces.length > 0 && (
        <div className={styles.governsGroup}>
          <Text as="span" size="xs" weight="semibold" color="tertiary" className={styles.governsLabel}>
            Surfaces
          </Text>
          <div className={styles.chipList}>
            {governs.surfaces.map((name) => (
              <Badge key={name} variant="outline" data-slot="governs-surface">
                {name === GOVERNS_WILDCARD ? "all" : name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The Pillars Brand Workbench surface (VI-507): Visor's strategic pillars rendered
 * live on the active theme from the Brand Record (`resolveBrandStrategy`). Each
 * pillar's `governs` link turns its statement from a slogan into a checkable claim
 * — selecting a pillar surfaces the tokens (live swatches + resolved values),
 * components, and surfaces it governs, in-card (D1, v1 scope). A pillar that
 * governs nothing renders a visible warning (D2). Theme/mode-aware: re-resolves on
 * switch via {@link useActiveTheme} while the content stays the brand's. Composes
 * existing Visor primitives only.
 */
export function PillarsSection() {
  const theme = useActiveTheme();
  const strategy = resolveBrandStrategy(theme);

  // Open the first pillar by default so the surface lands on a meaningful reveal
  // (and the dual-pane compare is populated without interaction). The initializer
  // runs identically on server and first client render — both resolve DEFAULT_THEME
  // to Visor's record — so there's no hydration mismatch.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => resolveBrandStrategy(DEFAULT_THEME)?.pillars[0]?.id ?? null,
  );

  // Pillars are brand-keyed: only Visor's own (public) record ships here. A
  // non-Visor theme has no public strategy — say so candidly rather than borrowing
  // Visor's (mirrors strategy.tsx).
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s brand pillars are private &mdash; only Visor&rsquo;s own Brand Record is
          published here.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Visor&rsquo;s strategic pillars &mdash; each an essence word made operational. The{" "}
        <code className={styles.code}>governs</code> link turns a pillar from a slogan into a claim the
        system can check: select a pillar to surface the tokens, components, and surfaces it governs,
        live on the active theme.
      </Text>

      <div className={styles.pillars}>
        {strategy.pillars.map((pillar) => {
          const empty = governsNothing(pillar.governs);
          const isSelected = !empty && pillar.id === selectedId;

          return (
            <Card key={pillar.id} className={styles.pillarCard} data-slot="pillar" data-pillar={pillar.id}>
              <CardContent className={styles.pillarContent}>
                {empty ? (
                  <div className={styles.pillarHead}>
                    <Badge variant="default">{pillar.id}</Badge>
                    <Text as="span" size="sm" color="secondary" className={styles.statement}>
                      {pillar.statement}
                    </Text>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`${styles.pillarHead} ${styles.pillarButton}`}
                    aria-expanded={isSelected}
                    onClick={() => setSelectedId((prev) => (prev === pillar.id ? null : pillar.id))}
                  >
                    <Badge variant="default">{pillar.id}</Badge>
                    <Text as="span" size="sm" color="secondary" className={styles.statement}>
                      {pillar.statement}
                    </Text>
                  </button>
                )}

                {empty && (
                  <div className={styles.warning} data-slot="pillar-warning">
                    <Badge variant="warning">Governs nothing</Badge>
                    <Text as="span" size="sm" color="tertiary">
                      A pillar should govern at least one token, component, or surface.
                    </Text>
                  </div>
                )}

                {isSelected && <PillarGoverns governs={pillar.governs} />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
