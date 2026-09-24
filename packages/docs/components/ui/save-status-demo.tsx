'use client';

import * as React from 'react';
import { SaveStatus, type SaveStatusState } from '../../../../components/ui/save-status/save-status';
import { Input } from '../../../../components/ui/input/input';
import { useAutosave } from '../../../../hooks/use-autosave';

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '14px' };

/* ─── SaveStatusStatesDemo ──────────────────────────────────────────────── */

export function SaveStatusStatesDemo() {
  const states: SaveStatusState[] = ['saved', 'saving', 'unsaved', 'refused'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {states.map((status) => (
        <div key={status} style={row}>
          <strong style={{ width: '6rem' }}>Bio</strong>
          <SaveStatus status={status} onRetry={() => {}} />
          <span>Edit history</span>
        </div>
      ))}
    </div>
  );
}

/* ─── SaveStatusLiveDemo ────────────────────────────────────────────────── */

/** A fake store: 700ms per write, and it refuses any text containing "fail". */
function fakeSave(value: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (value.includes('fail') ? reject(new Error('refused')) : resolve()), 700);
  });
}

export function SaveStatusLiveDemo() {
  const [bio, setBio] = React.useState('Techno and electro, Brooklyn.');
  const autosave = useAutosave(bio, fakeSave, { validate: (v) => v.trim().length > 0 });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '28rem' }}>
      <div style={row}>
        <label htmlFor="save-status-demo-bio" style={{ fontWeight: 600 }}>
          Bio
        </label>
        <SaveStatus status={autosave.status} onRetry={autosave.retry} />
      </div>
      <Input id="save-status-demo-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      <small>Type to autosave. Clear the field to see a refused value; type “fail” to see a failed save and retry.</small>
    </div>
  );
}
