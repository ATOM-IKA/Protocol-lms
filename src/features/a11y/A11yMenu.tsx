import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Accessibility, Contrast, Type, Zap, Palette, RotateCcw, Check } from 'lucide-react'
import { useA11y, type A11ySettings } from './a11yStore'
import { cn } from '@/shared/lib/cn'

export function A11yMenu() {
  const { t } = useTranslation()
  const s = useA11y()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const rows: { key: keyof A11ySettings; label: string; desc: string; icon: typeof Contrast }[] = [
    { key: 'contrast', label: t('a11y.contrast'), desc: t('a11y.contrast_desc'), icon: Contrast },
    { key: 'large', label: t('a11y.large'), desc: t('a11y.large_desc'), icon: Type },
    { key: 'reduceMotion', label: t('a11y.reduce_motion'), desc: t('a11y.reduce_motion_desc'), icon: Zap },
    { key: 'grayscale', label: t('a11y.grayscale'), desc: t('a11y.grayscale_desc'), icon: Palette },
  ]
  const active = rows.some((r) => s[r.key])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('a11y.title')}
        title={t('a11y.title')}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[8px] border transition-colors',
          active ? 'border-lime/60 text-lime' : 'border-line-strong text-ink-muted hover:border-aqua/60 hover:text-ink',
        )}
      >
        <Accessibility size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="clip-hud absolute right-0 z-50 mt-2 w-64 border border-line-aqua bg-surface p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-aqua">{t('a11y.title')}</span>
              <button onClick={s.reset} className="flex items-center gap-1 font-mono text-[10px] text-ink-dim transition-colors hover:text-aqua">
                <RotateCcw size={11} /> {t('a11y.reset')}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {rows.map((r) => {
                const on = s[r.key]
                const Icon = r.icon
                return (
                  <button
                    key={r.key}
                    onClick={() => s.toggle(r.key)}
                    className={cn(
                      'flex items-start justify-between gap-3 border px-3 py-2.5 text-left transition-colors clip-btn',
                      on ? 'border-line-lime bg-lime/[0.06]' : 'border-line-strong hover:border-line-aqua',
                    )}
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <Icon size={15} className={cn('mt-0.5 shrink-0', on ? 'text-lime' : 'text-ink-dim')} />
                      <span className="min-w-0">
                        <span className={cn('block text-sm', on ? 'text-ink' : 'text-ink-soft')}>{r.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">{r.desc}</span>
                      </span>
                    </span>
                    <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border', on ? 'border-lime text-lime' : 'border-line-strong text-transparent')}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
