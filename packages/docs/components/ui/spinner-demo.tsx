'use client';

import * as React from 'react';
import { Spinner, type SpinnerOrbState } from '../../../../components/ui/spinner/spinner';

const ORB_STATES: { state: SpinnerOrbState; note: string }[] = [
  { state: 'working', note: 'particles on tilted orbits' },
  { state: 'searching', note: 'a scan meridian sweeps a globe' },
  { state: 'solving', note: 'bands scramble, then click back' },
  { state: 'listening', note: 'a waveform rolls through rings' },
  { state: 'connecting', note: 'a constellation wires itself' },
  { state: 'weaving', note: 'three strands plait the sphere' },
  { state: 'composing', note: 'an undulating multi-band sash' },
  { state: 'breathing', note: 'a ring slowly morphing' },
  { state: 'shaping', note: 'circle → triangle → square' },
];

const SIZES = ['xs', 'sm', 'md'] as const;

const caption: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--font-size-xs)',
  lineHeight: 'var(--line-height-tight, 1.25)',
  color: 'var(--text-secondary)',
};

const note: React.CSSProperties = {
  fontSize: 'var(--font-size-2xs)',
  lineHeight: 'var(--line-height-tight, 1.25)',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
};

/* ─── SpinnerOrbGalleryDemo ──────────────────────────────────────────── */

/** Every orb state at every size — md (64px), sm (32px), xs (20px). */
export function SpinnerOrbGalleryDemo({ tone = 'default' }: { tone?: 'default' | 'primary' }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(9.5rem, 1fr))',
        gap: 'var(--spacing-6)',
        width: '100%',
      }}
    >
      {ORB_STATES.map(({ state, note: text }) => (
        <div
          key={state}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', height: 64 }}>
            {[...SIZES].reverse().map((size) => (
              <Spinner key={size} variant="orb" orb={state} size={size} tone={tone} />
            ))}
          </div>
          <span style={caption}>{state}</span>
          <span style={note}>{text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── SpinnerRingVsOrbDemo ───────────────────────────────────────────── */

/** The ring and the orb side by side at each size. */
export function SpinnerRingVsOrbDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', alignItems: 'center', gap: 'var(--spacing-4) var(--spacing-8)' }}>
      <span />
      {SIZES.map((size) => (
        <span key={size} style={{ ...caption, textAlign: 'center' }}>{size}</span>
      ))}
      <span style={caption}>ring</span>
      {SIZES.map((size) => (
        <span key={size} style={{ display: 'flex', justifyContent: 'center' }}>
          <Spinner size={size} />
        </span>
      ))}
      <span style={caption}>orb</span>
      {SIZES.map((size) => (
        <span key={size} style={{ display: 'flex', justifyContent: 'center' }}>
          <Spinner variant="orb" size={size} />
        </span>
      ))}
    </div>
  );
}

/* ─── SpinnerOrbScrimDemo ────────────────────────────────────────────── */

/**
 * The register the orb exists for: a wait over a large visual. The orb
 * follows the text colour of where it sits: the scrim is dark in both
 * modes, so it sets white text and the orb draws light ink either way.
 */
export function SpinnerOrbScrimDemo() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '22rem',
        aspectRatio: '4 / 3',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, var(--primary, #111827), var(--surface-card, #ffffff))',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-3)',
          background: 'var(--overlay-bg)',
          color: 'var(--color-white, #ffffff)',
        }}
      >
        <Spinner variant="orb" orb="working" label="Rendering share card…" />
        <span style={{ fontSize: 'var(--font-size-sm)' }}>Rendering…</span>
      </div>
    </div>
  );
}
