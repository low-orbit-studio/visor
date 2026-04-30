"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { PageHeader } from "../../components/ui/page-header/page-header"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Separator } from "../../components/ui/separator/separator"
import { Button } from "../../components/ui/button/button"
import { ConfirmDialog } from "../../components/ui/confirm-dialog/confirm-dialog"
import styles from "./admin-settings-page.module.css"

export interface AdminSettingsSection {
  /** Stable identifier — used as DOM id anchor and nav highlight key. */
  id: string
  /** Label rendered inside the left nav / top tab bar. */
  label: React.ReactNode
  /** Section heading rendered above the content. */
  title: React.ReactNode
  /** Optional supporting copy rendered below the heading. */
  description?: React.ReactNode
  /** Optional leading icon rendered before the label in the nav. */
  icon?: React.ReactNode
  /** Section body — form fields or arbitrary content. */
  content: React.ReactNode

  // ── Per-section save mode ──────────────────────────────────────────────
  /** Dirty flag — only meaningful when the page runs in `perSectionSave` mode. */
  dirty?: boolean
  /** Busy flag — only meaningful when the page runs in `perSectionSave` mode. */
  busy?: boolean
  /** Save handler — only called in `perSectionSave` mode. Async-aware. */
  onSave?: () => void | Promise<void>
  /** Revert handler — only called in `perSectionSave` mode. */
  onRevert?: () => void
  /** Override the per-section save button label. Defaults to "Save". */
  saveLabel?: React.ReactNode
  /** Override the per-section revert button label. Defaults to "Revert". */
  revertLabel?: React.ReactNode

  // ── Grouped nav extras ─────────────────────────────────────────────────
  /** Trailing badge in the nav item — e.g. member count "8" or status "default".
   *  Rendered as a dim trailing element in the side rail; suppressed in the top chip bar. */
  meta?: React.ReactNode
  /** Mutes the nav item's text color via `--text-tertiary` — used for "add" / utility actions. */
  muted?: boolean
}

export interface AdminSettingsSectionGroup {
  /** Categorical eyebrow label rendered above this group's nav items.
   *  Omit to render an ungrouped cluster (no label). */
  label?: React.ReactNode
  /** Ordered list of settings sections that belong to this group. */
  sections: AdminSettingsSection[]
}

export interface AdminSettingsPageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  // ── Header ──────────────────────────────────────────────────────────────
  /** Page title rendered inside the PageHeader. */
  title: React.ReactNode
  /** Optional eyebrow rendered above the title. */
  eyebrow?: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional breadcrumb node rendered above the title row. */
  breadcrumb?: React.ReactNode
  /** Optional header actions slot rendered on the right side of the header. */
  headerActions?: React.ReactNode

  // ── Sections ────────────────────────────────────────────────────────────
  /** Flat ordered list of settings sections. Use when grouping is not needed. */
  sections?: AdminSettingsSection[]
  /** Grouped sections with categorical eyebrow labels.
   *  Mutually exclusive with `sections` — if both are passed, `sectionGroups` wins
   *  and a dev-mode console.warn fires. */
  sectionGroups?: AdminSettingsSectionGroup[]

  // ── Navigation ──────────────────────────────────────────────────────────
  /** Show the section nav. Defaults to true when there is more than one section. */
  showNav?: boolean
  /** Nav position — "left" (sticky side rail) or "top" (horizontal chip bar). Defaults to "left". */
  navPosition?: "left" | "top"

  // ── Mode ────────────────────────────────────────────────────────────────
  /**
   * If true, each section renders its own save/revert footer row and the global
   * sticky footer is not rendered. Defaults to false (global single-save mode).
   */
  perSectionSave?: boolean

  // ── Global save footer (single-save mode only) ──────────────────────────
  /** Save handler. Async-aware — a returned Promise drives the save button's pending state. */
  onSave?: () => void | Promise<void>
  /** Cancel handler. Protected by the unsaved-changes guard when `dirty` is true. */
  onCancel?: () => void
  /** Save button label. Defaults to "Save changes". */
  saveLabel?: React.ReactNode
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: React.ReactNode
  /** Dirty flag — drives the save button disabled state and the cancel guard. */
  dirty?: boolean
  /** Externally-controlled busy state. Overrides internal async pending detection. */
  busy?: boolean
  /** Middle slot inside the sticky footer — e.g. "Last saved 2 minutes ago". */
  footerStatus?: React.ReactNode
  /** Hide the global footer. */
  hideFooter?: boolean

  // ── Unsaved guard (global cancel only) ──────────────────────────────────
  /** Title of the unsaved-changes confirm dialog. */
  unsavedGuardTitle?: React.ReactNode
  /** Description of the unsaved-changes confirm dialog. */
  unsavedGuardDescription?: React.ReactNode
  /** Confirm (discard) label. Defaults to "Discard". */
  unsavedGuardConfirmLabel?: React.ReactNode
  /** Cancel (keep editing) label. Defaults to "Keep editing". */
  unsavedGuardCancelLabel?: React.ReactNode
}

