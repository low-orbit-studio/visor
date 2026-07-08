"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import {
  KeyValueList,
  type KeyValueItem,
} from "../../components/ui/key-value-list/key-value-list"
import {
  StatusBadge,
  statusBadgeLabels,
  type StatusBadgeStatus,
} from "../../components/ui/status-badge/status-badge"
import { Switch } from "../../components/ui/switch/switch"
import { Separator } from "../../components/ui/separator/separator"
import styles from "./admin-detail.module.css"

// ─── Shared KeyValueList passthrough ─────────────────────────────────────────

/** KeyValueList configuration shared by record sections and the sensitive panel. */
interface KeyValueConfig {
  /** Label/value pairs rendered via the composed `KeyValueList`. */
  items?: KeyValueItem[]
  /** Grid column count forwarded to `KeyValueList`. Defaults to 2. */
  columns?: 1 | 2 | 3 | 4
  /** Label placement forwarded to `KeyValueList`. Defaults to `stacked`. */
  orientation?: "horizontal" | "stacked"
  /** Row density forwarded to `KeyValueList`. Defaults to `editorial`. */
  density?: "compact" | "default" | "editorial"
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminDetailSection extends KeyValueConfig {
  /** Stable identifier — becomes the section's DOM `id` anchor. */
  id?: string
  /** Small uppercase label rendered above the section title. */
  eyebrow?: React.ReactNode
  /** Section heading. */
  title?: React.ReactNode
  /** Supporting copy rendered below the section title. */
  description?: React.ReactNode
  /** Right-aligned action slot for the section header (edit link, menu, etc.). */
  actions?: React.ReactNode
  /**
   * Arbitrary sub-list content rendered below the key-value pairs — invoice
   * ledger rows, booking history, or any bespoke table. Renders after `items`.
   */
  content?: React.ReactNode
}

export interface AdminDetailSensitivePanel extends KeyValueConfig {
  /** Stable identifier — becomes the panel's DOM `id` anchor. */
  id?: string
  /** Small uppercase label rendered above the panel title. */
  eyebrow?: React.ReactNode
  /** Panel heading — e.g. "Tax & Banking". */
  title?: React.ReactNode
  /** Supporting copy rendered below the panel title. */
  description?: React.ReactNode
  /** Extra content revealed alongside `items` when the panel is unlocked. */
  content?: React.ReactNode
  /** Label paired with the reveal switch. Defaults to "Reveal". */
  revealLabel?: React.ReactNode
  /** Note shown while the panel is hidden. Defaults to "Hidden for privacy." */
  hiddenNote?: React.ReactNode
  /** Controlled reveal state. Omit for uncontrolled behavior. */
  revealed?: boolean
  /** Reveal-state change handler (fires in both controlled and uncontrolled modes). */
  onRevealedChange?: (revealed: boolean) => void
  /** Initial reveal state when uncontrolled. Defaults to false. */
  defaultRevealed?: boolean
}

export interface AdminDetailProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  // ── Identity header ───────────────────────────────────────────────────────
  /** Small uppercase label rendered above the record title. */
  eyebrow?: React.ReactNode
  /** Record title — the primary identity of the page. */
  title: React.ReactNode
  /** Supporting line beneath the title (email, handle, category, etc.). */
  subtitle?: React.ReactNode
  /** Leading media slot — Avatar, logo plate, or icon. */
  media?: React.ReactNode
  /**
   * Record status. A `StatusBadgeStatus` string renders a composed
   * `StatusBadge`; any other node renders as-is.
   */
  status?: StatusBadgeStatus | React.ReactNode
  /** Breadcrumb node rendered above the identity row. */
  breadcrumb?: React.ReactNode
  /** Right-aligned header action slot (edit, archive, overflow menu). */
  actions?: React.ReactNode
  /** Replace the default identity header entirely with custom chrome. */
  header?: React.ReactNode
  /** Suppress the hairline divider beneath the identity header. */
  hideHeaderDivider?: boolean

  // ── Body ──────────────────────────────────────────────────────────────────
  /** Key-value record sections, each composing a `KeyValueList`. */
  sections?: AdminDetailSection[]
  /** Optional sensitive/reveal panel gated behind a reveal switch. */
  sensitive?: AdminDetailSensitivePanel
  /** Arbitrary trailing content appended after the sections. */
  children?: React.ReactNode

