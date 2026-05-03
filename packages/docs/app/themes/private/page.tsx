import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PRIVATE_THEMES } from "@/lib/private-themes";
import { PrivateThemeSwitcher } from "./private-theme-switcher";
import { ThemePreview } from "./preview";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Private theme gallery",
  robots: { index: false, follow: false },
};

export default function PrivateThemesPage() {
  if (PRIVATE_THEMES.length === 0) {
    notFound();
  }

  return (
    <div className={`${styles.page} ${PRIVATE_THEMES[0].slug}-theme`}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Private theme gallery</h1>
          <p className={styles.subtitle}>
            {PRIVATE_THEMES.length} private theme{PRIVATE_THEMES.length === 1 ? "" : "s"} —
            switch to preview each one live.
          </p>
        </div>
        <div className={styles.controls}>
          <Link href="/docs" className={styles.backLink}>
            ← Back to docs
          </Link>
          <PrivateThemeSwitcher themes={PRIVATE_THEMES} />
        </div>
      </header>
      <ThemePreview />
    </div>
  );
}
