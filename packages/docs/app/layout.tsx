import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider';
import { Starfield } from '@/components/starfield';
import './globals.css';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

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
      <body className={`space-theme ${spaceMono.variable}`}>
        <Starfield />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <RootProvider>{children}</RootProvider>
        </div>
      </body>
    </html>
  );
}
