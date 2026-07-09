'use client';

import * as React from 'react';
import { DocNav, type DocEntry } from '@/components/ui/doc-nav';

const docs: DocEntry[] = [
  { order: 1, label: 'Charter', href: '/docs/charter.html', kind: 'local-html', group: 'Shared' },
  { order: 6, label: 'Data', href: '/docs/data.html', kind: 'local-html', group: 'Shared' },
  { order: 7, label: 'Reuse', href: '/docs/reuse.html', kind: 'local-html', group: 'Shared' },
  { order: 2, label: 'Journeys', href: '/docs/artist/journeys', kind: 'route', scope: ['artist'], group: 'Artist' },
  { order: 3, label: 'Screens', href: '/docs/artist/screens', kind: 'route', scope: ['artist'], group: 'Artist' },
  { order: 4, label: 'Fidelity', href: '/docs/artist/fidelity', kind: 'route', scope: ['artist'], group: 'Artist' },
  { order: 2, label: 'Journeys', href: '/docs/pro/journeys', kind: 'route', scope: ['pro'], group: 'Pro' },
  { order: 3, label: 'Screens', href: '/docs/pro/screens', kind: 'route', scope: ['pro'], group: 'Pro' },
  { order: 5, label: 'States', href: '/docs/pro/states', kind: 'route', scope: ['pro'], group: 'Pro' },
  { order: 11, label: 'Q3 Audit', href: '/docs/q3-audit.html', kind: 'local-html' },
  { order: 12, label: 'Runbook', href: 'https://example.com/runbook', kind: 'external' },
];

export function DocNavDemo() {
  const [product, setProduct] = React.useState('artist');
  return (
    <DocNav
      docs={docs}
      currentPath="/docs/artist/screens"
      activeProduct={product}
      onProductToggle={setProduct}
    />
  );
}
