import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { Check, CloudUpload, FileText, Loader2, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const EASE = [0.22, 1, 0.36, 1] as const
interface Props {
  files: File[]
  onPick: (list: FileList | null) => void
  onRemove: (index: number) => void
  uploading?: boolean
  error?: unknown
  accept?: string
  multiple?: boolean
  max?: number
  label?: string
  hint?: string
}

/** HUD‑зона вложения файла: drag&drop + список + спиннер загрузки + вспышка подтверждения. */
export function FileDrop({ files, onPick, onRemove, uploading, error, accept, multiple, max, label = 'прикрепить файл', hint }: Props) {
  const [over, setOver] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)
  const prev = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (prev.current && !uploading) {
      setFlash(error ? 'err' : 'ok')
      const t = setTimeout(() => setFlash(null), 1000)
      prev.current = false
      return () => clearTimeout(t)
    }
    prev.current = !!uploading
  }, [uploading, error])

  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (!uploading) onPick(e.dataTransfer.files) }
  const full = max != null && files.length >= max

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!full) setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => !full && !uploading && input.current?.click()}
        className={cn(
          'clip-hud flex cursor-pointer flex-col items-center justify-center gap-2 border bg-surface-2 px-4 py-6 text-center transition-colors',
          over ? 'border-aqua bg-aqua/5' : 'border-line-strong hover:border-line-aqua',
          (full || uploading) && 'cursor-default opacity-60',
        )}
      >
        <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => { onPick(e.target.files); e.target.value = '' }} />
        {uploading ? <Loader2 size={20} className="animate-spin text-aqua" />
          : flash === 'ok' ? <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ ease: EASE }}><Check size={20} className="text-lime" /></motion.span>
          : flash === 'err' ? <X size={20} className="text-danger" />
          : <CloudUpload size={20} className={cn(over ? 'text-aqua' : 'text-ink-dim')} />}
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {uploading ? 'загрузка…' : flash === 'ok' ? <span className="glitch text-lime">загружено</span> : flash === 'err' ? <span className="text-danger">ошибка</span> : label}
        </div>
        {hint && !uploading && !flash && <div className="text-[11px] text-ink-dim">{hint}</div>}
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="clip-btn flex items-center gap-2 border border-line bg-surface px-2.5 py-1.5">
              {f.type.startsWith('image/')
                ? <img src={URL.createObjectURL(f)} alt="" className="h-8 w-8 border border-line-strong object-cover" />
                : <FileText size={16} className="text-ink-dim" />}
              <span className="max-w-[140px] truncate font-mono text-[11px] text-ink-soft">{f.name}</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(i) }} aria-label="Убрать" className="text-ink-dim transition-colors hover:text-danger"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}