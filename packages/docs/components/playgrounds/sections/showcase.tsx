"use client";

import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusBadgeStatus } from "@/components/ui/status-badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Banner, BannerTitle, BannerDescription } from "@/components/ui/banner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DataTable,
  type ColumnDef,
  type RowSelectionState,
} from "@/components/ui/data-table";
import sectionStyles from "./section.module.css";
import styles from "./showcase.module.css";

/*
 * Showcase (VI-487) — a deliberately curated composite, NOT the whole museum on
 * one page. ~8 meaningful component groupings exercise the system end-to-end so
 * cross-theme cohesion (or discord) is legible in one scroll. Everything is a
 * real Visor component on live theme tokens — switch theme/mode and the whole
 * surface re-resolves. Composition order is dual-pane sync-scroll friendly (D4).
 */

interface Member {
  id: string;
  name: string;
  role: string;
  status: StatusBadgeStatus;
}

const MEMBERS: Member[] = [
  { id: "ada", name: "Ada Lovelace", role: "Admin", status: "complete" },
  { id: "grace", name: "Grace Hopper", role: "Editor", status: "running" },
  { id: "alan", name: "Alan Turing", role: "Viewer", status: "pending" },
  { id: "katherine", name: "Katherine Johnson", role: "Admin", status: "failed" },
];

