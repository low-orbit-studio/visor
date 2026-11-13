'use client';

import { Meter } from '@/components/ui/meter';

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '44rem',
  padding: '18px 20px 14px',
  borderRadius: 18,
  background: 'var(--surface-page)',
};

export function MeterRowsDemo() {
  const rows = [
    { name: 'Client A', hue: 219, used: 44.8, max: 54, note: 'heads-up sent' },
    { name: 'Client B', hue: 147, used: 162, max: 200, note: 'heads-up due' },
    { name: 'Client C', hue: 315, used: 60.8, max: 160 },
  ];
  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: '20rem' }}>
      {rows.map((r) => (
        <Meter key={r.name} value={r.used} max={r.max} hue={r.hue} marks={[{ value: r.max * 0.8, threshold: true }]}>
          <strong>{Math.round((r.used / r.max) * 100)}%</strong> of {r.max} h{r.note ? ` · ${r.note}` : ''}
        </Meter>
      ))}
      <Meter value={12.5} max={40} hue={75}>
        <strong>12.5 of 40 h</strong> covered this month
      </Meter>
    </div>
  );
}

const contractMarks = (past: boolean) => [
  { value: 160, label: '160 h', caption: 'heads-up', align: 'end' as const, threshold: true, hideWhenNarrow: true },
  { value: 166, label: '166 h', caption: 'the low', align: 'start' as const, hideWhenNarrow: true },
  { value: 200, label: '200 h', caption: 'ceiling', align: past ? ('center' as const) : ('end' as const), variant: 'limit' as const },
];
const contractZones = [{ to: 190, variant: 'hatched' as const }, { to: 166 }];

export function MeterContractDemo() {
  return (
    <div style={card}>
      <Meter value={118} max={200} hue={219} size="contract" zones={contractZones} marks={contractMarks(false)}>
        <strong>118 h</strong> used of 200 h · 59% of the ceiling
      </Meter>
    </div>
  );
}

export function MeterPastCeilingDemo() {
  return (
    <div style={card}>
      <Meter value={212} max={200} hue={219} size="contract" zones={contractZones} marks={contractMarks(true)}>
        <strong>212 h</strong> used of 200 h · 12 h past the ceiling, unresolved
      </Meter>
    </div>
  );
}

export function MeterRetainerDemo() {
  const months = [
    { name: 'September', used: 34 },
    { name: 'October', used: 46 },
    { name: 'November', used: 12.5 },
  ];
  return (
    <div style={{ ...card, display: 'grid', gap: 18 }}>
      {months.map((m) => (
        <Meter
          key={m.name}
          value={m.used}
          max={40}
          scale={50}
          overflow="ink"
          hue={147}
          size="contract"
          zones={[{ to: 40 }]}
          marks={[{ value: 40, variant: 'limit' }]}
        >
          {m.name} · <strong>{m.used} of 40 h</strong>
          {m.used > 40 ? ` · +${m.used - 40} h overage` : ` · ${40 - m.used} h left`}
        </Meter>
      ))}
    </div>
  );
}
