"use client"

import * as React from "react"
import { BookOpen, Code, DownloadSimple, Export, ShieldCheck } from "@phosphor-icons/react"
import { CodeBlock } from "@/components/ui/code-block"
import { CheckGroup, CheckRow } from "@/components/ui/coherence-check"
import { Button } from "@/components/ui/button"
import type { BrandRecord } from "../../../../../spec/types"
import { EXPORT_CONTENT, PROVE_CONTENT } from "../lib/journey-fixtures"
import { VISOR_BRAND_RECORD } from "../lib/brand-record-fixture"
import { serializeBrandRecord } from "../lib/serialize-brand-record"
import { agentManifest } from "../lib/agent-manifest"
import stage from "./stage.module.css"
import styles from "./export.module.css"

/** Trigger a client-side file download (mirrors app/create/export-bar.tsx). */
function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** A coherence check, flattened across the Prove groups (the `as const` fixture has per-group shapes). */
type GateCheck = { state: "pass" | "warn" | "fail"; title: string; description: string }

/** The coherence checks that need looking at before export (warn + fail) — pass rows are elided. */
const FLAGGED_CHECKS: GateCheck[] = PROVE_CONTENT.groups
  .flatMap((g) => g.checks as readonly GateCheck[])
  .filter((c) => c.state !== "pass")

/**
 * Export stage (journey.html L525–564) — the compiled brand system: the live `.visor.yaml`
 * `brand-strategy:` block + the agent manifest, the coherence gate, and the live brand book (VI-563).
 *
 * The dogfood Visor Brand Record is serialized for real (serialize-brand-record + agent-manifest); the
 * public/private toggle drives both the emitted `visibility:` and whether a PUBLIC agent manifest is
 * emitted at all (D3 / visibility-gated). Coherence `warn`/`fail` are surfaced but never block — the
 * human is the gate (R-PROVE-NONBLOCKING). testids stay within the frozen INTERFACE.d.ts set.
 */
export function ExportView() {
  const [visibility, setVisibility] = React.useState<"public" | "private">("public")

  const record: BrandRecord = React.useMemo(
    () => ({ ...VISOR_BRAND_RECORD, visibility }),
    [visibility],
  )
  const visorYaml = React.useMemo(() => serializeBrandRecord(record), [record])
  const manifest = React.useMemo(() => agentManifest(record), [record])
  const manifestJson = React.useMemo(
    () => (manifest ? JSON.stringify(manifest, null, 2) : null),
    [manifest],
  )

  const exportBrand = React.useCallback(() => {
    downloadFile("brand-strategy.visor.yaml", visorYaml, "text/yaml")
    if (manifestJson) downloadFile("manifest.brand.json", manifestJson, "application/json")
  }, [visorYaml, manifestJson])

  return (
    <div className={stage.scroll} data-testid="bw-export">
      <div className={stage.eyebrow}>{EXPORT_CONTENT.eyebrow}</div>
      <h2 className={stage.heading}>{EXPORT_CONTENT.heading}</h2>
      <p className={stage.lede}>{EXPORT_CONTENT.lede}</p>

      <div className={styles.grid}>
        <CodeBlock
          code={visorYaml}
          language="yaml"
          title={EXPORT_CONTENT.filename}
          className={styles.file}
          data-testid="bw-export-yaml"
        />

        <div className={styles.side}>
          <div className={styles.pubrow}>
            <button
              type="button"
              className={visibility === "public" ? styles.pubpillOn : styles.pubpill}
              onClick={() => setVisibility("public")}
              aria-pressed={visibility === "public"}
              data-testid="bw-visibility-public"
            >
              <b>{EXPORT_CONTENT.visibility.public.label}</b>
              {EXPORT_CONTENT.visibility.public.body}
            </button>
            <button
              type="button"
              className={visibility === "private" ? styles.pubpillOn : styles.pubpill}
              onClick={() => setVisibility("private")}
              aria-pressed={visibility === "private"}
              data-testid="bw-visibility-private"
            >
              <b>{EXPORT_CONTENT.visibility.private.label}</b>
              {EXPORT_CONTENT.visibility.private.body}
            </button>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.dlBtn}
              onClick={() => downloadFile("brand-strategy.visor.yaml", visorYaml, "text/yaml")}
            >
              <DownloadSimple aria-hidden="true" />
              Download .visor.yaml
            </button>
            <button
              type="button"
              className={styles.dlBtn}
              onClick={() => manifestJson && downloadFile("manifest.brand.json", manifestJson, "application/json")}
              disabled={!manifestJson}
              title={manifestJson ? undefined : "Private brands emit no public agent manifest"}
            >
              <DownloadSimple aria-hidden="true" />
              Download manifest.brand.json
            </button>
          </div>

          <Button size="lg" className={styles.cta} onClick={exportBrand} data-testid="bw-export-submit">
            <Export aria-hidden="true" />
            {EXPORT_CONTENT.cta}
          </Button>
        </div>
      </div>

      {/* Agent manifest — the PUBLIC-key projection an agent reads (D3). Visibility-gated. */}
      <section className={styles.section}>
        <h3 className={styles.sectionHead}>
          <Code aria-hidden="true" /> Agent manifest
        </h3>
        <p className={styles.sectionSub}>{EXPORT_CONTENT.outputs[0].body}</p>
        {manifestJson ? (
          <CodeBlock
            code={manifestJson}
            language="json"
            title="manifest.brand.json"
            className={styles.file}
          />
        ) : (
          <p className={styles.privateNote}>
            <b>Private brand.</b> No public agent manifest is emitted — the{" "}
            <code>brand-strategy:</code> block ships to your private{" "}
            <code>brand-systems-private</code> package, not the OSS manifest.
          </p>
        )}
      </section>

      {/* Coherence gate — warn/fail surfaced, never blocking (R-PROVE-NONBLOCKING). */}
      <section className={styles.section}>
        <h3 className={styles.sectionHead}>
          <ShieldCheck aria-hidden="true" /> Coherence gate
        </h3>
        <p className={styles.sectionSub}>{EXPORT_CONTENT.outputs[2].body}</p>
        <p className={styles.gateCounts}>
          {PROVE_CONTENT.counts.pass} pass · {PROVE_CONTENT.counts.warn} warning ·{" "}
          {PROVE_CONTENT.counts.fail} fail — advisory only, nothing blocks export.
        </p>
        <CheckGroup heading="Needs a look before you ship">
          {FLAGGED_CHECKS.map((check) => (
            <CheckRow
              key={check.title}
              state={check.state}
              title={check.title}
              description={check.description}
            />
          ))}
        </CheckGroup>
      </section>

      {/* Live brand book — the same record, read-only and formatted (D4). */}
      <section className={styles.section}>
        <h3 className={styles.sectionHead}>
          <BookOpen aria-hidden="true" /> Live brand book
        </h3>
        <p className={styles.sectionSub}>{EXPORT_CONTENT.outputs[1].body}</p>
        <BrandBook record={record} />
      </section>
    </div>
  )
}

