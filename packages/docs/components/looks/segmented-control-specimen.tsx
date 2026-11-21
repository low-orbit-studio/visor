import { Moon, Sun } from '@phosphor-icons/react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import glass from './glass-specimen.module.css';
import styles from './segmented-control-specimen.module.css';

/**
 * SegmentedControl as the theme skins it (VI-803): no local hooks, so every colour and
 * size is the theme's. The Draw / Type switch has no icons; Light / Dark spans the width
 * with icons. Over a photo (an ancestor sets `data-glass="on"`) they sit on a glass form
 * panel and the wells blur the photo; elsewhere the panel draws nothing.
 */
export function SegmentedControlSpecimen() {
  return (
    <div className={styles.panel} data-slot="segmented-control-form-panel">
      <span className={glass.glass} aria-hidden="true" data-slot="glass-layer" />
      <span className={glass.edge} aria-hidden="true" />
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
    </div>
  );
}
