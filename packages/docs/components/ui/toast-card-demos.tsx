'use client';

import { ToastCard } from '../../../../components/ui/toast-card/toast-card';

export function ToastCardActionDemo() {
  return (
    <div style={{ maxWidth: '400px' }}>
      <ToastCard
        variant="error"
        title="Sync failed"
        body="Could not connect to the server."
        action="Retry"
        onAction={() => {}}
      />
    </div>
  );
}

export function ToastCardDismissDemo() {
  return (
    <div style={{ maxWidth: '400px' }}>
      <ToastCard
        variant="info"
        title="New update available"
        body="Refresh to load the latest version."
        onDismiss={() => {}}
      />
    </div>
  );
}
