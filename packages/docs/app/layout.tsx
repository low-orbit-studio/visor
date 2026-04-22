import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { ConditionalStarfield } from '@/components/conditional-starfield';
import { Toaster } from '@/components/ui/toast';
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

// Inline init script — restores body theme class and html color-mode class before React hydrates.
// Content is 100% static; no user data is interpolated here.
const INIT_SCRIPT = `(function(){` +
  `var t=localStorage.getItem("visor-theme")||"blackout";` +
  `document.body.classList.add(t+"-theme");` +
  `var m=localStorage.getItem("visor-color-mode");` +
  `if(m==="dark"){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");document.documentElement.style.colorScheme="dark";}` +
  `else if(m==="light"){document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}` +
`})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={spaceMono.variable} suppressHydrationWarning>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        <ConditionalStarfield />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <RootProvider>{children}</RootProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
