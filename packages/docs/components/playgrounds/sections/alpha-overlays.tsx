"use client";

import { ColorSwatch } from "@/components/ui/color-swatch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import sectionStyles from "./section.module.css";
import styles from "./alpha-overlays.module.css";

/*
 * Alpha Overlays — applied demos of the BL-193 alpha-overlay tokens.
 *
 * Swatches show a token's value; these demos show the token doing its job and
 * re-resolving on theme switch. Treatments follow the operator-approved VI-466
 * spec (docs/audits/vi-466/index.html §4–7):
 *   §4 soft   → selected/active list row tint + nav item (soft wash + 3px brand edge)
 *   §5 glow   → marker dot with a soft halo ring
 *   §6 strong → segmented control whose selected segment uses the lightened fill
 *   §7 status → status-tinted table rows + inline status pills
 *
 * Everything is CSS-var-driven (the six tokens). The status-soft trio and brand
 * soft/glow route through color-mix defaults in the engine, so they degrade
 * gracefully under themes that do not pin them (no blank tiles).
 */

const NEW_TOKEN_SWATCHES: Array<{ token: string; hex: string; name: string }> = [
  { token: "--interactive-primary-soft", hex: "rgba(37,99,235,0.12)", name: "primary-soft" },
  { token: "--interactive-primary-glow", hex: "rgba(37,99,235,0.32)", name: "primary-glow" },
  { token: "--interactive-primary-strong", hex: "#4fb0c3", name: "primary-strong" },
  { token: "--surface-success-soft", hex: "rgba(34,197,94,0.10)", name: "success-soft" },
  { token: "--surface-warning-soft", hex: "rgba(245,158,11,0.12)", name: "warning-soft" },
  { token: "--surface-error-soft", hex: "rgba(239,68,68,0.12)", name: "error-soft" },
];

const STATUS_ROWS: Array<{
  booking: string;
  status: string;
  rowClass: string;
  textClass: string;
}> = [
  { booking: "Open slot", status: "Available", rowClass: styles.statusRowSuccess, textClass: styles.statusSuccessText },
  { booking: "Hold", status: "Tentative", rowClass: styles.statusRowWarning, textClass: styles.statusWarningText },
  { booking: "Double-booked", status: "Conflict", rowClass: styles.statusRowError, textClass: styles.statusErrorText },
];

export function AlphaOverlaysSection() {
  return (
    <div className={sectionStyles.root}>
      <p className={sectionStyles.lede}>
        The BL-193 alpha-overlay tokens in context. Swatches show the value; the demos below show each token
        doing its job — all CSS-var-driven, so every treatment re-resolves on theme switch.
      </p>

      {/* ── Swatches: all six new tokens, live + theme-reactive ─────────────── */}
      <section className={sectionStyles.group}>
        <h3 className={sectionStyles.groupHeading}>New alpha-overlay tokens</h3>
        <div className={sectionStyles.row}>
          {NEW_TOKEN_SWATCHES.map((s) => (
            <ColorSwatch key={s.token} token={s.token} hex={s.hex} name={s.name} dynamic />
          ))}
        </div>
      </section>

      {/* ── §4 Brand · soft ─────────────────────────────────────────────────── */}
      <section className={sectionStyles.group}>
        <h3 className={sectionStyles.groupHeading}>Brand · soft — selected row + nav item</h3>
        <div className={sectionStyles.stack}>
          <Table data-testid="overlays-soft-table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Ada Lovelace</TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
              <TableRow className={styles.softRow} data-active="true" aria-selected="true">
                <TableCell>Grace Hopper</TableCell>
                <TableCell>Editor</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Alan Turing</TableCell>
                <TableCell>Viewer</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <nav className={styles.navList} aria-label="Workspace sections" data-testid="overlays-soft-nav">
            <div className={styles.navItem}>Overview</div>
            <div className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page">
              Bookings
            </div>
            <div className={styles.navItem}>Members</div>
          </nav>
        </div>
      </section>

      {/* ── §5 Brand · glow ─────────────────────────────────────────────────── */}
      <section className={sectionStyles.group}>
        <h3 className={sectionStyles.groupHeading}>Brand · glow — marker halo</h3>
        <div className={styles.markerStage} data-testid="overlays-glow">
          <span className={styles.marker} aria-hidden="true" />
          <span className={`${styles.marker} ${styles.markerHalo}`} data-testid="overlays-glow-marker" aria-hidden="true" />
        </div>
      </section>

      {/* ── §6 Brand · strong ───────────────────────────────────────────────── */}
      <section className={sectionStyles.group}>
        <h3 className={sectionStyles.groupHeading}>Brand · strong — segmented control</h3>
        <div className={sectionStyles.row}>
          <div className={styles.segmented} role="group" aria-label="Range" data-testid="overlays-strong">
            <span className={styles.segment}>Day</span>
            <span className={`${styles.segment} ${styles.segmentStrong}`} aria-pressed="true" data-selected="true">
              Week
            </span>
            <span className={styles.segment}>Month</span>
          </div>
          {/* Base brand fill alongside, so the lightened "strong" reads as distinct. */}
          <div className={styles.segmented} role="group" aria-label="Base brand reference">
            <span className={`${styles.segment} ${styles.segmentBrand}`}>Base brand</span>
          </div>
        </div>
      </section>

      {/* ── §7 Status · soft ────────────────────────────────────────────────── */}
      <section className={sectionStyles.group}>
        <h3 className={sectionStyles.groupHeading}>Status · soft — tinted rows + inline pills</h3>
        <div className={sectionStyles.stack}>
          <Table data-testid="overlays-status-table">
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATUS_ROWS.map((r) => (
                <TableRow key={r.booking} className={r.rowClass}>
                  <TableCell>{r.booking}</TableCell>
                  <TableCell className={r.textClass}>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className={styles.pillRow} data-testid="overlays-status-pills">
            <span className={`${styles.pill} ${styles.pillSuccess}`}>
              <span className={styles.pillDot} aria-hidden="true" />
              Available
            </span>
            <span className={`${styles.pill} ${styles.pillWarning}`}>
              <span className={styles.pillDot} aria-hidden="true" />
              Tentative
            </span>
            <span className={`${styles.pill} ${styles.pillError}`}>
              <span className={styles.pillDot} aria-hidden="true" />
              Conflict
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
