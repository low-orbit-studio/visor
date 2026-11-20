import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassSpecimen } from './glass-specimen';
import styles from './theme-specimen.module.css';

/** A theme's key pieces in one look: the glass card, a field and the primary (key colour) button. */
export function ThemeSpecimen() {
  return (
    <div className={styles.stack} data-slot="theme-specimen">
      <GlassSpecimen />
      <div className={styles.row}>
        <Input className={styles.field} aria-label="Your Name" placeholder="Your name" />
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
