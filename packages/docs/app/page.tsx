import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1.5rem',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Visor
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: '#64748b',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Low Orbit Studio&apos;s shared design system. Components you own,
          tokens that keep you consistent.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/docs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '2.5rem',
              padding: '0 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              fontWeight: 500,
              fontSize: '0.875rem',
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
              height: '2.5rem',
              padding: '0 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: 'transparent',
              color: '#0f172a',
              fontWeight: 500,
              fontSize: '0.875rem',
              textDecoration: 'none',
              border: '1px solid #e2e8f0',
            }}
          >
            Components
          </Link>
        </div>
      </div>
    </main>
  );
}
