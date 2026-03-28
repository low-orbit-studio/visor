'use client';

import { toast } from '../../../../components/ui/toast/toast';
import { Button } from '../../../../components/ui/button/button';

export function ToastVariantsDemo() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button variant="outline" size="sm" onClick={() => toast('Event created')}>
        Default
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.success('Changes saved')}>
        Success
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.error('Something went wrong')}>
        Error
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.warning('Storage almost full')}>
        Warning
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.info('New update available')}>
        Info
      </Button>
    </div>
  );
}

export function ToastWithDescriptionDemo() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        toast('File uploaded', {
          description: 'report-q4-2025.pdf was saved to your documents.',
        })
      }
    >
      Show with description
    </Button>
  );
}

export function ToastWithActionDemo() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        toast('Message sent', {
          action: {
            label: 'Undo',
            onClick: () => toast('Message unsent'),
          },
        })
      }
    >
      Show with action
    </Button>
  );
}
