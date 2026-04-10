'use client';

import { useCallback, useState } from 'react';
import { BulkActionBar } from '../../../../components/ui/bulk-action-bar/bulk-action-bar';
import { Button } from '../../../../components/ui/button/button';

export function BulkActionBarInlineDemo() {
  const [count, setCount] = useState(3);
  const handleClear = useCallback(() => setCount(0), []);
  const handleReset = useCallback(() => setCount(3), []);

  if (count === 0) {
    return (
      <Button variant="outline" size="sm" onClick={handleReset}>
        Select 3 items
      </Button>
    );
  }

  return (
    <BulkActionBar
      count={count}
      inline
      autoFocus={false}
      onClear={handleClear}
    >
      <Button variant="outline" size="sm">
        Archive
      </Button>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    </BulkActionBar>
  );
}

export function BulkActionBarCustomLabelDemo() {
  const [count, setCount] = useState(12);
  const handleClear = useCallback(() => setCount(0), []);
  const handleReset = useCallback(() => setCount(12), []);

  if (count === 0) {
    return (
      <Button variant="outline" size="sm" onClick={handleReset}>
        Select 12 users
      </Button>
    );
  }

  return (
    <BulkActionBar
      count={count}
      inline
      autoFocus={false}
      label={(n) => `${n} users selected`}
      onClear={handleClear}
    >
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    </BulkActionBar>
  );
}

export function BulkActionBarNoDismissDemo() {
  return (
    <BulkActionBar count={4} inline autoFocus={false} dismissible={false}>
      <Button variant="outline" size="sm">
        Archive
      </Button>
    </BulkActionBar>
  );
}
