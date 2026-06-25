'use client';

import * as React from 'react';
import { SessionTimeout } from '../../../../components/ui/session-timeout/session-timeout';
import { Button } from '../../../../components/ui/button/button';

export function SessionTimeoutBasicDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Simulate session expiry</Button>
      <SessionTimeout
        open={open}
        onSignIn={() => setOpen(false)}
        onReturnHome={() => setOpen(false)}
      />
    </>
  );
}

export function SessionTimeoutRedirectingDemo() {
  const [open, setOpen] = React.useState(false);

  function handleSignIn() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
        setOpen(false);
      }, 2500);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Simulate session expiry (with redirect delay)</Button>
      <SessionTimeout
        open={open}
        onSignIn={handleSignIn}
        onReturnHome={() => setOpen(false)}
      />
    </>
  );
}

export function SessionTimeoutNoReturnHomeDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Session expired (no escape hatch)</Button>
      <SessionTimeout
        open={open}
        onSignIn={() => setOpen(false)}
      />
    </>
  );
}
