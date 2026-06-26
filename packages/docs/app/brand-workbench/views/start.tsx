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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSpine } from "../lib/use-spine"
import { START_CONTENT } from "../lib/journey-fixtures"
import styles from "./start.module.css"

type Path = "seed" | "blank"

/**
 * Start stage (journey.html L357–383) — the journey entry. Two paths (seed-from-existing /
 * start-from-scratch), a brand name, and public/private visibility. "Begin the interview" advances
 * the guided chain to Positioning. Seed ingestion + the AI cold-start are VI-562 — here it's static.
 */
export function StartView() {
  const { advance } = useSpine()
  const [path, setPath] = React.useState<Path>("seed")
  const [name, setName] = React.useState<string>(START_CONTENT.blank.name)
  const [visibility, setVisibility] = React.useState<"public" | "private">("public")

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
            <div className={styles.fauxInput}>
              <LinkSimple aria-hidden="true" />
              <span className={styles.fauxValue}>{START_CONTENT.seed.url}</span>
            </div>
            <div className={styles.dropzone}>{START_CONTENT.seed.drop}</div>
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

        <div className={styles.go}>
          <Button size="lg" onClick={advance} data-testid="bw-begin">
            {START_CONTENT.begin}
            <ArrowRight aria-hidden="true" />
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
