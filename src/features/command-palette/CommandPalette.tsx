import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, CornerDownLeft } from 'lucide-react'
import { buildCommands, type Command } from './commands'
import { useAuthStore } from '@/features/auth/authStore'
import { cn } from '@/shared/lib/cn'

export function CommandPalette() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo(
    () => buildCommands({ navigate, i18n, authed: !!user, role: user?.role ?? null }),
    [navigate, i18n, i18n.language, user],
  )

  const results = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      (c.title + ' ' + (c.hint ?? '') + ' ' + (c.keywords ?? '')).toLowerCase().includes(q),
    )
  }, [commands, query])

  // Глобальный хоткей ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onOpenEvent(): void {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('protocol:cmdk', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('protocol:cmdk', onOpenEvent)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  function onListKey(e: React.KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = results[active]
      if (cmd) {
        cmd.run()
        setOpen(false)
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-bg/70 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('cmd.aria')}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onListKey}
            className="w-full max-w-xl overflow-hidden rounded-[14px] border border-line-strong bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('cmd.placeholder')}
                className="h-14 w-full bg-transparent text-ink placeholder:text-ink-dim focus:outline-none"
              />
              <span className="rounded-[6px] border border-line-strong px-2 py-0.5 font-mono text-[11px] text-ink-muted">ESC</span>
            </div>

            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">{t('common.nothing_found')}</li>
              )}
              {results.map((c, i) => (
                <li key={c.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      c.run()
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left transition-colors',
                      i === active ? 'bg-surface-2' : 'hover:bg-surface-2',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{c.group}</span>
                      <span className={cn('text-sm', i === active ? 'text-lime' : 'text-ink')}>{c.title}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {c.hint && <span className="font-mono text-xs text-ink-muted">{c.hint}</span>}
                      {i === active && <CornerDownLeft size={14} className="text-ink-muted" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
