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
            <Image src="/astronaut.png" alt="" width={38} height={38} />
            <Image
              src="/visor-wordmark-light.png"
              alt="Visor"
              width={64}
              height={18}
              className="wordmark-light"
            />
            <Image
              src="/visor-wordmark-dark.png"
              alt="Visor"
              width={64}
              height={18}
              className="wordmark-dark"
            />
          </div>
        ),
        url: '/',
        children: <ThemeSwitcher />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
