import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"

import styles from "./globals.css"

// A blessed pattern build: every element comes from the kit, every value comes
// from a token, and no styling is introduced here. The composition lint must
// pass this clean — a checker that fails its own reference is wrong (D6).
export default function BlessedPage() {
  return (
    <main className={styles.page}>
      <Card>
        <StatCard label="Revenue" value="$1,240" />
      </Card>
      <Button variant="primary">Refresh</Button>
    </main>
  )
}
