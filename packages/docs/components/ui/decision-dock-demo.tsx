'use client';

import * as React from 'react';
import { DecisionDock, type DecisionDockKind } from '../../../../components/ui/decision-dock/decision-dock';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';

const QUESTIONS: Record<DecisionDockKind, string> = {
  approve: 'Does the confirm dialog look right in all five looks?',
  pick: 'Which empty state should the inbox use?',
  run: 'Run the migration on staging, then tell the session.',
};

const OPTIONS = ['A', 'B', 'C'];

/** A scrolling page with the dock sticky at its bottom. One dock on the page, so its keys are the page's keys. */
export function DecisionDockDemo() {
  const [kind, setKind] = React.useState<DecisionDockKind>('approve');
  const [choice, setChoice] = React.useState<string | null>(null);
  const [item, setItem] = React.useState(0);
  const [log, setLog] = React.useState('Nothing sent yet.');

  const next = () => {
    setChoice(null);
    setItem((n) => n + 1);
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-3)', width: '100%' }} data-demo="decision-dock">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-3)', alignItems: 'center' }}>
        <SegmentedControl
          aria-label="Kind"
          value={kind}
          onValueChange={(v) => {
            setKind(v as DecisionDockKind);
            next();
          }}
          options={[
            { value: 'approve', label: 'Approve' },
            { value: 'pick', label: 'Pick' },
            { value: 'run', label: 'Run' },
          ]}
        />
        <Button variant="ghost" size="sm" onClick={next}>
          Reset
        </Button>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }} data-demo="decision-dock-log">
          {log}
        </span>
      </div>
      <div
        style={{
          height: 360,
          overflow: 'auto',
          borderRadius: 'var(--radius-lg)',
          border: 'var(--stroke-width-thin) solid var(--border-default)',
          background: 'var(--surface-page)',
          padding: 'var(--spacing-4)',
        }}
        data-demo="decision-dock-page"
      >
        {kind === 'pick' && (
          <div role="radiogroup" aria-label="Options" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
            {OPTIONS.map((o) => (
              <Button
                key={o}
                role="radio"
                aria-checked={choice === o}
                variant={choice === o ? 'default' : 'outline'}
                onClick={() => setChoice(o)}
              >
                Option {o}
              </Button>
            ))}
          </div>
        )}
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} style={{ margin: '0 0 var(--spacing-3)', color: 'var(--text-secondary)' }}>
            The work under review scrolls behind the dock. Line {i + 1}: the dock stays pinned to the bottom of
            the view and the page reads through its frost.
          </p>
        ))}
        <DecisionDock
          key={`${kind}-${item}`}
          kind={kind}
          label="VI-865"
          question={QUESTIONS[kind]}
          choice={choice}
          onAnswer={(verdict, note) => setLog(note ? `${verdict}: “${note}”` : verdict)}
          onAdvance={next}
        />
      </div>
    </div>
  );
}
