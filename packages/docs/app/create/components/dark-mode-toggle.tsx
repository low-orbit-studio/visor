"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import styles from "./dark-mode-toggle.module.css";

interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
      title={`Switch to ${darkMode ? "light" : "dark"} mode`}
    >
      {darkMode ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />}
      <span className={styles.label}>{darkMode ? "Dark" : "Light"}</span>
    </button>
  );
}
