import type { ThemeValidationResult } from "@loworbitstudio/visor-theme-engine";
import styles from "./validation-display.module.css";

interface ValidationDisplayProps {
  result: ThemeValidationResult | null;
}

export function ValidationDisplay({ result }: ValidationDisplayProps) {
  if (!result) return null;

  const hasIssues = result.errors.length > 0 || result.warnings.length > 0;

  if (!hasIssues) {
    return (
      <div className={styles.valid}>
        <span className={styles.validIcon}>&#10003;</span>
        Theme is valid
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {result.errors.map((issue, i) => (
        <div key={`error-${i}`} className={styles.error}>
          <span className={styles.severity}>Error</span>
          <span className={styles.message}>{issue.message}</span>
          {issue.path && <span className={styles.path}>{issue.path}</span>}
        </div>
      ))}
      {result.warnings.map((issue, i) => (
        <div key={`warning-${i}`} className={styles.warning}>
          <span className={styles.severity}>Warning</span>
          <span className={styles.message}>{issue.message}</span>
          {issue.path && <span className={styles.path}>{issue.path}</span>}
        </div>
      ))}
    </div>
  );
}
