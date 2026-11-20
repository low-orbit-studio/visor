'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from '@/components/ui/number-input';
import styles from './card-specimen.module.css';

/**
 * Card's glass variant with a blurred field inside, and an editable glass tile with
 * its save flash (VI-804). Solid unless an ancestor sets `data-glass="on"`.
 */
export function CardSpecimen() {
  const tile = useRef<HTMLDivElement>(null);
  const [saves, setSaves] = useState(0);

  // Replay the flash the way an app does after a save: drop the attribute, reflow, set it again.
  const save = () => {
    setSaves((n) => n + 1);
    const el = tile.current;
    if (!el) return;
    el.removeAttribute('data-flash');
    void el.offsetWidth;
    el.setAttribute('data-flash', '');
  };

  return (
    <div className={styles.row} data-slot="card-specimen">
      <Card variant="glass" className={styles.card} data-demo="card-glass">
        <CardHeader>
          <CardTitle>Friday Night</CardTitle>
          <CardDescription>The field below blurs the photo through the card.</CardDescription>
        </CardHeader>
        <CardContent>
          <NumberInput defaultValue={2} min={0} max={9} aria-label="Guests" />
        </CardContent>
      </Card>
      <div className={styles.stack}>
        <Card ref={tile} variant="glass" editable className={styles.tileCard} data-demo="card-editable" onClick={save}>
          <span className={styles.tile}>
            <span className={styles.eyebrow}>Doors</span>
            <span className={styles.value}>9:00 PM</span>
            <span className={styles.sub} data-slot="card-saves">
              Saved {saves} {saves === 1 ? 'time' : 'times'}
            </span>
          </span>
        </Card>
        <Button variant="outline" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
