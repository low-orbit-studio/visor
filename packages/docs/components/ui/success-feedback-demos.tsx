'use client';

import { useSuccessToast } from '../../../../components/ui/success-feedback/success-feedback';
import { Button } from '../../../../components/ui/button/button';

/** Basic success confirmation — project save pattern. */
export function SuccessFeedbackBasicDemo() {
  const { showSuccess } = useSuccessToast();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => showSuccess('Project saved', { description: 'All changes have been saved.' })}
    >
      Save project
    </Button>
  );
}

/** Success with undo action — delete item pattern. */
export function SuccessFeedbackUndoDemo() {
  const { showSuccess } = useSuccessToast();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        showSuccess('Item deleted', {
          description: 'Project archived successfully.',
          action: {
            label: 'Undo',
            onClick: () => showSuccess('Deletion undone'),
          },
        })
      }
    >
      Delete item
    </Button>
  );
}

/** Multiple success trigger examples. */
export function SuccessFeedbackGalleryDemo() {
  const { showSuccess } = useSuccessToast();
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => showSuccess('Project saved', { description: 'All changes have been saved.' })}
      >
        Save project
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          showSuccess('Invitation sent', {
            description: 'alex@example.com has been invited.',
            action: { label: 'View', onClick: () => {} },
          })
        }
      >
        Send invite
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          showSuccess('Item deleted', {
            action: { label: 'Undo', onClick: () => showSuccess('Deletion undone') },
          })
        }
      >
        Delete item
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => showSuccess('Link copied')}
      >
        Copy link
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          showSuccess('Export ready', {
            description: 'Your CSV is ready to download.',
            action: { label: 'View', onClick: () => {} },
          })
        }
      >
        Export CSV
      </Button>
    </div>
  );
}
