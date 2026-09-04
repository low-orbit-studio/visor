"use client"

import * as React from "react"
import {
  CaretDownIcon,
  CaretRightIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./doc-nav.module.css"

/**
 * Order threshold at or above which a doc with no group and no scope is
 * treated as an ad-hoc "random" doc and tucked into the Appendix bucket.
 * Mirrors the PL-2185 rule: no scope + no group + order >= 10 -> Appendix.
 */
const APPENDIX_ORDER_THRESHOLD = 10

const APPENDIX_ID = "appendix"
const APPENDIX_LABEL = "Appendix"
const SHARED_ID = "shared"
const SHARED_LABEL = "Shared"

/**
 * A single documentation entry — the manifest slice DocFrame passes down.
 * Every field but `order`/`label`/`href` is optional; absence of `scope`,
 * `group`, and `tier` reproduces the flat, single-row behaviour.
 */
export interface DocEntry {
  /** Sort order within the resolved group. `0` marks the hub/overview entry. */
  order: number
  /** Visible pill label. */
  label: string
  /** Destination URL (route or static `/docs/*.html`). */
  href: string
  /** Manifest kind (`route`, `local-html`, `external`, …). Used to detect external links. */
  kind?: string
  /** PL-2177 product scope — which product group(s) the doc belongs to. */
  scope?: string[]
  /** PL-2185 nav section-label hint. Defaults from `scope`. */
  group?: string
  /** PL-2170 load depth — referenced here, owned there. */
  tier?: number
  /** Force external treatment (new tab + badge). Defaults from `kind`/`href`. */
  external?: boolean
}

export interface DocNavProps
  extends Omit<React.ComponentProps<"nav">, "children"> {
  /** The manifest slice for the active view (Shared + product-scoped), pre-filtered by DocFrame. */
  docs: DocEntry[]
  /** Which product group is open (accordion). Absent → single-product mode (no accordion). */
  activeProduct?: string
  /**
   * Accordion callback — expand a product group (the parent collapses the
   * sibling by swapping `activeProduct`). Absent → groups render as plain,
   * independently expandable links (static-doc mode).
   */
  onProductToggle?: (id: string) => void
  /** Groups that stay open regardless of the accordion. Default `["shared"]`. */
  pinnedGroups?: string[]
  /** Resolves the active pill and auto-expands its group. */
  currentPath: string
  /** Whether non-active, non-pinned groups start collapsed. Default `true` — the anti-wall rule. */
  defaultCollapsed?: boolean
}

type GroupRole = "pinned" | "collapsible" | "appendix"

interface ResolvedGroup {
  id: string
  label: string
  role: GroupRole
  entries: DocEntry[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

function titleCase(value: string): string {
  if (value.length === 0) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Strip query + hash so a static `href` compares cleanly against `currentPath`. */
function normalizePath(value: string): string {
  return value.replace(/[?#].*$/, "")
}

function hrefMatchesPath(href: string, currentPath: string): boolean {
  if (!href) return false
  return normalizePath(href) === normalizePath(currentPath)
}

function isExternalEntry(entry: DocEntry): boolean {
  if (typeof entry.external === "boolean") return entry.external
  if (entry.kind === "external") return true
  return /^https?:\/\//.test(entry.href)
}

/** Resolve which group an entry belongs to, following the PL-2185 rules. */
function groupKeyFor(entry: DocEntry): { id: string; label: string } {
  const hasGroup = typeof entry.group === "string" && entry.group.length > 0
  const hasScope = Array.isArray(entry.scope) && entry.scope.length > 0

  if (!hasGroup && !hasScope && entry.order >= APPENDIX_ORDER_THRESHOLD) {
    return { id: APPENDIX_ID, label: APPENDIX_LABEL }
  }
  if (hasGroup) {
    return { id: slug(entry.group as string), label: entry.group as string }
  }
  if (hasScope) {
    // Bind-then-guard: index reads are only `string` under a checked-index
    // compiler. `hasScope` already proves a non-empty array, so the guard never
    // fires in practice — a scope that somehow yields nothing falls through to
    // the same Shared bucket an absent scope resolves to.
    const first = (entry.scope as string[])[0]
    if (first !== undefined) {
      return { id: slug(first), label: titleCase(first) }
    }
  }
  return { id: SHARED_ID, label: SHARED_LABEL }
}

/** Bucket the docs into ordered, non-empty groups (pinned → collapsible → appendix). */
function resolveGroups(
  docs: DocEntry[],
  pinnedGroups: string[]
): ResolvedGroup[] {
  const byId = new Map<string, ResolvedGroup>()
  const appearance: string[] = []

  for (const entry of docs) {
    const key = groupKeyFor(entry)
    let group = byId.get(key.id)
    if (!group) {
      const role: GroupRole =
        key.id === APPENDIX_ID
          ? "appendix"
          : pinnedGroups.includes(key.id)
            ? "pinned"
            : "collapsible"
      group = { id: key.id, label: key.label, role, entries: [] }
      byId.set(key.id, group)
      appearance.push(key.id)
    }
    group.entries.push(entry)
  }

  for (const group of byId.values()) {
    group.entries.sort((a, b) => a.order - b.order)
  }

  const rank = (group: ResolvedGroup): number => {
    if (group.role === "pinned") {
      const idx = pinnedGroups.indexOf(group.id)
      return idx === -1 ? 0 : idx
    }
    if (group.role === "appendix") return Number.MAX_SAFE_INTEGER
    return 1000 + appearance.indexOf(group.id)
  }

  return appearance
    .map((id) => byId.get(id) as ResolvedGroup)
    .sort((a, b) => rank(a) - rank(b))
}

// ─── DocNav ──────────────────────────────────────────────────────────────────

const DocNav = React.forwardRef<HTMLElement, DocNavProps>(
  (
    {
      docs,
      activeProduct,
      onProductToggle,
      pinnedGroups = [SHARED_ID],
      currentPath,
      defaultCollapsed = true,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const groups = React.useMemo(
      () => resolveGroups(docs, pinnedGroups),
      [docs, pinnedGroups]
    )

    // The group holding the active doc — always expanded on load.
    const activeGroupId = React.useMemo(() => {
      for (const group of groups) {
        if (group.entries.some((e) => hrefMatchesPath(e.href, currentPath))) {
          return group.id
        }
      }
      return null
    }, [groups, currentPath])

    const isControlled = onProductToggle != null

    // Uncontrolled expand state (static-doc mode + appendix, which is never a product).
    const [openSet, setOpenSet] = React.useState<Set<string>>(() => {
      const initial = new Set<string>()
      if (activeGroupId) initial.add(activeGroupId)
      if (activeProduct) initial.add(activeProduct)
      for (const group of groups) {
        if (group.role === "pinned") continue
        if (group.role === "appendix") {
          // A lone ad-hoc doc renders inline; two or more collapse.
          if (group.entries.length <= 1) initial.add(group.id)
          continue
        }
        if (!defaultCollapsed) initial.add(group.id)
      }
      return initial
    })

    const isOpen = (group: ResolvedGroup): boolean => {
      if (group.role === "pinned") return true
      if (group.role === "appendix") return openSet.has(group.id)
      // Collapsible product group.
      if (isControlled) {
        return group.id === activeProduct || group.id === activeGroupId
      }
      return openSet.has(group.id) || group.id === activeGroupId
    }

    const toggle = (group: ResolvedGroup): void => {
      if (group.role === "pinned") return
      if (group.role === "collapsible" && isControlled) {
        onProductToggle(group.id)
        return
      }
      setOpenSet((prev) => {
        const next = new Set(prev)
        if (next.has(group.id)) next.delete(group.id)
        else next.add(group.id)
        return next
      })
    }

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel ?? "Documentation"}
        data-slot="doc-nav"
        className={cn(styles.root, className)}
        {...props}
      >
        {groups.map((group) => (
          <DocNavGroup
            key={group.id}
            group={group}
            open={isOpen(group)}
            currentPath={currentPath}
            onToggle={() => toggle(group)}
          />
        ))}
      </nav>
    )
  }
)
DocNav.displayName = "DocNav"

// ─── DocNavGroup (internal) ──────────────────────────────────────────────────

interface DocNavGroupProps {
  group: ResolvedGroup
  open: boolean
  currentPath: string
  onToggle: () => void
}

function DocNavGroup({ group, open, currentPath, onToggle }: DocNavGroupProps) {
  const panelId = React.useId()
  const isPinned = group.role === "pinned"
  const Caret = open ? CaretDownIcon : CaretRightIcon

  const head = (
    <>
      <Caret className={styles.caret} weight="fill" aria-hidden="true" />
      <span className={styles.scopeDot} aria-hidden="true" />
      <span className={styles.groupLabel}>{group.label}</span>
      {!open && <span className={styles.count}>{group.entries.length}</span>}
    </>
  )

  return (
    <div
      data-slot="doc-nav-group"
      data-group={group.id}
      data-role={group.role}
      data-state={open ? "open" : "closed"}
      className={cn(
        styles.group,
        isPinned && styles.groupPinned,
        !open && styles.groupCollapsed
      )}
    >
      {isPinned ? (
        <div className={styles.head}>{head}</div>
      ) : (
        <button
          type="button"
          data-slot="doc-nav-group-trigger"
          className={cn(styles.head, styles.headButton)}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {head}
        </button>
      )}

      {open && (
        <div id={panelId} className={styles.pills}>
          {group.entries.map((entry, index) => (
            <DocNavPill
              key={entry.href}
              entry={entry}
              active={hrefMatchesPath(entry.href, currentPath)}
              // Hub = the group's overview entry: an explicit order-0 doc, or the
              // lead pill of the pinned Shared set (which often starts at order 1).
              isHub={entry.order === 0 || (group.role === "pinned" && index === 0)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DocNavPill (internal) ───────────────────────────────────────────────────

interface DocNavPillProps {
  entry: DocEntry
  active: boolean
  /** Marks the group's hub/overview entry — a leading accent dot. */
  isHub: boolean
}

function DocNavPill({ entry, active, isHub }: DocNavPillProps) {
  const external = isExternalEntry(entry)

  return (
    <a
      href={entry.href}
      data-slot="doc-nav-pill"
      data-active={active || undefined}
      data-hub={isHub || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(styles.pill, active && styles.pillActive, isHub && styles.pillHub)}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <span className={styles.pillNum}>{entry.order}</span>
      <span className={styles.pillLabel}>{entry.label}</span>
      {external && (
        <>
          <ArrowSquareOutIcon className={styles.pillExternal} aria-hidden="true" />
          <span className={styles.srOnly}>(opens in a new tab)</span>
        </>
      )}
    </a>
  )
}

export { DocNav }
