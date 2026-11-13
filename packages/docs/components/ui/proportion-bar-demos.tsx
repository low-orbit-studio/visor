'use client';

import * as React from 'react';
import {
  ProportionBar,
  type ProportionBarPart,
} from '../../../../components/ui/proportion-bar/proportion-bar';

const hoursFmt = (v: number) => `${v} h`;
const moneyFmt = (v: number) => `$${v.toLocaleString('en-US')}`;

export const HOURS: ProportionBarPart[] = [
  { label: 'On a package', value: 92.25 },
  { label: 'Outside a package', value: 41.5 },
  { label: 'Covered', value: 18, fill: 'var(--proportion-bar-fill-3)' },
  { label: 'Investment', value: 21.5, fill: 'var(--proportion-bar-fill-4)' },
  { label: 'Not billable', value: 4, fill: 'hatched' },
  { label: 'Unresolved', value: 9.25, fill: 'alert' },
];

export const MONEY: ProportionBarPart[] = [
  { label: 'Invoiced', value: 12455 },
  { label: 'Waiting', value: 9025, fill: 'striped' },
  { label: 'Written off', value: 0, fill: 'hatched' },
];

/** Hours by bucket, with its legend. */
export function ProportionBarHoursDemo() {
  return <ProportionBar legend formatValue={hoursFmt} parts={HOURS} />;
}

/** Money by state at the thin size, as inside a card. */
export function ProportionBarThinDemo() {
  return <ProportionBar size="thin" legend formatValue={moneyFmt} parts={MONEY} />;
}

/** Two bars on one width, each labelled: hours above money. */
export function ProportionBarStackedDemo() {
  const label: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--text-secondary)',
    lineHeight: '30px',
  };
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
        gap: 'var(--spacing-5) var(--spacing-4)',
        width: '100%',
      }}
    >
      <span style={label}>Hours</span>
      <ProportionBar legend formatValue={hoursFmt} parts={HOURS} />
      <span style={label}>Money</span>
      <ProportionBar legend formatValue={moneyFmt} parts={MONEY} />
    </div>
  );
}

/** Nothing measured yet: one neutral track, at both sizes. */
export function ProportionBarEmptyDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-4)', width: '100%' }}>
      <ProportionBar parts={[]} formatValue={hoursFmt} />
      <ProportionBar size="thin" legend formatValue={moneyFmt} parts={[{ label: 'Earned', value: 0 }]} />
    </div>
  );
}

/** The fills a part can take: the four default positions and the three built in. */
export function ProportionBarFillsDemo() {
  return (
    <ProportionBar
      legend
      parts={[
        { label: 'fill-1', value: 3 },
        { label: 'fill-2', value: 3 },
        { label: 'fill-3', value: 3 },
        { label: 'fill-4', value: 3 },
        { label: 'hatched', value: 3, fill: 'hatched' },
        { label: 'striped', value: 3, fill: 'striped' },
        { label: 'alert', value: 3, fill: 'alert' },
        { label: 'sliver', value: 0.05 },
      ]}
    />
  );
}
