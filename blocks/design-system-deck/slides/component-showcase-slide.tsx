"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card/card"
import { Badge } from "../../../components/ui/badge/badge"
import { Alert, AlertTitle, AlertDescription } from "../../../components/ui/alert/alert"
import { Progress } from "../../../components/ui/progress/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs/tabs"
import { Separator } from "../../../components/ui/separator/separator"
import styles from "./slides.module.css"

export function ComponentShowcaseSlide() {
  return (
    <Slide id="s-components">
      <SlideHeader
        subtitle="Components"
        title="Component Showcase"
        description="A selection of Visor components composed together."
      />

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
    </Slide>
  )
}
