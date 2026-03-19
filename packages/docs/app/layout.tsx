import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Visor — Design System',
    template: '%s | Visor',
  },
  description: 'Low Orbit Studio\'s shared design system. Components, tokens, and theming for modern apps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
