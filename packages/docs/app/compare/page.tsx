"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { THEME_GROUPS, ALL_THEMES } from "@/lib/theme-config";
import styles from "./compare.module.css";

type Mode = "light" | "dark";

interface QuadrantState {
  theme: string;
  mode: Mode;
}

interface ComparatorState {
  tl: QuadrantState;
  tr: QuadrantState;
  bl: QuadrantState;
  br: QuadrantState;
}

const QUADRANT_KEYS = ["tl", "tr", "bl", "br"] as const;
type QuadrantKey = (typeof QUADRANT_KEYS)[number];

const QUADRANT_LABELS: Record<QuadrantKey, string> = {
  tl: "Top Left",
  tr: "Top Right",
  bl: "Bottom Left",
  br: "Bottom Right",
};

const DEFAULTS: ComparatorState = {
  tl: { theme: "space", mode: "light" },
  tr: { theme: "neutral", mode: "dark" },
  bl: { theme: "blackout", mode: "light" },
  br: { theme: "kaiah", mode: "dark" },
};

function parseMode(val: string | null): Mode {
  return val === "light" || val === "dark" ? val : "dark";
}

function parseTheme(val: string | null): string {
  return val && ALL_THEMES.includes(val) ? val : "space";
}

function parseStateFromParams(params: URLSearchParams): ComparatorState {
  return {
    tl: {
      theme: parseTheme(params.get("tl")),
      mode: parseMode(params.get("tlMode")),
    },
    tr: {
      theme: parseTheme(params.get("tr")),
      mode: parseMode(params.get("trMode")),
    },
    bl: {
      theme: parseTheme(params.get("bl")),
      mode: parseMode(params.get("blMode")),
    },
    br: {
      theme: parseTheme(params.get("br")),
      mode: parseMode(params.get("brMode")),
    },
  };
}

function stateToParams(state: ComparatorState): string {
  const params = new URLSearchParams();
  for (const key of QUADRANT_KEYS) {
    const q = state[key];
    params.set(key, q.theme);
    params.set(`${key}Mode`, q.mode);
  }
  return params.toString();
}

function isDefault(state: ComparatorState): boolean {
  return QUADRANT_KEYS.every(
    (k) =>
      state[k].theme === DEFAULTS[k].theme &&
      state[k].mode === DEFAULTS[k].mode
  );
}

function ThemeSelect({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" style={{ minWidth: "9rem" }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {THEME_GROUPS.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.themes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function ComparatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ComparatorState>(() => {
    if (searchParams.toString()) {
      return parseStateFromParams(searchParams);
    }
    return DEFAULTS;
  });

  const syncUrl = useCallback(
    (newState: ComparatorState) => {
      if (isDefault(newState)) {
        router.replace("/compare", { scroll: false });
      } else {
        router.replace(`/compare?${stateToParams(newState)}`, {
          scroll: false,
        });
      }
    },
    [router]
  );

  const updateQuadrant = useCallback(
    (key: QuadrantKey, update: Partial<QuadrantState>) => {
      setState((prev) => {
        const next = {
          ...prev,
          [key]: { ...prev[key], ...update },
        };
        syncUrl(next);
        return next;
      });
    },
    [syncUrl]
  );

  const toggleMode = useCallback(
    (key: QuadrantKey) => {
      setState((prev) => {
        const next = {
          ...prev,
          [key]: {
            ...prev[key],
            mode: prev[key].mode === "dark" ? ("light" as Mode) : ("dark" as Mode),
          },
        };
        syncUrl(next);
        return next;
      });
    },
    [syncUrl]
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Theme Comparator</h1>
        <Link href="/docs" className={styles.backLink}>
          Back to Docs
        </Link>
      </div>

      <div className={styles.controls}>
        {QUADRANT_KEYS.map((key) => (
          <div key={key} className={styles.controlItem}>
            <span className={styles.controlLabel}>
              {QUADRANT_LABELS[key]}
            </span>
            <ThemeSelect
              value={state[key].theme}
              onValueChange={(v) => updateQuadrant(key, { theme: v })}
            />
            <button
              type="button"
              className={styles.modeButton}
              onClick={() => toggleMode(key)}
              aria-label={`Toggle ${QUADRANT_LABELS[key]} mode`}
            >
              {state[key].mode === "dark" ? "Dark" : "Light"}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {QUADRANT_KEYS.map((key) => {
          const q = state[key];
          const themeName =
            THEME_GROUPS.flatMap((g) => g.themes).find(
              (t) => t.value === q.theme
            )?.label ?? q.theme;

          return (
            <div key={key} className={styles.quadrant}>
              <div className={styles.quadrantLabel}>
                <span>
                  {themeName} — {q.mode}
                </span>
              </div>
              <iframe
                className={styles.quadrantIframe}
                src={`/compare/panel?theme=${q.theme}&mode=${q.mode}`}
                sandbox="allow-same-origin allow-scripts"
                title={`${themeName} ${q.mode} preview`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparatorContent />
    </Suspense>
  );
}
