'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThemeToggle, type ThemeToggleValue } from '@/components/ui/theme-toggle';
import { LOOKS } from './looks';
import styles from './theme-toggle-specimen.module.css';

/**
 * ThemeToggle as the theme skins it (VI-816): no colour or glass hooks, so the fill, ring,
 * ink and blur are the theme's, and the glass layer's over a photo. It sits straight on the
 * photo, as in Backstage's top bar. Only the size is set here, Backstage's 42px (38px on phones).
 */
export function ThemeToggleSpecimen() {
  const params = useSearchParams();
  const look = LOOKS.find((l) => l.id === params.get('look'));
  const [tone, setTone] = useState<ThemeToggleValue>(
    (look?.mode ?? params.get('mode')) === 'dark' ? 'dark' : 'light',
  );
  return (
    <div className={styles.bar} data-slot="theme-toggle-specimen">
      <ThemeToggle value={tone} onValueChange={setTone} />
    </div>
  );
}
