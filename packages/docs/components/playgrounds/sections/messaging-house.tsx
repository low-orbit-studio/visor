"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { resolveBrandStrategy } from "@/lib/theme-config";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./messaging-house.module.css";

/**
 * The Messaging House Brand Workbench surface (VI-542): the full message hierarchy
 * — roof above, pillars beneath, and each pillar's proof points (RTBs) nested
 * under it — rendered live on the active theme from the Brand Record
 * (`resolveBrandStrategy`). The house view: `messaging.roof` as the headline
 * claim, each pillar's `statement`, and its `proof[]` RTBs below. Governs details
 * live in the Pillars surface. Theme/mode-aware: re-resolves on switch via
 * {@link useActiveTheme} while the content stays the brand's. Composes existing
 * Visor primitives only.
 */
export function MessagingHouseSection({ theme: themeOverride }: SectionProps = {}) {
  const theme = useActiveTheme(themeOverride);
  const strategy = resolveBrandStrategy(theme);

  // Messaging house is brand-keyed: only Visor's own (public) record ships here. A
  // non-Visor theme has no public strategy — say so candidly rather than borrowing
  // Visor's (mirrors strategy.tsx / pillars.tsx / verbal.tsx).
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s messaging house is private &mdash; only Visor&rsquo;s own Brand Record is
          published here.
        </Text>
      </div>
    );
  }

  const { messaging, pillars } = strategy;

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Visor&rsquo;s message hierarchy &mdash; the roof above, the pillars beneath it, and each
        pillar&rsquo;s reasons-to-believe (proof points) nested below. Switch themes and the surface
        re-resolves while the content stays the brand&rsquo;s.
      </Text>

      {/* Roof — the umbrella message above the pillars. */}
      {messaging?.roof && (
        <section className={styles.block} data-slot="messaging-roof">
          <Heading level={3} size="xs" className={styles.blockHeading}>
            Roof
          </Heading>
          <Card className={styles.roofCard}>
            <CardContent className={styles.roofContent}>
              <Text as="p" size="lg" leading="relaxed" className={styles.roofClaim} data-slot="roof-claim">
                {messaging.roof}
              </Text>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Pillars + proof points — the house view (roof + proof, not governs details). */}
      <section className={styles.block} data-slot="messaging-pillars">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Pillars
        </Heading>
        <div className={styles.pillars}>
          {pillars.map((pillar) => (
            <Card key={pillar.id} className={styles.pillarCard} data-slot="house-pillar" data-pillar={pillar.id}>
              <CardContent className={styles.pillarContent}>
                <div className={styles.pillarHead}>
                  <Badge variant="default">{pillar.id}</Badge>
                  <Text as="span" size="sm" color="secondary" className={styles.statement}>
                    {pillar.statement}
                  </Text>
                </div>

                {pillar.proof && pillar.proof.length > 0 && (
                  <ol className={styles.proofList} data-slot="proof-list">
                    {pillar.proof.map((point, i) => (
                      <li key={i} className={styles.proofItem} data-slot="proof-point">
                        <Text as="span" size="sm" color="secondary">
                          {point}
                        </Text>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
