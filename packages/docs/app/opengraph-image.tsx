import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Visor — Design System';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 112,
              fontWeight: 700,
              letterSpacing: '-6px',
              lineHeight: 1,
            }}
          >
            Visor
          </div>
          <div
            style={{
              color: '#888888',
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: '0.04em',
            }}
          >
            Low Orbit Studio&apos;s shared design system
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
