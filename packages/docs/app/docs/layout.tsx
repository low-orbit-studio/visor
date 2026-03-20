import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image src="/visor-logo.png" alt="Visor" width={28} height={28} />
            <span>Visor</span>
          </div>
        ),
        url: '/',
      }}
    >
      {children}
    </DocsLayout>
  );
}
