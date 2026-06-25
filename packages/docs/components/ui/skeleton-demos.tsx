'use client';

import { Skeleton, SkeletonList, SkeletonTable, SkeletonDetail } from '../../../../components/ui/skeleton/skeleton';

// ---------------------------------------------------------------------------
// SkeletonList demo
// ---------------------------------------------------------------------------
export function SkeletonListDemo() {
  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <SkeletonList count={3} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTable demo
// ---------------------------------------------------------------------------
export function SkeletonTableDemo() {
  return (
    <div style={{ width: '100%' }}>
      <SkeletonTable rows={4} columns={4} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonDetail demo
// ---------------------------------------------------------------------------
export function SkeletonDetailDemo() {
  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <SkeletonDetail lines={3} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card grid demo — three cards with thumbnail + text lines
// ---------------------------------------------------------------------------
export function SkeletonCardGridDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        width: '100%',
      }}
    >
      {[70, 80, 60].map((titleWidth, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <Skeleton style={{ height: '140px', width: '100%', borderRadius: '0.5rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton style={{ height: '18px', width: `${titleWidth}%` }} />
            <Skeleton style={{ height: '14px', width: '100%' }} />
            <Skeleton style={{ height: '14px', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
