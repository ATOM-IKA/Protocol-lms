import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolver.current?.(result)
    resolver.current = null
    setOpts(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {opts && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onKeyDown={(e) => e.key === 'Escape' && close(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => close(false)} />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`clip-hud relative w-full max-w-sm border bg-surface p-6 shadow-[0_0_50px_rgba(0,0,0,0.6)] ${opts.danger ? 'border-danger/50' : 'border-line-aqua'}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${opts.danger ? 'border-danger/60 text-danger' : 'border-line-aqua text-aqua'}`}>
                  <AlertTriangle size={17} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg text-ink">{opts.title ?? t('common.confirm_title')}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{opts.message}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => close(false)}
                  className="border border-line-strong px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-ink clip-btn"
                >
                  {opts.cancelLabel ?? t('common.cancel')}
                </button>
                <button
                  autoFocus
                  onClick={() => close(true)}
                  className={`border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors clip-btn ${
                    opts.danger
                      ? 'border-danger/60 text-danger hover:bg-danger/10'
                      : 'border-line-aqua text-aqua hover:bg-aqua/10'
                  }`}
                >
                  {opts.confirmLabel ?? t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}
