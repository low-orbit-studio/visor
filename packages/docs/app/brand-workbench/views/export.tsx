"use client"

import * as React from "react"
import { TextAlignLeft, Browsers, ShieldCheck, Export } from "@phosphor-icons/react"
import { CodeBlock } from "@/components/ui/code-block"
import { Button } from "@/components/ui/button"
import { EXPORT_CONTENT } from "../lib/journey-fixtures"
import stage from "./stage.module.css"
import styles from "./export.module.css"

const OUTPUT_ICONS = [TextAlignLeft, Browsers, ShieldCheck] as const

/**
 * Export stage (journey.html L525–564) — the compiled brand system: the `.visor.yaml` brand-strategy
 * block, the downstream outputs, and the visibility choice. The actual emit-to-disk is gap:VI-563 —
 * here the file is previewed and the CTA is inert.
 */
export function ExportView() {
  const [visibility, setVisibility] = React.useState<"public" | "private">("public")

  return (
    <div className={stage.scroll} data-testid="bw-export">
      <div className={stage.eyebrow}>{EXPORT_CONTENT.eyebrow}</div>
      <h2 className={stage.heading}>{EXPORT_CONTENT.heading}</h2>
      <p className={stage.lede}>{EXPORT_CONTENT.lede}</p>

      <div className={styles.grid}>
        <CodeBlock
          code={EXPORT_CONTENT.yaml}
          language="yaml"
          title={EXPORT_CONTENT.filename}
          data-testid="bw-export-yaml"
        />

        <div className={styles.side}>
          {EXPORT_CONTENT.outputs.map((out, i) => {
            const Icon = OUTPUT_ICONS[i]
            return (
              <div key={out.title} className={styles.outcard}>
                <span className={styles.outIcon} aria-hidden="true">
                  <Icon />
                </span>
                <div className={styles.outText}>
                  <b>{out.title}</b>
                  <p>{out.body}</p>
                </div>
              </div>
            )
          })}

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

          <Button size="lg" className={styles.cta} data-testid="bw-export-submit">
            <Export aria-hidden="true" />
            {EXPORT_CONTENT.cta}
          </Button>
        </div>
      </div>
    </div>
  )
}
