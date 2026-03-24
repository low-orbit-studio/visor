'use client';

import { toast } from '../../../../components/ui/toast/toast';
import { Button } from '../../../../components/ui/button/button';

export function ToastDemo() {
  return (
    <Button onClick={() => toast('Event created')}>Show Toast</Button>
  );
}
