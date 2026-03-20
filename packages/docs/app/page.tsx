import Link from 'next/link';
import Image from 'next/image';

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
        fontFamily: 'var(--font-syne), system-ui, sans-serif',
      }}
    >
      <Image
        src="/visor-hero.png"
        alt="Visor — One component system. Total Control."
        width={800}
        height={280}
        priority
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          href="/docs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '2.75rem',
            padding: '0 1.5rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9375rem',
            textDecoration: 'none',
          }}
        >
          Browse Docs
        </Link>
        <Link
          href="/docs/components/button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '2.75rem',
            padding: '0 1.5rem',
            borderRadius: '0.375rem',
            backgroundColor: 'transparent',
            color: 'var(--text)',
            fontWeight: 500,
            fontSize: '0.9375rem',
            textDecoration: 'none',
            border: '1px solid var(--border)',
          }}
        >
          Components
        </Link>
      </div>
    </main>
  );
}
