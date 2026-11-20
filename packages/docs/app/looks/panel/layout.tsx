import type { Metadata } from 'next';
import type { ReactNode } from 'react';
// Private theme CSS, so a locally installed private theme (honcho) draws its own looks.
// The generated file is an empty stub when no private package is installed.
import './../../private-themes.generated.css';

export const metadata: Metadata = {
  title: 'Look Panel',
  robots: { index: false, follow: false },
};

export default function LookPanelLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