const MEMBER_COLUMNS: ColumnDef<Member>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export function ShowcaseSection() {
  // One row pre-selected so the real DataTable shows its soft `--surface-selected`
  // row tint without any synthetic styling.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({
    grace: true,
  });

  return (
    <div className={sectionStyles.root}>
      <p className={sectionStyles.lede}>
        A curated exhibit &mdash; real components composed together as the cross-theme
        cohesion test. Switch the theme or color mode and every surface below
        re-resolves on live tokens; nothing here is hardcoded.
      </p>

      {/* ── §1 Hero — brand-anchored, on a recessed backdrop (D5) ───────────── */}
      <section className={styles.hero} aria-label="Hero">
        <Card className={styles.heroCard}>
          <Badge variant="info">Borealis · v1.3</Badge>
          <Heading level={1} size="2xl">
            Build on one cohesive system
          </Heading>
          <Text size="lg" color="secondary" className={styles.heroBody}>
            The Showcase composes real Visor components on live theme tokens, so a
            single glance tells you whether a theme sings end-to-end.
          </Text>
          <div className={styles.heroHighlight}>
            Theme-aware by default &mdash; no hardcoded colors anywhere on this canvas.
          </div>
          <div className={styles.heroActions}>
            <Button>Get started</Button>
            <Button variant="secondary">View components</Button>
            <Badge variant="success">Stable</Badge>
          </div>
        </Card>
      </section>

      {/* ── §2 Typography hierarchy + inline link ──────────────────────────── */}
      <section className={sectionStyles.group} aria-label="Typography">
        <h3 className={sectionStyles.groupHeading}>Type &amp; prose</h3>
        <div className={styles.prose}>
          <Heading level={2} size="xl">
            Section heading
          </Heading>
          <Heading level={3} size="lg">
            Subsection heading
          </Heading>
          <Text>
            Body prose sets the reading rhythm for the system. Inline emphasis and a{" "}
            <a className={styles.link} href="#showcase">
              themed link
            </a>{" "}
            ride the same token palette, so color and contrast stay consistent across
            every theme.
          </Text>
          <Text size="sm" color="tertiary">
            Small muted caption &mdash; metadata and fine print.
          </Text>
        </div>
      </section>

      {/* ── §3 Actions — Button states ─────────────────────────────────────── */}
      <section className={sectionStyles.group} aria-label="Actions">
        <h3 className={sectionStyles.groupHeading}>Actions</h3>
        <div className={sectionStyles.row}>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* ── §4 Status & signals — StatusBadge + intensity-vs-soft Badges ───── */}
      <section className={sectionStyles.group} aria-label="Status and signals">
        <h3 className={sectionStyles.groupHeading}>Status &amp; signals</h3>
        <div className={sectionStyles.row}>
          <StatusBadge status="running" pulse />
          <StatusBadge status="complete" />
          <StatusBadge status="failed" />
        </div>
        <div className={sectionStyles.row}>
          <span className={styles.badgePair}>
            <span className={styles.badgePairLabel}>Info</span>
            <Badge variant="info">Soft</Badge>
            <Badge variant="filled-info">Filled</Badge>
          </span>
          <span className={styles.badgePair}>
            <span className={styles.badgePairLabel}>Success</span>
            <Badge variant="success">Soft</Badge>
            <Badge variant="filled-success">Filled</Badge>
          </span>
        </div>
      </section>

      {/* ── §5 Messaging — 1 soft (Alert) + 1 intensity (Banner) per status ── */}
      <section className={sectionStyles.group} aria-label="Messaging">
        <h3 className={sectionStyles.groupHeading}>Messaging</h3>
        <div className={styles.messaging}>
          <Alert variant="success">
            <AlertTitle>Changes saved</AlertTitle>
            <AlertDescription>Your workspace settings were updated.</AlertDescription>
          </Alert>
          <Banner intent="success">
            <BannerTitle>Deploy complete</BannerTitle>
            <BannerDescription>Version 1.3 is live across all regions.</BannerDescription>
          </Banner>
          <Alert variant="warning">
            <AlertTitle>Double-check</AlertTitle>
            <AlertDescription>Two members still have a pending invite.</AlertDescription>
          </Alert>
          <Banner intent="warning">
            <BannerTitle>Scheduled maintenance</BannerTitle>
            <BannerDescription>The admin API is offline Sunday 02:00–04:00 UTC.</BannerDescription>
          </Banner>
        </div>
      </section>

      {/* ── §6 Form preview (BL-227) — Fieldset with three fields ──────────── */}
      <section className={sectionStyles.group} aria-label="Form">
        <h3 className={sectionStyles.groupHeading}>Form</h3>
        <Card className={styles.formCard}>
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
            <CardDescription>A small composed panel, form A/B preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Fieldset className={styles.formFieldset}>
              <FieldsetLegend>Member details</FieldsetLegend>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <Label htmlFor="sc-name">Name</Label>
                  <Input id="sc-name" placeholder="Ada Lovelace" />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="sc-email">Email</Label>
                  <Input id="sc-email" type="email" placeholder="ada@example.com" />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="sc-role">Role</Label>
                  <Select>
                    <SelectTrigger id="sc-role">
                      <SelectValue placeholder="Pick a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Fieldset>
          </CardContent>
        </Card>
      </section>

      {/* ── §7 Data — small DataTable with one row pre-selected (soft tint) ── */}
      <section className={sectionStyles.group} aria-label="Data table">
        <h3 className={sectionStyles.groupHeading}>Data</h3>
        <div className={styles.tableWrap} data-testid="showcase-table">
          <DataTable
            columns={MEMBER_COLUMNS}
            data={MEMBERS}
            getRowId={(row) => row.id}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </section>

      {/* ── §8 Token accents — D6 alpha-overlay tokens in real context ─────── */}
      <section className={sectionStyles.group} aria-label="Alpha-overlay tokens">
        <h3 className={sectionStyles.groupHeading}>Alpha-overlay tokens in context</h3>
        <div className={styles.accents}>
          {/* interactive-primary-glow → marker halo */}
          <div className={styles.accent} data-testid="showcase-glow">
            <span className={styles.accentLabel}>--interactive-primary-glow</span>
            <div className={styles.markerStage}>
              <span className={styles.marker} aria-hidden="true" />
              <span
                className={`${styles.marker} ${styles.markerHalo}`}
                data-testid="showcase-glow-marker"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* interactive-primary-strong → segmented control selected segment */}
          <div className={styles.accent} data-testid="showcase-strong">
            <span className={styles.accentLabel}>--interactive-primary-strong</span>
            <div className={styles.segmented} role="group" aria-label="Range">
              <span className={styles.segment}>Day</span>
              <span
                className={`${styles.segment} ${styles.segmentStrong}`}
                aria-pressed="true"
                data-selected="true"
              >
                Week
              </span>
              <span className={styles.segment}>Month</span>
            </div>
          </div>

          {/* interactive-primary-soft → soft active list row */}
          <div className={styles.accent} data-testid="showcase-soft">
            <span className={styles.accentLabel}>--interactive-primary-soft</span>
            <div className={styles.softList}>
              <div className={styles.softItem}>Overview</div>
              <div
                className={`${styles.softItem} ${styles.softItemActive}`}
                aria-current="true"
              >
                Bookings
              </div>
              <div className={styles.softItem}>Members</div>
            </div>
          </div>

          {/* surface-*-soft → status-tinted rows */}
          <div className={styles.accent} data-testid="showcase-status-soft">
            <span className={styles.accentLabel}>--surface-*-soft</span>
            <div className={styles.statusSoftList}>
              <div className={`${styles.statusSoftRow} ${styles.statusSoftSuccess}`}>
                <span>Available</span>
                <span>3</span>
              </div>
              <div className={`${styles.statusSoftRow} ${styles.statusSoftWarning}`}>
                <span>Tentative</span>
                <span>1</span>
              </div>
              <div className={`${styles.statusSoftRow} ${styles.statusSoftError}`}>
                <span>Conflict</span>
                <span>2</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
