'use client';

import * as React from 'react';
import {
  PhotoBackdrop,
  type PhotoBackdropSource,
} from '../../../../components/ui/photo-backdrop/photo-backdrop';
import { Button } from '../../../../components/ui/button/button';
import { GlassSpecimen } from '../looks/glass-specimen';
import { DEMO_PHOTOS } from './photo-picker-demos';
import styles from './photo-backdrop-demos.module.css';

/** Three stand-in photographs and a flat colour, so the docs ship no image files. */
const BACKGROUNDS: Record<string, PhotoBackdropSource> = {
  dusk: { kind: 'photo', src: DEMO_PHOTOS[0]!.thumb },
  lake: { kind: 'photo', src: DEMO_PHOTOS[1]!.thumb, focal: [0.7, 0.3] },
  stage: { kind: 'photo', src: DEMO_PHOTOS[3]!.thumb },
  ink: { kind: 'solid', color: 'var(--color-gray-900, #111827)' },
};
const PHOTOS = ['dusk', 'lake', 'stage'];

/** A framed stage: the next photo crossfades in, Solid fades to a colour, None renders nothing. */
export function PhotoBackdropDefaultDemo() {
  const [current, setCurrent] = React.useState<string | null>('dusk');
  const next = () => setCurrent((c) => PHOTOS[(PHOTOS.indexOf(c ?? '') + 1) % PHOTOS.length]!);
  const upcoming = PHOTOS.filter((k) => k !== current);
  return (
    <div className={styles.demo} data-demo="photo-backdrop">
      <div className={styles.stage}>
        <PhotoBackdrop backgrounds={BACKGROUNDS} current={current} upcoming={upcoming} />
        <div className={styles.content}>
          <GlassSpecimen />
        </div>
      </div>
      <div className={styles.controls}>
        <Button size="sm" onClick={next}>
          Next Photo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCurrent('ink')}>
          Solid
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCurrent(null)}>
          None
        </Button>
        <code>{String(current)}</code>
      </div>
    </div>
  );
}

/** One photo in a tall, narrow frame, centred and with its focal point at the top right. */
export function PhotoBackdropFocalDemo() {
  const src = DEMO_PHOTOS[3]!.thumb;
  return (
    <div className={styles.pair}>
      {([['Centred', undefined], ['focal [0.9, 0.2]', [0.9, 0.2]]] as const).map(([label, focal]) => (
        <figure key={label} className={styles.figure}>
          <div className={styles.narrow}>
            <PhotoBackdrop backgrounds={{ p: { kind: 'photo', src, focal: focal ? [...focal] : undefined } }} current="p" />
          </div>
          <figcaption className={styles.caption}>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
