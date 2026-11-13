'use client';

import * as React from 'react';
import { LayerChart, SpanStrip, type LayerNode, type Span } from '@/components/ui/layer-chart';
import { Meter } from '@/components/ui/meter';

/* ---------- sample data (made up) ---------- */

interface DemoNode extends LayerNode {
  /** Money, down to the package layer. */
  money?: number;
  low?: number;
  high?: number;
  bill?: number;
  agent?: number;
  date?: string;
  children?: DemoNode[];
}

const DAYS = ['Mon, Nov 2', 'Tue, Nov 3', 'Wed, Nov 4', 'Thu, Nov 5', 'Fri, Nov 6', 'Mon, Nov 9', 'Tue, Nov 10', 'Wed, Nov 11', 'Thu, Nov 12', 'Fri, Nov 13'];
const TODAY = DAYS.length - 1;

function seed(s: string) {
  let x = 7;
  for (const c of s) x = (Math.imul(x, 31) + c.charCodeAt(0)) >>> 0;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
}

/** Spreads a ticket's hours over a few days, in quarter hours that add up exactly. */
function days(id: string, hours: number, live = false): DemoNode[] {
  const r = seed(id);
  const q = Math.round(hours * 4);
  const k = Math.max(1, Math.min(5, Math.round(hours / 1.5), q));
  const end = live ? TODAY : TODAY - 1 - Math.floor(r() * 3);
  const picks = [...new Set(Array.from({ length: k }, (_, i) => Math.max(0, end - i * (1 + Math.floor(r() * 2)))))].sort((a, b) => a - b);
  const w = picks.map(() => 0.4 + r());
  const ws = w.reduce((a, b) => a + b, 0);
  const qs = picks.map((_, i) => 1 + Math.floor(((q - picks.length) * w[i]) / ws));
  for (let d = q - qs.reduce((a, b) => a + b, 0), i = 0; d > 0; d--, i++) qs[i % qs.length]++;
  return picks.map((di, j) => ({ id: `${id}/d${di}`, name: DAYS[di], date: DAYS[di], layer: 'Days', value: qs[j] / 4, today: di === TODAY, sub: di === TODAY ? 'Today · counts once it is over' : undefined }));
}

const T = (id: string, ref: string, name: string, h: number, live = false): DemoNode => ({
  id, ref, name, layer: 'Tickets', sub: live ? 'In progress' : 'Done', children: days(id, h, live),
});
const pkg = (id: string, name: string, low: number, high: number, rate: number, tickets: [string, string, number, boolean?][], o: Partial<DemoNode> = {}): DemoNode => {
  const children = tickets.map(([ref, n, h, live]) => T(`${id}/${ref}`, ref, n, h, live));
  const hours = children.reduce((a, t) => a + (t.children ?? []).reduce((b, d) => b + (d.value ?? 0), 0), 0);
  return {
    id, name, layer: 'Packages', low, high, bill: low, money: Math.round(hours * rate), children,
    sub: hours > high ? `+${+(hours - high).toFixed(2)} h over the high` : `est ${low}–${high} h`, ...o,
  };
};

