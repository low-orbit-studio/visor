"use client";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import styles from "./section.module.css";

export function TypographySection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>Heading scale and prose text tokens.</p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Headings</h3>
        <div className={styles.stack}>
          <Heading level={1} size="2xl">Design system heading 1</Heading>
          <Heading level={2} size="xl">Design system heading 2</Heading>
          <Heading level={3} size="lg">Design system heading 3</Heading>
          <Heading level={4} size="md">Design system heading 4</Heading>
          <Heading level={5} size="sm">Design system heading 5</Heading>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Text</h3>
        <div className={styles.stack}>
          <Text size="lg">
            Large prose — suitable for introductory paragraphs that set context at the top of a page.
          </Text>
          <Text>
            Body prose — the primary paragraph style. Lines of text flow comfortably and the leading feels calm.
          </Text>
          <Text size="sm" color="tertiary">
            Small muted text — captions, metadata, and fine print.
          </Text>
        </div>
      </section>
    </div>
  );
}
