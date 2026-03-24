"use client"

import * as React from "react"
import { UploadSimple } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./file-upload.module.css"

export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
  accept?: string
  /** Maximum file size in MB */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Whether the drop zone is disabled */
  disabled?: boolean
  /** Called when valid files are selected or dropped */
  onFilesChange?: (files: File[]) => void
  /** Custom drop zone content — overrides default UI */
  children?: React.ReactNode
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ accept, maxSize = 10, maxFiles = 1, disabled = false, onFilesChange, children, className, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const validateFiles = React.useCallback((fileList: File[]): File[] => {
      const valid: File[] = []
      for (const file of fileList) {
        if (maxSize && file.size > maxSize * 1024 * 1024) continue
        if (valid.length >= maxFiles) break
        valid.push(file)
      }
      return valid
    }, [maxSize, maxFiles])

    const handleFiles = React.useCallback((fileList: File[]) => {
      if (disabled) return
      const valid = validateFiles(fileList)
      if (valid.length > 0) {
        onFilesChange?.(valid)
      }
    }, [disabled, validateFiles, onFilesChange])

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    }, [disabled])

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }, [])

    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(Array.from(e.dataTransfer.files))
    }, [handleFiles])

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(Array.from(e.target.files || []))
      // Reset input so same file can be re-selected
      e.target.value = ""
    }, [handleFiles])

    const handleClick = React.useCallback(() => {
      if (!disabled) inputRef.current?.click()
    }, [disabled])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault()
        inputRef.current?.click()
      }
    }, [disabled])

    return (
      <div data-slot="file-upload-wrapper" className={styles.wrapper}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className={styles.input}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div
          ref={ref}
          data-slot="file-upload"
          data-dragging={isDragging || undefined}
          data-disabled={disabled || undefined}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label="Upload files"
          className={cn(styles.root, isDragging && styles.dragging, disabled && styles.disabled, className)}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          {...props}
        >
          {children || (
            <div data-slot="file-upload-default" className={styles.defaultContent}>
              <UploadSimple size={32} weight="light" className={styles.icon} />
              <p className={styles.text}>
                Drag and drop files here, or click to browse
              </p>
              <p className={styles.hint}>
                {accept ? `Accepted: ${accept}` : "All file types accepted"}
                {maxSize ? ` · Max ${maxSize}MB` : ""}
                {maxFiles > 1 ? ` · Up to ${maxFiles} files` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }
