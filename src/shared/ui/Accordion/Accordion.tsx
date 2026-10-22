import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface Props {
  title: ReactNode
  meta?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function Accordion({ title, meta, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-line bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-3">
          <ChevronDown size={18} className={cn('text-aqua transition-transform duration-200', open && 'rotate-180')} />
          <span className="font-display text-base text-ink">{title}</span>
        </span>
        {meta && <span className="font-mono text-xs text-ink-muted">{meta}</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
