import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminWizardShowcase } from '@/components/blocks/admin-wizard-showcase';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'admin-wizard showcase — Create organization',
  description:
    'Editorial-density showcase for the admin-wizard block — an ENTR-style four-step create-organization flow composing the stepper, Field family primitives, per-step validation, and the cancel guard.',
  alternates: { canonical: 'https://visor.design/showcases/admin-wizard' },
  openGraph: {
    type: 'website',
    url: 'https://visor.design/showcases/admin-wizard',
    title: 'admin-wizard showcase — Create organization',
    description:
      'Editorial-density showcase for the admin-wizard block — an ENTR-style four-step create-organization flow.',
    siteName: 'Visor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'admin-wizard showcase — Create organization',
    description:
      'Editorial-density showcase for the admin-wizard block — an ENTR-style four-step create-organization flow.',
  },
};

export default function AdminWizardShowcasePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrowRow}>
          <Link href="/docs/blocks/admin-wizard" className={styles.backLink}>
            ← admin-wizard docs
          </Link>
        </div>
        <h1 className={styles.title}>admin-wizard — create-organization</h1>
        <p className={styles.subtitle}>
          Editorial-density hardening pass. Composes the block against an
          ENTR-style admin onboarding flow: four steps (Organization →
          Workspace → Team → Confirm), Field primitives, per-step validation,
          and the dirty-guard / submit surface.
        </p>
      </header>
      <section className={styles.showcase}>
        <AdminWizardShowcase />
      </section>
      <section className={styles.notes}>
        <h2 className={styles.notesTitle}>What this exercises</h2>
        <ul className={styles.notesList}>
          <li>
            <strong>Stepper</strong> — horizontal, 4 steps, click-to-jump
            navigation gated by completed-step set.
          </li>
          <li>
            <strong>Per-step validation</strong> — Step 1 (sync) + Step 3
            (sync) gate Next; Back never invokes validate.
          </li>
          <li>
            <strong>Form rows</strong> — Field + FieldLabel + FieldDescription
            + FieldError compose with Input and Select primitives at
            multi-field editorial density.
          </li>
          <li>
            <strong>Repeating row</strong> — invite list with add/remove and
            per-row Select for role.
          </li>
          <li>
            <strong>Dirty guard</strong> — Cancel routes through the
            unsaved-changes ConfirmDialog when any field is dirty.
          </li>
          <li>
            <strong>Async submit</strong> — final step calls onSubmit; busy
            state announced via <code>aria-busy</code>.
          </li>
          <li>
            <strong>State persistence</strong> — form state lives in the
            consumer (not the block); confirmed to persist across step
            navigation in both directions.
          </li>
        </ul>
      </section>
    </div>
  );
}
