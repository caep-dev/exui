"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Attachment, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment"
import { cn } from "@/lib/utils"
import type { ControlBinding } from "../form-controls"

interface FilesProps {
  binding: ControlBinding
  accept?: string
  buttonLabel?: React.ReactNode
  description?: React.ReactNode
  className?: string
  formatFileSize?: (bytes: number) => string
  removeFileLabel?: (file: File) => string
}

export function FormFilesControl({ binding, accept, buttonLabel = "选择文件", description, className, formatFileSize = (bytes) => `${bytes.toLocaleString()} bytes`, removeFileLabel = (file) => `删除 ${file.name}` }: FilesProps) {
  const input = React.useRef<HTMLInputElement>(null)
  const files = Array.isArray(binding.value) ? binding.value as File[] : []
  React.useEffect(() => { if (input.current) input.current.value = "" }, [binding.value])
  const append = (next: File[]) => {
    if (!binding.disabled && next.length) binding.onChange([...files, ...next])
    if (input.current) input.current.value = ""
  }
  return <div className={cn("ex-form-files", className)} role="group" aria-labelledby={binding.labelId}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) binding.onBlur() }}
    onDragOver={(event) => {
      if (!binding.disabled && Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault()
    }}
    onDrop={(event) => {
      if (binding.disabled || !event.dataTransfer.files.length) return
      event.preventDefault()
      append(Array.from(event.dataTransfer.files))
    }}
    onPaste={(event) => {
      if (binding.disabled) return
      const incoming = Array.from(event.clipboardData.items).filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter((file): file is File => file !== null)
      if (!incoming.length) return
      event.preventDefault()
      append(incoming)
    }}>
    <input {...binding.accessibility} id={`${binding.accessibility.id}-input`} ref={input} hidden
      type="file" multiple accept={accept} disabled={binding.disabled} tabIndex={-1}
      aria-labelledby={binding.labelId} onChange={(event) => append(Array.from(event.target.files ?? []))} />
    <Button {...binding.accessibility} ref={binding.ref} aria-labelledby={binding.labelId} type="button" variant="outline"
      disabled={binding.disabled} onClick={() => input.current?.click()}>{buttonLabel}</Button>
    {description && <p className="ex-form-file-help">{description}</p>}
    {files.length > 0 && <ul className="ex-form-file-list">{files.map((file, index) => <li key={index}>
      <Attachment className="ex-form-file-attachment">
        <AttachmentContent><AttachmentTitle className="ex-form-file-name">{file.name}</AttachmentTitle>
          <AttachmentDescription>{formatFileSize(file.size)}</AttachmentDescription></AttachmentContent>
        <AttachmentActions><AttachmentAction type="button" disabled={binding.disabled} aria-label={removeFileLabel(file)}
          onClick={() => binding.onChange(files.filter((_, position) => position !== index))}>×</AttachmentAction></AttachmentActions>
      </Attachment>
    </li>)}</ul>}
  </div>
}
