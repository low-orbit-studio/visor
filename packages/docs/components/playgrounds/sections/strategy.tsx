"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { resolveBrandStrategy } from "@/lib/theme-config";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./strategy.module.css";

/**
 * The first/foundational Brand Workbench surface (VI-506): Visor's strategy trio
 * — Positioning, Essence, Personality — rendered live on the active theme from
 * the Brand Record (`resolveBrandStrategy`). Theme/mode-aware: the surface
 * re-resolves on switch via {@link useActiveTheme}, while the content stays the
 * brand's (D2). Composes existing Visor primitives only.
 */
export function StrategySection({ theme: themeOverride }: SectionProps = {}) {
  const theme = useActiveTheme(themeOverride);
  const strategy = resolveBrandStrategy(theme);

  // Brand strategy is brand-keyed: only Visor's own (public) record ships here.
  // A non-Visor theme has no public strategy — say so candidly rather than
  // borrowing Visor's (D2, "content stays the brand's").
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s brand strategy is private &mdash; only Visor&rsquo;s own Brand Record is
          published here.
        </Text>
      </div>
    );
  }

  const { positioning, essence, personality } = strategy;

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Visor&rsquo;s strategy trio &mdash; the generative core the rest of the brand derives from.
        Positioning, Essence, and Personality, live on the active theme: switch themes and the surface
        re-resolves, while the content stays the brand&rsquo;s.
      </Text>

      {/* Positioning — the onliness wedge (Neumeier's "only" test). */}
      <section className={styles.block} data-slot="strategy-positioning">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Positioning
        </Heading>
        <Card className={styles.positioningCard}>
          <CardContent className={styles.positioningContent}>
            <Text as="p" size="lg" leading="relaxed" className={styles.onliness}>
              {positioning.onliness}
            </Text>
            <div className={styles.metaRow}>
              <Badge variant="secondary">{positioning.category}</Badge>
              <Text as="span" size="sm" color="tertiary">
                {positioning.differentiation}
              </Text>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Essence — 2–3 internal-facing core words (Aaker). */}
      <section className={styles.block} data-slot="strategy-essence">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Essence
        </Heading>
        <div className={styles.essenceRow}>
          {essence.map((word) => (
            <Badge key={word} variant="default" size="lg">
              {word}
            </Badge>
          ))}
        </div>
      </section>

      {/* Personality — brand-as-person, each trait sharpened by its antonym. */}
      <section className={styles.block} data-slot="strategy-personality">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Personality
        </Heading>
        <div className={styles.personalityGrid}>
          {personality.map((p) => (
            <Card key={p.trait} size="sm" data-trait={p.trait} className={styles.traitCard}>
              <CardContent className={styles.traitContent}>
                <Badge variant="default">{p.trait}</Badge>
                <Text as="span" size="sm" color="tertiary" className={styles.traitNot}>
                  {`not ${p.not}`}
                </Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
