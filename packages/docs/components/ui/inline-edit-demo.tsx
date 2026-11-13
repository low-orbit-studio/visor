'use client';

import * as React from 'react';
import { InlineEdit } from '../../../../components/ui/inline-edit/inline-edit';

/* ─── InlineEditBodyDemo ────────────────────────────────────────────────── */

export function InlineEditBodyDemo() {
  const [value, setValue] = React.useState('Technical rider');
  return (
    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
      <InlineEdit label="Rider title" value={value} defaultValue="Rider" onCommit={setValue} />
    </p>
  );
}

/* ─── InlineEditNoPencilDemo ────────────────────────────────────────────── */

export function InlineEditNoPencilDemo() {
  const [value, setValue] = React.useState('Technical rider');
  return (
    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
      <InlineEdit pencil={false} label="Rider title" value={value} defaultValue="Rider" onCommit={setValue} />
    </p>
  );
}

/* ─── InlineEditHeadingDemo ─────────────────────────────────────────────── */

export function InlineEditHeadingDemo() {
  const [value, setValue] = React.useState('');
  return (
    <InlineEdit
      as="h2"
      style={{ margin: 0, fontSize: '21px', lineHeight: 1.25, fontWeight: 600 }}
      label="Section title"
      value={value}
      defaultValue="Track record"
      onCommit={setValue}
    />
  );
}

/* ─── InlineEditEdgesOffDemo ────────────────────────────────────────────── */

export function InlineEditEdgesOffDemo() {
  const [value, setValue] = React.useState('Hospitality rider');
  return (
    <div style={{ '--control-edge-width': '0' } as React.CSSProperties}>
      <InlineEdit label="Rider title" value={value} defaultValue="Rider" onCommit={setValue} defaultEditing />
    </div>
  );
}

/* ─── InlineEditAsyncDemo ───────────────────────────────────────────────── */

/** A fake server action: takes a second, and refuses any name containing "fail". */
function saveRiderTitle(next: string): Promise<{ error?: string }> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(/fail/i.test(next) ? { error: 'That title is already taken.' } : {}), 1000)
  );
}

export function InlineEditAsyncDemo() {
  const [value, setValue] = React.useState('Technical rider');
  return (
    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
      <InlineEdit
        label="Rider title"
        value={value}
        defaultValue="Rider"
        onCommit={async (next) => {
          const result = await saveRiderTitle(next);
          if (!result.error) setValue(next);
          return result;
        }}
      />
    </p>
  );
}
