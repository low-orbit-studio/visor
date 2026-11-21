import type { ReactNode } from 'react';
import glass from './glass-specimen.module.css';
import styles from './form-panel.module.css';

/**
 * FormDeck's frosted form panel, drawn from the glass recipe: form controls in a photo look sit on
 * it, never straight on the photo (VI-829). With glass off it adds no surface, so Today, Dark and
 * Light draw their controls exactly as before.
 */
export function FormPanel({ children }: { children: ReactNode }) {
  return (
    <div className={styles.panel} data-slot="look-form-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
