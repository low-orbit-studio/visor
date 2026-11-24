'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { ScrollHint, useKeepGoing } from './scroll-hint';

const FIELDS = [
  { id: 'name', label: 'Your Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'arrival', label: 'Arrival Day' },
  { id: 'camp', label: 'Camp Name' },
  { id: 'diet', label: 'Dietary Needs' },
  { id: 'emergency', label: 'Emergency Contact' },
];

// The box's row gap is the hint's --scroll-hint-gap, so the zero-height hint row adds no space.
const BOX = {
  '--scroll-hint-gap': 'var(--spacing-4)',
  display: 'grid',
  gap: 'var(--scroll-hint-gap)',
  height: '15rem',
  overflowY: 'auto',
  padding: 'var(--spacing-1)',
} as CSSProperties;

/**
 * A long form in a fixed-height box (VI-814): the "More Below" pill shows while there is
 * more to scroll, and the button reads Keep Going while an empty field sits below the fold.
 */
export function ScrollHintDemo() {
  const box = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const pending = FIELDS.filter((f) => !values[f.id]?.trim()).map((f) => f.id);
  const keepGoing = useKeepGoing(box, pending);

  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-4)', width: 'min(100%, 20rem)' }} data-slot="scroll-hint-demo">
      <div ref={box} style={BOX} data-slot="scroll-hint-box">
        {FIELDS.map((f) => (
          <div key={f.id} style={{ display: 'grid', gap: 'var(--spacing-2)' }} data-field={f.id}>
            <Label htmlFor={`scroll-hint-${f.id}`}>{f.label}</Label>
            <Input
              id={`scroll-hint-${f.id}`}
              value={values[f.id] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
            />
          </div>
        ))}
        <ScrollHint boxRef={box} keepGoing={keepGoing} />
      </div>
      <Button onClick={() => keepGoing.go()}>{keepGoing.below ? 'Keep Going' : 'Continue'}</Button>
    </div>
  );
}
