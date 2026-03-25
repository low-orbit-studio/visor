"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Button } from "../../components/ui/button/button"
import { Input } from "../../components/ui/input/input"
import { Textarea } from "../../components/ui/textarea/textarea"
import { Checkbox } from "../../components/ui/checkbox/checkbox"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select/select"
import { Switch } from "../../components/ui/switch/switch"
import { Slider } from "../../components/ui/slider/slider"
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group/toggle-group"
import { Label } from "../../components/ui/label/label"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card/card"
import { Badge } from "../../components/ui/badge/badge"
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert/alert"
import { Progress } from "../../components/ui/progress/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs/tabs"
import { Separator } from "../../components/ui/separator/separator"
import styles from "./design-system-specimen.module.css"

// ─── Button Specimens ────────────────────────────────────────────────────────

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive"] as const
const BUTTON_SIZES = ["sm", "md", "lg"] as const

interface ButtonSpecimenSectionProps {
  className?: string
}

export function ButtonSpecimenSection({ className }: ButtonSpecimenSectionProps) {
  return (
    <section id="specimen-buttons" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Buttons</Heading>
      <Text color="secondary" size="sm">
        All button variants and sizes.
      </Text>

      <div className={styles.buttonSubsection}>
        <Text weight="medium" size="sm" as="div">Variants</Text>
        <div className={styles.buttonRow}>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.buttonSubsection}>
        <Text weight="medium" size="sm" as="div">Sizes</Text>
        <div className={styles.buttonRow}>
          {BUTTON_SIZES.map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.buttonSubsection}>
        <Text weight="medium" size="sm" as="div">States</Text>
        <div className={styles.forceStateGrid}>
          <div className={styles.forceStateItem}>
            <Text size="xs" color="secondary" as="div">Default</Text>
            <Button>Button</Button>
          </div>
          <div className={styles.forceStateItem} data-force-state="hover">
            <Text size="xs" color="secondary" as="div">Hover</Text>
            <Button className={styles.forceHoverButton}>Button</Button>
          </div>
          <div className={styles.forceStateItem} data-force-state="active">
            <Text size="xs" color="secondary" as="div">Active</Text>
            <Button className={styles.forceActiveButton}>Button</Button>
          </div>
          <div className={styles.forceStateItem} data-force-state="focus">
            <Text size="xs" color="secondary" as="div">Focus</Text>
            <Button className={styles.forceFocusButton}>Button</Button>
          </div>
          <div className={styles.forceStateItem}>
            <Text size="xs" color="secondary" as="div">Disabled</Text>
            <Button disabled>Button</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Form Specimens ──────────────────────────────────────────────────────────

interface FormSpecimenSectionProps {
  className?: string
}

export function FormSpecimenSection({ className }: FormSpecimenSectionProps) {
  return (
    <section id="specimen-forms" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Form Controls</Heading>
      <Text color="secondary" size="sm">
        All form input types in default, error, and disabled states.
      </Text>

      <div className={styles.formGrid}>
        {/* Text Input */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Text Input</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label htmlFor="specimen-input-default">Default</Label>
              <Input id="specimen-input-default" placeholder="Enter text..." />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="specimen-input-error">Error</Label>
              <Input id="specimen-input-error" placeholder="Invalid input" aria-invalid="true" className={styles.inputError} />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="specimen-input-disabled">Disabled</Label>
              <Input id="specimen-input-disabled" placeholder="Disabled" disabled />
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Textarea</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItem}>
              <Label htmlFor="specimen-textarea-default">Default</Label>
              <Textarea id="specimen-textarea-default" placeholder="Write something..." rows={2} />
            </div>
            <div className={styles.formStateItem}>
              <Label htmlFor="specimen-textarea-disabled">Disabled</Label>
              <Textarea id="specimen-textarea-disabled" placeholder="Disabled" disabled rows={2} />
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Checkbox</Text>
          <div className={styles.formStateRow}>
            <div className={styles.formStateItemInline}>
              <Checkbox id="specimen-checkbox-unchecked" />
              <Label htmlFor="specimen-checkbox-unchecked">Unchecked</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Checkbox id="specimen-checkbox-checked" defaultChecked />
              <Label htmlFor="specimen-checkbox-checked">Checked</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Checkbox id="specimen-checkbox-disabled" disabled />
              <Label htmlFor="specimen-checkbox-disabled">Disabled</Label>
            </div>
          </div>
        </div>

        {/* Radio Group */}
        <div className={styles.formSpecimenGroup}>
          <Text weight="medium" size="sm" as="div">Radio Group</Text>
          <RadioGroup defaultValue="option-1">
            <div className={styles.formStateRow}>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-1" id="specimen-radio-1" />
                <Label htmlFor="specimen-radio-1">Option 1</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-2" id="specimen-radio-2" />
                <Label htmlFor="specimen-radio-2">Option 2</Label>
              </div>
              <div className={styles.formStateItemInline}>
                <RadioGroupItem value="option-3" id="specimen-radio-3" disabled />
                <Label htmlFor="specimen-radio-3">Disabled</Label>
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
              <Switch id="specimen-switch-off" />
              <Label htmlFor="specimen-switch-off">Off</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Switch id="specimen-switch-on" defaultChecked />
              <Label htmlFor="specimen-switch-on">On</Label>
            </div>
            <div className={styles.formStateItemInline}>
              <Switch id="specimen-switch-disabled" disabled />
              <Label htmlFor="specimen-switch-disabled">Disabled</Label>
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
    </section>
  )
}

// ─── Component Showcase ──────────────────────────────────────────────────────

interface ComponentShowcaseSectionProps {
  className?: string
}

export function ComponentShowcaseSection({ className }: ComponentShowcaseSectionProps) {
  return (
    <section id="specimen-components" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Component Showcase</Heading>
      <Text color="secondary" size="sm">
        A selection of Visor components composed together.
      </Text>

      <div className={styles.showcaseGrid}>
        {/* Card */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Card</Text>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="sm">Card content with body text and semantic surface tokens.</Text>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Badge</Text>
          <div className={styles.showcaseItemContent}>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>

        {/* Alerts */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Alert</Text>
          <div className={styles.showcaseItemStack}>
            <Alert>
              <AlertTitle>Default</AlertTitle>
              <AlertDescription>This is an informational alert.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Operation completed successfully.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Please review before continuing.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong.</AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Progress */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Progress</Text>
          <div className={styles.showcaseItemStack}>
            <div>
              <Text size="xs" color="secondary" as="div">25%</Text>
              <Progress value={25} aria-label="Progress at 25%" />
            </div>
            <div>
              <Text size="xs" color="secondary" as="div">75%</Text>
              <Progress value={75} aria-label="Progress at 75%" />
            </div>
            <div>
              <Text size="xs" color="secondary" as="div">100%</Text>
              <Progress value={100} aria-label="Progress at 100%" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Tabs</Text>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Details</TabsTrigger>
              <TabsTrigger value="tab3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <Text size="sm">Overview content goes here.</Text>
            </TabsContent>
            <TabsContent value="tab2">
              <Text size="sm">Detailed information here.</Text>
            </TabsContent>
            <TabsContent value="tab3">
              <Text size="sm">Settings panel here.</Text>
            </TabsContent>
          </Tabs>
        </div>

        {/* Separator */}
        <div className={styles.showcaseItem}>
          <Text size="xs" color="tertiary" weight="medium" as="div">Separator</Text>
          <div className={styles.showcaseItemStack}>
            <Text size="sm">Content above</Text>
            <Separator />
            <Text size="sm">Content below</Text>
          </div>
        </div>
      </div>
    </section>
  )
}