/** Read-only formatted render of the complete Brand Record — the brand book (D4). */
function BrandBook({ record }: { record: BrandRecord }) {
  return (
    <dl className={styles.book}>
      <BookRow label="Positioning">
        <span className={styles.onliness}>{record.positioning.onliness}</span>
        <span className={styles.meta}>
          {record.positioning.category} · {record.positioning.differentiation}
        </span>
      </BookRow>

      <BookRow label="Essence">
        <span className={styles.chips}>
          {record.essence.map((word) => (
            <span key={word} className={styles.chip}>
              {word}
            </span>
          ))}
        </span>
      </BookRow>

      <BookRow label="Personality">
        {record.personality.map((p) => (
          <span key={p.trait} className={styles.item}>
            <b>{p.trait}</b> <span className={styles.meta}>not {p.not}</span>
          </span>
        ))}
      </BookRow>

      <BookRow label="Archetype">
        {[record.archetype.primary, record.archetype.secondary, record.archetype.tertiary]
          .filter(Boolean)
          .join(" · ")}
      </BookRow>

      <BookRow label="Pillars">
        {record.pillars.map((pillar) => (
          <div key={pillar.id} className={styles.item}>
            <b>{pillar.id}</b> — {pillar.statement}
            <ul className={styles.proof}>
              {pillar.proof.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </BookRow>

      <BookRow label="Voice">
        {record.voice.traits.map((t) => (
          <div key={t.name} className={styles.item}>
            <b>{t.name}</b> — {t.do} <span className={styles.meta}>Not: {t.dont}</span>
            {t.example && <span className={styles.example}>“{t.example}”</span>}
          </div>
        ))}
      </BookRow>

      <BookRow label="Tone">
        {Object.entries(record.tone).map(([ctx, specimen]) => (
          <div key={ctx} className={styles.item}>
            <b>{ctx}</b> — {specimen.feeling}
            <span className={styles.example}>“{specimen.example}”</span>
          </div>
        ))}
      </BookRow>

      <BookRow label="Lexicon">
        {record.lexicon.map((l) => (
          <span key={l.use} className={styles.item}>
            <b>{l.use}</b> <span className={styles.meta}>not {l.avoid}</span>
          </span>
        ))}
      </BookRow>

      <BookRow label="Messaging">{record.messaging.roof}</BookRow>

      <BookRow label="Taglines">
        {record.taglines.map((t) => (
          <span key={t} className={styles.item}>
            {t}
          </span>
        ))}
      </BookRow>

      <BookRow label="Boilerplate">{record.boilerplate.short}</BookRow>

      <BookRow label="Color usage">
        {record.colorUsage.pairings.map((p) => (
          <div key={`${p.use}-${p.with}`} className={styles.item}>
            <b>
              {p.use} <span className={styles.meta}>with</span> {p.with}
            </b>
            <span className={styles.example}>{p.rule}</span>
          </div>
        ))}
      </BookRow>

      <BookRow label="Accessibility">
        <span className={styles.item}>
          <b>{record.accessibility.standard}</b>
        </span>
        {record.accessibility.contrast.map((c) => (
          <span key={c.context} className={styles.item}>
            {c.context} <span className={styles.meta}>{c.ratio}</span>
          </span>
        ))}
        <span className={styles.example}>{record.accessibility.intent}</span>
      </BookRow>
    </dl>
  )
}

/** One labelled row of the brand book (a `<dt>`/`<dd>` pair). */
function BookRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.bookRow}>
      <dt className={styles.bookLabel}>{label}</dt>
      <dd className={styles.bookValue}>{children}</dd>
    </div>
  )
}
