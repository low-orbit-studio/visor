import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { source } from '@/lib/source';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image src="/astronaut.png" alt="" width={34} height={34} style={{ marginLeft: 2, marginRight: 2 }} />
            <Image
              src="/visor-wordmark-light.png"
              alt="Visor"
              width={0}
              height={0}
              className="wordmark-light"
              style={{ width: 64, height: 'auto' }}
            />
            <Image
              src="/visor-wordmark-dark.png"
              alt="Visor"
              width={0}
              height={0}
              className="wordmark-dark"
              style={{ width: 64, height: 'auto' }}
            />
          </div>
        ),
        url: '/',
      }}
      sidebar={{
        banner: <ThemeSwitcher key="theme-switcher" />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
