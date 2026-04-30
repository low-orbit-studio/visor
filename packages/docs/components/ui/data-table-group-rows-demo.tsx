'use client';

import { DataTable, type ColumnDef, type DataTableGroupRow, type DataTableRow } from '@/components/ui/data-table';

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const COLUMNS: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
];

const ROWS: DataTableRow<Row>[] = [
  { kind: 'group', id: 'g1', label: 'Tonight · Sat Apr 27', count: 2 },
  { kind: 'data', id: 'u1', row: { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' } },
  { kind: 'data', id: 'u2', row: { id: '2', name: 'Bjarne Stroustrup', email: 'bjarne@example.com', role: 'Editor' } },
  { kind: 'group', id: 'g2', label: 'This week · Apr 28 — May 4', count: 3 },
  { kind: 'data', id: 'u3', row: { id: '3', name: 'Carmack', email: 'carmack@example.com', role: 'Viewer' } },
  { kind: 'data', id: 'u4', row: { id: '4', name: 'Dennis Ritchie', email: 'dennis@example.com', role: 'Admin' } },
  { kind: 'data', id: 'u5', row: { id: '5', name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Editor' } },
];

function badgeGroupRowRenderer(group: DataTableGroupRow) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2, 0.5rem)',
        padding: '0 var(--spacing-4, 1rem)',
        height: '28px',
        background: 'var(--surface-alt, #f3f4f6)',
        fontSize: 'var(--font-size-xs, 0.6875rem)',
        fontWeight: 'var(--font-weight-semibold, 600)',
        color: 'var(--text-secondary, #6b7280)',
        position: 'sticky',
        top: 0,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--color-primary-500, #3b82f6)',
          flexShrink: 0,
        }}
      />
      {group.label}
      {group.count != null && (
        <span style={{ marginLeft: 'var(--spacing-2, 0.5rem)', color: 'var(--text-quaternary, #9ca3af)' }}>
          ({group.count})
        </span>
      )}
    </span>
  );
}

export function DataTableGroupRowsDemo() {
  return <DataTable columns={COLUMNS} rows={ROWS} groupRowRenderer={badgeGroupRowRenderer} />;
}
