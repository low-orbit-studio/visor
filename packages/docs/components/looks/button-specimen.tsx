import { ArrowSwap, Button } from '@/components/ui/button';
import { FormPanel } from './form-panel';
import styles from './button-specimen.module.css';

/** Three buttons in one look, on the form panel, drawn as the theme ships them: a glass icon button, the primary and an outline button. */
export function ButtonSpecimen() {
  return (
    <FormPanel>
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
    </FormPanel>
  );
}
