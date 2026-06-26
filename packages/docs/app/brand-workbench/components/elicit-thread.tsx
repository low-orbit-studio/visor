"use client"

import * as React from "react"
import {
  Sparkle,
  CaretRight,
  Clock,
  TextAlignLeft,
  Check,
  Plus,
  Microphone,
  ShieldCheck,
} from "@phosphor-icons/react"
import {
  StructuredPrompt,
  StructuredPromptHeader,
  StructuredPromptBody,
  StructuredPromptSlot,
  StructuredPromptHint,
} from "@/components/ui/structured-prompt"
import {
  ChallengeCard,
  ChallengeCardHeader,
  ChallengeCardBody,
  ChallengeCardActions,
  ChallengeCardAction,
  ChallengeCardGate,
} from "@/components/ui/challenge-card"
import {
  Composer,
  ComposerField,
  ComposerToolbar,
  ComposerToolButton,
  ComposerSpacer,
  ComposerSend,
} from "@/components/ui/composer"
import { Badge } from "@/components/ui/badge"
import { SegmentedProgress } from "@/components/ui/segmented-progress"
import { StatusDot } from "@/components/ui/status-dot"
import { ELICIT_HEAD, ONLINESS_TOOL, SUGGESTIONS, COMPOSER } from "../lib/elicit-fixtures"
import styles from "./elicit-thread.module.css"

/** A plain-text assistant turn (Claude/ChatGPT-style — no bubble), optional warning eyebrow. */
function AssistantTurn({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className={styles.turn} data-testid="bw-turn-assistant">
      <div className={styles.turnHead}>
        <span className={styles.avatar} aria-hidden="true">
          <Sparkle weight="fill" />
        </span>
        <span className={styles.turnName}>
          Strategist
          {eyebrow ? <i className={styles.turnEyebrow}>{eyebrow}</i> : null}
        </span>
      </div>
      {children}
    </div>
  )
}

/** A soft, right-aligned user bubble. */
function UserTurn({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.userTurn} data-testid="bw-turn-user">
      <div className={styles.userBubble}>{children}</div>
    </div>
  )
}

/**
 * Column 2 — the conversational Elicit. A progress-forward header (breadcrumb, segmented step
 * meter, honest ETA), the thread (assistant turns, the onliness mad-lib, the adversarial Challenge
 * with its human gate, the section-set confirmation), and a modern composer. Static in VI-559: the
 * thread is the locked snapshot; the AI loop is VI-562.
 */
