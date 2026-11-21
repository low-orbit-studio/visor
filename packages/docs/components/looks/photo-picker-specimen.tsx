'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhotoPicker, type PhotoPickerPhoto } from '@/components/ui/photo-picker';
import { DEMO_PHOTOS } from '@/components/ui/photo-picker-demos';
import glass from './glass-specimen.module.css';
import styles from './photo-picker-specimen.module.css';

// Only same-origin paths, so a link can't point the thumbnails at another site.
const PHOTO_PATH = /^\/[\w./-]+$/;

/** `?thumbs=/a.webp,/b.webp` swaps the stand-in thumbnails for real photos. */
function thumbs(param: string | null): PhotoPickerPhoto[] {
  const paths = (param ?? '').split(',').filter((p) => PHOTO_PATH.test(p) && !p.startsWith('//'));
  if (!paths.length) return DEMO_PHOTOS;
  return paths.map((thumb, i) => ({ key: `photo-${i + 1}`, thumb, label: `Photo ${i + 1}` }));
}

/**
 * PhotoPicker as the theme skins it (VI-816): no ring or colour hooks, so the resting ring is
 * the theme's border and the chosen ring its key colour. Over a photo the grid sits on a glass
 * panel, as Backstage's Photo menu sits in its glass popover; elsewhere the panel draws nothing.
 */
export function PhotoPickerSpecimen() {
  const photos = thumbs(useSearchParams().get('thumbs'));
  const [value, setValue] = useState(photos[1]?.key ?? null);
  return (
    <div className={styles.panel} data-slot="photo-picker-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
      <PhotoPicker
        className={styles.grid}
        aria-label="Pick Your Background"
        photos={photos.slice(0, 6)}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}
