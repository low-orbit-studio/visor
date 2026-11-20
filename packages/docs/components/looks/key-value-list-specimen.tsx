import { KeyValueList } from '@/components/ui/key-value-list';
import glass from './glass-specimen.module.css';
import styles from './key-value-list-specimen.module.css';

/**
 * KeyValueList as FormDeck's Facts panel and as the Backstage itinerary's pairs
 * inside a glass tile (VI-800). The panel is solid unless an ancestor sets
 * `data-glass="on"`; the bare list never blurs, the tile carries the glass.
 */
export function KeyValueListSpecimen() {
  return (
    <div className={styles.stack} data-slot="key-value-list-specimen">
      <KeyValueList
        surface="panel"
        orientation="horizontal"
        className={styles.facts}
        data-demo="facts"
        items={[
          { label: 'Role', value: 'Stage Manager' },
          { label: 'Pay', value: '$450 a day, three days' },
          { label: 'Stage', value: 'The Barn' },
        ]}
      />
      <button type="button" className={`${glass.panel} ${styles.tile}`}>
        <span className={glass.glass} aria-hidden="true" />
        <span className={glass.edge} aria-hidden="true" />
        <span className={glass.content}>
          <span className={styles.eyebrow}>Meals and Access</span>
          <KeyValueList
            as="span"
            orientation="horizontal"
            className={styles.kv}
            data-demo="kv"
            items={[
              { label: 'Food', value: 'Three meals a day, vegetarian' },
              { label: 'Access', value: 'All areas, from Thursday' },
            ]}
          />
        </span>
      </button>
    </div>
  );
}