export function ElicitThread() {
  return (
    <main className={styles.conv}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <span className={styles.crumb} data-testid="bw-elicit-breadcrumb">
            {ELICIT_HEAD.section}
            <CaretRight aria-hidden="true" />
            <b>{ELICIT_HEAD.step}</b>
          </span>
          <span className={styles.stepCount}>
            {ELICIT_HEAD.stepLabel}
            <span className={styles.stepPct}>· {ELICIT_HEAD.pct}</span>
          </span>
        </div>
        <SegmentedProgress
          total={ELICIT_HEAD.segments.total}
          value={ELICIT_HEAD.segments.value}
          current={ELICIT_HEAD.segments.current}
          aria-label={`${ELICIT_HEAD.stepLabel}, ${ELICIT_HEAD.pct} complete`}
          data-testid="bw-elicit-stepmeter"
        />
        <span className={styles.eta}>
          <Clock aria-hidden="true" />
          {ELICIT_HEAD.eta}
        </span>
      </div>

      <div className={styles.thread} data-testid="bw-elicit-thread">
        <div className={styles.threadInner}>
          {/* Positioning question (history) */}
          <AssistantTurn>
            <div className={styles.turnText}>
              Forget polish for a second. Who is Visor for, and what can it do that nothing else can?
              Say it messy — I&apos;ll sharpen it with you.
            </div>
          </AssistantTurn>

          <UserTurn>
            A design system you copy and own. It ships your tokens as one portable file — and now the
            brand layer too: voice, tone, the strategy. For people and for AI agents.
          </UserTurn>

          {/* The onliness mad-lib */}
          <AssistantTurn>
            <div className={styles.turnText}>
              Strong raw material. Let&apos;s force it into the shape that actually differentiates —
              the onliness statement. Fill the blanks; rough is fine.
            </div>
            <div className={styles.turnSub}>
              <StructuredPrompt data-testid="bw-tool">
                <StructuredPromptHeader icon={<TextAlignLeft weight="bold" />}>
                  {ONLINESS_TOOL.header}
                </StructuredPromptHeader>
                <StructuredPromptBody>
                  The only{" "}
                  <span data-testid="bw-tool-slot">
                    <StructuredPromptSlot filled>{ONLINESS_TOOL.slots[0]}</StructuredPromptSlot>
                  </span>{" "}
                  that{" "}
                  <span data-testid="bw-tool-slot">
                    <StructuredPromptSlot filled>{ONLINESS_TOOL.slots[1]}</StructuredPromptSlot>
                  </span>
                  , for{" "}
                  <span data-testid="bw-tool-slot">
                    <StructuredPromptSlot filled>{ONLINESS_TOOL.slots[2]}</StructuredPromptSlot>
                  </span>
                  .
                </StructuredPromptBody>
                <StructuredPromptHint>{ONLINESS_TOOL.hint}</StructuredPromptHint>
              </StructuredPrompt>
            </div>
          </AssistantTurn>

          {/* The adversarial Challenge */}
          <AssistantTurn eyebrow="challenge">
            <div className={styles.turnSub}>
              <ChallengeCard data-testid="bw-challenge">
                <ChallengeCardHeader>
                  Is it actually <em className={styles.only}>only</em>?
                </ChallengeCardHeader>
                <ChallengeCardBody>
                  &ldquo;One portable file&rdquo; isn&apos;t yours alone — Frontify{" "}
                  <strong>hosts</strong> a brand, Brandpad <strong>publishes</strong> one, Zeroheight{" "}
                  <strong>documents</strong> one. The verb only you earn is <strong>compile</strong>:
                  from typed intent, against a live engine, for humans <strong>and</strong> agents.
                  Lean on that — or name a sharper wedge you can defend.
                </ChallengeCardBody>
                <ChallengeCardActions>
                  <ChallengeCardAction variant="primary" data-testid="bw-challenge-keep">
                    Use &ldquo;compile&rdquo;
                  </ChallengeCardAction>
                  <ChallengeCardAction variant="ghost" icon={null} data-testid="bw-challenge-rewrite">
                    I&apos;ll rewrite it
                  </ChallengeCardAction>
                  <ChallengeCardGate />
                </ChallengeCardActions>
              </ChallengeCard>
            </div>
          </AssistantTurn>

          <UserTurn>
            Yes — &ldquo;compile&rdquo; is the wedge. That&apos;s the verb nobody else can claim.
          </UserTurn>

          {/* Section set confirmation */}
          <div className={styles.setRow} data-testid="bw-section-complete">
            <span className={styles.setLine} />
            <Badge variant="success" className={styles.setBadge}>
              <Check weight="bold" aria-hidden="true" />
              Positioning set — downstream now derives
            </Badge>
            <span className={styles.setLine} />
          </div>

          {/* Essence kickoff (newest) */}
          <AssistantTurn>
            <div className={styles.turnText}>
              Positioning&apos;s locked — a genuine category of one. Now the{" "}
              <em className={styles.em}>essence</em>: the two or three words at the irreducible core,
              internal-facing, not a tagline. From everything you&apos;ve said, I&apos;d start with{" "}
              <strong>coherent · open · yours</strong>. Want me to draft why each earns its place — or
              would you rather choose the words yourself?
            </div>
          </AssistantTurn>
        </div>
      </div>

      {/* Composer */}
      <div className={styles.composerWrap}>
        <div className={styles.suggest}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              type="button"
              className={s.spark ? styles.schipSpark : styles.schip}
              data-testid="bw-suggestion-chip"
            >
              {s.spark ? <Sparkle weight="fill" aria-hidden="true" /> : null}
              {s.text}
            </button>
          ))}
        </div>
        <Composer data-testid="bw-composer">
          <ComposerField placeholder={COMPOSER.placeholder} data-testid="bw-composer-input" />
          <ComposerToolbar>
            <ComposerToolButton icon={<Plus />} aria-label="Add context" />
            <ComposerToolButton icon={<Microphone />} aria-label="Dictate" />
            <span className={styles.modelChip} data-testid="bw-model-chip">
              <StatusDot tone="mint" aria-hidden="true" />
              {COMPOSER.model}
            </span>
            <ComposerSpacer />
            <ComposerSend data-testid="bw-composer-send" />
          </ComposerToolbar>
        </Composer>
        <div className={styles.meta}>
          <ShieldCheck aria-hidden="true" />
          {COMPOSER.meta.map((m, i) => (
            <React.Fragment key={m}>
              {i > 0 ? <span className={styles.metaSep}>·</span> : null}
              <span>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </main>
  )
}
