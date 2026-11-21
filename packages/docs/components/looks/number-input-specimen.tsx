import type { CSSProperties } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { FormPanel } from './form-panel';
import styles from './number-input-specimen.module.css';

/** The kit stepper's sizes, bound through NumberInput's skin hooks (VI-798). */
const KIT_SIZES = {
  '--number-input-height': '54px',
  '--number-input-radius': '12px',
  '--number-input-value-width': '72px',
  '--number-input-value-font-size': '22px',
  '--number-input-value-font-weight': '640',
  '--number-input-button-size': '40px',
  '--number-input-button-inset': '7px',
  '--number-input-button-radius': '50%',
  '--number-input-icon-size': '20px',
} as CSSProperties;

/** NumberInput as shipped and with the kit's sizes, on the form panel. Solid unless an ancestor sets `data-glass="on"`. */
export function NumberInputSpecimen() {
  return (
    <FormPanel>
      <div className={styles.row} data-slot="number-input-specimen">
        <NumberInput defaultValue={2} min={0} max={9} aria-label="Guests" />
        {/* A theme binds these under `components.number-input`; here a wrapper sets them. */}
        <div style={KIT_SIZES}>
          <NumberInput defaultValue={2} min={0} max={9} aria-label="Guests, kit sizes" />
        </div>
      </div>
    </FormPanel>
  );
}
