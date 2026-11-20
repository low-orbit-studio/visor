'use client';

import * as React from 'react';
import {
  ThemeToggle,
  type ThemeToggleValue,
} from '../../../../components/ui/theme-toggle/theme-toggle';

/** A controlled toggle with a readout of the tone it holds. */
export function ThemeToggleControlledDemo() {
  const [tone, setTone] = React.useState<ThemeToggleValue>('light');
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
      <ThemeToggle value={tone} onValueChange={setTone} />
      <code>{tone}</code>
    </div>
  );
}

const GLASS = {
  '--theme-toggle-size': '42px',
  '--theme-toggle-icon-size': '17px',
  '--theme-toggle-bg': 'rgb(255 255 255 / 0.14)',
  '--theme-toggle-bg-hover': 'rgb(255 255 255 / 0.24)',
  '--theme-toggle-ring': 'rgb(255 255 255 / 0.16)',
  '--theme-toggle-color': '#ffffff',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
} as React.CSSProperties;

/** Backstage's glass button on a photograph: the same component, dressed by variables. */
export function ThemeToggleGlassDemo() {
  const [tone, setTone] = React.useState<ThemeToggleValue>('dark');
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 320,
        maxWidth: '100%',
        height: 160,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, #f59e0b, #db2777 45%, #1e1b4b)',
      }}
    >
      <ThemeToggle value={tone} onValueChange={setTone} style={GLASS} />
    </div>
  );
}
