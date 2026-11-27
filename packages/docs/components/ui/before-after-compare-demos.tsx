'use client';

import * as React from 'react';
import {
  BeforeAfterCompare,
  markLine,
  type CapturePair,
  type CompareMark,
} from '@/components/ui/before-after-compare';

const desktop: CapturePair = {
  label: 'Meter Docs',
  before: '/before-after-compare/desktop-before.webp',
  after: '/before-after-compare/desktop-after.webp',
  viewport: { width: 1280, height: 800, dpr: 1 },
};

const phone: CapturePair = {
  label: 'Meter Docs, Phone',
  before: '/before-after-compare/phone-before.webp',
  after: '/before-after-compare/phone-after.webp',
  viewport: { width: 390, height: 844, dpr: 2 },
};

export function BeforeAfterCompareDesktopDemo() {
  const [marks, setMarks] = React.useState<CompareMark[]>([]);
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      <BeforeAfterCompare pair={desktop} marks={marks} onMarksChange={setMarks} />
      {marks.length > 0 ? (
        <ul data-testid="before-after-compare-marks" style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          {marks.map((m) => (
            <li key={m.n}>{markLine(m, desktop.label)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BeforeAfterComparePhoneDemo() {
  return (
    <div style={{ width: '100%' }}>
      <BeforeAfterCompare pair={phone} />
    </div>
  );
}
