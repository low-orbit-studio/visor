import { Moon, Sun } from '@phosphor-icons/react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import styles from './segmented-control-specimen.module.css';

/**
 * SegmentedControl as the theme skins it (VI-803): no local hooks, so every colour and
 * size is the theme's. The Draw / Type switch has no icons; Light / Dark spans the width
 * with icons. The well blurs the photo only where an ancestor sets `data-glass="on"`.
 */
export function SegmentedControlSpecimen() {
  return (
    <div className={styles.stack} data-slot="segmented-control-specimen">
      <SegmentedControl
        aria-label="Signature mode"
        defaultValue="draw"
        options={[
          { value: 'draw', label: 'Draw' },
          { value: 'type', label: 'Type' },
        ]}
      />
      <SegmentedControl
        aria-label="Tone"
        defaultValue="dark"
        fullWidth
        options={[
          { value: 'light', label: 'Light', icon: <Sun weight="bold" /> },
          { value: 'dark', label: 'Dark', icon: <Moon weight="bold" /> },
        ]}
      />
    </div>
  );
}
