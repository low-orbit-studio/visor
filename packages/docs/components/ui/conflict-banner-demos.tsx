'use client';

import * as React from 'react';
import { ConflictBanner, useOptimisticMutation } from '../../../../components/ui/conflict-banner/conflict-banner';

// ── Static conflict-state demo ─────────────────────────────────────────────

export function ConflictBannerStaticDemo() {
  return (
    <ConflictBanner
      state="conflict"
      description="Jordan Kim saved changes 30 seconds ago. Your edits may conflict."
      diffs={[
        { field: 'Title', yours: 'Q3 Marketing Brief (Draft)', theirs: 'Q3 Marketing Brief' },
        { field: 'Due date', yours: 'July 15, 2026', theirs: 'August 1, 2026' },
      ]}
      onKeepMine={() => void 0}
      onLoadLatest={() => void 0}
    />
  );
}

// ── Interactive state-machine demo ─────────────────────────────────────────

type RecordData = { title: string; dueDate: string };

export function ConflictBannerInteractiveDemo() {
  const {
    status,
    conflictState,
    currentValue,
    mutate,
    keepMine,
    loadLatest,
    reset,
  } = useOptimisticMutation<RecordData>(
    { title: 'Q3 Marketing Brief', dueDate: 'August 1, 2026' },
    {
      onOptimisticApply: (_v) => void 0,
      onRollback: (_v) => void 0,
      onKeepMine: async (v) => {
        // Simulate server accepting the client's version
        await new Promise((r) => setTimeout(r, 800));
        return void 0;
      },
      onLoadLatest: async () => {
        // Simulate fetching the latest from the server
        await new Promise((r) => setTimeout(r, 800));
        return { title: 'Q3 Marketing Brief', dueDate: 'August 1, 2026' };
      },
    }
  );

  const isConflict = conflictState === 'conflict' || conflictState === 'resolving';
  const isResolved = conflictState === 'resolved-local' || conflictState === 'resolved-remote';

  async function triggerConflict() {
    await mutate(
      { title: 'Q3 Marketing Brief (Draft)', dueDate: 'July 15, 2026' },
      async () => {
        await new Promise((r) => setTimeout(r, 400));
        throw new Error('409 Conflict');
      }
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Simulated record card */}
      <div
        style={{
          background: 'var(--surface-card, #fff)',
          borderRadius: 'var(--radius-lg, 0.5rem)',
          border: '1px solid var(--border-default, #e5e7eb)',
          overflow: 'hidden',
        }}
      >
        {/* Record header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-default, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text-primary, #111827)',
              }}
            >
              {currentValue?.title ?? 'Q3 Marketing Brief'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #4b5563)',
                marginTop: '0.125rem',
              }}
            >
              Due: {currentValue?.dueDate ?? 'August 1, 2026'}
            </div>
          </div>
          {isResolved && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.625rem',
                borderRadius: '0.75rem',
                background:
                  conflictState === 'resolved-local'
                    ? 'var(--surface-success-subtle, rgba(16,185,129,0.1))'
                    : 'var(--surface-subtle, #f9fafb)',
                color:
                  conflictState === 'resolved-local'
                    ? 'var(--text-success, #065f46)'
                    : 'var(--text-secondary, #4b5563)',
              }}
            >
              {conflictState === 'resolved-local'
                ? 'Your version saved'
                : 'Latest version loaded'}
            </span>
          )}
        </div>

        {/* Conflict banner */}
        {isConflict && (
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <ConflictBanner
              state={conflictState}
              description="Jordan Kim saved changes 30 seconds ago. Your edits may conflict."
              diffs={[
                {
                  field: 'Title',
                  yours: 'Q3 Marketing Brief (Draft)',
                  theirs: 'Q3 Marketing Brief',
                },
              ]}
              onKeepMine={keepMine}
              onLoadLatest={loadLatest}
            />
          </div>
        )}

        {/* Record fields (dimmed during conflict) */}
        <div
          style={{
            padding: '1rem 1.25rem',
            opacity: isConflict ? 'var(--opacity-50, 0.5)' : '1',
            transition: 'opacity 150ms ease',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #4b5563)' }}>
            Status: In Review
          </div>
        </div>

        {/* Action bar */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-default, #e5e7eb)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {status === 'idle' || isResolved ? (
            <button
              type="button"
              onClick={triggerConflict}
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md, 0.375rem)',
                border: 'none',
                background: 'var(--surface-accent-default, #6366f1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Simulate conflict
            </button>
          ) : null}
          {isResolved && (
            <button
              type="button"
              onClick={reset}
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md, 0.375rem)',
                border: '1px solid var(--border-default, #e5e7eb)',
                background: 'transparent',
                color: 'var(--text-secondary, #4b5563)',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Status label */}
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary, #9ca3af)',
          textAlign: 'center',
        }}
      >
        Hook status: <code>{status}</code>
      </div>
    </div>
  );
}
