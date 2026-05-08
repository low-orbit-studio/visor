'use client';

import { Marquee } from '../../../../components/ui/marquee/marquee';

const logos = ['AC', 'VR', 'LO', 'FG', 'NT', 'LN'];

export function MarqueeRenderItemDemo() {
  return (
    <Marquee
      items={logos}
      separator="·"
      renderItem={(item) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-muted)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {item}
        </span>
      )}
    />
  );
}
