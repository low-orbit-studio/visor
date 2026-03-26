"use client"

import { useState } from "react"
import { CaretDown } from "@phosphor-icons/react"
import { Separator } from "../../components/ui/separator/separator"
import { cn } from "../../lib/utils"
import styles from "./configuration-panel.module.css"

export interface ConfigurationPanelSection {
  label: string
  children: React.ReactNode
}

export interface ConfigurationPanelProps {
  sections: ConfigurationPanelSection[]
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right"
  collapsible?: boolean
  defaultCollapsed?: boolean
  title?: string
  subtitle?: string
  className?: string
}

export function ConfigurationPanel({
  sections,
  position = "bottom-left",
  collapsible = true,
  defaultCollapsed = false,
  title,
  subtitle,
  className,
}: ConfigurationPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const hasHeader = title || subtitle || collapsible

  return (
    <div
      className={cn(styles.root, className)}
      data-position={position}
      role="region"
      aria-label={title ?? "Configuration panel"}
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {title && <div className={styles.title}>{title}</div>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {collapsible && (
            <button
              className={styles.collapseButton}
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              type="button"
            >
              <CaretDown
                className={styles.collapseIcon}
                data-collapsed={collapsed ? "true" : undefined}
                weight="bold"
              />
            </button>
          )}
        </div>
      )}

      <div
        className={styles.contentWrapper}
        data-collapsed={collapsed ? "true" : undefined}
      >
        <div className={styles.content}>
          {sections.map((section, index) => (
            <div key={section.label}>
              {index > 0 && (
                <Separator className={styles.divider} />
              )}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>{section.label}</div>
                <div className={styles.sectionContent}>
                  {section.children}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
