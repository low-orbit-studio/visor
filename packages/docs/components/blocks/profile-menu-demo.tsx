'use client';

import * as React from 'react';
import { BuildingsIcon, EnvelopeSimpleIcon, SignOutIcon } from '@phosphor-icons/react';
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

const TOP_BAR_USER: ProfileMenuUser = { name: 'Sam Rivera', email: 'sam@example.com' };

/** Change Email and Sign Out, as a top bar's account menu carries them. */
export function topBarItems(onChangeEmail?: () => void, onSignOut?: () => void): ProfileMenuItem[] {
  return [
    { type: 'item', icon: <EnvelopeSimpleIcon size={16} weight="regular" />, label: 'Change Email', onSelect: onChangeEmail },
    { type: 'item', icon: <SignOutIcon size={16} weight="regular" />, label: 'Sign Out', onSelect: onSignOut },
  ];
}

/**
 * A top bar's account menu: the avatar trigger, the menu in place under it. Solid on a
 * plain page; glass where an ancestor sets `data-glass="on"` over a photo.
 */
export function ProfileMenuTopBarDemo({ defaultOpen = false, modal }: { defaultOpen?: boolean; modal?: boolean }) {
  return (
    <div
      data-demo="profile-menu-top-bar"
      style={{
        width: 'min(100%, 20rem)',
        minHeight: '15rem',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
      }}
    >
      <ProfileMenu
        trigger="avatar"
        user={TOP_BAR_USER}
        items={topBarItems(() => undefined, () => undefined)}
        defaultOpen={defaultOpen}
        modal={modal}
      />
    </div>
  );
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
