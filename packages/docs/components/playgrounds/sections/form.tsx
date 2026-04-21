"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import styles from "./section.module.css";

export function FormSection() {
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <div className={styles.root}>
      <p className={styles.lede}>Text input, textarea, checkbox, radio, switch, slider, select.</p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <Label htmlFor="pg-name">Name</Label>
          <Input id="pg-name" placeholder="Ada Lovelace" />
        </div>
        <div className={styles.card}>
          <Label htmlFor="pg-email">Email</Label>
          <Input id="pg-email" type="email" placeholder="ada@example.com" />
        </div>
        <div className={styles.card}>
          <Label htmlFor="pg-role">Role</Label>
          <Select>
            <SelectTrigger id="pg-role">
              <SelectValue placeholder="Pick a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Textarea</h3>
        <Textarea placeholder="Notes…" rows={4} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Toggles</h3>
        <div className={styles.row}>
          <div className={styles.row}>
            <Checkbox id="pg-cb" defaultChecked />
            <Label htmlFor="pg-cb">Subscribe to updates</Label>
          </div>
          <div className={styles.row}>
            <Switch id="pg-switch" defaultChecked />
            <Label htmlFor="pg-switch">Enable notifications</Label>
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Radio group</h3>
        <RadioGroup defaultValue="weekly">
          <div className={styles.row}>
            <RadioGroupItem id="pg-r-daily" value="daily" />
            <Label htmlFor="pg-r-daily">Daily</Label>
          </div>
          <div className={styles.row}>
            <RadioGroupItem id="pg-r-weekly" value="weekly" />
            <Label htmlFor="pg-r-weekly">Weekly</Label>
          </div>
          <div className={styles.row}>
            <RadioGroupItem id="pg-r-monthly" value="monthly" />
            <Label htmlFor="pg-r-monthly">Monthly</Label>
          </div>
        </RadioGroup>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Slider</h3>
        <Slider value={sliderValue} onValueChange={setSliderValue} min={0} max={100} step={1} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Actions</h3>
        <div className={styles.row}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>
    </div>
  );
}
