"use client";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Banner, BannerTitle, BannerDescription } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import styles from "./color-signals.module.css";

type AlertVariant = "info" | "success" | "warning" | "destructive";
type BannerIntent = "info" | "success" | "warning" | "error";
type BadgeVariant = "info" | "success" | "warning" | "destructive";

const INTENTS: Array<{
  key: string;
  label: string;
  alert: AlertVariant;
  banner: BannerIntent;
  badge: BadgeVariant;
  toast: (msg: string) => void;
}> = [
  { key: "info", label: "Info", alert: "info", banner: "info", badge: "info", toast: (m) => toast.info(m) },
  { key: "success", label: "Success", alert: "success", banner: "success", badge: "success", toast: (m) => toast.success(m) },
  { key: "warning", label: "Warning", alert: "warning", banner: "warning", badge: "warning", toast: (m) => toast.warning(m) },
  { key: "danger", label: "Danger", alert: "destructive", banner: "error", badge: "destructive", toast: (m) => toast.error(m) },
];

export function ColorSignalsSection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>
        Every feedback surface side-by-side, so intent color treatment can be judged holistically per theme.
      </p>

      <section className={styles.row}>
        <h3 className={styles.rowHeading}>Badge</h3>
        <div className={styles.rowGrid}>
          {INTENTS.map((i) => (
            <div key={i.key} className={styles.cell}>
              <Badge variant={i.badge}>{i.label}</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.row}>
        <h3 className={styles.rowHeading}>Alert</h3>
        <div className={styles.rowGrid}>
          {INTENTS.map((i) => (
            <div key={i.key} className={styles.cell}>
              <Alert variant={i.alert}>
                <AlertTitle>{i.label}</AlertTitle>
                <AlertDescription>Concise description of the {i.label.toLowerCase()} condition.</AlertDescription>
              </Alert>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.row}>
        <h3 className={styles.rowHeading}>Banner</h3>
        <div className={styles.bannerStack}>
          {INTENTS.map((i) => (
            <Banner key={i.key} intent={i.banner}>
              <BannerTitle>{i.label} banner</BannerTitle>
              <BannerDescription>System-level {i.label.toLowerCase()} message surfaced at the top of a region.</BannerDescription>
            </Banner>
          ))}
        </div>
      </section>

      <section className={styles.row}>
        <h3 className={styles.rowHeading}>Toast</h3>
        <div className={styles.rowGrid}>
          {INTENTS.map((i) => (
            <div key={i.key} className={styles.cell}>
              <Button variant="outline" size="sm" onClick={() => i.toast(`${i.label} toast`)}>
                Show {i.label.toLowerCase()}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