const tree: DemoNode = {
  id: 'all', name: 'All clients', layer: 'All', sub: 'Q4 so far',
  children: [
    {
      id: 'a', name: 'Client A', hue: 147, layer: 'Clients', sub: '1 engagement', agent: 40,
      children: [{
        id: 'a/e1', name: 'Website rebuild', layer: 'Engagements', sub: 'Hourly',
        children: [
          pkg('a/e1/portal', 'Member portal', 22, 25, 90, [['A-150', 'Portal shell and nav', 9.5], ['A-152', 'Schedule view', 8.25], ['A-154', 'Uploads', 6.5], ['A-156', 'Guest list', 4.75], ['A-158', 'Sign-in', 2.5], ['A-159', 'Mobile pass', 1.25], ['A-161', 'Copy pass', 0.5], ['A-162', 'Empty states', 0.25]]),
          pkg('a/e1/offers', 'Offers', 17, 19.5, 90, [['A-140', 'Offer builder', 6.25, true], ['A-142', 'Offer acceptance', 4.5, true], ['A-145', 'Offer emails', 2.25], ['A-146', 'Offer expiry', 1]]),
          pkg('a/e1/staff', 'Staff onboarding', 10, 11.5, 90, [['A-130', 'Invite flow', 2.75], ['A-132', 'Checklist', 1.75]]),
          pkg('a/e1/email', 'Email sender', 4, 4.5, 90, [['A-125', 'Sender DNS', 0.75]]),
          pkg('a/e1/warranty', 'Warranty fixes', 0, 0, 0, [['A-120', 'Form error states', 1.5]], { kind: 'not-billable', sub: 'Not billable · warranty', low: undefined, high: undefined }),
          { ...pkg('a/e1/out', 'Outside a package', 0, 0, 90, [['A-12', 'Weekly call', 5.5], ['A-19', 'Project management', 2.75]]), sub: 'Bills as measured', low: undefined, high: undefined },
        ],
      }],
    },
    {
      id: 'b', name: 'Client B', hue: 219, layer: 'Clients', sub: '1 engagement', agent: 30,
      children: [{
        id: 'b/e1', name: 'Maintenance', layer: 'Engagements', sub: 'Retainer',
        children: [
          { ...pkg('b/e1/oct', 'Covered · October', 0, 0, 0, [['B-401', 'Calendar sync fixes', 9.5], ['B-404', 'Layout pass', 8], ['B-407', 'Push reliability', 6.75], ['B-409', 'Report fixes', 5.5]]), kind: 'covered', sub: 'The fee pays for it', money: 6500, low: undefined, high: undefined },
          { ...pkg('b/e1/nov', 'Covered · November', 0, 0, 0, [['B-420', 'Provider export', 5.5], ['B-422', 'Booking edge cases', 4.25]]), kind: 'covered', sub: 'The fee pays for it', money: 6500, low: undefined, high: undefined },
          { ...pkg('b/e1/scope', 'Out of scope', 0, 0, 0, [['B-88', 'Calendar export', 2.75]]), kind: 'unresolved', sub: 'Unresolved · bill as a change?', money: 0, low: undefined, high: undefined },
        ],
      }],
    },
    {
      id: 'c', name: 'Client C', hue: 339, layer: 'Clients', sub: '1 engagement', agent: 16,
      children: [{
        id: 'c/e1', name: 'Booking platform', layer: 'Engagements', sub: 'By estimate',
        children: [
          pkg('c/e1/groups', 'Artist groups', 12, 15, 120, [['C-201', 'Group model', 3.5], ['C-203', 'Roster editor', 3], ['C-205', 'Booking rules', 2.5]]),
          pkg('c/e1/invoicing', 'Auto-invoicing', 14, 17.5, 120, [['C-210', 'Invoice sync', 6.25], ['C-212', 'Triggers', 4.75], ['C-214', 'Retry and alerts', 3.5], ['C-216', 'Pilot report', 2]]),
          pkg('c/e1/embeds', 'Website embeds', 8, 10, 120, [['C-231', 'Embed widget', 4.5], ['C-236', 'Theming', 2.75], ['C-233', 'Script loader', 1.5], ['C-238', 'Venue page', 1]]),
        ],
      }],
    },
    {
      id: 'd', name: 'Client D', hue: 315, layer: 'Clients', sub: '1 engagement', agent: 8,
      children: [
        { id: 'd/e1', name: 'Beta', layer: 'Engagements', sub: 'Hourly', children: [pkg('d/e1/fixes', 'Feedback fixes', 7, 9, 125, [['D-101', 'Sizing quiz fixes', 4.5], ['D-104', 'Feedback inbox', 3.25]])] },
        { id: 'd/noeng', name: 'No engagement yet', layer: 'Engagements', kind: 'unresolved', sub: 'Nothing earns until an engagement exists', money: 0, children: [T('d/noeng/D-112', 'D-112', 'Listing refresh', 2.5, true)] },
      ],
    },
    {
      id: 'e', name: 'Client E', hue: 75, layer: 'Clients', sub: '1 engagement', agent: 5,
      children: [{ id: 'e/e1', name: 'Funnel and ops', layer: 'Engagements', sub: 'By estimate', children: [pkg('e/e1/report', 'Funnel report', 10, 13, 140, [['E-501', 'Funnel events', 4.25, true], ['E-503', 'Report view', 2.5]])] }],
    },
    {
      id: 'lo', name: 'Studio · investment', hue: 'tide', layer: 'Clients', sub: 'Investment · earns nothing', money: 0, agent: 64,
      children: [
        { id: 'lo/app', name: 'Studio app', layer: 'Products', sub: 'Investment', children: [T('lo/app/S-340', 'S-340', 'Earnings ledger', 7.5), T('lo/app/S-329', 'S-329', 'Admin refresh', 6.5)] },
        { id: 'lo/ds', name: 'Design system', layer: 'Products', sub: 'Investment', children: [T('lo/ds/S-749', 'S-749', 'Paper theme', 9), T('lo/ds/S-746', 'S-746', 'AA pairs', 3.25)] },
      ],
    },
    { id: 'u', name: 'Unassigned', layer: 'Clients', kind: 'unresolved', sub: 'No project · goal 0', value: 2, money: 0 },
  ],
};

