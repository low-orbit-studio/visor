import { Spinner } from '@/components/ui/spinner';

/** Spinner with its words, fading in after 600ms (VI-797). The words read the theme's ink, so they invert with the tone. */
export function SpinnerSpecimen() {
  return <Spinner label="Loading your form" showLabel delay={600} />;
}
