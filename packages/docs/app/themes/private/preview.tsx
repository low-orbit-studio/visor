"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import styles from "./page.module.css";

export function ThemePreview() {
  return (
    <section className={styles.preview} aria-label="Theme preview">
      <div className={styles.row}>
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <div className={styles.row}>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      <div className={styles.cardGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Theme-driven surface, border, and typography tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder="Type to preview input styling" />
          </CardContent>
          <CardFooter>
            <Button variant="default" size="sm">Confirm</Button>
            <Button variant="ghost" size="sm">Cancel</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Headings and body copy under the active theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className={styles.h2}>Heading two</h2>
            <h3 className={styles.h3}>Heading three</h3>
            <p className={styles.body}>
              Body copy renders with the theme&apos;s sans font, line height, and color tokens.
              Use this surface to evaluate readability and contrast.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
