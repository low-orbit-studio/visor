import { WarningCircle, WifiSlash } from '@phosphor-icons/react/dist/ssr';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** The soft Alert as the kit's Notice (VI-799): "Didn't Send" and "You're Offline", then one of each other tone. Over a photo every tone draws in the glass ink. */
export function AlertSpecimen() {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-3)', width: '100%', maxWidth: '30rem' }}>
      <Alert appearance="soft" variant="destructive" icon={<WarningCircle weight="bold" />}>
        <AlertTitle>Your Answers Didn&apos;t Send</AlertTitle>
        <AlertDescription>
          Everything you entered is safe and saved in this browser. Try again in a moment, or write to{' '}
          <a href="mailto:help@example.com">help@example.com</a> if it keeps happening.
        </AlertDescription>
      </Alert>
      <Alert appearance="soft" variant="destructive" icon={<WifiSlash weight="bold" />}>
        <AlertTitle>You&apos;re Offline</AlertTitle>
        <AlertDescription>Everything you entered is safe and saved in this browser.</AlertDescription>
      </Alert>
      <Alert appearance="soft" variant="warning">
        <AlertDescription>Your session ends in five minutes.</AlertDescription>
      </Alert>
      <Alert appearance="soft" variant="success">
        <AlertDescription>Your answers are in.</AlertDescription>
      </Alert>
      <Alert appearance="soft">
        <AlertDescription>Drafts save in this browser.</AlertDescription>
      </Alert>
    </div>
  );
}
