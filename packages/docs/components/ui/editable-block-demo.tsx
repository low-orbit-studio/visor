'use client';

import * as React from 'react';
import { EditableBlock } from '../../../../components/ui/editable-block/editable-block';

/* ─── EditableBlockDefaultDemo ──────────────────────────────────────────── */

export function EditableBlockDefaultDemo() {
  const [value, setValue] = React.useState('coherent · open · yours');
  return (
    <div style={{ maxWidth: '320px', width: '100%' }}>
      <EditableBlock
        label="Essence"
        value={value}
        onSave={setValue}
        onAiAction={() => alert('AI pressure-test triggered')}
      />
    </div>
  );
}

/* ─── EditableBlockDoneDemo ─────────────────────────────────────────────── */

export function EditableBlockDoneDemo() {
  const [value, setValue] = React.useState(
    'The only design system that compiles a brand — visual and verbal — from one file.'
  );
  return (
    <div style={{ maxWidth: '320px', width: '100%' }}>
      <EditableBlock
        label="Positioning"
        value={value}
        done
        onSave={setValue}
      />
    </div>
  );
}

/* ─── EditableBlockEditingDemo ──────────────────────────────────────────── */

export function EditableBlockEditingDemo() {
  const [value, setValue] = React.useState('coherent · open · yours');
  return (
    <div style={{ maxWidth: '320px', width: '100%' }}>
      <EditableBlock
        label="Essence"
        value={value}
        defaultEditing
        onSave={setValue}
        onAiAction={() => {}}
      />
    </div>
  );
}

/* ─── EditableBlockGridDemo ──────────────────────────────────────────────── */

export function EditableBlockGridDemo() {
  const initialBlocks = [
    { label: 'Essence', value: 'coherent · open · yours', done: false },
    { label: 'Positioning', value: 'The only design system that compiles a brand from one file.', done: true },
    { label: 'Personality', value: 'precise · candid · generous · warm', done: true },
    { label: 'Voice', value: 'plainspoken · candid · generous · warm', done: true },
    { label: 'Tone', value: 'error · success · empty · loading · warning', done: true },
    { label: 'Lexicon', value: 'theme not skin · compose not drag-drop · token not variable', done: true },
  ];
  const [blocks, setBlocks] = React.useState(initialBlocks);

  const handleSave = (idx: number, newValue: string) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, value: newValue } : b))
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.875rem',
        width: '100%',
      }}
    >
      {blocks.map((block, idx) => (
        <EditableBlock
          key={block.label}
          label={block.label}
          value={block.value}
          done={block.done}
          onSave={(v) => handleSave(idx, v)}
          onAiAction={() => {}}
        />
      ))}
    </div>
  );
}