  // ── Layout ────────────────────────────────────────────────────────────────
  /** Max-width of the record column. Number is treated as pixels. */
  maxWidth?: number | string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isStatusBadgeStatus(
  value: React.ReactNode
): value is StatusBadgeStatus {
  return typeof value === "string" && value in statusBadgeLabels
}

function resolveSize(
  value: number | string | undefined,
  fallback: string
): string {
  if (value == null) return fallback
  return typeof value === "number" ? `${value}px` : value
}

// ─── Section renderer ────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  if (!eyebrow && !title && !description && !actions) return null
  return (
    <div className={styles.sectionHeader} data-slot="admin-detail-section-header">
      <div className={styles.sectionHeaderText}>
        {eyebrow ? (
          <p className={styles.sectionEyebrow}>{eyebrow}</p>
        ) : null}
        {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
        {description ? (
          <p className={styles.sectionDescription}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className={styles.sectionActions}>{actions}</div>
      ) : null}
    </div>
  )
}

function RecordSection({ section }: { section: AdminDetailSection }) {
  const hasItems = section.items != null && section.items.length > 0
  return (
    <section
      id={section.id}
      className={styles.section}
      data-slot="admin-detail-section"
    >
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
        actions={section.actions}
      />
      {hasItems ? (
        <KeyValueList
          items={section.items!}
          columns={section.columns ?? 2}
          orientation={section.orientation ?? "stacked"}
          density={section.density ?? "editorial"}
        />
      ) : null}
      {section.content}
    </section>
  )
}

// ─── Sensitive panel ─────────────────────────────────────────────────────────

function SensitivePanel({ panel }: { panel: AdminDetailSensitivePanel }) {
  const isControlled = panel.revealed !== undefined
  const [internalRevealed, setInternalRevealed] = React.useState(
    panel.defaultRevealed ?? false
  )
  const revealed = isControlled
    ? (panel.revealed as boolean)
    : internalRevealed
  const switchId = React.useId()
  const contentId = React.useId()

  const handleChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalRevealed(next)
      panel.onRevealedChange?.(next)
    },
    [isControlled, panel]
  )

  const hasItems = panel.items != null && panel.items.length > 0
  const revealLabel = panel.revealLabel ?? "Reveal"
  const hiddenNote = panel.hiddenNote ?? "Hidden for privacy."

  return (
    <section
      id={panel.id}
      className={styles.sensitive}
      data-slot="admin-detail-sensitive"
      data-revealed={revealed ? "" : undefined}
    >
      <div className={styles.sensitiveHeader}>
        <div className={styles.sectionHeaderText}>
          {panel.eyebrow ? (
            <p className={styles.sectionEyebrow}>{panel.eyebrow}</p>
          ) : null}
          {panel.title ? (
            <h2 className={styles.sectionTitle}>{panel.title}</h2>
          ) : null}
          {panel.description ? (
            <p className={styles.sectionDescription}>{panel.description}</p>
          ) : null}
        </div>
        <div
          className={styles.revealControl}
          data-slot="admin-detail-reveal"
        >
          <label htmlFor={switchId} className={styles.revealLabel}>
            {revealLabel}
          </label>
          <Switch
            id={switchId}
            checked={revealed}
            onCheckedChange={handleChange}
            aria-controls={contentId}
          />
        </div>
      </div>

      <div
        id={contentId}
        className={styles.sensitiveBody}
        data-slot="admin-detail-sensitive-body"
      >
        {revealed ? (
          <>
            {hasItems ? (
              <KeyValueList
                items={panel.items!}
                columns={panel.columns ?? 2}
                orientation={panel.orientation ?? "stacked"}
                density={panel.density ?? "editorial"}
              />
            ) : null}
            {panel.content}
          </>
        ) : (
          <p className={styles.sensitiveNote}>{hiddenNote}</p>
        )}
      </div>
    </section>
  )
}

// ─── AdminDetail ─────────────────────────────────────────────────────────────

const AdminDetail = React.forwardRef<HTMLDivElement, AdminDetailProps>(
  function AdminDetail(
    {
      eyebrow,
      title,
      subtitle,
      media,
      status,
      breadcrumb,
      actions,
      header,
      hideHeaderDivider = false,
      sections,
      sensitive,
      children,
      maxWidth,
      className,
      style,
      ...rest
    },
    ref
  ) {
    const resolvedStatus = isStatusBadgeStatus(status) ? (
      <StatusBadge status={status} />
    ) : (
      status
    )

    const rootStyle = {
      ...style,
      ["--admin-detail-max-width" as string]: resolveSize(maxWidth, "none"),
    } as React.CSSProperties

    // Collect body regions so dividers interleave cleanly.
    const regions: React.ReactNode[] = []
    sections?.forEach((section, i) => {
      regions.push(
        <RecordSection key={section.id ?? `section-${i}`} section={section} />
      )
    })
    if (sensitive) {
      regions.push(
        <SensitivePanel key={sensitive.id ?? "sensitive"} panel={sensitive} />
      )
    }
    if (children != null) {
      regions.push(
        <div
          key="extra"
          className={styles.section}
          data-slot="admin-detail-extra"
        >
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(styles.root, className)}
        style={rootStyle}
        data-slot="admin-detail"
        {...rest}
      >
        {header ?? (
          <header
            className={cn(
              styles.identity,
              !hideHeaderDivider && styles.identityDivided
            )}
            data-slot="admin-detail-header"
          >
            {breadcrumb ? (
              <div
                className={styles.breadcrumb}
                data-slot="admin-detail-breadcrumb"
              >
                {breadcrumb}
              </div>
            ) : null}
            <div className={styles.identityRow}>
              {media ? (
                <div
                  className={styles.media}
                  data-slot="admin-detail-media"
                >
                  {media}
                </div>
              ) : null}
              <div className={styles.identityText}>
                {eyebrow ? (
                  <p className={styles.eyebrow}>{eyebrow}</p>
                ) : null}
                <div className={styles.titleRow}>
                  <h1
                    className={styles.title}
                    data-slot="admin-detail-title"
                  >
                    {title}
                  </h1>
                  {resolvedStatus ? (
                    <span
                      className={styles.status}
                      data-slot="admin-detail-status"
                    >
                      {resolvedStatus}
                    </span>
                  ) : null}
                </div>
                {subtitle ? (
                  <p className={styles.subtitle}>{subtitle}</p>
                ) : null}
              </div>
              {actions ? (
                <div
                  className={styles.actions}
                  data-slot="admin-detail-actions"
                >
                  {actions}
                </div>
              ) : null}
            </div>
          </header>
        )}

        {regions.length > 0 ? (
          <div className={styles.body} data-slot="admin-detail-body">
            {regions.map((node, i) => (
              <React.Fragment key={i}>
                {i > 0 ? (
                  <Separator className={styles.divider} decorative />
                ) : null}
                {node}
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    )
  }
)

AdminDetail.displayName = "AdminDetail"

export { AdminDetail }
