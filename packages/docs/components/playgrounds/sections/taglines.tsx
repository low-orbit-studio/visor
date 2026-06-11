"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { resolveBrandStrategy } from "@/lib/theme-config";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./taglines.module.css";

/**
 * Taglines & Boilerplate Brand Workbench surface (VI-544): the brand's permanent
 * tagline(s) and short/long boilerplate as live copy on the active theme — the
 * universal asset-layer blocks a brand book carries, copy-ready for agents and
 * humans. Taglines render at display scale; boilerplate renders as labeled body
 * blocks. Theme/mode-aware: re-resolves on switch via {@link useActiveTheme} while
 * the content stays the brand's. Composes existing Visor primitives only.
 */
export function TaglinesSection({ theme: themeOverride }: SectionProps = {}) {
  const theme = useActiveTheme(themeOverride);
  const strategy = resolveBrandStrategy(theme);

  // Taglines + boilerplate are brand-keyed: only Visor's own (public) record ships
  // here. A non-Visor theme has no public record — say so candidly rather than
  // borrowing Visor's (mirrors strategy.tsx / verbal.tsx).
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s taglines and boilerplate are private &mdash; only Visor&rsquo;s own
          Brand Record is published here.
        </Text>
      </div>
    );
  }

  const { taglines, boilerplate } = strategy;

  // Taglines and boilerplate are Phase 2 wave-1 optional fields (VI-541).
  // Surface a helpful notice rather than rendering empty blocks.
  if (!taglines?.length && !boilerplate) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s Brand Record does not yet include taglines or boilerplate. Add the
          <code> taglines</code> and <code>boilerplate</code> fields to the brand record to
          populate this surface.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Visor&rsquo;s permanent tagline(s) and short/long boilerplate &mdash; copy-ready blocks
        for every context. Switch themes and the surface re-resolves, while the content stays the
        brand&rsquo;s.
      </Text>

      {/* Taglines — permanent brand tagline(s) at display scale (D1). */}
      {taglines && taglines.length > 0 && (
        <section className={styles.block} data-slot="taglines-taglines">
          <Heading level={3} size="xs" className={styles.blockHeading}>
            Tagline{taglines.length !== 1 ? "s" : ""}
          </Heading>
          <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
            Permanent, outward-facing &mdash; the sentence that precedes everything else.
          </Text>
          <div className={styles.taglineList}>
            {taglines.map((tagline: string, i: number) => (
              <Card key={i} className={styles.taglineCard}>
                <CardContent className={styles.taglineContent}>
                  <Text as="p" size="xl" leading="snug" className={styles.taglineText}>
                    {tagline}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Boilerplate — short and long variants as labeled body blocks (D1). */}
      {boilerplate && (
        <section className={styles.block} data-slot="taglines-boilerplate">
          <Heading level={3} size="xs" className={styles.blockHeading}>
            Boilerplate
          </Heading>
          <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
            Ready-to-paste copy for pitches, press kits, and about pages.
          </Text>

          <div className={styles.boilerplateBlock} data-slot="boilerplate-short">
            <Heading level={4} size="xs" className={styles.boilerplateLabel}>
              Short
            </Heading>
            <Text as="p" leading="relaxed" className={styles.boilerplateText}>
              {boilerplate.short}
            </Text>
          </div>

          <div className={styles.boilerplateBlock} data-slot="boilerplate-long">
            <Heading level={4} size="xs" className={styles.boilerplateLabel}>
              Long
            </Heading>
            <Text as="p" leading="relaxed" className={styles.boilerplateText}>
              {boilerplate.long}
            </Text>
          </div>
        </section>
      )}
    </div>
  );
}
