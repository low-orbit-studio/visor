"use client"

// BYOK settings surface (VI-562) — mounted from the top-bar key pill (bw-key-pill). A popover panel
// for: key entry (masked), store, clear, model select, and a live per-turn cost estimate. Keyless is
// the default and stays a full manual tool; a key flips the workbench into the AI turbo path
// (R-KEYLESS). All state is local-first via `useByok` (localStorage only, no server).

import * as React from "react"
import { Key, Check, Trash, Sparkle } from "@phosphor-icons/react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { StatusDot } from "@/components/ui/status-dot"
import { MODELS, estimateCost, formatCost, modelOption } from "../lib/byok"
import { useByok } from "../lib/use-byok"
import styles from "./byok-settings.module.css"

/** Representative per-turn token footprint for the live cost estimate (refreshed on model change). */
const EST_INPUT_TOKENS = 1500
const EST_OUTPUT_TOKENS = 600

/**
 * The top-bar BYOK control: the key pill (testable affordance, `bw-key-pill`) doubles as the popover
 * trigger; clicking it opens the key-management panel.
 */
export function ByokKeyControl() {
  const { keyStatus, model, hasKey, saveKey, clearKey, chooseModel } = useByok()
  const [draft, setDraft] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const active = keyStatus === "key-active"
  const cost = formatCost(estimateCost(model, EST_INPUT_TOKENS, EST_OUTPUT_TOKENS))
  const modelLabel = modelOption(model)?.label ?? model

  function save() {
    saveKey(draft)
    setDraft("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={styles.pill}
          data-testid="bw-key-pill"
          data-key-status={keyStatus}
        >
          <StatusDot tone={active ? "mint" : "muted"} aria-hidden="true" />
          {active ? "Claude · key active" : "Add Claude key"}
        </button>
      </PopoverTrigger>

      <PopoverContent className={styles.panel} align="end" data-testid="bw-byok">
        <div className={styles.head}>
          <Key weight="bold" aria-hidden="true" />
          <span className={styles.heading}>Bring your own key</span>
        </div>
        <p className={styles.lede}>
          Stored only in this browser — no server. Keyless stays a full manual tool; a key turns on
          the AI turbo.
        </p>

        <label className={styles.label} htmlFor="bw-byok-key">
          Anthropic API key
        </label>
        <PasswordInput
          id="bw-byok-key"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={active ? "key stored — enter a new one to replace" : "sk-ant-…"}
          data-testid="bw-byok-key-input"
        />

        <div className={styles.row}>
          <Button size="sm" onClick={save} disabled={!draft.trim()} data-testid="bw-byok-save">
            <Check aria-hidden="true" /> Save key
          </Button>
          {hasKey ? (
            <Button size="sm" variant="ghost" onClick={clearKey} data-testid="bw-byok-clear">
              <Trash aria-hidden="true" /> Clear
            </Button>
          ) : null}
        </div>

        <label className={styles.label} htmlFor="bw-byok-model">
          Model
        </label>
        <Select value={model} onValueChange={chooseModel}>
          <SelectTrigger id="bw-byok-model" size="sm" data-testid="bw-byok-model">
            <SelectValue>{modelLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className={styles.cost} data-testid="bw-byok-cost">
          <Sparkle weight="fill" aria-hidden="true" />
          <span>~{cost} per turn · estimated</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
