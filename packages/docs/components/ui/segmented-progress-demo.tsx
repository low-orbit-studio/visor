'use client';

import * as React from 'react';
import {
  SegmentedProgress,
  type SegmentedProgressStep,
} from '../../../../components/ui/segmented-progress/segmented-progress';
import { Button } from '@/components/ui/button';

/** A multi-step form's sections, each weighted by its slide count. */
export const SECTIONS = [
  { label: 'About You', slides: 2 },
  { label: 'Tickets', slides: 1 },
  { label: 'Travel', slides: 3 },
  { label: 'Camp', slides: 2 },
  { label: 'Review', slides: 1 },
];

/** Steps for a form standing in section `at`, `fill` of the way through it; finished sections jump back. */
export function sectionSteps(at: number, fill: number, onJump?: (i: number) => void): SegmentedProgressStep[] {
  return SECTIONS.map((s, i) => ({
    label: s.label,
    weight: s.slides,
    state: i < at ? 'done' : i === at ? 'current' : 'pending',
    fill: i === at ? fill : undefined,
    onSelect: i < at && onJump ? () => onJump(i) : undefined,
  }));
}

/** Walk the sections: Next fills the current one slide by slide, a finished section jumps back. */
export function SegmentedProgressSectionsDemo() {
  const total = SECTIONS.reduce((n, s) => n + s.slides, 0);
  const [slide, setSlide] = React.useState(2);
  let at = 0;
  let first = 0;
  while (at < SECTIONS.length - 1 && slide >= first + SECTIONS[at]!.slides) first += SECTIONS[at++]!.slides;
  const fill = (slide - first + 1) / SECTIONS[at]!.slides;
  const jump = (i: number) => setSlide(SECTIONS.slice(0, i).reduce((n, s) => n + s.slides, 0));

  return (
    <div
      data-demo="segmented-progress-sections"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', width: '100%', maxWidth: '40rem' }}
    >
      <SegmentedProgress size="md" revealLabels steps={sectionSteps(at, fill, jump)} />
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
        <Button variant="outline" size="sm" disabled={slide === 0} onClick={() => setSlide((n) => n - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={slide === total - 1} onClick={() => setSlide((n) => n + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
