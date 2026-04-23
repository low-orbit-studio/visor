import type { Metadata } from 'next';
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: 'Theme Compare',
  description: 'Compare Visor themes side by side to see how tokens and components differ across light and dark modes.',
  alternates: { canonical: 'https://visor.design/compare' },
  openGraph: {
    type: 'website',
    url: 'https://visor.design/compare',
    title: 'Theme Compare | Visor',
    description: 'Compare Visor themes side by side to see how tokens and components differ across light and dark modes.',
    siteName: 'Visor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theme Compare | Visor',
    description: 'Compare Visor themes side by side to see how tokens and components differ across light and dark modes.',
  },
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
