"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";
import styles from "./section.module.css";

export function GeneralSection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>Buttons, cards, separators, keyboard hints.</p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Button variants</h3>
        <div className={styles.row}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Button sizes</h3>
        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Card</h3>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Card title</div>
          <div style={{ opacity: 0.8 }}>Supporting copy explaining the card contents.</div>
          <Separator style={{ margin: "0.875rem 0" }} />
          <Button size="sm" variant="outline">Action</Button>
        </Card>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Keyboard hints</h3>
        <div className={styles.row}>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <span>open command palette</span>
        </div>
      </section>
    </div>
  );
}
