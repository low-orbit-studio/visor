"use client";

import Link from "next/link";
import { useThemeCreator } from "./hooks/use-theme-creator";
import { PreviewPanel } from "./components/preview-panel";
import { ValidationDisplay } from "./components/validation-display";
import { ColorControls } from "./components/color-controls";
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
          <ColorControls config={config} updateConfig={updateConfig} />
          <ValidationDisplay result={validationResult} />
        </div>

        <div className={styles.preview}>
          <PreviewPanel themeData={themeData} />
        </div>
      </div>
    </div>
  );
}
