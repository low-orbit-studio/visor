'use client';

import * as React from 'react';
import { DocFrame, type DocsManifest } from '@/components/ui/doc-frame';

const manifest: DocsManifest = {
  brand: 'Blacklight',
  products: [{ id: 'artist' }, { id: 'pro' }],
  docs: [
    { order: 1, label: 'Charter', href: '/docs/charter.html', kind: 'local-html', group: 'Shared' },
    { order: 6, label: 'Data', href: '/docs/data.html', kind: 'local-html', group: 'Shared' },
    { order: 2, label: 'Journeys', href: '/docs/artist/journeys', kind: 'route', scope: ['artist'], group: 'Artist' },
    { order: 3, label: 'Screens', href: '/docs/artist/screens', kind: 'route', scope: ['artist'], group: 'Artist' },
    { order: 2, label: 'Journeys', href: '/docs/pro/journeys', kind: 'route', scope: ['pro'], group: 'Pro' },
    { order: 5, label: 'States', href: '/docs/pro/states', kind: 'route', scope: ['pro'], group: 'Pro' },
    { order: 11, label: 'Q3 Audit', href: '/docs/q3-audit.html', kind: 'local-html' },
  ],
};

export function DocFrameDemo() {
  return (
    <DocFrame
      manifest={manifest}
      currentPath="/docs/artist/screens"
      activeProduct="artist"
      home={{ href: '/docs', label: 'Overview' }}
      meta="Artist · Build-Ready"
      style={{ maxWidth: '100%', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    >
      <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
        Artist — Screen Inventory
      </h2>
      <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
        The themed shell wraps DocNav in a sticky header and renders the doc as
        children below the nav. Switching between the Artist and Pro groups is one
        click, in place; the Shared group stays pinned.
      </p>
    </DocFrame>
  );
}
