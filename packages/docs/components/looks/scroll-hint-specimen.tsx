import { ScrollHintDemo } from '@/components/ui/scroll-hint-demo';
import glass from './glass-specimen.module.css';
import styles from './scroll-hint-specimen.module.css';

/**
 * ScrollHint on a long form (VI-814): a solid chip in the plain looks. Over a photo (an
 * ancestor sets `data-glass="on"`) the form sits on a glass form panel and the pill turns
 * to the page colour at 70% with the glass blur; elsewhere the panel draws nothing.
 */
export function ScrollHintSpecimen() {
  return (
    <div className={styles.panel} data-slot="scroll-hint-form-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={styles.content} data-slot="scroll-hint-specimen">
        <ScrollHintDemo />
      </div>
    </div>
  );
}
