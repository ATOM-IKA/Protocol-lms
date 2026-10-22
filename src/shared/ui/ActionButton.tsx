import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
const BASE: Record<Variant, string> = {
  primary: 'bg-lime text-bg font-display font-bold hover:bg-lime-bright',
  secondary: 'border border-line-aqua text-aqua hover:bg-aqua/10',
  ghost: 'text-ink-muted hover:text-ink',
}
const EASE = [0.22, 1, 0.36, 1] as const

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  pending?: boolean
  /** Пробрось m.error из react-query мутации — кнопка сама покажет ✕ при завершении с ошибкой. */
  error?: unknown
  icon?: ReactNode
  children: ReactNode
  variant?: Variant
  className?: string
}

/** Кнопка сохранения/отправки: pending‑спиннер + вспышка ✓/✕ в момент завершения процесса. */
export function ActionButton({ pending, error, icon, children, variant = 'primary', className, disabled, ...rest }: Props) {
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)
  const prev = useRef(false)
  useEffect(() => {
    if (prev.current && !pending) {            // переход «закончил работу»
      setFlash(error ? 'err' : 'ok')
      const t = setTimeout(() => setFlash(null), 900)
      prev.current = false
      return () => clearTimeout(t)
    }
    prev.current = !!pending
  }, [pending, error])

  const busy = !!pending
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cn('clip-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm transition-colors disabled:opacity-60', BASE[variant], className)}
    >
      {busy ? <Loader2 size={15} className="animate-spin" />
        : flash === 'ok' ? <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ ease: EASE }} className="text-bg"><Check size={15} /></motion.span>
        : flash === 'err' ? <X size={15} className="text-danger" />
        : icon}
      <span className={cn(flash === 'ok' && variant === 'primary' && 'glitch')}>
        {flash === 'ok' ? 'готово' : flash === 'err' ? 'ошибка' : children}
      </span>
    </button>
  )
}