const DEFAULT_UNSAVED_DESCRIPTION =
  "You have unsaved changes that will be lost if you leave this page."

/** Internal helper: returns the flat section list used by the observer, refs,
 *  and main-column renderer. When `sectionGroups` is provided it wins; `sections`
 *  is the flat fallback. */
function flattenSections(
  sections: AdminSettingsSection[] | undefined,
  sectionGroups: AdminSettingsSectionGroup[] | undefined
): AdminSettingsSection[] {
  if (sectionGroups) return sectionGroups.flatMap((g) => g.sections)
  return sections ?? []
}

const AdminSettingsPage = React.forwardRef<
  HTMLDivElement,
  AdminSettingsPageProps
>(function AdminSettingsPage(
  {
    title,
    eyebrow,
    description,
    breadcrumb,
    headerActions,
    sections,
    sectionGroups,
    showNav,
    navPosition = "left",
    perSectionSave = false,
    onSave,
    onCancel,
    saveLabel = "Save changes",
    cancelLabel = "Cancel",
    dirty = false,
    busy,
    footerStatus,
    hideFooter = false,
    unsavedGuardTitle = "Discard unsaved changes?",
    unsavedGuardDescription = DEFAULT_UNSAVED_DESCRIPTION,
    unsavedGuardConfirmLabel = "Discard",
    unsavedGuardCancelLabel = "Keep editing",
    className,
    ...rest
  },
  ref
) {
  // Dev-mode warning when both props are provided.
  if (
    process.env.NODE_ENV !== "production" &&
    sections !== undefined &&
    sectionGroups !== undefined
  ) {
    console.warn(
      "[AdminSettingsPage] Both `sections` and `sectionGroups` were provided. " +
        "`sectionGroups` takes precedence and `sections` is ignored. " +
        "Pass only one of these props."
    )
  }

  const flatSections = flattenSections(sections, sectionGroups)
  const shouldShowNav = showNav ?? flatSections.length > 1
  const firstSectionId = flatSections[0]?.id
  const [activeId, setActiveId] = React.useState<string | undefined>(
    firstSectionId
  )
  const [isGlobalPending, setIsGlobalPending] = React.useState(false)
  const [pendingCancel, setPendingCancel] = React.useState(false)
  const sectionRefs = React.useRef<Map<string, HTMLElement>>(new Map())

  const effectiveBusy = busy ?? isGlobalPending

  // Intersection observer to highlight the nav item whose section is in view.
  React.useEffect(() => {
    if (!shouldShowNav) return
    if (typeof window === "undefined") return
    if (typeof IntersectionObserver === "undefined") return

    const elements = Array.from(sectionRefs.current.values())
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible entry.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          )
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).id
          if (id) setActiveId(id)
        }
      },
      {
        // Trigger when a section enters the top portion of the scroll container.
        rootMargin: "0px 0px -60% 0px",
        threshold: [0, 0.1, 0.5, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [shouldShowNav, flatSections])

  const registerSectionRef = React.useCallback(
    (id: string) => (node: HTMLElement | null) => {
      const map = sectionRefs.current
      if (node) {
        map.set(id, node)
      } else {
        map.delete(id)
      }
    },
    []
  )

  const handleNavClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault()
      const target = sectionRefs.current.get(id)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        // Update hash without jumping.
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `#${id}`)
        }
        setActiveId(id)
      }
    },
    []
  )

  const handleGlobalCancelClick = React.useCallback(() => {
    if (effectiveBusy) return
    if (dirty) {
      setPendingCancel(true)
      return
    }
    onCancel?.()
  }, [dirty, effectiveBusy, onCancel])

  const handleGlobalSaveClick = React.useCallback(async () => {
    if (!onSave) return
    const result = onSave()
    if (result && typeof (result as Promise<void>).then === "function") {
      setIsGlobalPending(true)
      try {
        await result
        setIsGlobalPending(false)
      } catch (err) {
        setIsGlobalPending(false)
        throw err
      }
    }
  }, [onSave])

  const handleGuardConfirm = React.useCallback(() => {
    if (pendingCancel) {
      setPendingCancel(false)
      onCancel?.()
    }
  }, [pendingCancel, onCancel])

  const handleGuardCancel = React.useCallback(() => {
    setPendingCancel(false)
  }, [])

  const globalSaveDisabled = effectiveBusy || !dirty

  return (
    <>
      <div
        ref={ref}
        className={cn(
          styles.root,
          shouldShowNav && navPosition === "left"
            ? styles.withLeftNav
            : styles.noLeftNav,
          className
        )}
        data-slot="admin-settings-page"
        data-nav-position={shouldShowNav ? navPosition : undefined}
        {...rest}
      >
        {firstSectionId ? (
          <a className={styles.skipLink} href={`#${firstSectionId}`}>
            Skip to content
          </a>
        ) : null}

        <PageHeader
          className={styles.header}
          eyebrow={eyebrow}
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          actions={headerActions}
        />

        {shouldShowNav && navPosition === "top" ? (
          <nav
            aria-label="Settings sections"
            className={styles.topNav}
            data-slot="admin-settings-page-nav"
          >
            <ul className={styles.topNavList}>
              {(sectionGroups ?? (flatSections.length > 0 ? [{ sections: flatSections }] : [])).map((group, gi) => (
                <React.Fragment key={gi}>
                  {gi > 0 ? (
                    <li
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={typeof group.label === "string" ? group.label : undefined}
                      className={styles.topNavSeparator}
                    />
                  ) : null}
                  {group.sections.map((section) => {
                    const isActive = section.id === activeId
                    return (
                      <li key={section.id} className={styles.topNavItem}>
                        <a
                          href={`#${section.id}`}
                          className={cn(
                            styles.topNavLink,
                            isActive && styles.navLinkActive
                          )}
                          aria-current={isActive ? "true" : undefined}
                          onClick={(e) => handleNavClick(e, section.id)}
                        >
                          {section.icon ? (
                            <span
                              className={styles.navIcon}
                              aria-hidden="true"
                            >
                              {section.icon}
                            </span>
                          ) : null}
                          <span className={styles.navLabel}>
                            {section.label}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </React.Fragment>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className={styles.body}>
          {shouldShowNav && navPosition === "left" ? (
            <nav
              aria-label="Settings sections"
              className={styles.sideNav}
              data-slot="admin-settings-page-nav"
            >
              <ul className={styles.sideNavList}>
                {(sectionGroups ?? (flatSections.length > 0 ? [{ sections: flatSections }] : [])).map((group, gi) => (
                  <li key={gi} className={styles.sideNavGroup}>
                    {group.label ? (
                      <div
                        className={styles.navGroupLabel}
                        aria-hidden="true"
                      >
                        {group.label}
                      </div>
                    ) : null}
                    <ul
                      className={styles.sideNavGroupList}
                      role="list"
                      aria-label={typeof group.label === "string" ? group.label : undefined}
                    >
                      {group.sections.map((section) => {
                        const isActive = section.id === activeId
                        return (
                          <li key={section.id} className={styles.sideNavItem}>
                            <a
                              href={`#${section.id}`}
                              className={cn(
                                styles.sideNavLink,
                                isActive && styles.navLinkActive,
                                section.muted && styles.navItemMuted
                              )}
                              aria-current={isActive ? "true" : undefined}
                              onClick={(e) => handleNavClick(e, section.id)}
                            >
                              {section.icon ? (
                                <span
                                  className={styles.navIcon}
                                  aria-hidden="true"
                                >
                                  {section.icon}
                                </span>
                              ) : null}
                              <span className={styles.navLabel}>
                                {section.label}
                              </span>
                              {section.meta !== undefined ? (
                                <span className={styles.navItemMeta}>
                                  {section.meta}
                                </span>
                              ) : null}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div
            className={styles.main}
            data-slot="admin-settings-page-main"
          >
            {flatSections.map((section, index) => {
              const titleId = `${section.id}-title`
              const showSectionFooter =
                perSectionSave && (section.onSave || section.onRevert)
              const sectionSaveDisabled =
                (section.busy ?? false) || !(section.dirty ?? false)

              return (
                <React.Fragment key={section.id}>
                  {index > 0 ? (
                    <Separator className={styles.sectionSeparator} />
                  ) : null}
                  <section
                    id={section.id}
                    ref={registerSectionRef(section.id)}
                    aria-labelledby={titleId}
                    className={styles.section}
                    data-slot="admin-settings-page-section"
                  >
                    <header className={styles.sectionHeader}>
                      <Heading
                        level={2}
                        size="lg"
                        id={titleId}
                        className={styles.sectionTitle}
                      >
                        {section.title}
                      </Heading>
                      {section.description ? (
                        <Text
                          size="sm"
                          color="secondary"
                          className={styles.sectionDescription}
                        >
                          {section.description}
                        </Text>
                      ) : null}
                    </header>

                    <div className={styles.sectionContent}>
                      {section.content}
                    </div>

                    {showSectionFooter ? (
                      <div
                        className={styles.sectionFooter}
                        role="group"
                        aria-label="Section actions"
                        data-slot="admin-settings-page-section-footer"
                      >
                        {section.onRevert ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={section.onRevert}
                            disabled={
                              (section.busy ?? false) ||
                              !(section.dirty ?? false)
                            }
                            data-slot="admin-settings-page-section-revert"
                          >
                            {section.revertLabel ?? "Revert"}
                          </Button>
                        ) : null}
                        {section.onSave ? (
                          <Button
                            type="button"
                            onClick={() => {
                              const result = section.onSave?.()
                              if (
                                result &&
                                typeof (result as Promise<void>).then ===
                                  "function"
                              ) {
                                // Consumer owns busy state in per-section mode.
                                void result
                              }
                            }}
                            disabled={sectionSaveDisabled}
                            aria-busy={
                              (section.busy ?? false) || undefined
                            }
                            data-slot="admin-settings-page-section-save"
                          >
                            {section.saveLabel ?? "Save"}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {!perSectionSave && !hideFooter ? (
          <div
            className={styles.footer}
            data-slot="admin-settings-page-footer"
            role="group"
            aria-label="Settings actions"
          >
            <div className={styles.footerCancel}>
              <Button
                type="button"
                variant="outline"
                onClick={handleGlobalCancelClick}
                disabled={effectiveBusy}
                data-slot="admin-settings-page-cancel"
              >
                {cancelLabel}
              </Button>
            </div>
            {footerStatus ? (
              <div
                className={styles.footerStatus}
                data-slot="admin-settings-page-status"
              >
                {footerStatus}
              </div>
            ) : null}
            <div className={styles.footerSave}>
              <Button
                type="button"
                onClick={handleGlobalSaveClick}
                disabled={globalSaveDisabled}
                aria-busy={effectiveBusy || undefined}
                data-slot="admin-settings-page-save"
              >
                {saveLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {!perSectionSave ? (
        <ConfirmDialog
          open={pendingCancel}
          onOpenChange={(next) => {
            if (!next) handleGuardCancel()
          }}
          severity="warning"
          title={unsavedGuardTitle}
          description={unsavedGuardDescription}
          confirmLabel={unsavedGuardConfirmLabel}
          cancelLabel={unsavedGuardCancelLabel}
          onConfirm={handleGuardConfirm}
          onCancel={handleGuardCancel}
        />
      ) : null}
    </>
  )
})

AdminSettingsPage.displayName = "AdminSettingsPage"

export { AdminSettingsPage }
