"use client"

import * as React from "react"
import { Check, Sun, Moon, ShieldCheck } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SpecimenCard, SpecimenCardFooter } from "@/components/ui/specimen-card"
import { useActiveTheme, toggleColorMode } from "../lib/use-active-theme"
import {
  POSITIONING_RECORD,
  ESSENCE_CHIPS,
  ESSENCE_GHOST,
  PERSONALITY_TRAITS,
  PILLAR_SET,
  PILLAR_DERIVING,
  VOICE_KEY,
  CANVAS_FOOTNOTE,
} from "../lib/elicit-fixtures"
import styles from "./live-canvas.module.css"

/** A canvas section: status divider + content, tagged for the oracle (bw-canvas-section). */
function Section({
  label,
  status,
  children,
}: {
  label: string
  status?: { text: string; live?: boolean }
  children: React.ReactNode
}) {
  return (
    <div className={styles.section} data-testid="bw-canvas-section">
      <div className={styles.sect}>
        <span className={styles.sectLabel}>{label}</span>
        <span className={styles.sectLine} />
        {status ? (
          <span className={status.live ? styles.sectStatusLive : styles.sectStatus}>
            {!status.live ? <Check weight="bold" aria-hidden="true" /> : null}
            {status.text}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

/**
 * Column 3 — the live brand system (hybrid canvas). The Brand Record assembles section by section
 * as answers land, and the brand "Speaks" through real Visor components rendered in its own voice.
 * Everything resolves through tokens, so switching theme or mode re-resolves the whole surface —
 * the differentiator made visible. Static in VI-559; live re-resolution is VI-561.
 */
export function LiveCanvas() {
  const { themeLabel, mode } = useActiveTheme()

  return (
    <aside className={styles.canvas} data-testid="bw-canvas" aria-label="Live brand system">
      <div className={styles.khead}>
        <div className={styles.kheadText}>
          <b>Live brand system</b>
          <span>assembling as you answer</span>
        </div>
        <div className={styles.kheadSpacer} />
        <span className={styles.tchip}>
          <span className={styles.tchipSwatch} aria-hidden="true" />
          {themeLabel || "theme"}
        </span>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && toggleColorMode(v as "light" | "dark")}
          variant="outline"
          size="xs"
          aria-label="Preview color mode"
          data-testid="bw-canvas-mode-toggle"
        >
          <ToggleGroupItem value="light" aria-label="Light mode">
            <Sun aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark mode">
            <Moon aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className={styles.scroll}>
        {/* Positioning — set */}
        <Section label="Positioning" status={{ text: "set" }}>
          <div className={styles.recCard}>
            <div className={styles.onliness}>
              The only design system that <em>compiles</em> a complete brand — visual <em>and</em>{" "}
              verbal — from one portable file, for humans and agents alike.
            </div>
            <div className={styles.recTags}>
              {POSITIONING_RECORD.tags.map((tag) => (
                <span key={tag} className={styles.recTag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* Essence — drafting */}
        <Section label="Essence" status={{ text: "drafting…", live: true }}>
          <div className={styles.chips}>
            {ESSENCE_CHIPS.map((word) => (
              <Chip key={word} variant="filled-primary" size="md" label={word} />
            ))}
            <Chip
              variant="outlined"
              size="md"
              className={styles.ghostChip}
              leadingIcon={<Spinner size="xs" tone="primary" />}
              label={ESSENCE_GHOST}
            />
          </div>
        </Section>

        {/* Personality — derives next */}
        <Section label="Personality">
          <div className={styles.traits}>
            {PERSONALITY_TRAITS.map((t) => (
              <div key={t.trait} className={styles.trait}>
                <b>{t.trait}</b>
                <span>{t.not}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Pillars — derive after essence */}
        <Section label="Pillars">
          <div className={styles.pillCard}>
            <div className={styles.pillTop}>
              <b>{PILLAR_SET.id}</b>
              <span className={styles.governs}>governs</span>
            </div>
            <div className={styles.pillStmt}>{PILLAR_SET.statement}</div>
            <div className={styles.govern}>
              {PILLAR_SET.governs.map((tok) => (
                <code key={tok} className={styles.govToken}>
                  {tok}
                </code>
              ))}
            </div>
          </div>
          <div className={styles.pillDeriving}>
            <Spinner size="xs" tone="primary" />
            {PILLAR_DERIVING}
          </div>
        </Section>

        {/* Speaking — live components in the brand voice */}
        <Section label="Speaking" status={{ text: "live", live: true }}>
          <SpecimenCard context="live" feel={VOICE_KEY}>
            <div className={styles.speakBody}>
              <div className={styles.speakRow}>
                <Button>Get started</Button>
                <Button variant="outline">Cancel</Button>
              </div>
              <Alert variant="warning">
                <AlertDescription>
                  <b>Heads up</b> — this theme fails AA on small text. Bump the contrast a notch, or
                  keep the warning if it&apos;s intentional.
                </AlertDescription>
              </Alert>
              <Alert variant="success">
                <AlertDescription>
                  <b>Saved!</b> Your theme&apos;s live across every component — go take a look.
                </AlertDescription>
              </Alert>
              <div className={styles.empty}>
                <b>Nothing here yet</b> — let&apos;s change that. Start from a blank file, or clone one
                and make it yours.
              </div>
            </div>
            <SpecimenCardFooter>
              <span className={styles.voiceKeyLabel}>voice</span> rendered on real components, this
              theme
            </SpecimenCardFooter>
          </SpecimenCard>
        </Section>

        <div className={styles.footnote}>
          <ShieldCheck aria-hidden="true" />
          {CANVAS_FOOTNOTE}
        </div>
      </div>
    </aside>
  )
}
