import styles from './glass-specimen.module.css';

/** The glass recipe on one card and one control. Solid unless an ancestor sets `data-glass="on"`. */
export function GlassSpecimen() {
  return (
    <div className={styles.panel} data-slot="glass-specimen">
      <span className={styles.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={styles.edge} aria-hidden="true" data-slot="glass-edge" />
      <div className={styles.content}>
        <h3 className={styles.title}>Friday Night</h3>
        <p className={styles.body}>Doors at nine. The card turns to glass only where a photo sits behind it.</p>
        <button type="button" className={styles.control} data-slot="glass-control">
          Open the Lineup
        </button>
      </div>
    </div>
  );
}
