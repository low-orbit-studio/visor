'use client';

import * as React from 'react';
import { FilePdf } from '@phosphor-icons/react';
import { PhotoDrop } from '../../../../components/ui/photo-drop/photo-drop';

/** The docs' own picture, so the docs ship no extra image files. Pick your own to see it fill. */
export const DEMO_PHOTO = '/astronaut.png';

const stack: React.CSSProperties = { display: 'grid', gap: 'var(--spacing-6)', width: '100%' };

export function PhotoDropDefaultDemo() {
  const [src, setSrc] = React.useState('');
  return (
    <div style={stack}>
      <label htmlFor="demo-photo" style={{ fontWeight: 'var(--font-weight-medium)' }}>
        Your Photo
      </label>
      <PhotoDrop id="demo-photo" src={src} onPick={(url) => setSrc(url)} alt="Your photo" />
    </div>
  );
}

/** Pick a photo and watch it upload; the switch makes the next upload fail. */
export function PhotoDropUploadDemo() {
  const [src, setSrc] = React.useState(DEMO_PHOTO);
  const [progress, setProgress] = React.useState<number | undefined>();
  const [failed, setFailed] = React.useState(false);
  const [failNext, setFailNext] = React.useState(true);
  const timer = React.useRef<ReturnType<typeof setInterval>>(undefined);

  const upload = React.useCallback(() => {
    clearInterval(timer.current);
    setFailed(false);
    setProgress(0);
    const fail = failNext;
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = (p ?? 0) + 0.1;
        if (fail && next >= 0.6) {
          clearInterval(timer.current);
          setFailed(true);
          return undefined;
        }
        if (next >= 1) {
          clearInterval(timer.current);
          return undefined;
        }
        return next;
      });
    }, 300);
  }, [failNext]);

  React.useEffect(() => () => clearInterval(timer.current), []);

  return (
    <div style={stack}>
      <PhotoDrop
        id="demo-upload"
        src={src}
        alt="Your photo"
        onPick={(url) => {
          setSrc(url);
          upload();
        }}
        progress={progress}
        failed={failed}
        onRetry={() => {
          setFailNext(false);
          upload();
        }}
      />
      <label style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center', fontSize: 'var(--font-size-sm)' }}>
        <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} />
        Make the next upload fail
      </label>
    </div>
  );
}

/** Every state that takes no input, side by side. */
export function PhotoDropStatesDemo() {
  return (
    <div style={stack}>
      <PhotoDrop id="demo-uploading" src={DEMO_PHOTO} alt="Your photo" size={128} progress={0.4} />
      <PhotoDrop id="demo-sweep" src={DEMO_PHOTO} alt="Your photo" size={128} progress="indeterminate" />
      <PhotoDrop id="demo-failed" src={DEMO_PHOTO} alt="Your photo" size={128} failed onRetry={() => {}} />
      <PhotoDrop id="demo-locked" src={DEMO_PHOTO} alt="Your photo" size={128} locked lockedReason="Check-in has started." />
      <PhotoDrop id="demo-readonly" src={DEMO_PHOTO} alt="Your photo" size={128} readOnly readOnlyReason="It can't be changed here." />
    </div>
  );
}

export function PhotoDropFileDemo() {
  const [name, setName] = React.useState('');
  return (
    <PhotoDrop
      id="demo-file"
      src={name}
      file={{
        icon: <FilePdf weight="light" />,
        accept: 'application/pdf',
        onFile: (f) => setName(f.name),
        onClear: () => setName(''),
      }}
    />
  );
}

export function PhotoDropSizesDemo() {
  return (
    <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))', alignItems: 'end' }}>
      {[96, 128, 220].map((size) => (
        <PhotoDrop key={size} id={`demo-size-${size}`} src={DEMO_PHOTO} alt="Your photo" size={size} readOnly />
      ))}
    </div>
  );
}
