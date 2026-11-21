import { AnimatedTitle } from '@/components/ui/animated-title';
import glass from './glass-specimen.module.css';
import styles from './animated-title-specimen.module.css';

/**
 * AnimatedTitle's three entrances (VI-815), one under the other. The ink is the theme's
 * --text-primary and the motion is the same in every look. Over a photo (an ancestor sets
 * `data-glass="on"`) they sit on a glass panel, as FormDeck's titles sit on its slide card.
 * Reload the frame to replay.
 */
export function AnimatedTitleSpecimen() {
  return (
    <div className={styles.panel} data-slot="animated-title-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={styles.stack} data-slot="animated-title-specimen">
        <AnimatedTitle className={styles.title} animation="blur" text="Tell us about your weekend" />
        <AnimatedTitle className={styles.title} animation="rise" text="Friday night" />
        <AnimatedTitle className={styles.title} animation="weight" text="Edit your arrival" />
      </div>
    </div>
  );
}
