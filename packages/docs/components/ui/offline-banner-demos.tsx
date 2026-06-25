'use client';

import * as React from 'react';
import { OfflineBanner, useNetworkStatus } from '../../../../components/ui/offline-banner/offline-banner';
import type { NetworkState } from '../../../../components/ui/offline-banner/offline-banner';

/* ─── State Machine Demo ─────────────────────────────────────────────────── */

/**
 * Cycles through all three banner states (offline → reconnecting → restored → hidden)
 * so the reader can see each variant. Uses a controlled state rather than
 * the real navigator.onLine — safe to demonstrate in any environment.
 */
export function OfflineBannerStateDemo() {
  const [networkState, setNetworkState] = React.useState<NetworkState>('offline');

  function handleRetry() {
    setNetworkState('reconnecting');
    setTimeout(() => {
      setNetworkState('restored');
      setTimeout(() => setNetworkState('online'), 1500);
    }, 1200);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['offline', 'reconnecting', 'restored', 'online'] as NetworkState[]).map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setNetworkState(state)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              border: '1.5px solid',
              borderColor: networkState === state ? 'var(--primary, #111827)' : 'var(--border-default, #e5e7eb)',
              background: networkState === state ? 'var(--primary, #111827)' : 'transparent',
              color: networkState === state ? 'var(--text-inverse, #fff)' : 'var(--text-secondary, #6b7280)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {state}
          </button>
        ))}
      </div>

      {/* Banner preview */}
      <div style={{ borderRadius: 'var(--radius-md, 0.5rem)', overflow: 'hidden', border: '1px solid var(--border-default, #e5e7eb)' }}>
        <OfflineBanner networkState={networkState} onRetry={handleRetry} />
        <div style={{
          padding: 'var(--spacing-4, 1rem)',
          background: 'var(--surface-card, #fff)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          color: 'var(--text-secondary, #6b7280)',
        }}>
          App content remains visible and scrollable below the banner.
        </div>
      </div>

      {networkState === 'online' && (
        <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
          Banner is hidden — select "offline" to show it again.
        </p>
      )}
    </div>
  );
}

/* ─── Hook-driven Demo ────────────────────────────────────────────────────── */

/**
 * Demonstrates the useNetworkStatus hook wired to the OfflineBanner.
 * In a real app this responds to actual browser online/offline events.
 */
export function OfflineBannerHookDemo() {
  const { networkState, retry } = useNetworkStatus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <OfflineBanner networkState={networkState} onRetry={retry} />
      <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
        Current network state: <strong>{networkState}</strong>. Toggle your device's Wi-Fi to trigger the banner.
      </p>
    </div>
  );
}
