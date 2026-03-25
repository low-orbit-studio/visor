"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./tag-input.module.css"

export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: string[]
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  max?: number
}

const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onChange,
      placeholder = "Add tag...",
      disabled = false,
      max,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [internalTags, setInternalTags] = React.useState<string[]>(
      defaultValue ?? []
    )
    const [inputValue, setInputValue] = React.useState("")
    const [focused, setFocused] = React.useState(false)

    const isControlled = value !== undefined
    const tags = isControlled ? value : internalTags
    const atMax = max !== undefined && tags.length >= max

    const updateTags = (newTags: string[]) => {
      if (!isControlled) {
        setInternalTags(newTags)
      }
      onChange?.(newTags)
    }

    const addTag = (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return
      if (atMax) return
      updateTags([...tags, trimmed])
      setInputValue("")
    }

    const removeTag = (index: number) => {
      updateTags(tags.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addTag(inputValue)
      } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
        removeTag(tags.length - 1)
      }
    }

    const handleWrapperClick = () => {
      inputRef.current?.focus()
    }

    return (
      <div
        ref={ref}
        data-slot="tag-input"
        className={cn(
          styles.wrapper,
          focused && styles.wrapperFocused,
          disabled && styles.wrapperDisabled,
          className
        )}
        onClick={handleWrapperClick}
        {...props}
      >
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} data-slot="tag" className={styles.tag}>
            <span className={styles.tagLabel}>{tag}</span>
            {!disabled && (
              <button
                type="button"
                className={styles.tagRemove}
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
                aria-label={`Remove ${tag}`}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false)
              if (inputValue.trim()) {
                addTag(inputValue)
              }
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className={styles.input}
            aria-label="Add tag"
          />
        )}
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }
