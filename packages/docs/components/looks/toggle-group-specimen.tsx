import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FormPanel } from './form-panel';
import styles from './toggle-group-specimen.module.css';

/** Option rows with descriptions (VI-806): one answer with the round mark, several with the box, on the form panel. */
export function ToggleGroupSpecimen() {
  return (
    <FormPanel>
      <div className={styles.stack} data-slot="toggle-group-specimen">
        <ToggleGroup type="single" variant="option" mark shortcuts aria-label="Ticket" defaultValue="weekend">
          <ToggleGroupItem value="weekend" description="Friday to Sunday, every stage">
            Weekend Pass
          </ToggleGroupItem>
          <ToggleGroupItem value="day" description="One day, pick it at the gate">
            Day Ticket
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="option" aria-label="Add-ons" defaultValue={['camping']}>
          <ToggleGroupItem value="camping" description="A pitch in the quiet field">
            Camping
          </ToggleGroupItem>
          <ToggleGroupItem value="parking" description="One car, all weekend">
            Parking
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </FormPanel>
  );
}
