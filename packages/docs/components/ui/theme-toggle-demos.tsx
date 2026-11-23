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
