'use client';

import {
  PencilSimple,
  Tray,
  CalendarDots,
  Receipt,
  ChartLineUp,
  UsersThree,
  Gear,
} from '@phosphor-icons/react';
import { BottomNav } from '@/components/ui/bottom-nav';

export function BottomNavDefaultDemo() {
  return (
    <BottomNav
      fixed={false}
      aria-label="Workspace"
      items={[
        { label: 'Edit', icon: PencilSimple, href: '#edit', active: true },
        { label: 'Inbox', icon: Tray, href: '#inbox' },
        { label: 'Calendar', icon: CalendarDots, href: '#calendar' },
      ]}
    />
  );
}

export function BottomNavMarkGroupDemo() {
  return (
    <BottomNav
      fixed={false}
      aria-label="Workspace"
      items={[
        { label: 'Edit', icon: PencilSimple, href: '#edit', active: true },
        { label: 'Inbox', icon: Tray, href: '#inbox', mark: 3 },
        { label: 'Calendar', icon: CalendarDots, href: '#calendar' },
        { label: 'Invoices', icon: Receipt, href: '#invoices' },
        { label: 'Analytics', icon: ChartLineUp, href: '#analytics' },
        { label: 'Team', icon: UsersThree, href: '#team', group: 'admin' },
        { label: 'Settings', icon: Gear, href: '#settings', group: 'admin' },
      ]}
    />
  );
}

export function BottomNavLabelsDemo() {
  return (
    <BottomNav
      fixed={false}
      showLabels
      aria-label="Workspace"
      items={[
        { label: 'Edit', icon: PencilSimple, href: '#edit', active: true },
        { label: 'Inbox', icon: Tray, href: '#inbox', mark: true },
        { label: 'Settings', icon: Gear, href: '#settings' },
      ]}
    />
  );
}
