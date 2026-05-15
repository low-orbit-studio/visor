'use client';

import * as React from 'react';
import {
  CalendarBlank,
  Compass,
  CurrencyDollar,
  Diamond,
  Gauge,
  Gear,
  MagnifyingGlass,
  Plus,
  SlidersHorizontal,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react';
import { AdminShell } from '../../../../blocks/admin-shell/admin-shell';
import {
  WorkspaceSwitcher,
  type WorkspaceItem,
} from '../../../../blocks/workspace-switcher/workspace-switcher';
import { ChromeButton } from '../../../../components/ui/chrome-button/chrome-button';
import {
  Avatar,
  AvatarFallback,
} from '../../../../components/ui/avatar/avatar';
import { Kbd } from '../../../../components/ui/kbd/kbd';

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  active?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
  { href: '#dashboard', label: 'Dashboard', icon: Gauge, active: true },
  { href: '#events', label: 'Events', icon: CalendarBlank },
  { href: '#promoters', label: 'Promoters', icon: Diamond },
  { href: '#audience', label: 'Audience', icon: UsersThree },
  { href: '#finance', label: 'Finance', icon: CurrencyDollar },
];

const WORKSPACE_NAV: NavItem[] = [
  { href: '#foundation', label: 'Foundation', icon: Compass },
  { href: '#settings', label: 'Settings', icon: Gear },
];

const WORKSPACES: WorkspaceItem[] = [
  { id: 'empire-room', name: 'Empire Room', plan: 'Pro · NYC', initials: 'ER' },
  {
    id: 'house-of-yes',
    name: 'House of Yes',
    plan: 'Free · Brooklyn',
    initials: 'HY',
  },
];

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <li key={item.href}>
            <a
              href={item.href}
              data-active={item.active ? 'true' : undefined}
              aria-current={item.active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.375rem 0.5rem',
                borderRadius: 'var(--radius-sm, 0.375rem)',
                color: item.active
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                background: item.active
                  ? 'var(--surface-muted, rgba(0,0,0,0.04))'
                  : 'transparent',
                fontSize: '0.8125rem',
                fontWeight: item.active ? 500 : 400,
                textDecoration: 'none',
                lineHeight: 1.2,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  color: item.active
                    ? 'var(--text-primary)'
                    : 'var(--text-tertiary, var(--text-secondary))',
                }}
              >
                <IconComponent size={16} weight="regular" />
              </span>
              <span>{item.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShellShowcaseDemo() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState(
    WORKSPACES[0].id
  );
  const [commandOpen, setCommandOpen] = React.useState(false);
  const current =
    WORKSPACES.find((w) => w.id === currentWorkspaceId) ?? WORKSPACES[0];

  return (
    <AdminShell
      sidebarWidth={228}
      mainPadding="lg"
      logo={
        <WorkspaceSwitcher
          current={current}
          workspaces={WORKSPACES}
          onSelect={setCurrentWorkspaceId}
        />
      }
      sidebarNav={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <NavList items={PRIMARY_NAV} />
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary, var(--text-secondary))',
              padding: '0 0.5rem',
              marginTop: '0.25rem',
            }}
          >
            Workspace
          </div>
          <NavList items={WORKSPACE_NAV} />
        </div>
      }
      sidebarFooter={
        <button
          type="button"
          onClick={() => setCommandOpen((prev) => !prev)}
          aria-label="Open command palette"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.375rem 0.5rem',
            borderRadius: 'var(--radius-sm, 0.375rem)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)',
          }}
        >
          <Avatar size="sm">
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Justin S.
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              justin@empire.nyc
            </span>
          </div>
          <Kbd keys={['⌘', 'K']} size="sm" />
        </button>
      }
      topbarStart={
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          Dashboard
        </div>
      }
      topbarEnd={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChromeButton
            icon={<MagnifyingGlass size={14} weight="regular" />}
            keys={['⌘', 'K']}
            onClick={() => setCommandOpen(true)}
          >
            Search
          </ChromeButton>
          <ChromeButton
            icon={<SlidersHorizontal size={14} weight="regular" />}
          >
            Density
          </ChromeButton>
          <ChromeButton
            variant="primary"
            icon={<Plus size={14} weight="bold" />}
          >
            New event
          </ChromeButton>
        </div>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          color: 'var(--text-primary)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Tonight&apos;s lineup
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            maxWidth: '52ch',
            lineHeight: 1.5,
          }}
        >
          This showcase composes <code>AdminShell</code> with{' '}
          <code>WorkspaceSwitcher</code> in the logo slot, a{' '}
          <code>ChromeButton</code> cluster in <code>topbarEnd</code>, an
          eyebrow-grouped nav, and a sidebar footer that pairs{' '}
          <code>Avatar</code> with a <code>Kbd</code> shortcut hint — the same
          editorial-density pattern used in the admin-v7-r3 reference shell.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--text-tertiary, var(--text-secondary))',
            fontFamily: 'var(--font-mono, ui-monospace)',
          }}
        >
          {commandOpen
            ? 'Command palette: open (stub — wire your own ⌘K dialog here)'
            : 'Press ⌘K or click Search to toggle the command-palette stub.'}
        </p>
      </div>
    </AdminShell>
  );
}
