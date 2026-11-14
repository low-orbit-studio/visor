'use client';

import {
  Briefcase,
  Buildings,
  Coins,
  Folder,
  Funnel,
  Gauge,
  MagnifyingGlass,
  type Icon,
} from '@phosphor-icons/react';
import { AdminShell } from '../../../../blocks/admin-shell/admin-shell';
import {
  ProfileMenu,
  defaultProfileMenuItems,
} from '../../../../blocks/profile-menu/profile-menu';
import styles from './admin-shell-rail-demo.module.css';

const NAV: { label: string; icon: Icon; count?: number; active?: boolean }[] = [
  { label: 'Dashboard', icon: Gauge },
  { label: 'Pipeline', icon: Funnel },
  { label: 'Money', icon: Coins, count: 9, active: true },
  { label: 'Workbench', icon: Briefcase },
  { label: 'Projects', icon: Folder },
  { label: 'Clients', icon: Buildings },
];

const CLIENTS = [
  { name: 'Client A', hue: 'var(--paper-hue-339-solid, #b84a6e)' },
  { name: 'Client B', hue: 'var(--paper-hue-147-solid, #3f7d4a)' },
  { name: 'Client C', hue: 'var(--paper-hue-219-solid, #2f6f8f)' },
];

/** AdminShell folded to its icon rail and back (VI-770): the button beside the brand, or ⌘\ / Ctrl+\. */
export function AdminShellRailDemo() {
  return (
    <AdminShell
      collapsible
      storageKey="visor-docs-admin-shell-rail"
      sidebarWidth={232}
      mainPadding="md"
      hideTopbar
      logo={
        <div className={styles.brand}>
          <span className={styles.mono} aria-hidden="true">AS</span>
          <span data-admin-shell-label className={styles.full}>
            Acme Studio <small>Admin</small>
          </span>
        </div>
      }
      sidebarNav={
        <>
          <button type="button" className={styles.search} title="Search or jump to… (⌘K)">
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span data-admin-shell-label>Search or jump to…</span>
            <span data-admin-shell-label className={styles.kbd}>⌘K</span>
          </button>
          {NAV.map(({ label, icon: IconComponent, count, active }) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className={styles.link}
              title={label}
              aria-current={active ? 'page' : undefined}
            >
              <IconComponent size={16} aria-hidden="true" />
              <span data-admin-shell-label>{label}</span>
              {count ? <span className={styles.count}>{count}</span> : null}
            </a>
          ))}
          <div data-admin-shell-label className={styles.group}>Active clients</div>
          {CLIENTS.map(({ name, hue }) => (
            <a key={name} href={`#${name}`} className={styles.link} title={name}>
              <span className={styles.dot} style={{ background: hue }} aria-hidden="true" />
              <span data-admin-shell-label>{name}</span>
            </a>
          ))}
        </>
      }
      sidebarFooter={
        <ProfileMenu
          user={{ name: 'Jane Doe', email: 'jane@acme.com', initials: 'JD' }}
          items={defaultProfileMenuItems({ name: 'Jane Doe' })}
        />
      }
    >
      <h2 className={styles.title}>Money</h2>
      <p className={styles.body}>
        Fold the sidebar with the button beside the brand, or ⌘\ (Ctrl+\ off a Mac). The main
        area takes the width, and the choice is remembered in this browser.
      </p>
    </AdminShell>
  );
}
