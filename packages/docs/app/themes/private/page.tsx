import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PRIVATE_THEMES } from "@/lib/private-themes";
import { BrandSection } from "@/components/playgrounds/sections/brand";
import { FiveLooks } from "@/components/looks/five-looks";
import { PrivateThemeSwitcher } from "./private-theme-switcher";
import { ThemePreview } from "./preview";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Private theme gallery",
  robots: { index: false, follow: false },
};

// Honcho's five looks: Today stays on `honcho`; Dark, Light and both Photo looks are `honcho-backstage`.
// shortcut: one theme pair, hard-coded; make it theme-driven if a second theme needs looks.
const HONCHO_LOOKS = PRIVATE_THEMES.some((t) => t.slug === "honcho-backstage");

export default function PrivateThemesPage() {
  if (PRIVATE_THEMES.length === 0) {
    notFound();
  }

  return (
    <div className={styles.page}>
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
      {HONCHO_LOOKS && (
        <section className={styles.brandBlock} aria-label="Honcho Five Looks" data-slot="honcho-looks">
          <h2 className={styles.brandHeading}>Honcho Five Looks</h2>
          <FiveLooks specimen="theme" theme="honcho-backstage" height={440} />
        </section>
      )}
      <section className={styles.brandBlock} aria-label="Brand">
        <h2 className={styles.brandHeading}>Brand</h2>
        <BrandSection privateThemes={PRIVATE_THEMES} />
      </section>
    </div>
  );
}
