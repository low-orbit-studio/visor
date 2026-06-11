'use client';

import { MatrixTable } from '@/components/ui/matrix-table';

const sampleColumns = [
  { id: 'admin', label: 'Admin', count: 3 },
  { id: 'editor', label: 'Editor', count: 8 },
  { id: 'viewer', label: 'Viewer', count: 14 },
  { id: 'billing', label: 'Billing', count: 2 },
];

const sampleRows = [
  {
    id: '1',
    identity: { name: 'Ada Lovelace', email: 'ada@example.com' },
    activeColumns: new Set(['admin', 'editor']),
  },
  {
    id: '2',
    identity: { name: 'Grace Hopper', email: 'grace@example.com' },
    activeColumns: new Set(['editor', 'viewer']),
  },
  {
    id: '3',
    identity: { name: 'Margaret Hamilton', email: 'margaret@example.com' },
    activeColumns: new Set(['viewer']),
  },
  {
    id: '4',
    identity: { name: 'Dennis Ritchie', email: 'dennis@example.com' },
    activeColumns: new Set(['admin', 'editor', 'viewer', 'billing']),
  },
  {
    id: '5',
    identity: { name: 'Linus Torvalds', email: 'linus@example.com' },
    activeColumns: new Set([]),
  },
];

function renderIdentity(identity: { name: string; email: string }) {
  return <span style={{ fontWeight: 500 }}>{identity.name}</span>;
}

export function MatrixTableDemo() {
  return (
    <MatrixTable
      columns={sampleColumns}
      rows={sampleRows}
      renderIdentity={renderIdentity}
      aria-label="Member role assignments"
    />
  );
}
