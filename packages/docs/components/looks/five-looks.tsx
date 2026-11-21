'use client';

import { useEffect, useState } from 'react';
import { PRIVATE_THEMES } from '@/lib/private-themes';
import { useActiveTheme } from '@/components/playgrounds/sections/use-active-theme';
import { LOOKS, type LookMode } from './looks';
import styles from './five-looks.module.css';

const PRIVATE_SLUGS = PRIVATE_THEMES.map((t) => t.slug);

function readDocsMode(): LookMode {
  const html = document.documentElement;
  if (html.classList.contains('dark')) return 'dark';
  if (html.classList.contains('light')) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface FiveLooksProps {
  /** Key in `LOOK_SPECIMENS`. */
  specimen: string;
  /** Height of each look, in px. */
  height?: number;
  /** Draw every look on this theme instead of the one picked in the docs. */
  theme?: string;
  /** Draw Today on this theme (Honcho's Today look is its own theme). Defaults to `theme`. */
  todayTheme?: string;
}

/**
 * One specimen in all five looks (Today, Dark, Dark + Photo, Light, Light + Photo),
 * on the theme picked in the docs. Each look is its own frame, because a page can
 * only hold one light/dark mode per theme. Today follows the docs site's mode.
 * A `?photo=/path.jpg` on the page swaps the stand-in photo for a real one; `?photo-dark=` and
 * `?photo-light=` set one per tone (a night photo behind Dark + Photo, a day photo behind Light + Photo).
 * A `?thumbs=/a.webp,/b.webp` passes real photos to a specimen that shows thumbnails (PhotoPicker).
 */
export function FiveLooks({ specimen, height = 340, theme: themeProp, todayTheme }: FiveLooksProps) {
  const theme = useActiveTheme(themeProp, PRIVATE_SLUGS);
  const [mode, setMode] = useState<LookMode>('light');
  const [photos, setPhotos] = useState<Record<LookMode, string>>({ dark: '', light: '' });
  const [thumbs, setThumbs] = useState('');

  useEffect(() => {
    const read = () => setMode(readDocsMode());
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const params = new URLSearchParams(window.location.search);
    const photo = params.get('photo') ?? '';
    setPhotos({ dark: params.get('photo-dark') ?? photo, light: params.get('photo-light') ?? photo });
    setThumbs(params.get('thumbs') ?? '');
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.grid} data-slot="five-looks">
      {LOOKS.map((look) => {
        const lookTheme = look.id === 'today' ? (todayTheme ?? theme) : theme;
        const query = new URLSearchParams({ theme: lookTheme, look: look.id, mode, specimen });
        const photo = look.mode ? photos[look.mode] : '';
        if (photo) query.set('photo', photo);
        if (thumbs) query.set('thumbs', thumbs);
        return (
          <figure key={look.id} className={styles.look} data-look={look.id}>
            <figcaption className={styles.label}>{look.label}</figcaption>
            <iframe
              className={styles.frame}
              title={`${look.label} look`}
              src={`/looks/panel?${query}`}
              style={{ height }}
            />
          </figure>
        );
      })}
    </div>
  );
}
