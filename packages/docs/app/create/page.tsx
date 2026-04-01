"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useThemeCreator } from "./hooks/use-theme-creator";
import { PreviewPanel } from "./components/preview-panel";
import { ValidationDisplay } from "./components/validation-display";
import { ColorControls } from "./components/color-controls";
import { TypographyControls } from "./components/typography-controls";
import { SpacingControls } from "./components/spacing-controls";
import { AdvancedControls } from "./components/advanced-controls";
import { ExportBar } from "./components/export-bar";
import { StartFromDropdown } from "./components/start-from-dropdown";
import { DarkModeToggle } from "./components/dark-mode-toggle";
import styles from "./create.module.css";

export default function CreatePage() {
  const { config, themeData, validationResult, updateConfig, replaceConfig } =
    useThemeCreator();
  const [darkMode, setDarkMode] = useState(false);

  /** Forward font-load postMessage to the preview iframe */
  const handleLoadFont = useCallback((url: string) => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[title="Theme preview"]'
    );
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "load-font", url }, "*");
    }
  }, []);


  const handleNameChange = useCallback(
    (name: string) => {
      updateConfig("name", name);
    },
    [updateConfig]
  );

  // Extract current values with defaults
  const headingFamily = config.typography?.heading?.family ?? "";
  const headingWeight = config.typography?.heading?.weight ?? 600;
  const bodyFamily = config.typography?.body?.family ?? "";
  const bodyWeight = config.typography?.body?.weight ?? 400;
  const monoFamily = config.typography?.mono?.family ?? "";

  const spacingBase = config.spacing?.base ?? 4;
  const radiusSm = config.radius?.sm ?? 2;
  const radiusMd = config.radius?.md ?? 4;
  const radiusLg = config.radius?.lg ?? 8;
  const radiusXl = config.radius?.xl ?? 12;
  const radiusPill = config.radius?.pill ?? 9999;

  const shadowXs = config.shadows?.xs ?? "";
  const shadowSm = config.shadows?.sm ?? "";
  const shadowMd = config.shadows?.md ?? "";
  const shadowLg = config.shadows?.lg ?? "";
  const shadowXl = config.shadows?.xl ?? "";

  const motionDurationFast = config.motion?.["duration-fast"] ?? "";
  const motionDurationNormal = config.motion?.["duration-normal"] ?? "";
  const motionDurationSlow = config.motion?.["duration-slow"] ?? "";
  const motionEasing = config.motion?.easing ?? "";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Theme Creator</h1>
          <Link href="/docs" className={styles.backLink}>
            Back to Docs
          </Link>
        </div>
        <div className={styles.headerControls}>
          <StartFromDropdown onLoadConfig={replaceConfig} />
          <DarkModeToggle
            darkMode={darkMode}
            onToggle={() => setDarkMode((prev) => !prev)}
          />
        </div>
      </div>

      <div className={styles.exportRow}>
        <ExportBar
          themeName={config.name}
          onNameChange={handleNameChange}
          themeData={themeData}
          validationResult={validationResult}
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.controls}>
          <ColorControls config={config} updateConfig={updateConfig} />

          <TypographyControls
            headingFamily={headingFamily}
            headingWeight={headingWeight}
            bodyFamily={bodyFamily}
            bodyWeight={bodyWeight}
            monoFamily={monoFamily}
            onHeadingFamilyChange={(v) =>
              updateConfig("typography.heading.family", v)
            }
            onHeadingWeightChange={(v) =>
              updateConfig("typography.heading.weight", v)
            }
            onBodyFamilyChange={(v) =>
              updateConfig("typography.body.family", v)
            }
            onBodyWeightChange={(v) =>
              updateConfig("typography.body.weight", v)
            }
            onMonoFamilyChange={(v) =>
              updateConfig("typography.mono.family", v)
            }
            onLoadFont={handleLoadFont}
          />

          <SpacingControls
            spacingBase={spacingBase}
            radiusSm={radiusSm}
            radiusMd={radiusMd}
            radiusLg={radiusLg}
            radiusXl={radiusXl}
            radiusPill={radiusPill}
            onSpacingBaseChange={(v) => updateConfig("spacing.base", v)}
            onRadiusSmChange={(v) => updateConfig("radius.sm", v)}
            onRadiusMdChange={(v) => updateConfig("radius.md", v)}
            onRadiusLgChange={(v) => updateConfig("radius.lg", v)}
            onRadiusXlChange={(v) => updateConfig("radius.xl", v)}
            onRadiusPillChange={(v) => updateConfig("radius.pill", v)}
          />

          <AdvancedControls
            shadowXs={shadowXs}
            shadowSm={shadowSm}
            shadowMd={shadowMd}
            shadowLg={shadowLg}
            shadowXl={shadowXl}
            motionDurationFast={motionDurationFast}
            motionDurationNormal={motionDurationNormal}
            motionDurationSlow={motionDurationSlow}
            motionEasing={motionEasing}
            onShadowChange={(size, value) =>
              updateConfig(`shadows.${size}`, value)
            }
            onMotionDurationChange={(speed, value) =>
              updateConfig(`motion.${speed}`, value)
            }
            onMotionEasingChange={(value) =>
              updateConfig("motion.easing", value)
            }
          />

          <ValidationDisplay result={validationResult} />
        </div>

        <div className={styles.preview}>
          <PreviewPanel themeData={themeData} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
