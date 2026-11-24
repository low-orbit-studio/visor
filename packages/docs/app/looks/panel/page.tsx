'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { ALL_THEMES } from '@/lib/theme-config';
import { PRIVATE_THEMES } from '@/lib/private-themes';
import { LOOKS, PHOTO_SCRIM, STAND_IN_PHOTO, STAND_IN_PHOTO_ALT, type LookMode } from '@/components/looks/looks';
import { LOOK_SPECIMENS } from '@/components/looks/specimens';

const VALID_THEMES = new Set<string>([...ALL_THEMES, ...PRIVATE_THEMES.map((t) => t.slug)]);
const THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;
// Only a same-origin path, so a link can't point the frame at another site.
const PHOTO_PATH = /^\/[\w./-]+$/;

/**
 * The real photos behind the photo looks (VI-829): the theme's own, else any private theme's, so
 * every demo on a machine with the private themes shows a real photo. The stand-in is left only
 * for a public build without them.
 */
function lookPhotos(theme: string) {
  return (
    PRIVATE_THEMES.find((t) => t.slug === theme)?.lookPhotos ?? PRIVATE_THEMES.find((t) => t.lookPhotos)?.lookPhotos
  );
}

/** One look of one specimen, in its own document so each look gets its own mode. */
function LookPanel() {
  const params = useSearchParams();
  const theme = VALID_THEMES.has(params.get('theme') ?? '') ? params.get('theme')! : 'neutral';
  const look = LOOKS.find((l) => l.id === params.get('look')) ?? LOOKS[0];
  const mode: LookMode = look.mode ?? (params.get('mode') === 'dark' ? 'dark' : 'light');
  const Specimen = LOOK_SPECIMENS[params.get('specimen') ?? ''] ?? LOOK_SPECIMENS.glass;
  // `photo-dark` / `photo-light` pick each tone's photos (a night shot in dark, a day shot in light).
  const given = (params.get(`photo-${mode}`) ?? params.get('photo') ?? '').split(',').filter((p) => PHOTO_PATH.test(p) && !p.startsWith('//'));
  const real = lookPhotos(theme)?.[mode];
  const photos = given.length ? given : real ? [real] : [STAND_IN_PHOTO, STAND_IN_PHOTO_ALT];
  const photo = photos[0];

  useEffect(() => {
    const body = document.body;
    body.className = body.className.replace(THEME_CLASS_PATTERN, '').trim();
    body.classList.add(`${theme}-theme`);
    // `.light` on the theme scope beats a dark-preferring OS (docs theme CSS keys light off html:not(.dark)).
    body.classList.toggle('light', mode === 'light');
    body.style.minHeight = '0';
    const html = document.documentElement;
    html.classList.toggle('dark', mode === 'dark');
    html.classList.toggle('light', mode === 'light');
    html.style.colorScheme = mode;
  }, [theme, mode]);

  return (
    <div
      data-slot="look-panel"
      data-look={look.id}
      data-mode={mode}
      data-glass={look.photo ? 'on' : undefined}
      style={{
        boxSizing: 'border-box',
        minHeight: '100vh',
        padding: 'var(--spacing-6)',
        display: 'grid',
        placeItems: 'center',
        background: look.photo
          ? `linear-gradient(${PHOTO_SCRIM[mode]}, ${PHOTO_SCRIM[mode]}), url("${photo}") center / cover`
          : 'var(--surface-page)',
      }}
    >
      <Specimen look={look} mode={mode} photos={photos} />
    </div>
  );
}

export default function LookPanelPage() {
  return (
    <Suspense>
      <LookPanel />
    </Suspense>
  );
}
