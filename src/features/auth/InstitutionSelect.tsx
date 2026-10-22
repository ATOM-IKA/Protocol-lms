import { useMemo, useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Label } from '@/shared/ui/Label'
import type { Institution } from '@/entities/institution/types'

interface Props {
  items: Institution[]
  value: Institution | null
  onChange: (inst: Institution) => void
  label?: string
}

export function InstitutionSelect({ items, value, onChange, label }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.shortName.toLowerCase().includes(q),
    )
  }, [items, query])

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-[10px] border bg-surface-2 px-4 text-left',
            'transition-colors duration-200 focus:border-lime focus:outline-none',
            open ? 'border-lime' : 'border-line-strong',
          )}
        >
          <span className={value ? 'text-ink' : 'text-ink-dim'}>
            {value ? value.name : t('auth.select_institution')}
          </span>
          <ChevronDown
            size={18}
            className={cn('text-ink-muted transition-transform duration-200', open && 'rotate-180 text-lime')}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-[12px] border border-line-strong bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              role="listbox"
            >
              <div className="flex items-center gap-2 border-b border-line px-3">
                <Search size={16} className="text-ink-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('auth.search_institution')}
                  className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
                />
              </div>
              <ul className="max-h-60 overflow-y-auto p-1">
                {filtered.length === 0 && (
                  <li className="px-3 py-3 text-sm text-ink-muted">{t('common.nothing_found')}</li>
                )}
                {filtered.map((inst) => {
                  const selected = value?.id === inst.id
                  return (
                    <li key={inst.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(inst)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left transition-colors',
                          selected ? 'bg-surface-2 text-lime' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="font-mono text-xs text-ink-muted">{inst.shortName}</span>
                          <span className="text-sm">{inst.name}</span>
                        </span>
                        {selected && <Check size={16} className="text-lime" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
