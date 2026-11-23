import { RichText } from '@/components/ui/rich-text';
import glass from './glass-specimen.module.css';
import styles from './rich-text-specimen.module.css';

/** Database text as FormDeck's intro body (VI-813), on a panel built from the glass recipe. */
export const RICH_TEXT_SAMPLE =
  'Doors open *Friday at 6 PM* – bring _your_ ticket and read the [crew guide](https://example.com).\nGates close at 11 PM.\n\n- Parking runs Fri – Sun\n- Questions? Write to [the crew desk](mailto:help@example.com)';

/**
 * RichText draws no surface of its own: its ink and its link inherit from the card, which is solid
 * in the plain looks and glass over the photo. The underline is the theme's `rich-text.link-underline`.
 */
export function RichTextSpecimen() {
  return (
    <div className={`${glass.panel} ${styles.card}`} data-slot="rich-text-specimen">
      <span className={glass.glass} aria-hidden="true" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={glass.content}>
        <h2 className={glass.title}>Welcome to the Crew</h2>
        <p className={glass.body} data-demo="rich-text">
          <RichText text={RICH_TEXT_SAMPLE} dashes />
        </p>
      </div>
    </div>
  );
}
