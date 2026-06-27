"use client"

import * as React from "react"
import {
  Sparkle,
  Plus,
  LinkSimple,
  TextAlignLeft,
  Globe,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSpine } from "../lib/use-spine"
import { useByok } from "../lib/use-byok"
import { useSeed } from "../lib/seed-store"
import {
  extractSeedText,
  classifyTextInput,
  type SeedInput,
  type SeedFailure,
} from "../lib/seed-ingest"
import { proposeDraftFromText } from "../lib/seed-propose-draft"
import { SeedErrorCard } from "../components/seed-error-card"
import { START_CONTENT } from "../lib/journey-fixtures"
import styles from "./start.module.css"

type Path = "seed" | "blank"

/**
 * Start stage (journey.html L357–383) — the journey entry. Two paths (seed-from-existing /
 * start-from-scratch), a brand name, and public/private visibility. The blank path's "Begin" advances
 * the guided chain to Positioning. The seed path (UJ-F, VI-594) ingests a URL / paste / file, asks the
 * AI for a first-draft positioning, then lands on Positioning seeded. Keyless suppresses the seed path
 * (D5 / R-KEYLESS) — the pathcard disables with a BYOK pointer.
 */
export function StartView() {
  const { advance } = useSpine()
  const { keyStatus } = useByok()
  const { setSeeded } = useSeed()
  const keyless = keyStatus === "keyless"

  const [path, setPath] = React.useState<Path>("seed")
  const [name, setName] = React.useState<string>(START_CONTENT.blank.name)
  const [visibility, setVisibility] = React.useState<"public" | "private">("public")

  const [seedText, setSeedText] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<{ failure: SeedFailure; detail?: string } | null>(null)
  const lastInput = React.useRef<SeedInput | null>(null)

  // Ingest a seed input → extract text → AI proposes a first-draft record → land on Positioning seeded.
  const runIngest = React.useCallback(
    async (input: SeedInput) => {
      lastInput.current = input
      setBusy(true)
      setError(null)
      const extracted = await extractSeedText(input)
      if (!extracted.ok) {
        setError({ failure: extracted.failure, detail: extracted.detail })
        setBusy(false)
        return
      }
      const proposal = await proposeDraftFromText(extracted.text)
      if (!proposal.ok) {
        setError({ failure: proposal.failure, detail: proposal.detail })
        setBusy(false)
        return
      }
      setBusy(false)
      setSeeded(proposal.record)
      advance()
    },
    [setSeeded, advance],
  )

  const handleBegin = React.useCallback(() => {
    if (busy) return
    // Blank path, or the seed path with no usable seed (keyless, or an empty field), begins the guided
    // cold-start (UJ-A/UJ-E). Only a key-active seed path with input runs the ingestion pipeline.
    if (path === "blank" || keyless || !seedText.trim()) {
      advance()
      return
    }
    void runIngest(classifyTextInput(seedText))
  }, [path, keyless, busy, seedText, advance, runIngest])

  const seedDisabled = keyless || busy

  return (
    <div className={styles.wrap} data-testid="bw-start">
      <div className={styles.start}>
        <div className={styles.hello}>
          <span className={styles.helloAvatar} aria-hidden="true">
            <Sparkle weight="fill" />
          </span>
          {START_CONTENT.eyebrow}
        </div>
        <h1 className={styles.heading}>{START_CONTENT.heading}</h1>
        <p className={styles.sub}>{START_CONTENT.sub}</p>

        <div className={styles.paths}>
          <Card
            className={path === "seed" ? styles.cardActive : styles.card}
            onClick={() => setPath("seed")}
            data-testid="bw-path-seed"
            data-selected={path === "seed"}
            data-disabled={keyless || undefined}
          >
            <div className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Sparkle weight="fill" />
              </span>
              <h3 className={styles.cardTitle}>
                {START_CONTENT.seed.title}
                <span className={styles.recoTag}>{START_CONTENT.seed.tag}</span>
              </h3>
            </div>
            <p className={styles.cardBody}>{START_CONTENT.seed.body}</p>

            <div className={styles.seedField}>
              <LinkSimple aria-hidden="true" className={styles.seedFieldIcon} />
              <Input
                size="sm"
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                disabled={seedDisabled}
                aria-label="Seed from a URL or pasted text"
                placeholder="Paste a URL — or your notes"
                data-testid="bw-seed-input"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()
                    handleBegin()
                  }
                }}
              />
            </div>

            <FileUpload
              accept=".pdf,.txt,.md,.markdown,.mdx,.csv,text/*,application/pdf"
              maxSize={10}
              disabled={seedDisabled}
              onFilesChange={(files) => {
                if (files[0]) void runIngest({ kind: "file", file: files[0] })
              }}
              data-testid="bw-seed-dropzone"
            >
              <span className={styles.seedDropText}>{START_CONTENT.seed.drop}</span>
            </FileUpload>

            {keyless ? (
              <p className={styles.byokPointer} data-testid="bw-seed-disabled">
                <Lock aria-hidden="true" />
                Add a Claude key (top-right) to seed from existing materials.
              </p>
            ) : null}
          </Card>

          <Card
            className={path === "blank" ? styles.cardActive : styles.card}
            onClick={() => setPath("blank")}
            data-testid="bw-path-blank"
            data-selected={path === "blank"}
          >
            <div className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Plus weight="bold" />
              </span>
              <h3 className={styles.cardTitle}>{START_CONTENT.blank.title}</h3>
            </div>
            <p className={styles.cardBody}>{START_CONTENT.blank.body}</p>
            <div className={styles.nameRow}>
              <TextAlignLeft aria-hidden="true" className={styles.nameIcon} />
              <Input
                size="sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Brand name"
                placeholder="Name your brand"
                data-testid="bw-name-input"
                // Card click would steal focus selection; keep input interactions local.
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ToggleGroup
              type="single"
              value={visibility}
              onValueChange={(v) => v && setVisibility(v as "public" | "private")}
              variant="outline"
              size="sm"
              aria-label="Visibility"
              data-testid="bw-visibility-toggle"
            >
              <ToggleGroupItem value="public">
                <Globe aria-hidden="true" />
                Public
              </ToggleGroupItem>
              <ToggleGroupItem value="private">
                <Lock aria-hidden="true" />
                Private
              </ToggleGroupItem>
            </ToggleGroup>
          </Card>
        </div>

        {error ? (
          <div className={styles.errorWrap}>
            <SeedErrorCard
              failure={error.failure}
              detail={error.detail}
              onRetry={() => {
                if (lastInput.current) void runIngest(lastInput.current)
              }}
              onSwitchInput={() => {
                setError(null)
                setSeedText("")
              }}
              onFallback={() => {
                setError(null)
                setPath("blank")
              }}
            />
          </div>
        ) : null}

        <div className={styles.go}>
          <Button size="lg" onClick={handleBegin} disabled={busy} data-testid="bw-begin">
            {busy ? "Reading your materials…" : START_CONTENT.begin}
            {busy ? null : <ArrowRight aria-hidden="true" />}
          </Button>
          <span className={styles.note}>
            <ShieldCheck aria-hidden="true" />
            {START_CONTENT.note}
          </span>
        </div>
      </div>
    </div>
  )
}
