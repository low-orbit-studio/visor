"use client";

import { useRef, useEffect, useState } from "react";
import type { ThemeData } from "@loworbitstudio/visor-theme-engine";
import styles from "./preview-panel.module.css";

interface PreviewPanelProps {
  themeData: ThemeData | null;
}

export function PreviewPanel({ themeData }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  // Send CSS to iframe when themeData changes
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !iframeReady || !themeData) return;

    iframeRef.current.contentWindow.postMessage(
      { type: "theme-css", css: themeData.output.fullBundleCss },
      "*"
    );
  }, [themeData, iframeReady]);

  // Send dark mode toggle
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !iframeReady) return;

    iframeRef.current.contentWindow.postMessage(
      { type: "dark-mode", enabled: darkMode },
      "*"
    );
  }, [darkMode, iframeReady]);

  const handleIframeLoad = () => {
    setIframeReady(true);

    // Send initial theme data if available
    if (themeData && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "theme-css", css: themeData.output.fullBundleCss },
        "*"
      );
      iframeRef.current.contentWindow.postMessage(
        { type: "dark-mode", enabled: darkMode },
        "*"
      );
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Preview</span>
        <button
          type="button"
          className={styles.modeToggle}
          onClick={() => setDarkMode((prev) => !prev)}
          aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
        >
          {darkMode ? "Dark" : "Light"}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className={styles.iframe}
        src="/create/preview"
        sandbox="allow-same-origin allow-scripts"
        title="Theme preview"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
