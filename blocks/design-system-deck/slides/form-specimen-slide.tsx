"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { Input } from "../../../components/ui/input/input"
import { Checkbox } from "../../../components/ui/checkbox/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select/select"
import { Switch } from "../../../components/ui/switch/switch"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group/radio-group"
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group/toggle-group"
import { Label } from "../../../components/ui/label/label"
import styles from "./slides.module.css"

export function FormSpecimenSlide() {
  return (
    <Slide id="s-forms">
      <SlideHeader
        subtitle="Components"
        title="Form Controls"
        description="Core input components in their default state."
      />

      <div className={styles.formGrid}>
        <div className={styles.formCuratedRow}>
          <div className={styles.formCuratedItem}>
            <Text weight="medium" size="sm" as="div">Text Input</Text>
            <Input placeholder="Enter text..." />
          </div>
          <div className={styles.formCuratedItem}>
            <Text weight="medium" size="sm" as="div">Select</Text>
            <Select>
              <SelectTrigger aria-label="Select option">
                <SelectValue placeholder="Choose..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={styles.formCuratedRow}>
          <div className={styles.formCuratedItemInline}>
            <Text weight="medium" size="sm" as="div">Checkbox</Text>
            <div className={styles.formInlineGroup}>
              <div className={styles.formStateItemInline}>
                <Checkbox id="slide-cb-unchecked" />
                <Label htmlFor="slide-cb-unchecked">Unchecked</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <Checkbox id="slide-cb-checked" defaultChecked />
                <Label htmlFor="slide-cb-checked">Checked</Label>
              </div>
            </div>
          </div>
          <div className={styles.formCuratedItemInline}>
            <Text weight="medium" size="sm" as="div">Switch</Text>
            <div className={styles.formInlineGroup}>
              <div className={styles.formStateItemInline}>
                <Switch id="slide-sw-off" />
                <Label htmlFor="slide-sw-off">Off</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <Switch id="slide-sw-on" defaultChecked />
                <Label htmlFor="slide-sw-on">On</Label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formCuratedRow}>
          <div className={styles.formCuratedItemInline}>
            <Text weight="medium" size="sm" as="div">Radio Group</Text>
            <RadioGroup defaultValue="a">
              <div className={styles.formInlineGroup}>
                <div className={styles.formStateItemInline}>
                  <RadioGroupItem value="a" id="slide-radio-a" />
                  <Label htmlFor="slide-radio-a">Option A</Label>
                </div>
                <div className={styles.formStateItemInline}>
                  <RadioGroupItem value="b" id="slide-radio-b" />
                  <Label htmlFor="slide-radio-b">Option B</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className={styles.formCuratedItemInline}>
            <Text weight="medium" size="sm" as="div">Toggle Group</Text>
            <ToggleGroup type="single" defaultValue="center">
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </Slide>
  )
}
