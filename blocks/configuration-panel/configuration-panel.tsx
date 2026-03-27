"use client"

import { useState, useRef, useCallback } from "react"
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
  /** Enable drag-to-reposition via header. */
  draggable?: boolean
  title?: string
  subtitle?: string
  className?: string
}

export function ConfigurationPanel({
  sections,
  position = "bottom-left",
  collapsible = true,
  defaultCollapsed = false,
  draggable = false,
  title,
  subtitle,
  className,
}: ConfigurationPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const hasHeader = title || subtitle || collapsible

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable) return
      // Only drag from the header, not from buttons inside it
      if ((e.target as HTMLElement).closest("button")) return
      e.preventDefault()
      setDragging(true)
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: offset.x,
        origY: offset.y,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [draggable, offset],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setOffset({
        x: dragState.current.origX + dx,
        y: dragState.current.origY + dy,
      })
    },
    [],
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    setDragging(false)
  }, [])


  const dragStyle = draggable
    ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
    : undefined

  return (
    <div
      ref={rootRef}
      className={cn(styles.root, className)}
      data-position={position}
      data-draggable={draggable ? "true" : undefined}
      data-dragging={dragging ? "true" : undefined}
      style={dragStyle}
      role="region"
      aria-label={title ?? "Configuration panel"}
    >
      {hasHeader && (
        <div
          className={styles.header}
          onPointerDown={draggable ? handlePointerDown : undefined}
          onPointerMove={draggable ? handlePointerMove : undefined}
          onPointerUp={draggable ? handlePointerUp : undefined}
        >
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
