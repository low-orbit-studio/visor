'use client';

import * as React from 'react';
import {
  PhotoPicker,
  type PhotoPickerPhoto,
} from '../../../../components/ui/photo-picker/photo-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover/popover';
import { Button } from '../../../../components/ui/button/button';

/** Stand-in photographs: a two-stop gradient each, so the docs ship no image files. */
const SCENES: Array<[string, string, string]> = [
  ['dusk', '#f59e0b', '#7c2d12'],
  ['lake', '#38bdf8', '#1e3a8a'],
  ['field', '#a3e635', '#14532d'],
  ['stage', '#f472b6', '#4c1d95'],
  ['fog', '#e5e7eb', '#4b5563'],
  ['ember', '#fb923c', '#450a0a'],
  ['moss', '#6ee7b7', '#064e3b'],
  ['night', '#818cf8', '#0f172a'],
  ['sand', '#fde68a', '#92400e'],
  ['tide', '#5eead4', '#134e4a'],
];

const photo = (from: string, to: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='480' height='360' fill='url(#g)'/><circle cx='340' cy='110' r='54' fill='${from}' opacity='0.7'/></svg>`
  )}`;

export const DEMO_PHOTOS: PhotoPickerPhoto[] = SCENES.map(([key, from, to]) => ({
  key,
  thumb: photo(from, to),
  label: key[0].toUpperCase() + key.slice(1),
}));

/** The grid in a panel, with a button that bumps `play` to replay the wave. */
export function PhotoPickerDefaultDemo() {
  const [value, setValue] = React.useState('dusk');
  const [play, setPlay] = React.useState(0);
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-3)', width: 600, maxWidth: '100%' }}>
      <PhotoPicker aria-label="Pick Your Background" photos={DEMO_PHOTOS} value={value} onValueChange={setValue} play={play} />
      <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
        <Button variant="outline" size="sm" onClick={() => setPlay((n) => n + 1)}>
          Replay the Wave
        </Button>
        <code>{value}</code>
      </div>
    </div>
  );
}

/** In a popover: the wave plays on every open, and thumbnails wait for the first one. */
export function PhotoPickerPopoverDemo() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('lake');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">Photo</Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 600, maxWidth: 'calc(100vw - 32px)' }}>
        <PhotoPicker
          aria-label="Pick Your Background"
          photos={DEMO_PHOTOS}
          value={value}
          onValueChange={setValue}
          play={open}
          load={open}
        />
      </PopoverContent>
    </Popover>
  );
}
