'use client';

import * as React from 'react';
import { TinInput, type TinKind } from '../../../../components/ui/tin-input/tin-input';
import { Field, FieldLabel } from '../../../../components/ui/field/field';

interface TinInputDemoProps {
  id: string;
  label: string;
  kind: TinKind;
  lastFour?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * A labelled TinInput with a readout of what the consumer receives. The
 * readout reports the SHAPE of each onValueChange call and never the digits —
 * a demo that echoed them would undo the component.
 */
export function TinInputDemo({ id, label, kind, lastFour, error, size, disabled }: TinInputDemoProps) {
  const [received, setReceived] = React.useState('nothing yet');

  return (
    <div style={{ width: '100%', maxWidth: '22rem', display: 'grid', gap: 'var(--spacing-2)' }}>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <TinInput
          id={id}
          kind={kind}
          lastFour={lastFour}
          error={error}
          size={size}
          disabled={disabled}
          onValueChange={(digits) => setReceived(digits === null ? 'onValueChange(null)' : 'onValueChange(9 digits, not shown)')}
          onReplace={() => setReceived('onReplace()')}
        />
      </Field>
      <p
        data-testid={`${id}-received`}
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        {received}
      </p>
    </div>
  );
}
