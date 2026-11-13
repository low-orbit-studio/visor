'use client';

import * as React from 'react';
import {
  KanbanBoard,
  type KanbanBoardColumn,
} from '../../../../blocks/kanban-board/kanban-board';
import { StatusDot } from '../../../../components/ui/status-dot/status-dot';
import { Chip } from '../../../../components/ui/chip/chip';

interface Deal {
  id: string;
  name: string;
  contact: string;
  value: number;
  next: string;
  overdue?: boolean;
}

const STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'pitched', label: 'Pitched' },
  { id: 'signed', label: 'Signed' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'archived', label: 'Archived' },
];

const DEALS: Record<string, Deal[]> = {
  lead: [
    { id: 'd1', name: 'Northwind', contact: 'Ana Ruiz', value: 18000, next: 'Intro call', overdue: true },
    { id: 'd2', name: 'Harbor & Co', contact: 'Sam Lee', value: 6500, next: 'Send deck' },
  ],
  pitched: [{ id: 'd3', name: 'Fieldnote', contact: 'Priya Shah', value: 42000, next: 'Follow up' }],
  signed: [],
  active: [
    { id: 'd4', name: 'Lumen Labs', contact: 'Jo Park', value: 24000, next: 'Sprint review' },
    { id: 'd5', name: 'Quarry', contact: 'Eli Stone', value: 9000, next: 'Invoice' },
  ],
  paused: [{ id: 'd6', name: 'Tessellate', contact: 'Mo Diaz', value: 12000, next: 'Check in' }],
  archived: [{ id: 'd7', name: 'Old Mill', contact: 'Kit Wren', value: 3000, next: 'None' }],
};

const money = (n: number) => (n ? `$${Math.round(n / 1000)}k` : '—');

export function KanbanBoardDemo() {
  const [deals, setDeals] = React.useState(DEALS);

  const columns: KanbanBoardColumn<Deal>[] = STAGES.map((s) => ({
    ...s,
    items: deals[s.id],
    total: money(deals[s.id].reduce((sum, d) => sum + d.value, 0)),
    empty: 'Nothing here yet.',
  }));

  return (
    <div style={{ width: '100%' }}>
      <KanbanBoard<Deal>
        aria-label="Deals"
        columns={columns}
        rails={['paused', 'archived']}
        getItemLabel={(d) => d.name}
        onMove={(id, to) =>
          setDeals((prev) => {
            const deal = Object.values(prev).flat().find((d) => d.id === id)!;
            const next: Record<string, Deal[]> = {};
            for (const [stage, list] of Object.entries(prev))
              next[stage] = stage === to ? [...list, deal] : list.filter((d) => d.id !== id);
            return next;
          })
        }
        renderCard={(d) => (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <StatusDot tone={d.overdue ? 'danger' : 'info'} />
              <strong style={{ color: 'var(--text-primary)' }}>{d.name}</strong>
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {money(d.value)}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-1)' }}>{d.contact}</div>
            <div style={{ marginTop: 'var(--spacing-2)' }}>
              <Chip size="sm">{d.overdue ? `${d.next} · overdue` : d.next}</Chip>
            </div>
          </>
        )}
      />
    </div>
  );
}