// Roll money up to the package's ancestors; below the package widths stay hours.
(function roll(n: DemoNode, depth: number): number {
  const kids = (n.children ?? []).map((c) => roll(c, depth + 1));
  if (depth < 3 && n.money === undefined) n.money = kids.reduce((a, b) => a + b, 0);
  return n.money ?? 0;
})(tree, 0);

const byId = new Map<string, DemoNode>();
const parentOf = new Map<string, DemoNode>();
(function index(n: DemoNode, p?: DemoNode) {
  byId.set(n.id, n);
  if (p) parentOf.set(n.id, p);
  n.children?.forEach((c) => index(c, n));
})(tree);
const pathTo = (id: string) => {
  const out: DemoNode[] = [];
  for (let n = byId.get(id); n; n = parentOf.get(n.id)) out.unshift(n);
  return out;
};
const sum = (n: DemoNode): number => n.value ?? (n.children ?? []).reduce((a, c) => a + sum(c), 0);
const clientOf = (id: string) => pathTo(id)[1];

/** A day's spans for its whole project, in 5-minute runs. */
function spansFor(day: DemoNode): Span[] {
  const r = seed(day.id);
  const hours = (day.value ?? 0) + 1.5;
  const out: Span[] = [];
  let t = 9 * 60 + Math.round(r() * 8) * 5;
  let left = Math.round(hours * 12) * 5;
  let call = hours >= 2;
  while (left > 0) {
    if (call && out.length) { out.push({ kind: 'call', start: t, end: t + 30 }); t += 35; left -= 30; call = false; continue; }
    const len = Math.min(left, 5 * (8 + Math.floor(r() * 22)));
    out.push({ kind: 'attended', start: t, end: t + len });
    t += len + 5 * (2 + Math.floor(r() * 10));
    left -= len;
  }
  let ag = Math.round(hours * 0.6 * 12) * 5;
  let at = 9 * 60 + 30;
  while (ag > 0) { const len = Math.min(ag, 5 * (6 + Math.floor(r() * 18))); out.push({ kind: 'agent', start: at, end: at + len }); ag -= len; at += len + 5 * (6 + Math.floor(r() * 30)); }
  return out;
}

/* ---------- the demos ---------- */

