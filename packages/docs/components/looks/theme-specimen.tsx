import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormPanel } from './form-panel';
import { GlassSpecimen } from './glass-specimen';
import styles from './theme-specimen.module.css';

/** A theme's key pieces in one look: the glass card, then a field and the primary (key colour) button on the form panel. */
export function ThemeSpecimen() {
  return (
    <div className={styles.stack} data-slot="theme-specimen">
      <GlassSpecimen />
      <FormPanel>
        <div className={styles.row}>
          <Input className={styles.field} aria-label="Your Name" placeholder="Your name" />
          <Button>Save Changes</Button>
        </div>
      </FormPanel>
    </div>
  );
}
