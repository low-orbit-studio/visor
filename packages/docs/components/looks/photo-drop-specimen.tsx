'use client';

import { useEffect, useState } from 'react';
import { PhotoDrop } from '@/components/ui/photo-drop';
import glass from './glass-specimen.module.css';
import styles from './photo-drop-specimen.module.css';

// Only a same-origin path, as the look panel's own photo.
const PHOTO_PATH = /^\/[\w./-]+$/;

/**
 * PhotoDrop's states (VI-812): empty, uploading, failed, locked and read-only, at 96px. Over a
 * photo (an ancestor sets `data-glass="on"`) they sit on a glass form panel; elsewhere the panel
 * draws nothing. `?tile-photo=/path.jpg` on the frame fills the tiles with a real photo.
 */
export function PhotoDropSpecimen() {
  const [photo, setPhoto] = useState('/astronaut.png');
  useEffect(() => {
    const tile = new URLSearchParams(window.location.search).get('tile-photo') ?? '';
    if (PHOTO_PATH.test(tile) && !tile.startsWith('//')) setPhoto(tile);
  }, []);

  return (
    <div className={styles.panel} data-slot="photo-drop-form-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={styles.stack} data-slot="photo-drop-specimen">
        <PhotoDrop id="look-empty" src="" size={96} />
        <PhotoDrop id="look-uploading" src={photo} alt="Your photo" size={96} progress={0.4} />
        <PhotoDrop id="look-failed" src={photo} alt="Your photo" size={96} failed onRetry={() => {}} />
        <PhotoDrop id="look-locked" src={photo} alt="Your photo" size={96} locked lockedReason="Check-in has started." />
        <PhotoDrop id="look-readonly" src={photo} alt="Your photo" size={96} readOnly readOnlyReason="It can't be changed here." />
      </div>
    </div>
  );
}
