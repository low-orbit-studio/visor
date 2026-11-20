import { ArrowSwap, Button } from '@/components/ui/button';
import styles from './button-specimen.module.css';

/** The kit's pill buttons in one look: a round glass icon button, the ink pill and the outline pill. */
export function ButtonSpecimen() {
  return (
    <div className={styles.pills} data-slot="button-specimen">
      <Button variant="glass" size="icon" aria-label="Back">
        <ArrowSwap direction="left" />
      </Button>
      <Button size="lg">
        Keep Going <ArrowSwap />
      </Button>
      <Button variant="outline" size="lg">
        Not Now
      </Button>
    </div>
  );
}
