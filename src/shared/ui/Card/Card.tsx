import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { scaleIn } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  reveal?: boolean
  hoverable?: boolean
  /** Лайм-обводка для «главной» карточки. */
  accent?: boolean
}

export function Card({ children, className, reveal = false, hoverable = false, accent = false }: CardProps) {
  const base = cn(
    'rounded-[14px] border bg-surface p-6',
    accent ? 'border-line-lime shadow-[0_0_28px_rgba(205,245,68,0.10)]' : 'border-line',
    className,
  )

  if (reveal) {
    return (
      <motion.div
        variants={scaleIn}
        whileHover={hoverable ? { y: -4, borderColor: 'rgba(205,245,68,0.5)', transition: { duration: 0.25 } } : undefined}
        className={base}
      >
        {children}
      </motion.div>
    )
  }
  return <div className={base}>{children}</div>
}
