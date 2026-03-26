"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { Input } from "../../../components/ui/input/input"
import { Textarea } from "../../../components/ui/textarea/textarea"
import { Checkbox } from "../../../components/ui/checkbox/checkbox"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select/select"
import { Switch } from "../../../components/ui/switch/switch"
import { Slider } from "../../../components/ui/slider/slider"
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group/toggle-group"
import { Label } from "../../../components/ui/label/label"
import styles from "./slides.module.css"

export function FormSpecimenSlide() {
  return (
    <Slide id="s-forms">
      <SlideHeader
        subtitle="Components"
        title="Form Controls"
        description="All form input types in default, error, and disabled states."
      />

      <div className={styles.formGrid}>
        {/* Text Input */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Text Input</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label htmlFor="slide-input-default">Default</Label>
              <Input id="slide-input-default" placeholder="Enter text..." />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="slide-input-error">Error</Label>
              <Input id="slide-input-error" placeholder="Invalid input" aria-invalid="true" className={styles.inputError} />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="slide-input-disabled">Disabled</Label>
              <Input id="slide-input-disabled" placeholder="Disabled" disabled />
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Textarea</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label htmlFor="slide-textarea-default">Default</Label>
              <Textarea id="slide-textarea-default" placeholder="Write something..." rows={2} />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="slide-textarea-disabled">Disabled</Label>
              <Textarea id="slide-textarea-disabled" placeholder="Disabled" disabled rows={2} />
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Checkbox</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItemInline}>
              <Checkbox id="slide-checkbox-unchecked" />
              <Label htmlFor="slide-checkbox-unchecked">Unchecked</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Checkbox id="slide-checkbox-checked" defaultChecked />
              <Label htmlFor="slide-checkbox-checked">Checked</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Checkbox id="slide-checkbox-disabled" disabled />
              <Label htmlFor="slide-checkbox-disabled">Disabled</Label>
            </div>
          </div>
        </div>

        {/* Radio Group */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Radio Group</Text>
          <RadioGroup defaultValue="option-1">
            <div className={styles.formStateRow}>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-1" id="slide-radio-1" />
                <Label htmlFor="slide-radio-1">Option 1</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-2" id="slide-radio-2" />
                <Label htmlFor="slide-radio-2">Option 2</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-3" id="slide-radio-3" disabled />
                <Label htmlFor="slide-radio-3">Disabled</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Select */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Select</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label>Default</Label>
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
            <div className={styles.formStateItem}>
              <Label>Disabled</Label>
              <Select disabled>
                <SelectTrigger aria-label="Disabled select">
                  <SelectValue placeholder="Disabled" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Switch */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Switch</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItemInline}>
              <Switch id="slide-switch-off" />
              <Label htmlFor="slide-switch-off">Off</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Switch id="slide-switch-on" defaultChecked />
              <Label htmlFor="slide-switch-on">On</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Switch id="slide-switch-disabled" disabled />
              <Label htmlFor="slide-switch-disabled">Disabled</Label>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Slider</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label>Default</Label>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
            <div className={styles.formStateItem}>
              <Label>Disabled</Label>
              <Slider defaultValue={[30]} max={100} step={1} disabled />
            </div>
          </div>
        </div>

        {/* Toggle Group */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Toggle Group</Text>
          <ToggleGroup type="single" defaultValue="center">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </Slide>
  )
}
