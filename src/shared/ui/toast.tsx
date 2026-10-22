import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, AlertOctagon, Info, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Kind = 'success' | 'error' | 'info' | 'loading'
interface Toast { id: number; kind: Kind; title?: string; message: string; duration?: number }
interface Ctx {
  push: (t: Omit<Toast, 'id'>) => number
  update: (id: number, patch: Partial<Omit<Toast, 'id'>>) => void
  dismiss: (id: number) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  /** Один вызов = «идёт…» → «готово/ошибка». Удобно для мутаций и uploadFile. */
  promise: <T>(p: Promise<T>, m: { loading: string; success: string | ((v: T) => string); error: string }) => Promise<T>
}
const ToastCtx = createContext<Ctx | null>(null)
export const useToast = (): Ctx => {
  const c = useContext(ToastCtx)
  if (!c) throw new Error('useToast вне <ToastProvider>')
  return c
}

const EASE = [0.22, 1, 0.36, 1] as const
const TONE: Record<Kind, { border: string; text: string; icon: ReactNode; dur: number }> = {
  success: { border: 'border-line-lime', text: 'text-lime', icon: <Check size={16} />, dur: 2600 },
  error:   { border: 'border-danger',    text: 'text-danger', icon: <AlertOctagon size={16} />, dur: 4200 },
  info:    { border: 'border-line-aqua', text: 'text-aqua', icon: <Info size={16} />, dur: 3000 },
  loading: { border: 'border-line-strong', text: 'text-ink-soft', icon: <Loader2 size={16} className="animate-spin" />, dur: 0 },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const seq = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const clear = useCallback((id: number) => {
    const t = timers.current.get(id); if (t) clearTimeout(t); timers.current.delete(id)
  }, [])
  const dismiss = useCallback((id: number) => { clear(id); setItems((a) => a.filter((x) => x.id !== id)) }, [clear])
  const arm = useCallback((id: number, dur: number) => {
    if (!dur) return
    clear(id)
    timers.current.set(id, setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), dur))
  }, [clear])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq.current
    setItems((a) => [...a, { ...t, id }])
    arm(id, t.duration ?? TONE[t.kind].dur)
    return id
  }, [arm])
  const update = useCallback((id: number, patch: Partial<Omit<Toast, 'id'>>) => {
    setItems((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const k = patch.kind ?? items.find((x) => x.id === id)?.kind ?? 'info'
    arm(id, patch.duration ?? TONE[k].dur)
  }, [arm, items])

  const success = useCallback((message: string, title?: string) => { push({ kind: 'success', message, title }) }, [push])
  const error = useCallback((message: string, title?: string) => { push({ kind: 'error', message, title }) }, [push])
  const info = useCallback((message: string, title?: string) => { push({ kind: 'info', message, title }) }, [push])
  const promise = useCallback(<T,>(p: Promise<T>, m: { loading: string; success: string | ((v: T) => string); error: string }) => {
    const id = push({ kind: 'loading', message: m.loading })
    return p.then((v) => { update(id, { kind: 'success', message: typeof m.success === 'function' ? m.success(v) : m.success }); return v })
            .catch((e) => { update(id, { kind: 'error', message: (e as Error)?.message || m.error }); throw e })
  }, [push, update])

  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)) }, [])

  return (
    <ToastCtx.Provider value={{ push, update, dismiss, success, error, info, promise }}>
      {children}
      {/* Адаптив: на мобиле — над нижним меню (AppLayout pb-24), на десктопе — угол. z выше шапки/модалок. */}
      <div className="pointer-events-none fixed inset-x-3 bottom-24 z-[80] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[360px] lg:bottom-6">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const tone = TONE[t.kind]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.32, ease: EASE }}
                className={cn('pointer-events-auto clip-hud flex items-start gap-3 border bg-surface px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.45)]', tone.border)}
              >
                <span className={cn('mt-0.5 shrink-0', tone.text)}>{tone.icon}</span>
                <div className="min-w-0 flex-1">
                  {t.title && (
                    <div className={cn('font-mono text-[11px] uppercase tracking-widest', tone.text, t.kind === 'success' && 'glitch')}>{t.title}</div>
                  )}
                  <div className="whitespace-pre-line text-sm text-ink">{t.message}</div>
                </div>
                {t.kind !== 'loading' && (
                  <button onClick={() => dismiss(t.id)} aria-label="Закрыть" className="shrink-0 text-ink-dim transition-colors hover:text-ink">
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}