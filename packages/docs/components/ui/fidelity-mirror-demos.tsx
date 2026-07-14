'use client';

import * as React from 'react';
import { FidelityMirror } from '@/components/ui/fidelity-mirror';

/**
 * A lightweight doc-nav cluster capture — the pure design (correct) or the
 * built render carrying the exact drifts CLAUDE.md's self-check enumerates.
 * Mirrors the approved spec's Example A so the compare is meaningful.
 */
function DocNavCapture({ drift = false }: { drift?: boolean }) {
  const pillBg = drift
    ? 'var(--surface-subtle)'
    : 'color-mix(in srgb, var(--surface-card), var(--color-neutral-950) 22%)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <span
          style={{
            width: '20px', height: '20px', borderRadius: '6px', display: 'grid', placeItems: 'center',
            background: 'var(--primary)', color: 'var(--color-white)',
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, lineHeight: 1,
          }}
        >
          {/* Optically center the cap — mono metrics ride the glyph above the em center. */}
          <span style={{ transform: 'translateY(1px)' }}>V</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
          Visor
        </span>
      </div>
      <div
        style={{
          display: 'inline-flex', flexDirection: 'column', gap: 'var(--spacing-2)', padding: 'var(--spacing-2)',
          border: '1px solid var(--hairline)',
          borderRadius: drift ? '22px' : '12px',
          background: 'var(--surface-card)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
            letterSpacing: drift ? '0' : '0.14em',
            textTransform: drift ? 'none' : 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          Shared
        </span>
        <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
          {['Overview', 'Tokens', 'Themes'].map((label) => (
            <span
              key={label}
              style={{
                padding: '5px 9px', borderRadius: '9999px', border: '1px solid transparent',
                background: pillBg,
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500,
                letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A minimal iOS roster screen — same on both sides (the MATCH case). */
function RosterCapture() {
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-sans)' }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', padding: '6px 12px 2px',
          fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 700, color: 'var(--text-secondary)',
        }}
      >
        <span>9:41</span>
        <span>●●●</span>
      </div>
      <div style={{ padding: '4px 12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)' }}>
        Roster
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderTop: '1px solid var(--hairline)' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '9999px', background: 'color-mix(in srgb, var(--accent) 30%, var(--surface-subtle))' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ height: '6px', width: '70%', borderRadius: '3px', background: 'var(--text-secondary)', opacity: 0.8 }} />
            <span style={{ height: '5px', width: '45%', borderRadius: '3px', background: 'var(--text-tertiary)', opacity: 0.7 }} />
          </span>
        </div>
      ))}
      <div style={{ margin: '10px 12px 14px', padding: '8px', borderRadius: '10px', background: 'var(--primary)', color: 'var(--color-white)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '10px' }}>
        Add player
      </div>
    </div>
  );
}

/**
 * Web · split (default) with delta callouts — the pure HTML design left, the
 * Visor-TSX render right. Toggle to overlay in the header. Contained (not
 * full-bleed) so it fits inside the docs preview column.
 */
export function FidelityMirrorDemo() {
  return (
    <FidelityMirror
      title="DocNav"
      subtitle="Fidelity Mirror · VI-611"
      platform="web"
      verdict="drift"
      score="3 deltas"
      bleed={false}
      design={{ content: <DocNavCapture />, meta: 'index.html' }}
      built={{ content: <DocNavCapture drift />, meta: 'route · /doc-nav' }}
      deltas={[
        {
          class: 'radius',
          description: (
            <>
              Group cluster corners <b>22px → 12px</b> — decorative theme inflated{' '}
              <code>--radius-xl</code>.
            </>
          ),
          position: { top: '34px', left: '12px' },
        },
        {
          class: 'color',
          description: (
            <>
              Resting pills read <b>--surface-subtle</b> — should be a recessed well darker than the card.
            </>
          ),
          position: { top: '52px', left: '96px' },
        },
        {
          class: 'type',
          description: (
            <>
              Group labels are <b>title-case</b> — should be all-caps mono.
            </>
          ),
          position: { top: '34px', right: '12px' },
        },
      ]}
    />
  );
}

/** Native iOS · device-framed · verdict MATCH (no callouts). */
export function FidelityMirrorNativeDemo() {
  return (
    <FidelityMirror
      title="Roster Screen"
      subtitle="Fidelity Mirror · SK-204"
      platform="native"
      verdict="match"
      score="99.4%"
      bleed={false}
      design={{ content: <RosterCapture />, meta: 'figma · roster' }}
      built={{ content: <RosterCapture />, meta: 'snapshot · iphone-15' }}
    />
  );
}
