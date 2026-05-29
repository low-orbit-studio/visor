"use client";

import { MotionEasing, MotionDuration } from "@/components/ui/motion-specimen";
import styles from "./section.module.css";

// Theme easing set, including the spring/overshoot curve. Values mirror the
// stock primitives (packages/tokens); --motion-easing-spring is byte-identical
// to BL-193's overshoot curve and is emitted by every theme incl. the docs adapter.
const EASINGS = [
  { token: "--motion-easing-linear", name: "linear", value: "linear" },
  { token: "--motion-easing-ease-in", name: "ease-in", value: "cubic-bezier(0.4, 0, 1, 1)" },
  { token: "--motion-easing-ease-out", name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)" },
  { token: "--motion-easing-ease-in-out", name: "ease-in-out", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  { token: "--motion-easing-spring", name: "spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
];

// Semantic duration scale (fast / normal / slow) mapped to its primitive tokens.
const DURATIONS = [
  { token: "--motion-duration-100", name: "fast", ms: 100 },
  { token: "--motion-duration-200", name: "normal", ms: 200 },
  { token: "--motion-duration-500", name: "slow", ms: 500 },
];

export function MotionSection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>
        Easing curves and durations as they resolve in the active theme. Watch the spring curve overshoot and settle.
      </p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Easing curves</h3>
        <MotionEasing easings={EASINGS} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Durations</h3>
        <MotionDuration durations={DURATIONS} />
      </section>
    </div>
  );
}
