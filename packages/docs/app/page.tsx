import Link from 'next/link';
import { ThemeImage } from '@/components/theme-image';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '2.5rem',
        padding: '2rem',
        fontFamily: 'var(--font-heading)',
      }}
    >
      <ThemeImage
        srcDark="/visor-hero.png"
        srcLight="/visor-hero-light.png"
        alt="Visor — One component system. Total Control."
        width={800}
        height={280}
        priority
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button asChild size="lg">
          <Link href="/docs">Browse Docs</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/docs/components/button">Components</Link>
        </Button>
      </div>
    </main>
  );
}
