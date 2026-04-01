"use client";

import Link from "next/link";
import { useThemeCreator } from "./hooks/use-theme-creator";
import { PreviewPanel } from "./components/preview-panel";
import { ValidationDisplay } from "./components/validation-display";
import styles from "./create.module.css";

export default function CreatePage() {
  const { config, themeData, validationResult, updateConfig } =
    useThemeCreator();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Theme Creator</h1>
        <Link href="/docs" className={styles.backLink}>
          Back to Docs
        </Link>
      </div>

      <div className={styles.layout}>
        <div className={styles.controls}>
          <div className={styles.controlsPlaceholder}>
            Theme controls coming soon.
            <br />
            Editing: {config.name}
          </div>
          <ValidationDisplay result={validationResult} />
        </div>

        <div className={styles.preview}>
          <PreviewPanel themeData={themeData} />
        </div>
      </div>
    </div>
  );
}
