'use client';

import * as React from 'react';
import {
  DotsThreeVerticalIcon,
  XIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { AdminDetailDrawer } from '../../../../blocks/admin-detail-drawer/admin-detail-drawer';
import { Button } from '../../../../components/ui/button/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../../../components/ui/tabs/tabs';
import { Kbd } from '../../../../components/ui/kbd/kbd';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar/avatar';
import styles from './admin-detail-drawer-admin-ui-density-demo.module.css';

type LineupAct = {
  initials: string;
  name: string;
  role: string;
  time: string;
  duration: string;
  accent?: boolean;
};

const LINEUP: LineupAct[] = [
  {
    initials: 'ED',
    name: 'Eris Drew',
    role: 'Headliner',
    time: '00:30 — 03:00',
    duration: '2h 30m',
    accent: true,
  },
  {
    initials: 'OG',
    name: 'Octo Octa',
    role: 'Support',
    time: '22:30 — 00:30',
    duration: '2h',
  },
  {
    initials: 'PD',
    name: 'Padded Cell',
    role: 'Opener',
    time: '22:00 — 22:30',
    duration: '30m',
  },
];

type DoorRow = {
  initials: string;
  name: string;
  plus?: string;
  source: string;
  badge: string;
  badgeTone?: 'mint';
  time: string;
};

const RECENT_DOOR: DoorRow[] = [
  {
    initials: 'MR',
    name: 'Maya Rodriguez',
    plus: '+1',
    source: 'Resolute',
    badge: 'GA+1',
    badgeTone: 'mint',
    time: '21:48',
  },
  {
    initials: 'EK',
    name: 'Elliot Kim',
    source: 'Door',
    badge: 'VIP',
    time: '21:42',
  },
  {
    initials: 'NO',
    name: 'Nadia Okafor',
    plus: '+2',
    source: 'Discwoman',
    badge: 'GA+2',
    time: '21:38',
  },
  {
    initials: 'JP',
    name: 'Joshua Park',
    source: 'Comp',
    badge: 'Comp',
    time: '21:31',
  },
];

export function AdminDetailDrawerAdminUiDensityDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-4, 1rem)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-1, 0.25rem)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          color: 'var(--text-secondary, #6b7280)',
        }}
      >
        <div>
          <strong style={{ color: 'var(--text-primary, #111827)' }}>
            Eris Drew — Resolute presents
          </strong>
        </div>
        <div>Sat Apr 27 · 22:00 — 04:00 · House of Yes</div>
      </div>

      <Button onClick={() => setOpen(true)}>Open event drawer</Button>

      <AdminDetailDrawer
        open={open}
        onOpenChange={setOpen}
        width="lg"
        className={styles.drawer}
        hideFooter={false}
        title="Eris Drew — Resolute presents"
        customHeader={
          <div className={styles.chrome}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Previous event"
            >
              <CaretLeftIcon className={styles.iconGlyph} weight="bold" />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Next event"
            >
              <CaretRightIcon className={styles.iconGlyph} weight="bold" />
            </button>
            <span className={styles.counter}>
              <span className={styles.num}>2</span> of{' '}
              <span className={styles.num}>128</span>
            </span>
            <div className={styles.chromeSpacer} />
            <button type="button" className={styles.chromeBtn}>
              Edit
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="More actions"
            >
              <DotsThreeVerticalIcon
                className={styles.iconGlyph}
                weight="bold"
              />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close drawer"
              onClick={() => setOpen(false)}
            >
              <XIcon className={styles.iconGlyph} />
            </button>
          </div>
        }
        footerStatus={
          <span className={styles.footerHints}>
            <span className={styles.hint}>
              <Kbd size="sm">⌘S</Kbd>{' '}
              <span className={styles.hintLabel}>save</span>
            </span>
            <span className={styles.hint}>
              <Kbd size="sm">Esc</Kbd>{' '}
              <span className={styles.hintLabel}>close</span>
            </span>
          </span>
        }
      >
        <div className={styles.hero}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles.badgeMint}`}>
              <span className={styles.dot} aria-hidden="true" />
              Live
            </span>
            <span className={styles.badge}>Tonight · 22:00</span>
            <span className={styles.badge}>
              <span
                className={`${styles.dot} ${styles.dotMuted}`}
                aria-hidden="true"
              />
              Door open in 2h 14m
            </span>
          </div>
          <div className={styles.eyebrow}>Resolute presents</div>
          <h2 className={styles.title}>Eris Drew</h2>
          <p className={styles.meta}>
            Main floor · 21+ · Sat Apr 27 · 22:00 — 04:00 · House of Yes
          </p>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCell}>
              <div className={styles.kpiLabel}>RSVPs</div>
              <div className={styles.kpiValue}>
                <span className={styles.figure}>512</span>
                <span className={styles.kpiAux}>/600</span>
              </div>
            </div>
            <div className={styles.kpiCell}>
              <div className={styles.kpiLabel}>Pre-sale</div>
              <div className={styles.kpiValue}>
                <span className={styles.figure}>$18,420</span>
              </div>
            </div>
            <div className={styles.kpiCell}>
              <div className={styles.kpiLabel}>Door list</div>
              <div className={styles.kpiValue}>
                <span className={styles.figure}>87</span>
              </div>
            </div>
            <div className={styles.kpiCell}>
              <div className={styles.kpiLabel}>VIP</div>
              <div className={styles.kpiValue}>
                <span className={styles.figure}>42</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className={styles.tabs}>
          <TabsList variant="line" className={styles.tabsList}>
            <TabsTrigger value="overview" className={styles.tabsTrigger}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="door" className={styles.tabsTrigger}>
              Door list{' '}
              <span className={styles.tabMeta} data-meta="true">
                512
              </span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className={styles.tabsTrigger}>
              Tickets
            </TabsTrigger>
            <TabsTrigger value="promoters" className={styles.tabsTrigger}>
              Promoters
            </TabsTrigger>
            <TabsTrigger value="comp" className={styles.tabsTrigger}>
              Comp &amp; VIP
            </TabsTrigger>
            <TabsTrigger value="activity" className={styles.tabsTrigger}>
              Activity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className={styles.tabsContent}>
            <section className={styles.section}>
              <div className={styles.sectionRule}>
                <span className={styles.sectionLabel}>Lineup</span>
                <span className={styles.rule} />
              </div>
              <ul className={styles.lineupList}>
                {LINEUP.map((act) => (
                  <li key={act.initials} className={styles.lineupRow}>
                    <Avatar
                      size="sm"
                      className={act.accent ? styles.avatarAccent : undefined}
                      aria-hidden="true"
                    >
                      <AvatarFallback>{act.initials}</AvatarFallback>
                    </Avatar>
                    <div className={styles.lineupText}>
                      <div className={styles.lineupName}>{act.name}</div>
                      <div className={styles.lineupMeta}>
                        {act.role} · {act.time}
                      </div>
                    </div>
                    <span className={`${styles.lineupDuration} ${styles.num}`}>
                      {act.duration}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionRule}>
                <span className={styles.sectionLabel}>Recent door list</span>
                <span className={styles.rule} />
                <span className={styles.sectionMeta}>
                  <span className={styles.num}>12</span> in last hour
                </span>
              </div>
              <div className={styles.doorList}>
                {RECENT_DOOR.map((row) => (
                  <div key={row.initials} className={styles.doorRow}>
                    <Avatar size="sm" aria-hidden="true">
                      <AvatarFallback>{row.initials}</AvatarFallback>
                    </Avatar>
                    <div className={styles.doorName}>
                      <span>{row.name}</span>
                      {row.plus ? (
                        <span className={styles.doorPlus}>{row.plus}</span>
                      ) : null}
                    </div>
                    <span className={styles.doorSource}>{row.source}</span>
                    <span
                      className={`${styles.doorBadge} ${
                        row.badgeTone === 'mint' ? styles.doorBadgeMint : ''
                      }`}
                    >
                      {row.badge}
                    </span>
                    <span className={`${styles.doorTime} ${styles.num}`}>
                      {row.time}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionRule}>
                <span className={styles.sectionLabel}>Internal notes</span>
                <span className={styles.rule} />
              </div>
              <p className={styles.notes}>
                Tech rider arrived 2 days ago — Eris confirmed CDJ-3000s, allen
                &amp; heath xone96. Greenroom upstairs unlocked from 21:30. Door
                ratio 80/20 GA/VIP. Comp list capped at 100, currently at{' '}
                <span className={styles.num}>87</span>.
              </p>
            </section>
          </TabsContent>
          <TabsContent value="door" className={styles.tabsContentEmpty}>
            Door list view — to be wired against full RSVP data.
          </TabsContent>
          <TabsContent value="tickets" className={styles.tabsContentEmpty}>
            Tickets view — pre-sale ledger and refunds.
          </TabsContent>
          <TabsContent value="promoters" className={styles.tabsContentEmpty}>
            Promoters view — splits and payouts.
          </TabsContent>
          <TabsContent value="comp" className={styles.tabsContentEmpty}>
            Comp &amp; VIP view — guest list and overrides.
          </TabsContent>
          <TabsContent value="activity" className={styles.tabsContentEmpty}>
            Activity view — full audit log.
          </TabsContent>
        </Tabs>
      </AdminDetailDrawer>
    </div>
  );
}
