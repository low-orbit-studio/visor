'use client';

import * as React from 'react';
import { BillingSlider, type BillingSliderProps } from '@/components/ui/billing-slider';
import { Switch } from '@/components/ui/switch';

const RATE = 120;
const H = (h: number) => `${h.toLocaleString('en-US')} h`;
const usd = (h: number) => `$${(h * RATE).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const card: React.CSSProperties = {
  width: '100%',
  padding: '18px 22px 16px',
  borderRadius: 18,
  background: 'var(--surface-page)',
};
const sub: React.CSSProperties = { fontSize: 13, lineHeight: '18px', color: 'var(--text-secondary)' };

type RowProps = Omit<BillingSliderProps, 'value' | 'onValueChange' | 'savedValue'> & {
  title: string;
  note?: string;
  bill: number;
  saved?: number;
  /** Every save on this row fails, so the thumb snaps back. */
  failSaves?: boolean;
};

/** One live slider: drag it or use the keys; Enter or releasing the thumb saves after a short wait. */
function Row({ title, note, bill, saved = bill, failSaves, status: fixedStatus, ...props }: RowProps) {
  const [value, setValue] = React.useState(bill);
  const [savedValue, setSavedValue] = React.useState(saved);
  const [liveStatus, setLiveStatus] = React.useState<BillingSliderProps['status']>();
  const status = fixedStatus ?? liveStatus;

  const onValueCommit = (v: number) => {
    if (v === savedValue) return;
    setLiveStatus('saving');
    window.setTimeout(() => {
      if (failSaves) {
        setValue(savedValue);
        setLiveStatus('failed');
      } else {
        setSavedValue(v);
        setLiveStatus(undefined);
      }
    }, 650);
  };

  const message =
    status === 'saving'
      ? `Saving ${H(value)}…`
      : status === 'failed'
        ? `Couldn't save. The slider went back to ${H(savedValue)}.`
        : value !== savedValue
          ? `${H(value)} · not saved yet. Enter saves, Esc goes back to ${H(savedValue)}.`
          : note;

  return (
    <div style={{ ...card, display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 44, fontSize: 15, lineHeight: '20px' }}>
        <span style={{ fontWeight: 600 }}>{title}</span>
        <span style={{ fontWeight: 700 }}>
          Bills {H(value)} · {usd(value)}
        </span>
      </div>
      <BillingSlider
        aria-label={`Hours ${title} bills`}
        value={value}
        savedValue={savedValue}
        onValueChange={(v) => {
          setValue(v);
          setLiveStatus(undefined);
        }}
        onValueCommit={onValueCommit}
        status={status}
        formatValue={H}
        valueText={(h) => `Bills ${H(h)}, ${usd(h)}`}
        minLabel="Low"
        maxLabel="Ceiling allows"
        hue={339}
        {...props}
      />
      <div style={{ ...sub, minHeight: 18, marginTop: 6, color: status === 'failed' ? 'var(--text-error)' : sub.color }}>
        {message}
      </div>
    </div>
  );
}

const base = { min: 8, max: 16.75, marks: [{ value: 10, label: 'High', hatchPast: true }] };
const column: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', maxWidth: '48rem' };

export function BillingSliderHeroDemo() {
  const [countAgent, setCountAgent] = React.useState(true);
  return (
    <div style={column}>
      <Row
        title="Website embeds"
        size="lg"
        bill={8}
        {...base}
        evidence={{ value: 10.5, agent: countAgent ? 3 : undefined, proposed: 1.25 }}
        gap
        note="Worked past the low. Raise it, or keep the low."
      />
      <label style={{ ...sub, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Switch checked={countAgent} onCheckedChange={setCountAgent} aria-label="Count agent time as evidence" />
        Count agent time (3 h) as evidence
      </label>
    </div>
  );
}

export function BillingSliderStatesDemo() {
  return (
    <div style={column}>
      <Row title="Worked under the low" bill={8} {...base} evidence={{ value: 6.5 }} note="Bills the low. Worked 6.5 h." />
      <Row title="Worked past the low" bill={8} {...base} evidence={{ value: 10.5 }} gap note="Worked 2.5 h past the low. Raise it, or keep the low." />
      <Row title="Past the high" bill={12.5} saved={8} {...base} evidence={{ value: 12.5 }} />
      <Row title="At the end" bill={16.75} saved={8} {...base} evidence={{ value: 18 }} />
      <Row title="Proposed hours" bill={8} {...base} evidence={{ value: 7.5, proposed: 2.25 }} note="2.25 h proposed, not confirmed." />
      <Row title="Saving" bill={9.5} saved={8} status="saving" {...base} evidence={{ value: 9.5 }} />
      <Row title="Failed" bill={8} failSaves {...base} evidence={{ value: 9.5 }} note="Every save here fails and snaps back: step with an arrow, then press Enter." />
      <Row title="The books don't balance" bill={8} disabled {...base} evidence={{ value: 9.5 }} note="Saving is off while the books don't balance." />
    </div>
  );
}
