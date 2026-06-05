"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Banner, BannerDescription, BannerTitle } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { DEFAULT_THEME, getStoredTheme, resolveBrandStrategy } from "@/lib/theme-config";
import type { BrandToneEntry } from "@loworbitstudio/visor-theme-engine";
import styles from "./verbal.module.css";

/**
 * Track the active theme via the same `visor-theme-change` event the Explorer
 * dispatches — the re-resolution model established by the Brand section
 * (brand.tsx) and shared by the Strategy and Pillars surfaces. The main Explorer,
 * dual-pane compare, and matrix only activate stock/custom themes, so no extra
 * private slugs are accepted here.
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

/** Humanize a tone key for display ("validation-warning" → "Validation warning"). */
function humanizeState(key: string): string {
  const spaced = key.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Alert variant for each recognized tone state. Unmapped keys fall back to neutral. */
const TONE_ALERT_VARIANT: Record<string, "destructive" | "success" | "warning" | "info" | "default"> = {
  error: "destructive",
  "validation-warning": "warning",
  warning: "warning",
  success: "success",
  info: "info",
};

/**
 * Display order for tone states — alerts grouped first, then the empty and loading
 * states (D2). Keys present in the record but absent here are appended after, so a
 * brand's tone is surfaced in full rather than silently dropped.
 */
const TONE_ORDER = ["error", "validation-warning", "warning", "success", "info", "empty", "loading"];

/**
 * Render a single tone entry in the real UI state it ships in (D2): `empty` →
 * EmptyState, `loading` → Skeleton, everything else → an Alert in its mapped
 * variant. The `feeling` is shown as a caption (the strategy made inspectable);
 * the `example` is the real, shippable message.
 */
function ToneEntry({ stateKey, entry }: { stateKey: string; entry: BrandToneEntry }) {
  return (
    <div className={styles.toneEntry} data-slot="tone-entry" data-tone={stateKey}>
      <div className={styles.toneMeta}>
        <Badge variant="outline">{`tone.${stateKey}`}</Badge>
        <Text as="span" size="xs" color="tertiary" className={styles.feeling}>
          {entry.feeling}
        </Text>
      </div>

      {stateKey === "empty" ? (
        <EmptyState heading={entry.example} />
      ) : stateKey === "loading" ? (
        <div className={styles.loading} role="status" aria-live="polite">
          <Skeleton style={{ height: "0.75rem", width: "70%" }} />
          <Skeleton style={{ height: "0.75rem", width: "90%" }} />
          <Text as="p" size="sm" color="secondary" className={styles.loadingCaption}>
            {entry.example}
          </Text>
        </div>
      ) : (
        <Alert variant={TONE_ALERT_VARIANT[stateKey] ?? "default"}>
          <AlertTitle>{humanizeState(stateKey)}</AlertTitle>
          <AlertDescription>{entry.example}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * The Verbal Surfaces Brand Workbench surface (VI-508): Visor's verbal identity —
 * Voice, Tone-by-context, and Lexicon — rendered live on the active theme from the
 * Brand Record (`resolveBrandStrategy`). Tone-by-context is the verbal twin of
 * light/dark mode: each message rendered in the real component it ships in, so the
 * voice is judged in product chrome, not a spec. Theme/mode-aware: re-resolves on
 * switch via {@link useActiveTheme} while the content stays the brand's. Composes
 * existing Visor primitives only.
 */
export function VerbalSection() {
  const theme = useActiveTheme();
  const strategy = resolveBrandStrategy(theme);

  // Verbal identity is brand-keyed: only Visor's own (public) record ships here. A
  // non-Visor theme has no public strategy — say so candidly rather than borrowing
  // Visor's (mirrors strategy.tsx / pillars.tsx).
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s verbal identity is private &mdash; only Visor&rsquo;s own Brand Record is
          published here.
        </Text>
      </div>
    );
  }

  const { voice, tone, lexicon } = strategy;
  const toneKeys = [
    ...TONE_ORDER.filter((k) => k in tone),
    ...Object.keys(tone).filter((k) => !TONE_ORDER.includes(k)),
  ];

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Visor&rsquo;s verbal identity, live on the active theme &mdash; the same Voice, Tone, and
        Lexicon an agent reads from the Brand Record. Switch themes and the words hold while the
        surface re-resolves.
      </Text>

      {/* Voice — fixed across the brand; each trait as live copy in real chrome (D1). */}
      <section className={styles.block} data-slot="verbal-voice">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Voice
        </Heading>
        <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
          Voice is fixed &mdash; it never flexes. Each trait rendered as live copy in real product
          chrome: does it still sing on this theme?
        </Text>
        <div className={styles.voiceList}>
          {voice.traits.map((trait) => (
            <div
              key={trait.name}
              className={styles.voiceTrait}
              data-slot="voice-trait"
              data-trait={trait.name}
            >
              <Banner intent="info">
                <BannerTitle>{trait.name}</BannerTitle>
                <BannerDescription>{trait.example ?? trait.do}</BannerDescription>
              </Banner>
              <div className={styles.voiceGuide}>
                <Text as="p" size="sm" color="secondary">
                  <span className={styles.guideLabel}>Do</span> {trait.do}
                </Text>
                <Text as="p" size="sm" color="tertiary">
                  <span className={styles.guideLabel}>Don&rsquo;t</span> {trait.dont}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tone — Voice flexed per UI state, each in the real component it ships in (D2). */}
      <section className={styles.block} data-slot="verbal-tone">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Tone
        </Heading>
        <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
          Tone is Voice flexed per UI state &mdash; the verbal twin of light/dark mode. Each message
          in the real component it&rsquo;d ship in.
        </Text>
        <div className={styles.toneList}>
          {toneKeys.map((stateKey) => (
            <ToneEntry key={stateKey} stateKey={stateKey} entry={tone[stateKey]} />
          ))}
        </div>
      </section>

      {/* Lexicon — the words we use, and the ones we don't (D3). */}
      <section className={styles.block} data-slot="verbal-lexicon">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Lexicon
        </Heading>
        <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
          The words we use, and the ones we don&rsquo;t.
        </Text>
        <div className={styles.lexiconGrid}>
          {lexicon.map((pair) => (
            <div key={pair.use} className={styles.lexiconPair} data-slot="lexicon-pair">
              <Badge variant="success">{pair.use}</Badge>
              <span className={styles.lexiconSep} aria-hidden>
                not
              </span>
              <Badge variant="destructive">{pair.avoid}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
