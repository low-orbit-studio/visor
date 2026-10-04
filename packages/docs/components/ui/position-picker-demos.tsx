'use client';

import * as React from 'react';
import {
  PositionPicker,
  type PositionValue,
} from '../../../../components/ui/position-picker/position-picker';

/** A controlled picker with a readout of the { y, x } pair it reports. */
export function PositionPickerControlledDemo() {
  const [value, setValue] = React.useState<PositionValue | null>({ y: 'center', x: 'center' });
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-3)', justifyItems: 'start' }}>
      <PositionPicker aria-label="Anchor" value={value} onValueChange={setValue} />
      <code>{value ? JSON.stringify(value) : 'null'}</code>
    </div>
  );
}

/**
 * The on-image variant over a busy synthetic photograph, one light half and one
 * dark half. The picker fills the positioned frame; the photo is never filtered.
 */
export function PositionPickerOnImageDemo({ width = 320, height = 200 }: { width?: number; height?: number }) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.06' numOctaves='4' seed='7'/><feColorMatrix values='1.4 0 0 0 0.05 0 1.2 0 0 0.05 0 0 1.1 0 0.05 0 0 0 1 0'/></filter><rect width='480' height='300' fill='#d9c8a6'/><rect width='480' height='300' filter='url(#n)'/><rect width='240' height='300' fill='#f4efe4' opacity='0.55'/><rect x='240' width='240' height='300' fill='#0b0b14' opacity='0.6'/></svg>";
  const photo = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  const [value, setValue] = React.useState<PositionValue | null>({ y: 'top', x: 'right' });
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        maxWidth: '100%',
        backgroundImage: photo,
        backgroundSize: 'cover',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <PositionPicker variant="on-image" aria-label="Focal point" value={value} onValueChange={setValue} />
    </div>
  );
}

/** A custom glyph per target: alignment marks in the occupied row. */
export function PositionPickerGlyphDemo() {
  const [value, setValue] = React.useState<PositionValue | null>({ y: 'center', x: 'left' });
  return (
    <PositionPicker
      aria-label="Info position and alignment"
      value={value}
      onValueChange={setValue}
      renderTarget={(position, { selected }) =>
        selected ? null : position.y === value?.y ? (
          <span aria-hidden="true" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            {position.x === 'left' ? 'L' : position.x === 'right' ? 'R' : 'C'}
          </span>
        ) : null
      }
    />
  );
}
