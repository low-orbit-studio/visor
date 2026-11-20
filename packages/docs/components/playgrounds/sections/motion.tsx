"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MotionEasing, MotionDuration } from "@/components/ui/motion-specimen";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./section.module.css";
import motionStyles from "./motion.module.css";

// Theme easing set, including the spring/overshoot curve. Values are the stock
// primitives (packages/tokens) and the fallback when a theme value can't be
// read; --motion-easing-spring is byte-identical to BL-193's overshoot curve.
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

// VI-796: opt-in role durations. A theme emits each only when it sets it.
const ROLE_DURATIONS = ["enter", "exit", "page", "stagger", "enter-delay"].map((role) => ({
  token: `--motion-duration-${role}`,
  name: role,
}));

const RADII = ["sm", "md", "lg", "xl", "full"];

const READ_TOKENS = [
  ...EASINGS.map((e) => e.token),
  ...DURATIONS.map((d) => d.token),
  ...ROLE_DURATIONS.map((d) => d.token),
  "--corner-shape",
];

/** Read the active theme's value for each token off the section root. */
function useResolvedTokens(theme: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    // Wait a frame so the explorer has applied the new theme class.
    const id = requestAnimationFrame(() => {
      if (!ref.current) return;
      const cs = getComputedStyle(ref.current);
      setValues(Object.fromEntries(READ_TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()])));
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return { ref, values };
}

const toMs = (value: string | undefined) => {
  const m = value?.match(/^([\d.]+)(m?s)$/);
  return m ? Number(m[1]) * (m[2] === "s" ? 1000 : 1) : undefined;
};

export function MotionSection({ theme }: SectionProps = {}) {
  const active = useActiveTheme(theme);
  const { ref, values } = useResolvedTokens(active);

  const easings = EASINGS.map((e) => ({ ...e, value: values[e.token] || e.value }));
  const durations = DURATIONS.map((d) => ({ ...d, ms: toMs(values[d.token]) ?? d.ms }));
  const roles = ROLE_DURATIONS.flatMap((d) => {
    const ms = toMs(values[d.token]);
    return ms === undefined ? [] : [{ ...d, ms }];
  });
  const unsetRoles = ROLE_DURATIONS.filter((d) => toMs(values[d.token]) === undefined);
  const corner = values["--corner-shape"] || "round";

  return (
    <div ref={ref} className={styles.root}>
      <p className={styles.lede}>
        Easing curves, durations and corner shape as they resolve in the active theme. Watch the spring curve overshoot and settle.
      </p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Easing curves</h3>
        <MotionEasing easings={easings} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Durations</h3>
        <MotionDuration durations={durations} />
      </section>

      <section className={styles.group} data-testid="motion-role-durations">
        <h3 className={styles.groupHeading}>Role durations</h3>
        {roles.length > 0 && <MotionDuration durations={roles} />}
        {unsetRoles.length > 0 && (
          <p className={styles.cardLabel}>
            Not set by this theme: {unsetRoles.map((d) => d.token).join(", ")}
          </p>
        )}
      </section>

      <section className={styles.group} data-testid="motion-corner-shape">
        <h3 className={styles.groupHeading}>Corner shape</h3>
        <p className={styles.cardLabel}>
          This theme: <code>{corner}</code>. Browsers without <code>corner-shape</code> draw round.
        </p>
        {[
          { label: "This theme", shape: "var(--corner-shape, round)" },
          { label: "squircle", shape: "squircle" },
          { label: "round", shape: "round" },
        ].map((row) => (
          <div key={row.label} className={motionStyles.cornerRow}>
            <span className={motionStyles.cornerLabel}>{row.label}</span>
            <div className={motionStyles.cornerTiles}>
              {RADII.map((r) => (
                <div
                  key={r}
                  className={motionStyles.cornerTile}
                  style={{ borderRadius: `var(--radius-${r})`, cornerShape: row.shape } as CSSProperties}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