const type = (weight: number, size: number, line: number): React.CSSProperties => ({ fontFamily: 'inherit', fontWeight: weight, fontSize: size, lineHeight: `${line}px` });
const fmtH = (h: number) => `${+h.toFixed(2)} h`;
const fmtM = (m: number) => `$${Math.round(m).toLocaleString('en-US')}`;

const pill = (on: boolean): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 11, border: 0, ...type(600, 13, 18), cursor: 'pointer',
  background: on ? 'var(--surface-page)' : 'transparent', color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
});
const seg: React.CSSProperties = { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 14, background: 'color-mix(in srgb, var(--text-primary) 7%, transparent)' };

const JUMPS: [string, string][] = [['Top', 'all'], ['Client', 'a'], ['Package', 'c/e1/embeds'], ['Ticket', 'a/e1/offers/A-140'], ['Day', byId.get('a/e1/offers/A-140')!.children![0].id], ['Covered', 'b/e1'], ['Unresolved', 'd']];

export function LayerChartExplorerDemo({ width }: { width?: number }) {
  const [focus, setFocus] = React.useState('all');
  const [mode, setMode] = React.useState<'hours' | 'money'>('hours');
  const [agent, setAgent] = React.useState(false);
  const F = byId.get(focus) ?? tree;
  const path = pathTo(focus);
  const money = mode === 'money';

  const measure = React.useCallback((n: LayerNode) => {
    const d = n as DemoNode;
    return money ? (d.money ?? (d.children?.length ? undefined : d.value)) : d.value;
  }, [money]);
  const format = React.useCallback((v: number, { node, short }: { node: LayerNode; short: boolean }) => {
    if (money && (node as DemoNode).money !== undefined) return fmtM(v);
    return short ? String(+v.toFixed(2)) : fmtH(v);
  }, [money]);

  return (
    <div style={{ width: '100%', maxWidth: width, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={seg} role="group" aria-label="Measure">
          <button type="button" style={pill(!money)} aria-pressed={!money} onClick={() => setMode('hours')}>Hours</button>
          <button type="button" style={pill(money)} aria-pressed={money} onClick={() => setMode('money')}>Money</button>
        </div>
        <div style={seg} role="group" aria-label="Agent time">
          <button type="button" style={pill(agent)} aria-pressed={agent} onClick={() => setAgent(!agent)}>Agent time</button>
        </div>
        {!width && (
          <div style={{ ...seg, flexWrap: 'wrap' }} role="group" aria-label="Jump to">
            {JUMPS.map(([label, id]) => (
              <button key={label} type="button" style={pill(focus === id)} onClick={() => setFocus(id)}>{label}</button>
            ))}
          </div>
        )}
      </div>
      <nav aria-label="Layers path" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', ...type(600, 14, 20), color: 'var(--text-secondary)' }}>
        {path.map((n, i) => (
          <React.Fragment key={n.id}>
            {i > 0 && <span aria-hidden="true">/</span>}
            <button type="button" onClick={() => setFocus(n.id)} aria-current={n.id === focus ? 'true' : undefined}
              style={{ ...pill(false), padding: '4px 8px', color: n.id === focus ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: n.id === focus ? 700 : 600 }}>
              {n.ref ?? n.name}
            </button>
          </React.Fragment>
        ))}
      </nav>
      {money && path.length > 3 && (
        <p style={{ margin: 0, ...type(600, 13, 18), color: 'var(--text-primary)' }}>Money is earned per package. Below the package, widths are hours.</p>
      )}
      <LayerChart
        data={tree}
        measure={measure}
        focusId={focus}
        onFocusChange={(id) => setFocus(id)}
        format={format}
        aria-label={money ? 'Money by layer' : 'Hours by layer'}
        band={agent ? {
          value: (n) => {
            const d = n as DemoNode;
            if (d.layer === 'Clients') return d.agent;
            if (d.layer === 'Days') return +(spansFor(d).filter((s) => s.kind === 'agent').reduce((a, s) => a + s.end - s.start, 0) / 60).toFixed(2);
            return undefined;
          },
          note: (layer) => `Agent time · not measured per ${layer.toLowerCase().replace(/s$/, '')} yet`,
        } : undefined}
        renderBlock={(n) => {
          const d = n as DemoNode;
          if (money || d.low == null || d.high == null) return null;
          const h = sum(d);
          return (
            <Meter
              aria-hidden="true"
              value={h}
              max={d.high}
              scale={Math.max(d.high, h) * 1.08}
              overflow="ink"
              marks={[{ value: d.low }, { value: d.high, variant: 'limit' }]}
              style={{ '--meter-hue-fill-strong': 'color-mix(in srgb, currentColor 18%, transparent)', '--meter-hue-ink': 'currentColor', '--meter-tick': 'currentColor' } as React.CSSProperties}
            />
          );
        }}
      />
      {F.layer === 'Days' && (
        <div style={{ background: 'var(--surface-card)', borderRadius: 24, padding: '18px 20px 16px' }}>
          <p style={{ margin: 0, ...type(700, 15, 20), color: 'var(--text-primary)' }}>{F.name} · {clientOf(F.id).name}, every 5 minutes</p>
          <p style={{ margin: '2px 0 14px', ...type(500, 13, 18), color: 'var(--text-secondary)' }}>
            Spans are kept per project and day, not per ticket, so this is the whole day on {clientOf(F.id).name}.
          </p>
          <SpanStrip
            spans={spansFor(F).filter((s) => agent || s.kind !== 'agent')}
            hue={clientOf(F.id).hue}
          />
        </div>
      )}
    </div>
  );
}

export function LayerChartNarrowDemo() {
  return (
    <div style={{ width: 358, maxWidth: '100%' }}>
      <LayerChartExplorerDemo width={358} />
    </div>
  );
}

const kinds: LayerNode = {
  id: 'k', name: 'Kinds', layer: 'All',
  children: [
    {
      id: 'k/a', name: 'Client A', hue: 219, layer: 'Clients',
      children: [
        { id: 'k/a/solid', name: 'On a package', sub: 'Solid', layer: 'Packages', value: 12 },
        { id: 'k/a/cov', name: 'Covered', sub: 'Pale, dotted', layer: 'Packages', kind: 'covered', value: 9 },
        { id: 'k/a/nb', name: 'Not billable', sub: 'Hatched', layer: 'Packages', kind: 'not-billable', value: 8 },
        { id: 'k/a/u', name: 'Out of scope', sub: 'Unresolved', layer: 'Packages', kind: 'unresolved', value: 7 },
        { id: 'k/a/today', name: 'Today', sub: 'Counts once it is over', layer: 'Packages', today: true, value: 6 },
      ],
    },
  ],
};

export function LayerChartKindsDemo() {
  return <div style={{ width: '100%' }}><LayerChart data={kinds} defaultFocusId="k/a" format={(v, { short }) => (short ? String(v) : `${v} h`)} /></div>;
}

export function SpanStripDemo() {
  const spans: Span[] = [
    { kind: 'attended', start: 9 * 60 + 10, end: 10 * 60 + 25 },
    { kind: 'call', start: 10 * 60 + 30, end: 11 * 60 },
    { kind: 'attended', start: 11 * 60 + 20, end: 12 * 60 + 40 },
    { kind: 'attended', start: 14 * 60, end: 15 * 60 + 35 },
    { kind: 'agent', start: 9 * 60 + 30, end: 10 * 60 + 50 },
    { kind: 'agent', start: 13 * 60 + 15, end: 14 * 60 + 5 },
  ];
  return (
    <div style={{ width: '100%', background: 'var(--surface-card)', borderRadius: 24, padding: '18px 20px 16px' }}>
      <SpanStrip spans={spans} hue={147} />
    </div>
  );
}
