'use client';

import { AdminShell } from '@/components/blocks/admin-shell';
import { Card, CardContent } from '@/components/ui/card';

const SIDEBAR_NAV = [
  { label: 'Dashboard', href: '#' },
  { label: 'Projects', href: '#' },
  { label: 'Team', href: '#' },
  { label: 'Settings', href: '#' },
];

const logo = (
  <span
    style={{
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)',
    }}
  >
    Acme
  </span>
);

const sidebarNav = (
  <nav aria-label="Sidebar">
    {SIDEBAR_NAV.map((item) => (
      <a
        key={item.href + item.label}
        href={item.href}
        style={{
          display: 'block',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {item.label}
      </a>
    ))}
  </nav>
);

export function ResponsiveSidebarLayoutDemo() {
  return (
    <AdminShell
      logo={logo}
      sidebarNav={sidebarNav}
      style={{ minHeight: 400 }}
    >
      <Card>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Main content area
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
