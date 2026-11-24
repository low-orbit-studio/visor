'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhotoBackdrop, type PhotoBackdropSource } from '@/components/ui/photo-backdrop';
import { PHOTO_SCRIM, type LookSpecimenProps } from './looks';
import glass from './glass-specimen.module.css';
import styles from './photo-backdrop-specimen.module.css';

/**
 * PhotoBackdrop in a look (VI-811). It draws the photo only in the two Photo looks and
 * renders nothing in Today, Dark and Light. Its container holds it, so that container
 * turns glass on: the card over it is glass, and solid wherever no photo is drawn.
 * Next Photo crossfades to the look's other photo.
 */
export function PhotoBackdropSpecimen({ look, mode, photos }: LookSpecimenProps) {
  const [index, setIndex] = useState(0);
  const backgrounds: Record<string, PhotoBackdropSource> = Object.fromEntries(
    photos.map((src, i) => [String(i), { kind: 'photo', src }]),
  );
  const current = String(index % photos.length);
  return (
    <div className={styles.stage} data-slot="photo-backdrop-specimen">
      <PhotoBackdrop
        backgrounds={backgrounds}
        current={look.photo ? current : null}
        upcoming={Object.keys(backgrounds).filter((k) => k !== current)}
      />
      {look.photo && <div className={styles.scrim} style={{ background: PHOTO_SCRIM[mode] }} aria-hidden="true" />}
      <div className={glass.panel}>
        <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
        <span className={glass.edge} aria-hidden="true" />
        <div className={glass.content}>
          <h3 className={glass.title}>This Weekend</h3>
          <p className={glass.body}>The photo behind this card is a PhotoBackdrop. Where it draws one, the card turns to glass.</p>
          {look.photo && photos.length > 1 && (
            <Button variant="outline" className={styles.next} onClick={() => setIndex((i) => i + 1)}>
              Next Photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
