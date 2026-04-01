"use client";

import { useCallback } from "react";
import { DownloadSimple, Copy } from "@phosphor-icons/react";
import { exportTheme } from "@loworbitstudio/visor-theme-engine";
import type {
  ThemeData,
  ThemeValidationResult,
} from "@loworbitstudio/visor-theme-engine";
import { toast } from "@/components/ui/toast";
import styles from "./export-bar.module.css";

interface ExportBarProps {
  themeName: string;
  onNameChange: (name: string) => void;
  themeData: ThemeData | null;
  validationResult: ThemeValidationResult | null;
}

export function ExportBar({
  themeName,
  onNameChange,
  themeData,
  validationResult,
}: ExportBarProps) {
  const hasErrors =
    validationResult !== null &&
    validationResult.errors.length > 0;
  const canExport = themeName.trim().length > 0 && themeData !== null && !hasErrors;

  const handleDownload = useCallback(() => {
    if (!themeData || !canExport) return;

    const yaml = exportTheme(themeData.primitives, themeData.config);
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${themeName.trim()}.visor.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [themeData, canExport, themeName]);

  const handleCopyCli = useCallback(async () => {
    const command = `npx visor theme apply ${themeName.trim()}.visor.yaml`;
    try {
      await navigator.clipboard.writeText(command);
      toast("CLI command copied to clipboard");
    } catch {
      toast("Failed to copy to clipboard");
    }
  }, [themeName]);

  return (
    <div className={styles.bar}>
      <input
        type="text"
        className={styles.nameInput}
        value={themeName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Theme name"
        aria-label="Theme name"
      />
      <button
        type="button"
        className={styles.downloadButton}
        onClick={handleDownload}
        disabled={!canExport}
        title={
          !canExport
            ? hasErrors
              ? "Fix validation errors before exporting"
              : "Enter a theme name to export"
            : "Download .visor.yaml"
        }
      >
        <DownloadSimple size={16} weight="bold" />
        <span className={styles.buttonLabel}>Download</span>
      </button>
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopyCli}
        disabled={themeName.trim().length === 0}
        title="Copy CLI apply command"
      >
        <Copy size={16} weight="bold" />
        <span className={styles.buttonLabel}>Copy CLI</span>
      </button>
    </div>
  );
}
