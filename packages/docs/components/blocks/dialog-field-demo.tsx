'use client';

import {
  DialogField,
  DialogFieldLabel,
  DialogFieldControl,
} from '../../../../blocks/dialog-field/dialog-field';

export function DialogFieldDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', width: '100%', maxWidth: 360 }}>
      <DialogField>
        <DialogFieldLabel htmlFor="dfld-name">Artist name</DialogFieldLabel>
        <DialogFieldControl icon={<span aria-hidden>◎</span>}>
          <input id="dfld-name" defaultValue="Aurora Halo" />
        </DialogFieldControl>
      </DialogField>
      <DialogField>
        <DialogFieldLabel htmlFor="dfld-time">Set time</DialogFieldLabel>
        <DialogFieldControl trailing={<span aria-hidden>▾</span>}>
          <input id="dfld-time" defaultValue="23:00" />
        </DialogFieldControl>
      </DialogField>
    </div>
  );
}
