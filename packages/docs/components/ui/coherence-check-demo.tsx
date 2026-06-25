'use client';

import * as React from 'react';
import { CheckGroup, CheckRow } from '../../../../components/ui/coherence-check/coherence-check';

/* ─── CoherenceCheckStatesDemo ──────────────────────────────────────────── */

export function CoherenceCheckStatesDemo() {
  return (
    <CheckGroup heading="Derivation — every layer traces upward">
      <CheckRow
        state="pass"
        title="Every pillar governs something real"
        description="No dead pillars."
      />
      <CheckRow
        state="warn"
        title="One sampled string drifts from voice"
        description='Try a plainspoken verb — "Compile" or "Publish".'
        fixLabel="Rewrite to voice"
        onFix={() => {}}
      />
      <CheckRow
        state="fail"
        title="One pairing fails on small text"
        description="Below 4.5:1 for body text. Bump tertiary one step."
        fixLabel="Suggest a fix"
        onFix={() => {}}
      />
    </CheckGroup>
  );
}

/* ─── CoherenceCheckInlineCodeDemo ─────────────────────────────────────── */

export function CoherenceCheckInlineCodeDemo() {
  return (
    <CheckGroup heading="Accessibility — WCAG 2.1 AA">
      <CheckRow
        state="fail"
        title="One pairing fails on small text"
        description={<><code>--text-tertiary</code> on <code>--surface-subtle</code> is 3.9:1 — below 4.5:1 for body text.</>}
        fixLabel="Suggest a fix"
        onFix={() => {}}
      />
      <CheckRow
        state="pass"
        title="Primary, text, and focus rings clear AA"
        description="Body 7.1:1 · large text 4.8:1 · non-text UI 3.4:1 — all above target."
      />
    </CheckGroup>
  );
}

/* ─── CoherenceCheckMultipleGroupsDemo ─────────────────────────────────── */

export function CoherenceCheckMultipleGroupsDemo() {
  return (
    <>
      <CheckGroup heading="Derivation — every layer traces upward">
        <CheckRow
          state="pass"
          title="Every pillar governs something real"
          description="No dead pillars."
        />
        <CheckRow
          state="pass"
          title="Voice derives from personality"
          description="Each trait is a consequence, not an assertion."
        />
      </CheckGroup>
      <CheckGroup heading="Voice & copy">
        <CheckRow
          state="warn"
          title="One sampled string drifts from voice"
          description='Try a plainspoken verb — "Compile" or "Publish".'
          fixLabel="Rewrite to voice"
          onFix={() => {}}
        />
      </CheckGroup>
    </>
  );
}
