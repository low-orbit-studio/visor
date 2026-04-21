"use client";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Banner, BannerTitle, BannerDescription } from "@/components/ui/banner";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import styles from "./section.module.css";

export function FeedbackSection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>Alerts, banners, badges, progress, skeletons, empty states.</p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Badges</h3>
        <div className={styles.row}>
          <Badge>Default</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Danger</Badge>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Alerts</h3>
        <div className={styles.stack}>
          <Alert variant="info">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>Informational alert for contextual messages.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>All set</AlertTitle>
            <AlertDescription>Success alert confirming a completed action.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Double-check</AlertTitle>
            <AlertDescription>Warning alert for potentially problematic states.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>Destructive alert for errors and failures.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Banner</h3>
        <Banner intent="warning">
          <BannerTitle>Scheduled maintenance</BannerTitle>
          <BannerDescription>The admin API will be offline on Sunday from 02:00–04:00 UTC.</BannerDescription>
        </Banner>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Progress</h3>
        <div className={styles.stack}>
          <Progress value={25} />
          <Progress value={60} />
          <Progress value={92} />
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Skeleton</h3>
        <div className={styles.stack}>
          <Skeleton style={{ height: "1rem", width: "60%" }} />
          <Skeleton style={{ height: "1rem", width: "90%" }} />
          <Skeleton style={{ height: "1rem", width: "75%" }} />
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Empty state</h3>
        <EmptyState
          heading="No items yet"
          description="When you create something, it will appear in this list."
        />
      </section>
    </div>
  );
}
