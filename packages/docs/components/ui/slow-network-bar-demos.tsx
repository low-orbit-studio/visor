'use client';

import * as React from 'react';
import { SlowNetworkBar, useSlowRequest } from '../../../../components/ui/slow-network-bar/slow-network-bar';

/* ── SlowNetworkBarStateDemo ─────────────────────────────────────────────── */

/**
 * Interactive demo that lets the user cycle through all three states
 * and trigger a simulated slow request end-to-end.
 */
export function SlowNetworkBarStateDemo() {
  const { state, trigger, resolve, reset } = useSlowRequest(3000);
  const [status, setStatus] = React.useState<string>('');

  const handleTrigger = () => {
    setStatus('Request started — bar appears after 3 s…');
    trigger();
    // Simulate a 4s request
    setTimeout(() => {
      resolve();
      setStatus('Request resolved');
      setTimeout(() => setStatus(''), 1200);
    }, 4000);
  };

  const handleReset = () => {
    reset();
    setStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4, 1rem)', width: '100%' }}>
      {/* Simulated app chrome */}
      <div
        style={{
          border: '1px solid var(--border-default, #e5e7eb)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Fake nav bar */}
        <div
          style={{
            background: 'var(--surface-card, #18181b)',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--spacing-4, 1rem)',
            gap: 'var(--spacing-3, 0.75rem)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 600, color: 'var(--text-primary, #f5f5f6)' }}>
            Acme App
          </span>
        </div>

        {/* The slow network bar sits immediately below the nav */}
        <SlowNetworkBar state={state} label="Generating export, please wait…" />

        {/* Content area */}
        <div style={{ padding: 'var(--spacing-6, 1.5rem)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4, 1rem)' }}>
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #b6b7bd)', margin: 0 }}>
            {status || 'Click "Export Report" to simulate a slow network request.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-2, 0.5rem)' }}>
            <button
              type="button"
              onClick={handleTrigger}
              disabled={state !== 'hidden'}
              style={{
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--primary, #111827)',
                color: '#fff',
                cursor: state !== 'hidden' ? 'not-allowed' : 'pointer',
                opacity: state !== 'hidden' ? 0.6 : 1,
              }}
            >
              Export Report
            </button>
            {state !== 'hidden' && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default, #e5e7eb)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #b6b7bd)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current state badge */}
      <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--text-tertiary, #8e8e97)', margin: 0 }}>
        Current state: <strong style={{ color: 'var(--text-primary, #f5f5f6)' }}>{state}</strong>
      </p>
    </div>
  );
}

/* ── SlowNetworkBarManualDemo ─────────────────────────────────────────────── */

/**
 * Manual state toggle demo — shows all three visual states without timing.
 */
export function SlowNetworkBarManualDemo() {
  const [state, setState] = React.useState<'hidden' | 'visible' | 'resolving'>('hidden');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4, 1rem)', width: '100%' }}>
      <div
        style={{
          border: '1px solid var(--border-default, #e5e7eb)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--surface-subtle, #2d2d34)',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--spacing-4, 1rem)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 600, color: 'var(--text-primary, #f5f5f6)' }}>
            Dashboard
          </span>
        </div>
        <SlowNetworkBar state={state} />
        <div style={{ padding: 'var(--spacing-4, 1rem)' }}>
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #b6b7bd)', margin: 0 }}>
            Page content renders below the bar and remains interactive during loading.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-2, 0.5rem)', flexWrap: 'wrap' }}>
        {(['hidden', 'visible', 'resolving'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1.5px solid var(--border-default, #e5e7eb)',
              background: state === s ? 'var(--primary, #111827)' : 'transparent',
              color: state === s ? '#fff' : 'var(--text-secondary, #b6b7bd)',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
