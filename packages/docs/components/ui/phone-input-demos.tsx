'use client';

import * as React from 'react';
import { PhoneInput } from '../../../../components/ui/phone-input/phone-input';

/* ── Live onChange — shows that a partial emits null ─────────────────── */

export function PhoneInputOnChangeDemo() {
  const [e164, setE164] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState(false);

  return (
    <div style={{ width: '100%', maxWidth: '20rem', minHeight: '19rem', display: 'grid', gap: 'var(--spacing-2)', alignContent: 'start' }}>
      <PhoneInput
        name="phone-onchange"
        placeholder="Enter phone number"
        onChange={(value, valid) => {
          setE164(value);
          setIsValid(valid);
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        onChange({e164 === null ? 'null' : `"${e164}"`}, {String(isValid)})
      </p>
    </div>
  );
}

/* ── Blur-time validation error ──────────────────────────────────────── */

export function PhoneInputBlurErrorDemo() {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div style={{ width: '100%', maxWidth: '20rem', minHeight: '19rem', display: 'grid', gap: 'var(--spacing-2)', alignContent: 'start' }}>
      <PhoneInput
        name="phone-blur"
        placeholder="Type a partial number, then click away"
        onBlur={(validationError) => setError(validationError)}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-xs)',
          color: error ? 'var(--text-error)' : 'var(--text-secondary)',
        }}
      >
        {error ? `Error: ${error}` : 'No error'}
      </p>
    </div>
  );
}

/* ── Read-only display — needs countrySelectorMode="OFF" too ─────────── */

export function PhoneInputReadOnlyDemo() {
  return (
    <div style={{ width: '100%', maxWidth: '20rem', minHeight: '19rem' }}>
      <PhoneInput
        name="phone-readonly"
        value="+12133734253"
        readOnly
        countrySelectorMode="OFF"
      />
    </div>
  );
}
