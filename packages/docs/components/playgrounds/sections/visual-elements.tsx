"use client";

import { ColorSwatch } from "@/components/ui/color-swatch";
import { SurfaceRow } from "@/components/ui/surface-row";
import { ElevationCard } from "@/components/ui/elevation-card";
import styles from "./section.module.css";

export function VisualElementsSection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>Foundational tokens — colors, surfaces, elevation — as they resolve in the active theme.</p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Text color tokens</h3>
        <div className={styles.row}>
          <ColorSwatch token="--text-primary" hex="" name="Primary" dynamic />
          <ColorSwatch token="--text-secondary" hex="" name="Secondary" dynamic />
          <ColorSwatch token="--text-tertiary" hex="" name="Tertiary" dynamic />
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Surface tokens</h3>
        <div className={styles.stack}>
          <SurfaceRow token="--surface-primary" name="Primary" />
          <SurfaceRow token="--surface-secondary" name="Secondary" />
          <SurfaceRow token="--surface-tertiary" name="Tertiary" />
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Elevation</h3>
        <div className={styles.row}>
          <ElevationCard token="--shadow-xs" name="xs" />
          <ElevationCard token="--shadow-sm" name="sm" />
          <ElevationCard token="--shadow-md" name="md" />
          <ElevationCard token="--shadow-lg" name="lg" />
          <ElevationCard token="--shadow-xl" name="xl" />
        </div>
      </section>
    </div>
  );
}
