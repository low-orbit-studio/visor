import type { Metadata } from 'next';
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: 'Theme Creator',
  description: 'Build a custom Visor theme by tweaking colors, typography, and spacing tokens in a live preview.',
  alternates: { canonical: 'https://visor.design/create' },
  openGraph: {
    type: 'website',
    url: 'https://visor.design/create',
    title: 'Theme Creator | Visor',
    description: 'Build a custom Visor theme by tweaking colors, typography, and spacing tokens in a live preview.',
    siteName: 'Visor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theme Creator | Visor',
    description: 'Build a custom Visor theme by tweaking colors, typography, and spacing tokens in a live preview.',
  },
};

export default function CreateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
