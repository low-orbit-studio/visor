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
