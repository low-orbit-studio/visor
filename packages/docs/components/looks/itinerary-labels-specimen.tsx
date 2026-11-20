import { Chip } from '@/components/ui/chip';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { StatusDot } from '@/components/ui/status-dot';
import { Text } from '@/components/ui/text';
import glass from './glass-specimen.module.css';
import styles from './itinerary-labels-specimen.module.css';

/**
 * The itinerary's small labels (VI-801): the offline pill from the top bar, and a
 * tile of eyebrows with role dots and chips. The tile uses the glass recipe, so it
 * is a solid card unless an ancestor sets `data-glass="on"`; the chips, dots and
 * eyebrows never blur themselves.
 */
export function ItineraryLabelsSpecimen() {
  return (
    <div className={styles.kit} data-slot="itinerary-labels-specimen">
      <div className={styles.pills}>
        <OfflineBanner networkState="offline" variant="pill" detail="saved 9PM" />
        <OfflineBanner networkState="offline" variant="pill" detail="saved Aug 11, 9PM" />
      </div>
      <div className={`${glass.panel} ${styles.tile}`}>
        <span className={glass.glass} aria-hidden="true" />
        <span className={glass.edge} aria-hidden="true" />
        <div className={glass.content}>
          <Text size="eyebrow">
            <StatusDot className={styles.staff} />
            Your Shifts
          </Text>
          <div className={styles.chips}>
            <Chip>Fri 2–4PM</Chip>
            <Chip>Main Gate</Chip>
          </div>
          <Text size="eyebrow">
            <StatusDot className={styles.artist} />
            Your Performance
          </Text>
          <div className={styles.chips}>
            <Chip>Sat 9PM</Chip>
            <Chip>Sunset Stage</Chip>
          </div>
          <Text size="eyebrow">Your Roles at Campout 2027</Text>
        </div>
      </div>
    </div>
  );
}
