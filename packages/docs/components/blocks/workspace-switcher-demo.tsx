'use client';

import * as React from 'react';
import {
  WorkspaceSwitcher,
  type WorkspaceItem,
} from '../../../../blocks/workspace-switcher/workspace-switcher';

const WORKSPACES: WorkspaceItem[] = [
  { id: 'empire-room', name: 'Empire Room', plan: 'Pro · NYC', initials: 'ER' },
  {
    id: 'house-of-yes',
    name: 'House of Yes',
    plan: 'Free · Brooklyn',
    initials: 'HY',
  },
  {
    id: 'elsewhere',
    name: 'Elsewhere',
    plan: 'Pro · Bushwick',
    initials: 'EL',
  },
];

interface WorkspaceSwitcherDemoProps {
  trigger?: 'full' | 'compact';
  empty?: boolean;
}

export function WorkspaceSwitcherDemo({
  trigger = 'full',
  empty = false,
}: WorkspaceSwitcherDemoProps) {
  const [currentId, setCurrentId] = React.useState(WORKSPACES[0].id);
  const current =
    WORKSPACES.find((w) => w.id === currentId) ?? WORKSPACES[0];
  const workspaces = empty ? [] : WORKSPACES;

  return (
    <div
      style={{
        width: trigger === 'compact' ? 'auto' : '16rem',
        padding: 'var(--spacing-4, 1rem)',
        background: 'var(--surface-card, #ffffff)',
        border: '1px solid var(--border-default, #e5e7eb)',
        borderRadius: 'var(--radius-md, 0.375rem)',
      }}
    >
      <WorkspaceSwitcher
        current={current}
        workspaces={workspaces}
        trigger={trigger}
        onSelect={setCurrentId}
      />
    </div>
  );
}
