"use client"

import { Stack, Globe, Export } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useActiveTheme } from "../lib/use-active-theme"
import { useSpine } from "../lib/use-spine"
import { SPINE_PROGRESS } from "../lib/elicit-fixtures"
import { ByokKeyControl } from "./byok-settings"
import styles from "./top-bar.module.css"

/**
 * Brand Workbench top bar: brand mark + project chip, the active-theme pill, the BYOK key control
 * (the `bw-key-pill` affordance — keyless vs key-active, opens the key-management panel, VI-562), and
 * an Export action that jumps to the Export stage (journey.html `data-go="export"`).
 */
export function TopBar() {
  const { themeLabel } = useActiveTheme()
  const { goToStep } = useSpine()

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <Stack weight="bold" />
        </span>
        <span className={styles.title}>Brand Workbench</span>
        <span className={styles.proj}>
          <Globe aria-hidden="true" />
          {SPINE_PROGRESS.brand} · {SPINE_PROGRESS.visibility}
        </span>
      </div>

      <div className={styles.spacer} />

      <span className={styles.themePill}>
        <span className={styles.themeDot} aria-hidden="true" />
        {themeLabel || "theme"}
      </span>

      <ByokKeyControl />

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToStep("export")}
        data-testid="bw-topbar-export"
      >
        <Export aria-hidden="true" />
        Export
      </Button>
    </header>
  )
}
