'use client';

import * as React from 'react';
import { BuildingsIcon } from '@phosphor-icons/react';
import {
  ProfileMenu,
  defaultProfileMenuItems,
  type ProfileMenuItem,
  type ProfileMenuUser,
} from '../../../../blocks/profile-menu/profile-menu';

const DEFAULT_USER: ProfileMenuUser = {
  name: 'Justin Schier',
  email: 'justin@loworbit.studio',
  initials: 'JS',
  status: 'online',
};

interface ProfileMenuDemoProps {
  variant?: 'default' | 'no-context' | 'no-email' | 'with-badge';
}

export function ProfileMenuDemo({ variant = 'default' }: ProfileMenuDemoProps) {
  const user = variant === 'no-email' ? { ...DEFAULT_USER, email: undefined } : DEFAULT_USER;
  const items: ProfileMenuItem[] = defaultProfileMenuItems(user, {
    onSignOut: () => undefined,
    notificationCount: variant === 'with-badge' ? 3 : undefined,
  });
  const context =
    variant === 'no-context'
      ? undefined
      : {
          label: 'ENTR · Owner',
          icon: <BuildingsIcon size={14} weight="bold" />,
        };

  return (
    <div
      style={{
        width: '16rem',
        padding: 'var(--spacing-3, 0.75rem)',
        background: 'var(--surface-card, #ffffff)',
        border: '1px solid var(--border-default, #e5e7eb)',
        borderRadius: 'var(--radius-md, 0.375rem)',
      }}
    >
      <ProfileMenu user={user} context={context} items={items} side="bottom" />
    </div>
  );
}
